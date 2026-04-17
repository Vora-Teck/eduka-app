import * as API from "./modules/api.js";


var loginView = $(".login-view")
var newLoginView = $(".new-login-view");
var siteView = $(".site-view")



    

function showView(view) {
        $(".view").hide()
        view.show()
}

async function getSchools() {
        showLoader("Loading...")
        try {
                let data = await API.getSchools()
                if(data.status == "success") {
                        $("#suggestions").empty()
                        let d = data.data;
                        //console.log(d)
                        for(let i in d) {
                                let temp = `
                                <div class="suggestion-item" data-name="${d[i].name}" data-id="${d[i].id}">
                                        <img src="${d[i].logo ? `${API.BASE_URL}${d[i].logo}` : '/static/logos/Vector.svg'}" alt="" />
                                        &nbsp;&nbsp;&nbsp;${d[i].name}
                                </div>`
                                $("#suggestions").append(temp)
                        }
                        $(".suggestion-item").click(function() {
                                var id = $(this).data('id');
                                var s_name = $(this).data('name');
                                $("#school_name").val(s_name);
                                $("#school_id").val(id);

                                $("#suggestions").hide();
                        })
                }
                else {
                        pushNotification("n_error", data.message, 3000)
                }
        }
        catch(err) {
                console.log(err)
                pushNotification("n_error", err.body, 3000)
        }
        hideLoader()
}





async function refreshView() {
        let site_info = await API.getSiteInfo();
        let user_info = await API.getUserInfo();
        let biometric = await API.isBiometricEnabled();

        if(site_info) {
                let img = site_info["logo"];
                if(img) {
                        let url = API.BASE_URL + img
                        $(".sch-img").attr('src', url)
                } else {
                        $(".sch-img").attr('src', '')
                }
                $(".sch-name").html(site_info['school_name'])
        }
        if(user_info) {
                $(".user-name").html(`${user_info['firstName']} ${user_info['lastName']}`)
                $(".user-initial").html(`${user_info['firstName'].charAt(0)} ${user_info['lastName'].charAt(0)}`)
        }
        if(biometric == true) {$(".bio-login").show()}
        else {$(".bio-login").hide()}

}


async function authenticate(cred = {}) {

    
    showLoader("Authenticating...")

    try {
        let data = await API.login(cred);
        //console.log(data)
        if(data.status == 'success') {
                pushNotification("n_success", data.message, 3000);
                await API.saveUserInfo(data.data)
                window.location.href = "/"
        }
        else {
                pushNotification("n_error", data.message, 3000) 
        }
    }
    catch(err) {
        console.log(err)
        pushNotification("n_error", err.body, 3000)
    }
    hideLoader()
}

$("#new-login-form").on('submit', async function(e) {
        e.preventDefault();
        let username = $("#username").val();
        let password = $("#npassword").val();

        if(!username) {
                pushNotification("n_warning", "Kindly enter your student ID", 3000)
                return;
        }
        if(!password) {
                pushNotification("n_warning", "Kindly enter your password", 3000)
                return;
        }

        await authenticate({username, password})
})

$("#login-form").on('submit', async function(e) {
        e.preventDefault();
        let user_info = await API.getUserInfo();
        let username = user_info['studentId'];
        let password = $("#password").val();


        if(!password) {
                pushNotification("n_warning", "Kindly enter your password", 3000)
                return;
        }

        await authenticate({username, password})
})


$("#school-form").on('submit', async function(e) {
        e.preventDefault();
        let school_id = $("#school_id").val()
        if(!school_id) {
                pushNotification("n_warning", "Kindly select your school to continue", 3000)
                return;
        }
        showLoader("Processing...")
        try {
                let data = await API.getSchools({school_id})
                if(data.status == "success") {
                        //console.log(data)
                        let d = data.data;
                        let obj = {
                                school_id: d.id,
                                school_name: d.name,
                                motto: d.motto,
                                logo: d.logo,
                                year: d.year_established
                        }
                        await API.saveSiteInfo(obj)
                        await refreshView()
                        showView(newLoginView)
                }
                else {
                        pushNotification("n_error", data.message, 3000)
                }
        }
        catch(err) {
                console.log(err)
                pushNotification("n_error", err.body, 3000)
        }
        hideLoader()
})


$("#school_name").on("input", function () {
        $("#school_id").val('')
        const value = $(this).val().toLowerCase();
        var suggestions = $("#suggestions");
      
        if (value === "") {
                suggestions.hide();
                return;
        }
        suggestions.show()

      
        $(".suggestion-item").each((index, elem) => {
                let nam = $(elem).data('name').toLowerCase();
                if(nam.includes(value)) {$(elem).show()}
                else {$(elem).hide()}
        })
      
});

$(".bio-login").click(async function() {
        if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(
                        JSON.stringify({ 
                                type: 'REQUEST_BIOMETRIC_LOGIN'
                        }));
            }
            else {
                pushNotification("n_info", "Native element not enabled", 3000)
                
            }
})

$(".back-btn").click(async function() {
        await API.clearSiteInfo()
        await setup()
})

$(".back-btn2").click(async function() {
        await API.clearUserInfo()
        await setup()
})




