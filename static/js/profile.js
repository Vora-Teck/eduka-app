import * as API from "./modules/api.js";

async function getUser() {
  showLoader("Loading Profile...")
  let biometric = await API.isBiometricEnabled();
  if(biometric == true) {
    document.querySelector('#checkbox1').checked = true
  }
  else {
     document.querySelector('#checkbox1').checked = false
  }
  try {
    let data = await API.userProfile();
    //console.log(data)
    if(data.status == "success") {
      let d = data.data;
      let updated_data = {
        firstName: d.firstName, lastName: d.lastName, middleName: d.middleName,
        studentId: d.studentId, image: d.image
      }
      await API.saveUserInfo(updated_data)
      $('.user-names').html(`${d.firstName} ${d.middleName != "" ? `${d.middleName.charAt(0)}.` : ``} ${d.lastName}`)
      $('.user-teach').html(`${d.classroom.teacher?.firstName || ""} ${d.classroom.teacher?.lastName || ''}`)
      $('.user-id').html(`${d.studentId}`)
      $('.user-class').html(`${d.classroom.level.title.split(' ')[0]}`)
      $(".user_img").attr('src', `${d.image ? `${API.BASE_URL}${d.image}` : `/static/image/avatar.png`}`)
      $('.user-dob').html(`${datify(d.dateOfBirth)}`)
      $('.user-reg').html(`${datify(d.registration_date)}`)
      $('.user-gen').html(`${d.gender}`)
      $('.user-dep').html(`${d.classroom.level.category} (${d.classroom.level.department})`)
      $('.user-pname').html(`${d.parentInfo.name}`)
      $('.user-pemail').html(`${d.parentInfo.email}`)
      $('.user-ptel').html(`${d.parentInfo.phone_number.join(', ')}`)
      $('.user-addr').html(`${d.address.address}, ${d.address.lga} LGA, ${d.address.state} State, ${d.address.country}`)
    }
    else {
      pushNotification("n_error", data.message, 3000)
    }
  }
  catch(err) {
    console.log(err)
    pushNotification("n_error", err?.message, 3000)
  }
  hideLoader()
}
getUser()

async function getClassmates() {
  $(".classmate-con").empty()
  try {
    let data = await API.getClassmates();
    //console.log(data)
    if(data.status == "success") {
      if(data.data) {
        let d = data.data;
        for(let i in d) {
          let temp = `
          <div class="classmate-item">
                          <img src="${d[i].image ? `${API.BASE_URL}${d[i].image}` : `/static/image/avatar.png`}" alt="">
                          <div>
                            <div class="h5">${d[i].firstName} ${d[i].middleName != "" ? `${d[i].middleName.charAt(0)}.` : ``} ${d[i].lastName}</div>
                            <div style="margin-top:10px;" class="w-small text-muted">ID: ${d[i].studentId} | Gender: ${d[i].gender}</div>
                          </div>
                        </div>`;
        $(".classmate-con").append(temp)
        }
      }
      else {
        let temp = `
          <div class="classmate-item">
                          <div style="margin-top:10px;" class="w-small text-muted">No students found in this class</div>
                        </div>`;
        $(".classmate-con").append(temp)
      }
    }
    else {
      pushNotification("n_error", data.message, 3000)
    }
  }
  catch(err) {
    console.log(err)
    pushNotification("n_error", err?.message, 3000)
  }
}

getClassmates()

async function changePassword() {
    var old_pass = $('#old-pass').val();
    var new_pass = $('#new-pass').val();
    var cnew_pass = $('#cnew-pass').val();

    if(!old_pass || !new_pass) {
        pushNotification("n_warning", "Fields cannot be empty", 3000);
        return
    }
    if(new_pass !== cnew_pass) {
        pushNotification("n_warning", "Passwords do not match!", 3000);
        return
    }

    var formData = {
        'old_password': old_pass,
        'new_password': new_pass
    }
    showLoader("Updating password...")
    try {
      let data = await API.updatePassword(formData);
      //console.log(data)
      if(data.status == "success") {
        let biometric = await API.isBiometricEnabled();
        if(biometric == true) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ 
                type: 'REGISTER_BIOMETRIC',
                password: new_pass
              })
            );
          }
        }
        $("#change-pass-form")[0].reset();
        $(".change_pass_con").removeClass("active")
        pushNotification("n_success", data.message, 3000)
      }
      else {
        pushNotification("n_error", data.message, 3000)
      }
    }
    catch(err) {
      console.log(err)
      pushNotification("n_error", err?.message, 3000)
    }
    hideLoader()

}



$('.toggle-input').click(function(e) {
  e.preventDefault();
  $(".biometric-con").addClass("active")
})


async function toggleBiometric(password) {
  //console.log(password)
  let elem = $("#checkbox1")
  if(elem.is(':checked')) {
    await API.updateBioLogin(false)
    elem.prop('checked', false)
    pushNotification("n_info", "Biometric login disabled")
  }
  else {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ 
          type: 'REGISTER_BIOMETRIC',
          password: password
        })
      );
    }
    else {
      pushNotification("n_info", "Native element not enabled", 3000)
    }
  }
  //registerBiometric()
}


$(".confirm-pass-form").submit(async function(e) {
  e.preventDefault();
  let password = $("#password").val();
  if(!password) {
    pushNotification("n_warning", "Kindly enter your password", 3000);
    return;
  }
  showLoader("Verifying...")
  try {
    let data = await API.verifyPassword({password})
    //console.log(data)
    if(data.status == "success") {
      if(data.verified === true) {
        $("#password").val('')
        $(".biometric-con").removeClass("active")
        await toggleBiometric(password)
      }
      else {
        pushNotification("n_error", "Incorrect password!", 3000)
      }
    }
    else {
      pushNotification("n_error", data.message, 3000);
    }
  }
  catch(err) {
    console.log(err)
    pushNotification("n_error", err, 3000);
  }
  hideLoader()
})

$("#change-pass-form").submit(async function(e) {
  e.preventDefault();
  await changePassword()
})

window.addEventListener('online', checkNetwork)
window.addEventListener('offline', checkNetwork)

window.addEventListener('message', async function(ev) {
        try {
          const data = ev.data;
          
        }
        catch (e) {
          console.log(e)
        }
    });

