import * as API from "./modules/api.js";
import * as LOGIN from "./modules/login.js";
import * as HOME from "./modules/dashboard.js";
import { eduka_subjects } from "./modules/subjects.js";


// ============= Startup Functions ===================
async function setup() {
  showLoader("Starting app...")
  let site_info = await API.getSiteInfo();
  let user_info = await API.getUserInfo();
  let dev_id = await API.getDeviceId();
  let biometric = await API.isBiometricEnabled();

  let proceed = true;

  if(!dev_id || dev_id == 'undefined' || dev_id === undefined) {
    if (window.ReactNativeWebView) {
      // request device info
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ 
          type: 'REQUEST_DEVICE_INFO'
        }));
    }
    else {
      await API.saveDeviceId(safeUUID())    
    }
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
  
  //loadTheme()
  initDarkMode();
  setupSystemThemeListener();
  
  // Keyboard support for back
  document.addEventListener('keydown', function(e) {
      if (e.key === "Escape") {
          if ($('.sub-modal.active').length) {
              closeSubModal();
          }
      }
  });
});

// ================Theme Loading & Switching ===========
function initDarkMode() {
  const savedMode = localStorage.getItem('eduka-dark-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Priority: Saved preference > System preference > Light by default
  if (savedMode === 'dark' || (savedMode === null && prefersDark)) {
      document.documentElement.classList.add('dark');
  } else {
      document.documentElement.classList.remove('dark');
  }
  
  updateAllThemeIcons();
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('eduka-dark-mode', isDark ? 'dark' : 'light');
  updateAllThemeIcons();
  
  // Optional: Show toast
  showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', false);
}

function updateAllThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  
  // Update all theme icons across pages
  document.querySelectorAll('#theme-icon, #subjects-theme-icon, #profile-theme-icon, #attendance-theme-icon, #results-theme-icon, #tools-theme-icon, #fees-theme-icon').forEach(icon => {
      if (icon) {
          icon.classList.toggle('fa-moon', !isDark);
          icon.classList.toggle('fa-sun', isDark);
      }
  });
}

// Listen for system preference changes (optional but recommended)
function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
      // Only change if user hasn't set a manual preference
      if (localStorage.getItem('eduka-dark-mode') === null) {
          if (e.matches) {
              document.documentElement.classList.add('dark');
          } else {
              document.documentElement.classList.remove('dark');
          }
          updateAllThemeIcons();
      }
  });
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
  populateDaySelector();
  renderWeeklyGrid();
  renderResults();
  filterFees();
  renderMessages()
}

// =========== Subjects section =====================
// Sample Subjects Data
let subjectsData = [];


async function getSubjects() {
  //showLoader("Loading...")
  try {
    let data = await API.getSubjects()
    //console.log(data)
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
              <div class="text-5xl mb-4">${eduka_subjects[subject.slug]}</div>
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
    //console.log(data)
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
  //let biometricsEnabled = await API.isBiometricEnabled();
  $('#biometrics-confirm-modal').removeClass('hidden').addClass('flex');
}

async function toggleBiometric(password) {
  //console.log(password)
  let elem = $("#biometrics-toggle")
  if(elem.is(':checked')) {
    await API.updateBioLogin(false)
    elem.prop('checked', false)
    showToast("Biometric login disabled", false)
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
      showToast("Native element not enabled", true)
    }
  }
  //registerBiometric()
}

async function confirmBiometricsToggle() {
  let password = $('#biometrics-password-input').val();
  if(!password || password.trim() == "") {
    showToast("Kindly enter your password", true);
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
        closeBiometricsModal();
        await toggleBiometric(password)
      }
      else {
        showToast("Incorrect password!", true)
      }
    }
    else {
      showToast(data.message, true)
    }
  }
  catch(err) {
    console.log(err)
    showToast(err, true)
  }
  finally {hideLoader()}
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

async function saveNewPassword() {
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
    
    var formData = {
      'old_password': current,
      'new_password': newPass
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
                password: newPass
              })
            );
          }
        }
        closeChangePasswordModal();
        showToast(data.message, false);
      }
      else {
        showToast(data.message, true);
      }
    }
    catch(err) {
      console.log(err)
      showToast(err?.message, true);
    }
    finally {hideLoader()}
    
    
    
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
    showLoader("Logging out...")
  try {
    let data = await API.logout()
    //console.log(data)
    if(data.status == "success") {
      showToast(data.message, false)
      await navigateTo("#login-page");
      await getSchools()
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


// =========== Timetable section =====================
const timetableData = {
  monday: {
      periods: [
          { start: "08:00", end: "09:00", subject: { id: 1, name: "Mathematics" }, teacher: "Mrs. Adebayo", room: "Room 12", type: "Theory" },
          { start: "09:15", end: "10:15", subject: { id: 2, name: "English Literature" }, teacher: "Mr. Oladimeji", room: "Hall B", type: "Literature" },
          { start: "10:30", end: "11:30", subject: { id: 3, name: "Biology" }, teacher: "Miss Chidinma", room: "Lab 1", type: "Practical" }
      ]
  },
  tuesday: {
      periods: [
          { start: "08:00", end: "09:00", subject: { id: 4, name: "Physics" }, teacher: "Mr. Emmanuel", room: "Room 8", type: "Theory" },
          { start: "09:15", end: "10:15", subject: { id: 1, name: "Mathematics" }, teacher: "Mrs. Adebayo", room: "Room 12", type: "Theory" }
      ]
  },
  wednesday: {
      periods: [
          { start: "08:00", end: "09:00", subject: { id: 3, name: "Biology" }, teacher: "Miss Chidinma", room: "Lab 1", type: "Practical" },
          { start: "09:15", end: "10:15", subject: { id: 5, name: "Chemistry" }, teacher: "Mrs. Fatima", room: "Lab 2", type: "Theory" },
          { start: "11:00", end: "12:00", subject: { id: 2, name: "English Literature" }, teacher: "Mr. Oladimeji", room: "Hall B", type: "Literature" }
      ]
  },
  thursday: {
      periods: [
          { start: "08:00", end: "09:00", subject: { id: 1, name: "Mathematics" }, teacher: "Mrs. Adebayo", room: "Room 12", type: "Theory" },
          { start: "09:15", end: "10:15", subject: { id: 6, name: "History" }, teacher: "Mr. Kingsley", room: "Room 5", type: "Theory" }
      ]
  },
  friday: {
      periods: [
          { start: "08:00", end: "09:00", subject: { id: 3, name: "Biology" }, teacher: "Miss Chidinma", room: "Lab 1", type: "Practical" },
          { start: "09:15", end: "10:15", subject: { id: 4, name: "Physics" }, teacher: "Mr. Emmanuel", room: "Room 8", type: "Theory" },
          { start: "11:00", end: "12:00", subject: { id: 2, name: "English Literature" }, teacher: "Mr. Oladimeji", room: "Hall B", type: "Literature" }
      ]
  }
};


let days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

// Populate Day Selector
async function populateDaySelector() {
  let html = '';
  const today = new Date().getDay(); // 0=Sun, 1=Mon ...
  const todayIndex = today === 0 ? 0 : today - 1; // Monday = 0 in our array

  days.forEach((day, index) => {
      const isToday = index == todayIndex;
      html += `
      <button data-name="${day}"
              class="day-btn min-w-[90px] px-6 py-3 rounded-3xl text-sm font-medium whitespace-nowrap transition-all
              ${isToday ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}">
          ${day.charAt(0).toUpperCase() + day.slice(1)}
      </button>`;
  });
  $('#day-selector').html(html);

  $(".day-btn").click(function() {
    let ind = $(this).data('name');
    loadDay(ind)
  })

  loadDay(days[todayIndex])
}

// Load Timetable for a specific day
function loadDay(day) {
  $('.day-btn').removeClass('bg-emerald-600 text-white shadow-lg').addClass('bg-white dark:bg-gray-800');
  $(`.day-btn:contains(${day.charAt(0).toUpperCase() + day.slice(1)})`).addClass('bg-emerald-600 text-white shadow-lg');

  const dayData = timetableData[day];
  if (!dayData) return;

  let html = `<h2 class="text-xl font-semibold mb-5 capitalize">${day}'s Schedule</h2>`;

  dayData.periods.forEach((period, i) => {
      html += `
      <div data-id="${i}" data-name="${day}"
           class="sche-item bg-white dark:bg-gray-900 rounded-3xl p-6 mb-4 active:scale-[0.98] transition cursor-pointer border border-transparent hover:border-emerald-200">
          <div class="flex justify-between items-start">
              <div>
                  <div class="text-emerald-600 font-mono text-sm">${period.start} - ${period.end}</div>
                  <div class="text-2xl font-semibold mt-1">${period.subject.name}</div>
              </div>
              <div class="text-right">
                  <div class="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-4 py-1 rounded-2xl">${period.type}</div>
              </div>
          </div>
          <div class="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <div class="flex items-center gap-2">
                  <i class="fa-solid fa-user"></i>
                  <span>${period.teacher}</span>
              </div>
              <div class="flex items-center gap-2">
                  <i class="fa-solid fa-door-open"></i>
                  <span>${period.room}</span>
              </div>
          </div>
      </div>`;
  });

  $('#timetable-content').html(html);

  $(".sche-item").click(function() {
    let ind = $(this).data('id');
    let da = $(this).data('name');
    openPeriodDetail(da, ind)
  })
}

// Open Period Detail Modal
function openPeriodDetail(day, periodIndex) {
  const period = timetableData[day].periods[periodIndex];
  
  $('#modal-period-time').text(`${period.start} - ${period.end}`);
  $('#modal-period-subject').text(period.subject.name);
  $('#modal-teacher').text(period.teacher);
  $('#modal-room').text(period.room);
  $('#modal-duration').text(`${calculateDuration(period.start, period.end)} minutes`);
  $('#modal-type').text(period.type);

  // Sample topic for the period
  $('#modal-topic').html(`
      <div class="font-medium mb-2">Today's Topic:</div>
      <div class="text-lg">"${period.subject.name === 'Mathematics' ? 'Solving Quadratic Equations' : 
                            period.subject.name === 'Biology' ? 'Cell Structure and Function' : 
                            'Introduction to Literary Devices'}"</div>
  `);

  $('#period-detail-modal').removeClass('hidden').addClass('flex');
}

function closePeriodDetail() {
  $('#period-detail-modal').addClass('hidden').removeClass('flex');
}

function calculateDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// Toggle between Weekly and Daily view (demo)
let isWeeklyView = false;
function toggleViewMode() {
  isWeeklyView = !isWeeklyView;
  $('#view-mode-text').text(isWeeklyView ? 'Daily' : 'Weekly');
  showToast(isWeeklyView ? 'Switched to Daily View' : 'Switched to Weekly View');
  
  // For demo, reload Monday when switching
  if (!isWeeklyView) loadDay('monday');
}


// =========== Attendance section =====================
const attendanceData = {
      overall: { percentage: 92, present: 28, absent: 3, total: 31 },
      weeks: {
          week1: { percentage: 100, present: 5, absent: 0, days: [
              { date: "06 Apr", status: "present", reason: "" },
              { date: "07 Apr", status: "present", reason: "" },
              { date: "08 Apr", status: "present", reason: "" },
              { date: "09 Apr", status: "present", reason: "" },
              { date: "10 Apr", status: "present", reason: "" }
          ]},
          week2: { percentage: 80, present: 4, absent: 1, days: [
              { date: "13 Apr", status: "present", reason: "" },
              { date: "14 Apr", status: "absent", reason: "Sick" },
              { date: "15 Apr", status: "present", reason: "" },
              { date: "16 Apr", status: "present", reason: "" },
              { date: "17 Apr", status: "present", reason: "" }
          ]},
          week3: { percentage: 100, present: 5, absent: 0, days: [
              { date: "20 Apr", status: "present", reason: "" }
          ]},
          week4: { percentage: 90, present: 4, absent: 1, days: [] },
          week5: { percentage: 100, present: 5, absent: 0, days: [] },
          week6: { percentage: 80, present: 4, absent: 1, days: [] },
          week7: { percentage: 95, present: 5, absent: 0, days: [] },
          week8: { percentage: 100, present: 4, absent: 0, days: [
              { date: "13 Apr", status: "present", reason: "" },
              { date: "14 Apr", status: "present", reason: "" },
              { date: "15 Apr", status: "present", reason: "" },
              { date: "16 Apr", status: "present", reason: "" }
          ]}
      }
};

// Render Weekly Summary Grid
function renderWeeklyGrid() {
  let currentWeek = $('#week-filter').val();
  const weeks = attendanceData.weeks;
  let html = '';
  
  Object.keys(weeks).forEach(weekKey => {
      const week = weeks[weekKey];
      const isSelected = currentWeek === weekKey || currentWeek === "all";
      
      html += `
      <div data-id="${weekKey}" 
           class="week-item bg-white dark:bg-gray-800 rounded-3xl p-4 text-center active:scale-95 transition ${isSelected ? 'ring-2 ring-emerald-500' : ''}">
          <div class="text-xs text-gray-500 mb-1">${weekKey.toUpperCase()}</div>
          <div class="text-2xl font-bold text-emerald-600">${week.percentage}%</div>
          <div class="text-[10px] text-gray-400">${week.present}/${week.present + week.absent}</div>
      </div>`;
  });
  
  $('#weekly-grid').html(html);

  $(".week-item").click(function() {
    let id = $(this).data('id');
    selectWeek(id)
  })

  renderRegister();
}

// Render Detailed Register
function renderRegister() {
  let currentWeek = $('#week-filter').val();

  const weeksData = attendanceData.weeks;
  let allDays = [];
  
  if (currentWeek === "all") {
      Object.keys(weeksData).forEach(key => {
          if (weeksData[key].days && weeksData[key].days.length) {
              allDays = allDays.concat(weeksData[key].days);
          }
      });
  } else if (weeksData[currentWeek]) {
      allDays = weeksData[currentWeek].days;
  }
  
  let html = '';
  
  if (allDays.length === 0) {
      html = `<div class="p-12 text-center text-gray-400">No attendance records for this selection yet.</div>`;
  } else {
      allDays.forEach(day => {
          const statusIcon = day.status === "present" 
              ? `<i class="fa-solid fa-check-circle text-emerald-500 text-2xl"></i>` 
              : `<i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>`;
          
          html += `
          <div class="px-6 py-5 flex items-center justify-between">
              <div class="flex items-center gap-4">
                  <div class="text-base font-medium">${day.date}</div>
                  ${day.reason ? `<span class="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-3xl">${day.reason}</span>` : ''}
              </div>
              <div class="flex items-center gap-3">
                  ${statusIcon}
                  <span class="capitalize text-sm font-medium">${day.status}</span>
              </div>
          </div>`;
      });
  }
  
  $('#attendance-register').html(html);
}

// Select specific week from grid
function selectWeek(weekKey) {
  $('#week-filter').val(weekKey);
  renderWeeklyGrid();
}

// Export demo
function exportAttendance() {
  showToast("Attendance register exported as PDF", false);
}


// =========== Result section =====================
// Demo Results Data
const resultsData = {
  term1: {
      term: "Term 1",
      overall: 78,
      position: "12th out of 32",
      remark: "Good effort shown. Keep improving in English Literature and Biology.",
      subjects: [
          { name: "Mathematics", test: 22, exam: 65, total: 87, grade: "A" },
          { name: "English Literature", test: 19, exam: 58, total: 77, grade: "B" },
          { name: "Biology", test: 20, exam: 70, total: 90, grade: "A" },
          { name: "Physics", test: 21, exam: 62, total: 83, grade: "B" },
          { name: "Chemistry", test: 11, exam: 22, total: 33, grade: "E" }
      ]
  },
  term2: {
      term: "Term 2",
      overall: 84,
      position: "5th out of 32",
      remark: "Hassan continues to show strong potential in Science subjects. He needs to improve consistency in Mathematics and submit assignments on time. Overall performance is good.",
      subjects: [
        { name: "Mathematics", test: 20, exam: 40, total: 60, grade: "C" },
        { name: "English Literature", test: 19, exam: 58, total: 77, grade: "B" },
        { name: "Biology", test: 20, exam: 70, total: 90, grade: "A" },
        { name: "Physics", test: 9, exam: 13, total: 22, grade: "F" },
        { name: "Chemistry", test: 18, exam: 68, total: 86, grade: "A" }
    ]
  },
  term3: {
      term: "Term 3",
      overall: 81,
      position: "8th out of 32",
      remark: "Excellent improvement this term. Keep up the good work!",
      subjects: [
        { name: "Mathematics", test: 10, exam: 30, total: 40, grade: "D" },
        { name: "English Literature", test: 19, exam: 58, total: 77, grade: "B" },
        { name: "Biology", test: 20, exam: 70, total: 90, grade: "A" },
    ]
  }
};

// Render Results Table
function renderResults(term=1) {
  const data = resultsData[`term${term}`];
  
  $('#report-term').text(`${data.term} • 2025/2026`);
  $('#overall-percentage').text(`${data.overall}%`);
  $('#teacher-remark').text(data.remark);

  let tableHTML = '';
  data.subjects.forEach(sub => {
      tableHTML += `
      <tr class="border-b border-gray-100 dark:border-gray-700 last:border-none">
          <td class="py-5 font-medium">${sub.name}</td>
          <td class="text-center py-5">${sub.test}</td>
          <td class="text-center py-5">${sub.exam}</td>
          <td class="text-center py-5 font-semibold">${sub.total}</td>
          <td class="text-center py-5">
              <span class="inline-block px-4 py-1 text-xs font-medium rounded-3xl 
                  ${sub.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                    sub.grade === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">
                  ${sub.grade}
              </span>
          </td>
      </tr>`;
  });
  
  $('#results-table-body').html(tableHTML);
}

// Switch Term
function switchTerm(term) {
  
  // Update active button
  $('[id^="term-btn-"]').removeClass('bg-emerald-600 text-white');
  $(`#term-btn-${term}`).addClass('bg-emerald-600 text-white');
  
  renderResults(term);
}

// Download Report Card
function downloadReportCard() {
  showToast("Report card downloaded as PDF 📄", false);
}

// =========== Fees section =====================
// Demo Tuition Data
let tuitionData = [
  {
      id: 1,
      term: "Term 2",
      session: "2025/2026 Session",
      amount: 285000,
      paid: 236500,
      outstanding: 48500,
      isPaid: false,
      breakdown: [
          { name: "Tuition Fee", amount: 210000 },
          { name: "PTA Levy", amount: 15000 },
          { name: "Development Levy", amount: 25000 },
          { name: "Uniform & Books", amount: 35000 }
      ],
      transactions: [
          { date: "12 Mar 2026", amount: 150000, method: "Bank Transfer", receiptId: "RCP-784392" },
          { date: "05 Apr 2026", amount: 86500, method: "Card", receiptId: "RCP-784393" }
      ]
  },
  {
      id: 2,
      term: "Term 1",
      session: "2025/2026 Session",
      amount: 270000,
      paid: 270000,
      outstanding: 0,
      isPaid: true,
      breakdown: [
          { name: "Tuition Fee", amount: 200000 },
          { name: "PTA Levy", amount: 15000 },
          { name: "Development Levy", amount: 25000 },
          { name: "Uniform & Books", amount: 35000 }
      ],
      transactions: [
          { date: "10 Sep 2025", amount: 270000, method: "Bank Transfer", receiptId: "RCP-652341" }
      ]
  },
  {
      id: 3,
      term: "Term 3",
      session: "2024/2025 Session",
      amount: 290000,
      paid: 145000,
      outstanding: 145000,
      isPaid: false,
      breakdown: [
          { name: "Tuition Fee", amount: 215000 },
          { name: "PTA Levy", amount: 15000 },
          { name: "Development Levy", amount: 25000 },
          { name: "Exam Fee", amount: 35000 }
      ],
      transactions: []
  }
];

let currentFee = null;

// Render Fees List
function renderFeesList(filteredData) {
  let html = '';
  
  filteredData.forEach(fee => {
      const statusColor = fee.isPaid ? 'emerald' : (fee.outstanding > 0 ? 'red' : 'amber');
      const statusText = fee.isPaid ? 'PAID' : (fee.outstanding > 0 ? 'PARTIAL' : 'PENDING');
      
      html += `
      <div data-id="${fee.id}"" 
           class="fee-box-item bg-white dark:bg-gray-900 rounded-3xl p-6 cursor-pointer active:scale-[0.98] transition border border-transparent hover:border-emerald-200">
          <div class="flex justify-between items-start">
              <div>
                  <div class="font-semibold text-2xl">${fee.term}</div>
                  <div class="text-sm text-gray-500">${fee.session}</div>
              </div>
              <span class="px-4 py-1 text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-400 rounded-3xl">${statusText}</span>
          </div>
          
          <div class="mt-8 flex justify-between items-end">
              <div>
                  <div class="text-xs text-gray-500">TOTAL</div>
                  <div class="text-3xl font-bold">₦${fee.amount.toLocaleString()}</div>
              </div>
              <div class="text-right">
                  <div class="text-xs text-gray-500">PAID</div>
                  <div class="text-2xl font-semibold text-emerald-600">₦${fee.paid.toLocaleString()}</div>
                  <div class="text-xs text-red-500 mt-1">₦${fee.outstanding.toLocaleString()} outstanding</div>
              </div>
          </div>
      </div>`;
  });
  
  if (filteredData.length === 0) {
      html = `<div class="text-center py-16 text-gray-400">No fees found for this filter.</div>`;
  }
  
  $('#fees-list').html(html);
  
  // Update total outstanding
  const totalOut = filteredData.reduce((sum, f) => sum + f.outstanding, 0);
  $('#total-outstanding').text(`₦${totalOut.toLocaleString()}`);

  $(".fee-box-item").click(function() {
    let id = $(this).data('id');
    openFeeDetail(id)
  })
}

// Filter Fees
function filterFees() {
  const term = $('#fee-term-filter').val();

  let filtered = tuitionData;

  if (term !== 'all') {
    filtered = filtered.filter(fee => fee.id === parseInt(term));
  }

  renderFeesList(filtered);
}

// Open Fee Detail Modal
function openFeeDetail(id) {
  currentFee = tuitionData.find(f => f.id === id);
  if (!currentFee) return;

  $('#modal-term-title').text(`${currentFee.term} • ${currentFee.session}`);
  
  const statusHTML = currentFee.isPaid 
      ? `<span class="text-emerald-600 font-medium">✓ Fully Paid</span>` 
      : `<span class="text-red-500 font-medium">₦${currentFee.outstanding.toLocaleString()} outstanding</span>`;
  $('#modal-fee-status').html(statusHTML);

  // Breakdown
  let breakdownHTML = '';
  currentFee.breakdown.forEach(item => {
      breakdownHTML += `
      <div class="px-6 py-4 flex justify-between items-center">
          <span>${item.name}</span>
          <span class="font-medium">₦${item.amount.toLocaleString()}</span>
      </div>`;
  });
  $('#breakdown-list').html(breakdownHTML);

  // Summary
  $('#modal-total-amount').text(`₦${currentFee.amount.toLocaleString()}`);
  $('#modal-outstanding').text(`₦${currentFee.outstanding.toLocaleString()}`);

  // Transactions
  let transHTML = '';
  if (currentFee.transactions.length === 0) {
      transHTML = `<div class="text-center py-12 text-gray-400">No transactions yet</div>`;
  } else {
      currentFee.transactions.forEach(t => {
          transHTML += `
          <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 flex justify-between items-center">
              <div>
                  <div class="text-sm">${t.date}</div>
                  <div class="text-xs text-gray-500">${t.method}</div>
              </div>
              <div class="text-right">
                  <div class="font-semibold">₦${t.amount.toLocaleString()}</div>
                  <button onclick="printReceipt('${t.receiptId}'); event.stopImmediatePropagation();" 
                          class="text-xs mt-2 px-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-3xl">Print Receipt</button>
              </div>
          </div>`;
      });
  }
  $('#transactions-list').html(transHTML);

  // Show/hide pay button
  if (currentFee.outstanding > 0) {
      $('#pay-button').show();
  } else {
      $('#pay-button').hide();
  }

  $('#fee-detail-modal').removeClass('hidden').addClass('flex');
}

function closeFeeDetailModal() {
  $('#fee-detail-modal').addClass('hidden').removeClass('flex');
  //currentFee = null;
}

// Make Payment
function makeFeesPayment() {
  //closeFeeDetailModal();
  
  $('#payment-for').text(`${currentFee.term} • ${currentFee.session}`);
  $('#payment-amount').val(currentFee.outstanding);
  $('#payment-outstanding-display').text(`₦${currentFee.outstanding.toLocaleString()}`);
  
  $('#payment-modal').removeClass('hidden').addClass('flex');
}

function closePaymentModal() {
  $('#payment-modal').addClass('hidden').removeClass('flex');
}

function selectPaymentMethod(btn) {
  $('.payment-method-btn').removeClass('active border-emerald-600');
  btn.addClass('active border-emerald-600');
}

function processPayment() {
  const amount = parseInt($('#payment-amount').val()) || 0;
  
  if (amount <= 0 || amount > currentFee.outstanding) {
      showToast('Please enter a valid amount', true);
      return;
  }
  
  // Simulate payment
  closePaymentModal();
  showToast(`₦${amount.toLocaleString()} paid successfully! 🎉`, false);
  
  // Update data
  currentFee.paid += amount;
  currentFee.outstanding -= amount;
  if (currentFee.outstanding <= 0) currentFee.isPaid = true;
  
  // Add transaction
  currentFee.transactions.unshift({
      date: "16 Apr 2026",
      amount: amount,
      method: "Bank Transfer",
      receiptId: "RCP-" + Math.floor(100000 + Math.random() * 900000)
  });
  
  // Refresh
  setTimeout(() => {
    filterFees()
    openFeeDetail(currentFee.id);
  }, 800);
}

// Print Receipt (demo)
function printReceipt(receiptId) {
  showToast(`Receipt ${receiptId} downloaded as PDF`, false);
}


// =========== Group CHat section =====================
// Demo Messages
let messages = [
  {
      id: 1,
      sender: "Mrs. Adebayo",
      avatar: "👩‍🏫",
      time: "10:12",
      text: "Good morning everyone! Please remember to submit your quadratic equations assignment by tomorrow.",
      isSelf: false,
      starred: false
  },
  {
      id: 2,
      sender: "Hassan",
      avatar: "",
      time: "10:15",
      text: "Good morning ma! Noted ✅",
      isSelf: true,
      starred: false
  },
  {
      id: 3,
      sender: "Aisha Yusuf",
      avatar: "👧",
      time: "10:18",
      text: "Ma, can we get the solved examples for question 4?",
      isSelf: false,
      starred: true
  },
  {
      id: 4,
      sender: "Hassan",
      avatar: "",
      time: "10:22",
      text: "I just uploaded my assignment 📎",
      isSelf: true,
      starred: false,
      attachment: { type: "file", name: "Assignment_Quadratic.pdf" }
  }
];

let starredMessages = [];

// Render Messages
async function renderMessages() {
  let html = '';
  messages.forEach(msg => {
      if (msg.isSelf) {
          html += `
          <div class="flex justify-end group">
              <div class="max-w-[75%]">
                  <div onclick="toggleMessageOptions(${msg.id}, event)" 
                       class="bg-emerald-600 text-white px-5 py-3 rounded-3xl rounded-br-none text-base leading-relaxed">
                      ${msg.text}
                      ${msg.attachment ? `<div class="mt-3 text-xs opacity-75 flex items-center gap-2"><i class="fa-solid fa-paperclip"></i> ${msg.attachment.name}</div>` : ''}
                  </div>
                  <div class="flex items-center justify-end gap-2 mt-1 text-[10px] text-gray-400">
                      <span>${msg.time}</span>
                      <i onclick="event.stopImmediatePropagation(); toggleStar(${msg.id});" 
                         class="fa-solid ${msg.starred ? 'fa-star text-amber-400' : 'fa-star-o'} cursor-pointer"></i>
                      <i class="fa-solid fa-check text-emerald-400"></i>
                  </div>
              </div>
          </div>`;
      } else {
          html += `
          <div class="flex gap-3">
              <div class="text-3xl flex-shrink-0">${msg.avatar}</div>
              <div class="max-w-[75%]">
                  <div class="text-xs text-gray-500 mb-px">${msg.sender}</div>
                  <div onclick="toggleMessageOptions(${msg.id}, event)" 
                       class="bg-white dark:bg-gray-800 px-5 py-3 rounded-3xl rounded-bl-none text-base leading-relaxed dark:text-gray-100">
                      ${msg.text}
                      ${msg.attachment ? `<div class="mt-3 text-xs flex items-center gap-2"><i class="fa-solid fa-paperclip"></i> ${msg.attachment.name}</div>` : ''}
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span>${msg.time}</span>
                      <i onclick="event.stopImmediatePropagation(); toggleStar(${msg.id});" 
                         class="fa-solid ${msg.starred ? 'fa-star text-amber-400' : 'fa-star-o'} cursor-pointer"></i>
                  </div>
              </div>
          </div>`;
      }
  });
  $('#chat-body').html(html);
  $('#chat-body').scrollTop($('#chat-body')[0].scrollHeight);
}

// Send Message with animation
function sendMessage() {
  const input = $('#message-input');
  const text = input.val().trim();
  if (!text) return;

  // Create pending message
  const tempId = Date.now();
  const pendingHTML = `
  <div id="pending-msg-${tempId}" class="flex justify-end opacity-0 translate-y-4 transition-all duration-300">
      <div class="max-w-[75%]">
          <div class="bg-emerald-600 text-white px-5 py-3 rounded-3xl rounded-br-none text-base leading-relaxed">
              ${text}
          </div>
          <div class="flex items-center justify-end gap-2 mt-1 text-[10px] text-gray-400">
              <span>just now</span>
              <i class="fa-solid fa-clock animate-spin"></i>
          </div>
      </div>
  </div>`;

  $('#chat-body').append(pendingHTML);
  $('#chat-body').scrollTop($('#chat-body')[0].scrollHeight);

  // Clear input
  input.val('').trigger('input');

  // Simulate sending (800ms delay)
  setTimeout(() => {
      const sentMsg = {
          id: tempId,
          sender: "Hassan",
          time: "just now",
          text: text,
          isSelf: true,
          starred: false
      };
      messages.push(sentMsg);
      renderMessages();
      
      // Remove pending element
      $(`#pending-msg-${tempId}`).remove();
  }, 800);
}

// Auto-grow textarea
$('#message-input').on('input', function() {
  this.style.height = 'auto';
  const maxHeight = 128;
  if (this.scrollHeight > maxHeight) {
      this.style.height = maxHeight + 'px';
      this.style.overflowY = 'auto';
  } else {
      this.style.height = this.scrollHeight + 'px';
      this.style.overflowY = 'hidden';
  }
});

// Emoji Picker
function toggleEmojiPicker() {
  const picker = $('#emoji-picker');
  picker.toggleClass('hidden');
  
  if (!picker.hasClass('hidden') && picker.children().length === 0) {
      const emojis = ['😀','😂','❤️','👍','👏','🔥','📚','🎉','🙌','🚀','📝','❓','✅','📎','🌍'];
      let html = '';
      emojis.forEach(emoji => {
          html += `<div onclick="insertEmoji('${emoji}')" class="cursor-pointer hover:scale-125 transition text-center">${emoji}</div>`;
      });
      picker.html(html);
  }
}

function insertEmoji(emoji) {
  const input = document.getElementById('message-input');
  input.value += emoji;
  input.focus();
  toggleEmojiPicker();
}

// File Upload
function triggerFileUpload() {
  $('#chat-file-input').click();
}

$(document).on('change', '#chat-file-input', function(e) {
  const files = e.target.files;
  if (!files.length) return;
  
  const previewContainer = $('#attachment-preview');
  previewContainer.html('').removeClass('hidden');
  
  Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const previewHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 flex items-center gap-3 text-sm shadow-sm">
          ${isImage ? '🖼️' : '📎'} 
          <span class="flex-1 truncate">${file.name}</span>
          <button onclick="this.parentElement.remove(); if($('#attachment-preview').children().length===0) $('#attachment-preview').addClass('hidden')" class="text-red-400">✕</button>
      </div>`;
      previewContainer.append(previewHTML);
  });
  
  // In real app this would upload and attach to message
  showToast(`${files.length} file(s) attached`, false);
});

// Message options (long press simulation via click)
function toggleMessageOptions(id, e) {
  e.stopImmediatePropagation();
  const msg = messages.find(m => m.id === id);
  if (!msg) return;
  
  if (confirm(`Message options for:\n\n${msg.text}\n\n1️⃣ Star\n2️⃣ Copy\n3️⃣ Reply`)) {
      // Demo - copy to clipboard
      navigator.clipboard.writeText(msg.text).then(() => {
          showToast('Message copied to clipboard', false);
      });
  }
}

function toggleStar(id) {
  const msg = messages.find(m => m.id === id);
  if (msg) {
      msg.starred = !msg.starred;
      if (msg.starred) starredMessages.push(msg);
      renderMessages();
      showToast(msg.starred ? 'Message starred ⭐' : 'Star removed', false);
  }
}

// Dropdown
function toggleChatDropdown() {
  $('#chat-dropdown-menu').toggleClass('hidden');
}

// View Members
function viewClassMembers() {
  toggleChatDropdown();
  const membersHTML = `
      <div class="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-3xl mb-2">
          <div class="flex items-center gap-3"><span class="text-3xl">👩‍🏫</span><div><div class="font-medium">Mrs. Adebayo</div><div class="text-xs text-emerald-600">Class Teacher</div></div></div>
          <span class="text-xs bg-emerald-100 text-emerald-600 px-4 py-1 rounded-3xl">Online</span>
      </div>
      <div class="px-4 py-3 flex items-center gap-3"><span class="text-3xl">👦</span><div class="flex-1"><div class="font-medium">Hassan Olamide</div><div class="text-xs text-gray-500">You</div></div></div>
      <div class="px-4 py-3 flex items-center gap-3"><span class="text-3xl">👧</span><div class="flex-1"><div class="font-medium">Aisha Yusuf</div></div></div>
      <div class="px-4 py-3 flex items-center gap-3"><span class="text-3xl">👦</span><div class="flex-1"><div class="font-medium">David Okonkwo</div></div></div>
      <div class="px-4 py-3 flex items-center gap-3"><span class="text-3xl">👧</span><div class="flex-1"><div class="font-medium">Fatima Bello</div></div></div>
  `;
  $('#members-list').html(membersHTML);
  $('#members-modal').removeClass('hidden').addClass('flex');
}

function closeMembersModal() {
  $('#members-modal').addClass('hidden').removeClass('flex');
}

// Starred Messages
function showStarredMessages() {
  toggleChatDropdown();
  let html = '';
  if (starredMessages.length === 0) {
      html = `<p class="text-center py-12 text-gray-400">No starred messages yet</p>`;
  } else {
      starredMessages.forEach(m => {
          html += `<div class="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-3xl">${m.text}</div>`;
      });
  }
  $('#starred-list').html(html);
  $('#starred-modal').removeClass('hidden').addClass('flex');
}

function closeStarredModal() {
  $('#starred-modal').addClass('hidden').removeClass('flex');
}

function clearChat() {
  toggleChatDropdown();
  if (confirm('Clear entire chat history?')) {
      messages = [];
      renderMessages();
      showToast('Chat cleared', false);
  }
}

// Close dropdown when clicking outside
$(document).on('click', function(e) {
  if (!$(e.target).closest('#chat-dropdown-menu').length && !$(e.target).closest('button').length) {
      $('#chat-dropdown-menu').addClass('hidden');
  }
  if (!$(e.target).closest('#emoji-picker').length && !$(e.target).closest('button').length) {
      $('#emoji-picker').addClass('hidden');
  }
});




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
$(".close-bio-confirm").on('click', cancelBiometricsToggle)
$(".open-bio-confirm").on('click', confirmBiometricsToggle)
$(".logout-btn").on('click', logout)
$(".change-pass-btn").on('click', showChangePasswordModal)
$(".close-pass-con").on('click', closeChangePasswordModal)
$(".close-period-btn").on('click', closePeriodDetail)
$(".close-fees-btn").on('click', closeFeeDetailModal)
$(".close-pay-btn").on('click', closePaymentModal)
$(".close-mem-modal").on('click', closeMembersModal)
$(".close-starred-modal").on('click', closeStarredModal)
$(".send-message-btn").on('click', sendMessage)
$("#fees-pay-button").on('click', makeFeesPayment)
$(".pay-fees-btn").on('click', processPayment)
$(".toggle-chat-dropdown").on('click', toggleChatDropdown)
$(".view-chat-members").on('click', viewClassMembers)
$(".starred-btn").on('click', showStarredMessages)
$(".clear-chat-btn").on('click', clearChat)
$(".payment-method-btn").on('click', () => {selectPaymentMethod($(this))})
$(".update-pass-btn").on('click', saveNewPassword)
$(".std-tutor-modal").on('click', openTeacherModal)
$("#biometrics-toggle").on('click', (e) => {e.preventDefault(); toggleBiometrics()})

$("#subject-tab-0").on('click', () => {switchSubjectTab(0)})
$("#subject-tab-1").on('click', () => {switchSubjectTab(1)})
$("#subject-tab-2").on('click', () => {switchSubjectTab(2)})
$("#subject-tab-3").on('click', () => {switchSubjectTab(3)})

$("#assign-tab-0").on('click', () => {switchAssignmentTab(0)})
$("#assign-tab-1").on('click', () => {switchAssignmentTab(1)})
$("#assign-tab-2").on('click', () => {switchAssignmentTab(2)})

$("#quiz-submit-btn").on('click', submitTopicQuiz)
$(".download-rep-btn").on('click', downloadReportCard)
$("#week-filter").on('change', renderWeeklyGrid)
$("#fee-term-filter").on('change', filterFees)

$(".reload-btn").click(async () => {
  showToast("Reloading data...", false);
  await loadAllData();
  showToast("Loading complete!", false);
})

$(".cursor-pointer").click(async () => {
  let id = $(this).data('id');
  console.log(id)
  await navigateTo(`#${id}`);
  toggleFlyoutMenu()
})
$("#school-back").on('click', (e) => {e.preventDefault(); backToSchoolSelect()})
$("#login-form").on('submit', async (e) => {e.preventDefault(); await authenticate()})

$("#view-mode-btn").on('click', toggleViewMode)
$("#term-btn-1").on('click', () => {switchTerm(1)})
$("#term-btn-2").on('click', () => {switchTerm(2)})
$("#term-btn-3").on('click', () => {switchTerm(3)})
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
    else if (data && data.type === 'BIOMETRIC_REGISTERED') {
      await API.updateBioLogin(true)
      $("#biometrics-toggle").prop('checked', true)
      showToast("Biometric login enabled!", false)
    }
    else if (data && data.type === 'DEVICE_INFO') {
      await API.saveDeviceId(data.payload.uniqueId)
      //console.log(data.payload) {brand, modelName, osName, osVersion, deviceType, manufacturer, uniqueId};
    }
    else if (data && data.type === 'SAVE_RESULT') {
      //console.log(data.payload);  {success:boolean, message}
    }
    else if (data && data.type === 'PONG') {
      //console.log(data.payload?.ts);
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