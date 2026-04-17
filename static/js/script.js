import * as API from "./modules/api.js";
import * as LOGIN from "./modules/login.js";
import * as HOME from "./modules/dashboard.js";


// ============= Startup Functions ===================
async function setup() {
  showLoader("Starting app...")
  let site_info = await API.getSiteInfo();
  let user_info = await API.getUserInfo();
  let dev_id = await API.getDeviceId();
  let biometric = await API.isBiometricEnabled();

  let proceed = true;

  if(!dev_id || dev_id == 'undefined' || dev_id === undefined) {
    await API.saveDeviceId(safeUUID())
  }
  if(biometric === undefined) {
    await API.updateBioLogin(false)
  }
  if(!site_info) {
    await navigateTo("#intro-page")
    await getSchools()
    proceed = false;
    await refreshLogin()
  }
  else {
    if(!user_info) {
      proceed = false;
      await refreshLogin()
    }
  }
  if(proceed) {
    try {
      let data = await API.authStatus();
      //console.log(data)
      if(data.status == "success") {
        if(data.authenticated) {
          if(getHash() == "#login-page" || getHash() == "#intro-page") {
            await navigateTo("#dashboard-page");
          }
          else {
            await changeHash()
          }
          showToast(`Welcome back, ${user_info['firstName']}! 👋`, false);
          await loadAllData()
        }
        else {
          showToast("Session expired!", false);
          await navigateTo("#login-page");
          await refreshLogin();
        }
      }
      else {
        showToast(data.message, true);
        //pushNotification("n_error", data.message, 3000)
      }
    }
    catch(err) {
      console.log(err)
      showToast(err.body, true);
      //pushNotification("n_error", err.body, 3000)
    }
  }
  else {
    await navigateTo("#login-page")
  }
  
  hideLoader()
}
// Initialize App
$(document).ready(async () => {
  // Set initial hash
  // if (!window.location.hash) {
  //     window.location.hash = '#intro-page';
  // }
  await setup()
  
  loadTheme()
  
  // Keyboard support for back
  document.addEventListener('keydown', function(e) {
      if (e.key === "Escape") {
          if ($('.sub-modal.active').length) {
              closeSubModal();
          }
      }
  });
});

function loadTheme() {
  // Load dark mode preference
  if (localStorage.getItem('darkMode') === true) {
    $('body').addClass('dark');
    $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
  }
  else {
    $('body').removeClass('dark');
    $('#theme-icon').addClass('fa-moon').removeClass('fa-sun');
  }
}

// Dark Mode
function toggleDarkMode() {
  $('body').toggleClass('dark');
  const isDark = $('body').hasClass('dark');
  localStorage.setItem('darkMode', isDark);
  loadTheme()
}

// Flyout Menu
function toggleFlyoutMenu() {
  $('#flyout-menu').toggleClass('hidden');
}

// Close any sub modal
function closeSubModal() {
  $('.sub-modal').removeClass('active');
}

// =============== Login section =========================
async function refreshLogin() {
  let site_info = await API.getSiteInfo();
  let user_info = await API.getUserInfo();
  let biometric = await API.isBiometricEnabled();

  if(site_info) {
    let img = site_info["logo"];
    if(img) {
      let url = API.BASE_URL + img
      $("#selected-school-logo").attr('src', url)
    } else {
        $("#selected-school-logo").attr('src', '')
    }
    $("#selected-school-name").html(site_info['school_name'])
    $('#login-step-1').addClass('hidden');
    $('#login-step-2').removeClass('hidden');
  }
  else {
    $('#login-step-1').removeClass('hidden');
    $('#login-step-2').addClass('hidden');
  }
  if(user_info) {
    $("#username").val(user_info["studentId"])
  }
  if(biometric == true) {$(".bio-login").show()}
  else {$(".bio-login").hide()}


  // 
  

}

// Carousel Logic
let currentSlide = 1;
function nextSlide() {
  $('.carousel-slide').addClass('hidden');
  if (currentSlide === 3) {
      skipToLogin();
      return;
  }
  currentSlide++;
  //console.log(currentSlide)
  $(`#slide-${currentSlide}`).removeClass('hidden');
}

function skipToLogin() {
  navigateTo('#login-page');
}

// School Selection
let school_list = [];

async function getSchools() {
  showLoader("Loading...")
  try {
    let data = await API.getSchools()
    if(data.status == "success") {
      school_list = data.data;
                        
    }
    else {
      showToast(data.message, true)
    }
  }
  catch(err) {
    console.log(err)
    showToast(err.body, true)
  }
  hideLoader()
}
function populateSchoolList(search="") {
  let item_count = 0;
  $('#school-list').empty()

  school_list.forEach(school => {
    if(item_count < 3) {
      if(school.name.toLowerCase().includes(search)) {
        let temp = `
            <div data-id="${school.id}" 
                 class="school-item bg-white dark:bg-gray-800 p-5 rounded-3xl flex items-center gap-4 active:scale-95 transition cursor-pointer border border-transparent hover:border-emerald-200">
                <img src="${school.logo ? `${API.BASE_URL}${school.logo}` : '/static/logos/Vector.svg'}"
                class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-3xl" />
                    
                <div class="flex-1">
                    <div class="font-semibold">${school.name}</div>
                    <div class="text-xs text-gray-500">${school.motto}</div>
                </div>
            </div>
        `;
        $('#school-list').append(temp);
        item_count++;
      }
    }
  });

  $(".school-item").on('click', function() {
    let id = $(this).data('id')
    selectSchool(id)
  })
  
}
async function findSchool() {
  let value = $("#school-search").val();
  if(value.trim() == "") {
    $('#school-list').empty();
    return;
  }
  populateSchoolList(value.toLowerCase())
}
async function selectSchool(id) {
  let my_school = school_list.find(s => s.id === id);
  let obj = {
    school_id: my_school.id,
    school_name: my_school.name,
    motto: my_school.motto,
    logo: my_school.logo,
    year: my_school.year_established
  }
  await API.saveSiteInfo(obj)
  $('#login-step-1').addClass('hidden');
  $('#login-step-2').removeClass('hidden');
  
  $('#selected-school-logo').attr('src', `${API.BASE_URL}${my_school.logo}`);
  $('#selected-school-name').text(my_school.name);
}

async function backToSchoolSelect() {
  await API.clearSiteInfo()
  $('#login-step-2').addClass('hidden');
  $('#login-step-1').removeClass('hidden');
}

async function login(cred = {}) {
  showLoader("Authenticating...")
  try {
    let data = await API.login(cred);
    //console.log(data)
    if(data.status == 'success') {
      showToast("Logging you in...", false);
      await API.saveUserInfo(data.data)
      navigateTo("#dashboard-page");
      showToast(`Welcome back, ${data.data.firstName}! 👋`, false);
      hideLoader()
      await loadAllData()
    }
    else {
      showToast(data.message, true);
    }
    }
    catch(err) {
        console.log(err)
        showToast(err.body, true);
    }
    hideLoader()
}

$(".bio-login").click(async function() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ 
        type: 'REQUEST_BIOMETRIC_LOGIN'
      })
    );
  }
  else {
    showToast("Native element not enabled", true)
          
  }
})

async function authenticate() {
  let username = $("#username").val();
  let password = $("#password").val();

  if(!username) {
    showToast("Kindly enter your student ID", true)
    return;
  }
  if(!password) {
    showToast("Kindly enter your password", true)
    return;
  }
  await login({username, password})
}



// =========== Dashboard section =====================
async function loadAllData() {
  let user_info = await API.getUserInfo();
  $(".std-name").html(user_info['firstName'])
  getSubjects()
  loadProfile()
}

// =========== Subjects section =====================
// Sample Subjects Data
let subjectsData = [];

async function getSubjects() {
  //showLoader("Loading...")
  try {
    let data = await API.getSubjects()
    console.log(data)
    if(data.status == "success") {
      subjectsData = data.data;
      await loadSubjects()     
    }
    else {
      showToast(data.message, true)
    }
  }
  catch(err) {
    console.log(err)
    showToast(err.body, true)
  }
  //hideLoader()
}

// Populate Subjects Grid
async function loadSubjects() {
  let html = '';
  subjectsData.forEach(subject => {
      html += `
      <div data-id="${subject.id}"
           class="sub-item bg-white dark:bg-gray-900 rounded-3xl p-5 active:scale-95 transition cursor-pointer border border-transparent hover:border-emerald-200">
          <div class="flex justify-between items-start">
              <div class="text-5xl mb-4">${subject.icon}</div>
              <div class="px-3 py-1 bg-${subject.color}-100 dark:bg-${subject.color}-900/30 text-${subject.color}-600 rounded-2xl text-xs font-medium">${subject.progress}%</div>
          </div>
          <h3 class="font-semibold text-xl mb-1">${subject.name}</h3>
          <p class="text-xs text-gray-500">${subject.topics.length} topics • ${subject.assignments.length} assignments</p>
      </div>`;
  });
  $('#subjects-grid').html(html);

  $(".sub-item").click(function() {
    let id = $(this).data('id');
    openSubjectDetail(id)
  })
}

$('#subject-search-input').on('input', function() {
  const term = $(this).val().toLowerCase();
  $('#subjects-grid > div').each(function() {
      const text = $(this).text().toLowerCase();
      $(this).toggle(text.includes(term));
  });
});

// Open Subject Detail
let currentSubject = null;
function openSubjectDetail(id) {
  currentSubject = subjectsData.find(s => s.id === id);
  if (!currentSubject) return;

  $('#subject-detail-name').text(currentSubject.name);
  $('#subject-detail-icon').html(currentSubject.icon);
  $('#subject-detail-progress-text').html(`Progress: <span class="font-semibold">${currentSubject.progress}%</span>`);

  // Show modal
  $('#subject-detail-modal').removeClass('hidden').addClass('flex');
  switchSubjectTab(0); // Default to Progress tab
}

function closeSubjectDetail() {
  $('#subject-detail-modal').addClass('hidden').removeClass('flex');
  currentSubject = null;
}

// Subject Tab Switching
function switchSubjectTab(tabIndex) {
  // Reset tabs
  $('[id^="subject-tab-"]').removeClass('border-b-2 border-emerald-600 text-emerald-600').addClass('text-gray-500');
  $('#subject-tab-' + tabIndex).addClass('border-b-2 border-emerald-600 text-emerald-600');

  let contentHTML = '';

  if (tabIndex === 0) { // Progress
      contentHTML = `
      <div class="space-y-8">
          <div class="text-center">
              <div class="inline-flex items-center justify-center w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-7xl mb-4">${currentSubject.icon}</div>
              <div class="text-6xl font-bold text-emerald-600">${currentSubject.progress}</div>
              <p class="text-gray-500">Overall Progress</p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-center">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-3xl p-4">
                  <div class="text-3xl font-semibold">14</div>
                  <div class="text-xs text-gray-500">Topics Completed</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 rounded-3xl p-4">
                  <div class="text-3xl font-semibold">3</div>
                  <div class="text-xs text-gray-500">Assignments Done</div>
              </div>
          </div>
      </div>`;
  } 
  else if (tabIndex === 1) { // Tutor
      contentHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 text-center">
          <div class="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900 rounded-3xl flex items-center justify-center text-4xl mb-4">👩‍🏫</div>
          <h3 class="font-semibold text-2xl">${currentSubject.tutor || "No Tutor"}</h3>
          ${currentSubject.tutor ? `
            <p class="text-emerald-600">Class Teacher</p>
            <button class="mt-8 w-full py-4 bg-emerald-600 text-white rounded-2xl font-medium">Message Tutor</button>
          ` : ``}
          
      </div>`;
  } 
  else if (tabIndex === 2) { // Topics
      contentHTML = `<div class="space-y-3">`;
      currentSubject.topics.forEach(topic => {
          contentHTML += `
          <div data-id="${topic.id}"
               class="topic-item bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center cursor-pointer active:scale-[0.97]">
              <div>
                  <div class="font-medium">${topic.title}</div>
                  <div class="text-xs text-gray-500 line-clamp-2">${topic.desc}</div>
              </div>
              <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>`;
      });
      contentHTML += `</div>`;
  } 
  else if (tabIndex === 3) { // Assignments
      contentHTML = `<div class="space-y-3">`;
      if (currentSubject.assignments.length === 0) {
          contentHTML += `<p class="text-center py-12 text-gray-400">No assignments yet</p>`;
      } else {
          currentSubject.assignments.forEach(assign => {
              contentHTML += `
              <div data-id="${assign.id}"
                   class="assign-item bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between cursor-pointer active:scale-[0.97]">
                  <div class="flex-1">
                      <div class="font-medium">${assign.title}</div>
                      <div class="text-xs text-gray-500">Due: ${assign.due} • ${assign.marks} marks</div>
                  </div>
                  <span class="text-xs px-4 py-2 rounded-2xl ${assign.status === 'submitted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} self-start">${assign.status}</span>
              </div>`;
          });
      }
      contentHTML += `</div>`;
  }

  $('#subject-tab-content').html(contentHTML);

  $(".topic-item").on('click', function() {
    let id = $(this).data('id');
    openTopicDetail(id)
  })
  $(".assign-item").on('click', function() {
    let id = $(this).data('id');
    openAssignmentDetail(id)
  })
}

// Topic Detail
let currentTopic = null;
function openTopicDetail(topicId) {
  // Find topic from current subject
  currentTopic = currentSubject.topics.find(t => t.id === topicId);
  if (!currentTopic) return;

  $('#topic-detail-title').text(currentTopic.title);
  $('#topic-description').text(currentTopic.desc);
  
  // Objectives
  let objHTML = '';
  currentTopic.objectives.forEach(obj => {
      objHTML += `<li class="flex items-start gap-3"><i class="fa-solid fa-circle-check text-emerald-500 mt-px"></i> ${obj}</li>`;
  });
  $('#topic-objectives').html(objHTML);

  // Content
  $('#topic-content').html(currentTopic.content);

  // Show modal
  $('#topic-detail-modal').removeClass('hidden').addClass('flex');
  
  // Reset quiz
  $('#quiz-container').html(`
      <div class="space-y-4" id="quiz-questions">
          <div class="quiz-q bg-white dark:bg-gray-800 rounded-3xl p-5">
              <p class="font-medium mb-4">1. What does the quadratic formula solve?</p>
              <div onclick="selectQuizOption(this)" class="quiz-option border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-3 cursor-pointer">Equations of degree 2</div>
              <div onclick="selectQuizOption(this)" class="quiz-option border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-3 cursor-pointer">Linear equations</div>
              <div onclick="selectQuizOption(this)" class="quiz-option border border-gray-200 dark:border-gray-700 rounded-2xl p-4 cursor-pointer">Cubic equations</div>
          </div>
      </div>
  `);
  $('#quiz-submit-btn').addClass('hidden');
  $('#quiz-score').addClass('hidden');
}

function closeTopicDetail() {
  $('#topic-detail-modal').addClass('hidden').removeClass('flex');
  currentTopic = null;
}

// Simple Quiz Interaction
window.selectQuizOption = function(el) {
  $('.quiz-option').removeClass('border-emerald-500 bg-emerald-50');
  $(el).addClass('border-emerald-500 bg-emerald-50');
  $('#quiz-submit-btn').removeClass('hidden');
};

function submitTopicQuiz() {
  showToast('Quiz submitted! You scored 3/3 🎉', false);
  $('#quiz-score').removeClass('hidden').text('Score: 3/3');
  $('#quiz-submit-btn').addClass('hidden');
}

// Assignment Detail
let currentAssignment = null;
function openAssignmentDetail(assignId) {
  currentAssignment = currentSubject.assignments.find(a => a.id === assignId);
  if (!currentAssignment) return;

  $('#assignment-detail-title').text(currentAssignment.title);
  $('#assignment-detail-modal').removeClass('hidden').addClass('flex');
  switchAssignmentTab(0);
}

function closeAssignmentDetail() {
  $('#assignment-detail-modal').addClass('hidden').removeClass('flex');
  currentAssignment = null;
}

function switchAssignmentTab(tabIndex) {
  $('[id^="assign-tab-"]').removeClass('border-b-2 border-emerald-600 text-emerald-600').addClass('text-gray-500');
  $('#assign-tab-' + tabIndex).addClass('border-b-2 border-emerald-600 text-emerald-600');

  let html = '';

  if (tabIndex === 0) { // Overview
      html = `
      <div class="space-y-6">
          <div class="flex justify-between text-sm"><span class="text-gray-500">Due Date</span><span class="font-medium">${currentAssignment.due}</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">Total Marks</span><span class="font-medium">${currentAssignment.marks}</span></div>
          <p class="text-gray-600 dark:text-gray-300">Complete the essay on climate change and its impact on biodiversity. Include at least 3 scientific references.</p>
      </div>`;
  } 
  else if (tabIndex === 1) { // Submit
      html = `
      <div>
          <label class="block text-xs font-medium mb-2 text-gray-500">YOUR ANSWER / ESSAY</label>
          <textarea id="assignment-textarea" rows="8" 
                    class="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-3xl p-5 outline-none resize-none" 
                    placeholder="Write your response here..."></textarea>
          
          <div class="mt-8">
              <label class="block text-xs font-medium mb-2 text-gray-500">ATTACH FILE (PDF / DOC)</label>
              <div class="border border-dashed border-gray-300 dark:border-gray-600 rounded-3xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <i class="fa-solid fa-cloud-upload text-4xl text-gray-400 mb-3"></i>
                  <p class="text-sm text-gray-500">Tap to upload or drag file here</p>
                  <input type="file" id="assignment-file" class="hidden" accept=".pdf,.doc,.docx">
              </div>
          </div>
          
          <button onclick="submitAssignment()" 
                  class="mt-8 w-full bg-emerald-600 text-white py-4 rounded-3xl font-semibold active:scale-95 transition">
              Submit Assignment
          </button>
      </div>`;
  } 
  else if (tabIndex === 2) { // Feedback
      html = `<div class="text-center py-16 text-gray-400">No feedback yet. Submit your work to receive teacher comments.</div>`;
  }

  $('#assignment-tab-content').html(html);
}

function submitAssignment() {
  const text = $('#assignment-textarea').val();
  if (!text) {
      showToast('Please write something before submitting!', true);
      return;
  }
  closeAssignmentDetail();
  showToast('Assignment submitted successfully! 🎉', false);
}


// =========== Profile section =====================
// Toggle Biometrics

async function loadBiometrics() {
  let biometric = await API.isBiometricEnabled();
  $('#biometrics-toggle').prop('checked', biometric)
}

async function loadProfile() {
  await loadBiometrics()
  try {
    let data = await API.userProfile()
    console.log(data)
    if(data.status == "success") {
         let d = data.data
         $("#std-fname").html(d.firstName)
         $("#std-id").html(`${d.studentId} • ${d.classroom.level.title}`)
         $("#std-name").html(`${d.firstName} ${d.middleName} ${d.lastName}`)
         $("#std-gender").html(capitalize(d.gender))
         $("#std-dob").html(datify(d.dateOfBirth))
         $("#std-id2").html(`${d.studentId}`)
         $("#std-address").html(`${d.address.address},<br>${d.address.state} State, ${d.address.country}.`)
         $("#std-class").html(d.classroom.level.title.split(' ')[0])
         $("#std-dept").html(capitalize(d.classroom.level.department))
         $("#std-reg").html(datify(d.registration_date))
         $("#std-term").html(`${data.term.title}`)
         $("#std-session").html(`${data.term.session.title.split(' ')[0]}`)
         $("#std-tutor").html(d.classroom.teacher ? `${d.classroom.teacher.firstName} ${d.classroom.teacher.lastName}` : ``)
    }
    else {
      showToast(data.message, true)
    }
  }
  catch(err) {
    console.log(err)
    showToast(err.body, true)
  }
}

async function toggleBiometrics() {
  let biometricsEnabled = await API.isBiometricEnabled();
    const toggleEl = document.getElementById('biometrics-toggle');
    if (toggleEl.checked && !biometricsEnabled) {
        // Show password confirmation modal
        $('#biometrics-confirm-modal').removeClass('hidden').addClass('flex');
        toggleEl.checked = false; // Reset until confirmed
    } else if (!toggleEl.checked && biometricsEnabled) {
        // Disabling also requires confirmation
        $('#biometrics-confirm-modal').removeClass('hidden').addClass('flex');
        toggleEl.checked = true;
    }
}

function confirmBiometricsToggle() {
    const enteredPass = $('#biometrics-password-input').val();
    if (enteredPass === "demo1234") { // Demo password from login
        biometricsEnabled = !biometricsEnabled;
        document.getElementById('biometrics-toggle').checked = biometricsEnabled;
        closeBiometricsModal();
        showToast(biometricsEnabled ? 'Biometrics enabled successfully ✓' : 'Biometrics disabled', false);
    } else {
        showToast('Incorrect password. Try again.', true);
    }
}

function cancelBiometricsToggle() {
    closeBiometricsModal();
}

function closeBiometricsModal() {
    $('#biometrics-confirm-modal').addClass('hidden').removeClass('flex');
    $('#biometrics-password-input').val('');
}

// Change Password Modal
function showChangePasswordModal() {
    $('#change-password-modal').removeClass('hidden').addClass('flex');
}

function closeChangePasswordModal() {
    $('#change-password-modal').addClass('hidden').removeClass('flex');
    $('#current-pass, #new-pass, #confirm-pass').val('');
}

function saveNewPassword() {
    const current = $('#current-pass').val();
    const newPass = $('#new-pass').val();
    const confirmPass = $('#confirm-pass').val();
    
    if (!current || !newPass || !confirmPass) {
        showToast('All fields are required', true);
        return;
    }
    if (newPass !== confirmPass) {
        showToast('New passwords do not match', true);
        return;
    }
    if (current !== "demo1234") {
        showToast('Current password is incorrect', true);
        return;
    }
    
    closeChangePasswordModal();
    showToast('Password updated successfully! 🔐', false);
}

// Teacher Modal
function openTeacherModal() {
    $('#teacher-modal').removeClass('hidden').addClass('flex');
}

function closeTeacherModal() {
    $('#teacher-modal').addClass('hidden').removeClass('flex');
}

// Logout
async function logout() {
    //showLoader("Loading...")
  try {
    let data = await API.logout()
    //console.log(data)
    if(data.status == "success") {
      showToast(data.message, false)
      await navigateTo("#login-page");
      await refreshLogin()  
    }
    else {
      showToast(data.message, true)
    }
  }
  catch(err) {
    console.log(err)
    showToast(err.body, true)
  }
}




// ============== Event Listeners ========================
$("#school-search").on('input', async () => await findSchool())
$("#intro-next").on('click', nextSlide)
$("#intro-skip").on('click', skipToLogin)
$("#toggle-mode-btn").on('click', toggleDarkMode)
$(".flyout-menu-btn").on('click', toggleFlyoutMenu)
$(".close-sub-detail").on('click', closeSubjectDetail)
$(".close-top-detail").on('click', closeTopicDetail)
$(".close-ass-detail").on('click', closeAssignmentDetail)
$(".close-std-tutor").on('click', closeTeacherModal)
$(".logout-btn").on('click', logout)
$(".std-tutor-modal").on('click', openTeacherModal)

$("#subject-tab-0").on('click', () => {switchSubjectTab(0)})
$("#subject-tab-1").on('click', () => {switchSubjectTab(1)})
$("#subject-tab-2").on('click', () => {switchSubjectTab(2)})
$("#subject-tab-3").on('click', () => {switchSubjectTab(3)})

$("#assign-tab-0").on('click', () => {switchAssignmentTab(0)})
$("#assign-tab-1").on('click', () => {switchAssignmentTab(1)})
$("#assign-tab-2").on('click', () => {switchAssignmentTab(2)})

$("#quiz-submit-btn").on('click', submitTopicQuiz)


$(".cursor-pointer").click(async () => {
  let id = $(this).data('id');
  console.log(id)
  await navigateTo(`#${id}`);
  toggleFlyoutMenu()
})
$("#school-back").on('click', (e) => {e.preventDefault(); backToSchoolSelect()})
$("#login-form").on('submit', async (e) => {e.preventDefault(); await authenticate()})

// ============ React Native Bridge ====================
window.addEventListener('message', async function(ev) {
  try {
    const data = ev.data;
    if (data && data.type === 'BIOMETRIC_FAILED') {
      //console.log(data.payload?.message);
      showToast(data.payload?.message, false)
    }
    else if (data && data.type === 'BIOMETRIC_SUCCESS') {
          //console.log(data.payload?.password);
          let username = $("#username").val();
          let password = data.payload?.password;
          await login({username, password})
    }
    else if (data && data.type === 'DEVICE_INFO') {
      console.log(data.payload);
    }
    else if (data && data.type === 'BIOMETRIC_REGISTERED') {
      await API.updateBioLogin(true)
      $("#biometrics-toggle").prop('checked', true)
      showToast("Biometric login updated", false)
    }
  } catch (e) {
          console.log(e)
  }
});
// ====== Make key functions globally accessible ===========
// window.navigateTo = navigateTo;
// window.nextSlide = nextSlide;
// window.skipToLogin = skipToLogin;
// window.selectSchool = selectSchool;
// window.backToSchoolSelect = backToSchoolSelect;
// window.performLogin = performLogin;
// window.showToast = showToast;
// window.toggleDarkMode = toggleDarkMode;
// window.toggleFlyoutMenu = toggleFlyoutMenu;
// window.closeSubModal = closeSubModal;