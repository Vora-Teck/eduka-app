
function logout() {
  let url = `${base_url}accounts/dev_logout/`;

  var headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
  }

  $(".page-load").removeClass('keep')
  fetch(url, {
      method:'POST',
      headers: headers,
      credentials: "include",
      body: ""
  })
  .then(res => {return res.json()})
  .then(data => {
      //console.log(data);
       if(data.status == 'success') {
          pushNotification("n_success", data.message, 5000)
          location.href = '/login/'
       }
       else if(data.status == 'error') {
          pushNotification("n_error", data.message, 5000)
       }
       $(".page-load").addClass('keep')
  })
  .catch(err => {
      console.log(err);
      pushNotification("n_error", "Please check your internet connection", 5000)
      $(".page-load").addClass('keep')
  })
}

function escapeHtml(text) {
  var escapedText = $('<code>').text(text).html();
  return escapedText.replace(/\n/g, '&lt;br&gt;')
}

function digify(n, decimal=false) {
  a = Number(n)
  if(decimal) {
    return a.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
  }
  else{
    return a.toLocaleString()
  }
  
}


function datify(date, time=false) {
  if(time) {
    return `${new Date(date).toDateString()} ${new Date(date).toLocaleTimeString()}`
  }
  else {
    return `${new Date(date).toDateString()}`;
  }
}

function timify(time) {
  if(time) {
    let [hours, mins] = time.split(':')
    hours = Number(hours);
    let position = (hours >= 12) ? 'PM' : 'AM';
    hours = (hours > 12) ? hours - 12 : hours;
    hours = hours.toString().padStart(2, '0')
    mins = mins.padStart(2, '0')
    return `${hours}:${mins}${position}`
  }
}

function copyText(message) {
  const textArea = document.createElement('textarea');
  textArea.value = message;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea)
  swal('Success', 'copied!', 'success')
}

function generateString(n, upper=true, lower=true, digits=true) {
  var characters = ""
  if(upper) {characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"}
  if(lower) {characters += "abcdefghijklmnopqrstuvwxyz"}
  if(digits) {characters += "0123456789"}

  let result = ""
  const length = characters.length;

  for(let i=0; i < n; i++) {
    result += characters.charAt(Math.floor(Math.random() * length));
  }

  return result;
}

function truncateWord(str, n) {
  trunc_str = str.substring(0, n);
  if(str.length > n) {
    trunc_str += "...";
  }
  return trunc_str
}

function renderObject(obj) {
  const ul = $(`<ul></ul>`);
  ul.addClass('tr-det')
   for(const key in obj) {
    const li = $(`<li></li>`);
    const value = obj[key];

    if(typeof value === 'object' && value !== null) {
      // create toggle button
      const toggle = $(`<span></span>`);
      toggle.addClass('toggle');
      toggle.html('<i class="w-large fa fa-angle-right"></i>')

      // label for key
      const label = $(`<span></span>`);
      label.addClass('key');
      label.text(`${key}:`)

      // nested object rendering
      const nestedUL = renderObject(value);
      nestedUL.addClass('nested');

      // toggle event
      toggle.click(function() {
        const parent = $(this).parent();
        parent.toggleClass('open');
        $(this).html(`${parent.hasClass('open') ? '<i class="w-large fa fa-angle-down"></i>' : '<i class="w-large fa fa-angle-right"></i>'}`)
      })
      li.append(toggle);
      li.append(label);
      li.append(nestedUL);
    }
    else {
      // for simle key-value pair
      li.html(`<span class="key">${key}:</span> ${value}`)
    }
    ul.append(li);
   }
  return ul
}

function pushNotification(type, text, time, event=null) {
  var t = {
    n_error: "/static/logos/error.png",
    n_info: "/static/logos/info.png",
    n_network: "/static/logos/network.png",
    n_success: "/static/logos/success.png",
    n_warning: "/static/logos/warning.png",
  }
  Toastify({
    text: text,
    duration: time, // -1 for permanent
    className: `${type} w-card w-bold`,
    //destination: "#",
    newWindow: true,
    close: true,
    avatar: t[type], // image to br shown before text
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      //background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    offset: {
      x: '0px',
      y: '-10px',
    },
    //callback: function(){}, // when toast is dismissed
    ariaLive: "polite",
    oldestFirst: true,
    escapeMarkup: false, // escape markup syntax
    onClick: event // Callback after click
  }).showToast();
}

function downloadFile(url, filename="") {
  let link = document.createElement('a');
  link.href = url;
  link.dowload = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  pushNotification("n_success", "File downloaded successfully", 4000);
}

function getQueryParams() {
  let params = new URLSearchParams(window.location.search);
  let query = Object.fromEntries(params.entries());
  return query
}

function safeUUID() {
  if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
  }
  // Fallback for insecure origins like LAN
  return "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

function getWeeks(start, end) {
  let start_date = new Date(start);
  let end_date = new Date(end);
  let today = new Date();
  let ending = today > end_date ? end_date : today;

  let date_diff = ending - start_date;

  return Math.round(date_diff / (1000 * 60 * 60 * 24 * 7))
}

function dateDiff(date) {
  let givenDate = new Date(date);
  let today = new Date();

  let diff_years = today.getFullYear() - givenDate.getFullYear();

  if(
    today.getMonth() < givenDate.getMonth() ||
    (today.getMonth() === givenDate.getMonth() && today.getDate() < givenDate.getDate())
  ) {
    diff_years--;
  }
  return diff_years;
}


function buildQueryParams(obj, hash=null) {
  if(hash == null) hash = window.location.hash;
  let params = new URLSearchParams(obj);
  let url = `${window.location.protocol}//${window.location.host}/?${params.toString()}${hash}`;
  return url
}

function showToast(message, isError = false) {
  const toast = $(`
      <div class="toast bg-white dark:bg-gray-800 shadow-2xl rounded-3xl px-6 py-4 flex items-center gap-3 min-w-[280px]">
          <div class="${isError ? 'text-red-500' : 'text-emerald-500'}">
              <i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-check-circle'}"></i>
          </div>
          <div class="flex-1 text-sm">${message}</div>
      </div>
  `);
  
  $('#toast-container').append(toast);
  
  setTimeout(() => {
      toast.fadeOut(300, function() { $(this).remove(); });
  }, 2800);
}


function showLoader(text="") {
  //console.log(text)
  $("#loader-text").html(text)
  $(".page-load").addClass("active")
}
function hideLoader() {
  $("#loader-text").empty()
  $(".page-load").removeClass("active")
}

function checkNetwork() {
  let webVersion = navigator.userAgent;
  if(/Chrome\/5[0-9]/.test(webVersion)) {
    showToast("Your device version is outdated and cannot run this app.", true)
  }
  if(!navigator.onLine && window.location.hostname != "127.0.0.1") {
    showToast("You are now offline!", true)
  }
  else {
    showToast("You are now online!", true)
  }
}

function capitalize(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
  // return str
  // .toLowerCase()
  // .split(" ")
  // .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  // .join(" ");
}

// ============ utility functions ================
function getHash() {
  return window.location.hash || '#intro-page';
}
// Hash Routing System
function showSection(hash) {
  $('.section').addClass('hidden');
  $(hash).removeClass('hidden');
  
  // Hide bottom nav on intro and login
  if (hash === '#intro-page' || hash === '#login-page') {
      $('#bottom-nav').hide();
      $("#main-app").addClass('hidden');
  } else {
      $('#bottom-nav').show();
      $("#main-app").removeClass('hidden');
  }
}

async function navigateTo(hash) {
  window.location.hash = hash;
  await changeHash()
}

// Handle hash changes
async function changeHash() {
  let hash = window.location.hash || '#intro-page';
  showSection(hash);
}
window.onhashchange = changeHash;
//checkNetwork()




