import * as CRYPTO from "./modules/crypto.js";
import * as IDB from "./modules/idb-keys.js";
import * as API from "./modules/api.js";



var metadata = {}
var user_info = await API.getUserInfo()
var site_info = await API.getSiteInfo();


// Store chat history

async function setup_ai() {
  try {
    let data = await API.schoolMetadata();
    if(data.status == "success") {
      //API_KEY = data.api_key,
      metadata = data.data
      //console.log(metadata)
      let eleven_ai = $("#elevenlabs_ai");
      //console.log(eleven_ai.attr('agent-id'))
      let ai_data = {
        user_name: user_info['firstName'],
        user_id: user_info['studentId'],
        school_name: metadata["school_name"],
        school_id: site_info['school_id'],
        classes: metadata.classes.join(', '),
        subjects_offered: metadata.subjects_offered.join(', '),
        phone_number: metadata.phone_number,
        school_email: metadata.school_email,
        user_classroom: metadata.user_classroom,
        user_subjects: metadata.user_subjects.join(', ')
      }
      eleven_ai.attr('dynamic-variables', JSON.stringify(ai_data))
    }
    else {
      pushNotification("n_error", data.message, 3000)
    }
  }
  catch(err) {
    console.log(err)
    pushNotification("n_error", err.body, 3000)
  }
}

async function checkStatus() {
        try {
                let data = await API.authStatus();
                //console.log(data)
                //alert(JSON.stringify(data))
                if(data.status == "success") {
                        if(data.authenticated === false) {
                            pushNotification("n_warning", "Your session has expired!", 3000)
                                window.location.href = "/login/"
                        }
                }
        }
        catch(err) {
                console.log(err)
                //window.location.href = "/login/"
                pushNotification("n_error", err?.message, 3000)
        }
        hideLoader()
}


async function setup() {
  let dev_id = await API.getDeviceId();
  if(!site_info || !dev_id || !user_info) {
    window.location.href = "/login/"
    }
    showLoader("Loading...")
    await checkStatus()
    user_info = await API.getUserInfo();
    $(".dashboard-header-title").html(`Hello, ${user_info['firstName']}`)
    $("#user-avatar").attr('src', `${user_info['image'] ? `${API.BASE_URL}${user_info['image']}` : `/static/image/avatar.png`}`)
    await setup_ai()
    hideLoader()
}
setup()



$(".logout-btn").click(async function(e) {
    e.preventDefault();

    showLoader("Logging out...")

    try {
        let data = await API.logout();
        if(data.status == 'success') {
            pushNotification("n_success", data.message, 3000);
            window.location.href = "/login/"
        }
        else {
            pushNotification("n_error", data.message, 3000) 
        }
    }
    catch(err) {
        console.log(err)
        pushNotification("n_error", err.body, 3000)
    }
})


window.addEventListener('online', checkNetwork)
window.addEventListener('offline', checkNetwork)

window.addEventListener('message', function(ev) {
    try {
      const data = ev.data;
      if (data && data.type === 'BIOMETRIC_FAILED') {
        console.log(data.payload?.message);
        alert(data.payload?.message)
      }
      else if (data && data.type === 'BIOMETRIC_REGISTERED') {
        console.log(data.payload?.message);
        alert(data.payload?.message)
      }
      else if (data && data.type === 'BIOMETRIC_SUCCESS') {
        console.log(data.payload?.password);
      }
      else if (data && data.type === 'DEVICE_INFO') {
        console.log(data.payload);
      }
      else if (data && data.type === 'SAVE_RESULT') {
        console.log(data.payload);
      }
      else if (data && data.type === 'PONG') {
        console.log(data.payload?.ts);
      }
    } catch (e) {}
});


if (window.ReactNativeWebView) {
    //console.log("yes")
    //window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_EXTERNAL', payload: { url: 'https://google.com' }}));
    //window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REGISTER_BIOMETRIC', password: 'TAOFEEK'}));
}
else {
    //console.log("no")
    //window.open('https://google.com', '_blank');
}