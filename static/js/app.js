// app.js
import * as API from "./modules/api.js";
import * as CRYPTO from "./modules/crypto.js";
import * as IDB from "./modules/idb-keys.js";
import { exportBackup, importBackupFile } from "./modules/backup.js";
// pdf reader
import EmbedPDF from "./modules/embedpdf.js";
// translator
import { languages } from "./modules/countries.js";
// voice call
import * as WEBRTC from "./modules/webrtc.js";



/* ----------------- UI refs ----------------- */
const loginView = $("#login-view");
const signupView = $("#signup-view");
const chatView = $("#chat-view");

const btnLogin = $("#btn-login");
const btnSignup = $("#btn-signup");
const toSignup = $("#to-signup");
const openUpload = $("#to-login");

const convoListEl = document.getElementById("convo-list");
const callListEl = document.getElementById("call-list");
const convoListGr = document.getElementById("convo-list-group");
const messagesEl = document.getElementById("messages");
const messagesCon = document.getElementById("message-con");
const activeTitle = $("#active-title");
const msgInput = $("#msg-input");
const btnSend = $("#btn-send");
const btnLogout = $(".btn-logout");
const btnNew = $(".btn-new");
const btnExport = $(".btn-export");
const btnImport = $(".btn-import");
const translateBtn = document.querySelector("#translate-button");
const selectTag = document.querySelectorAll(".translate-con select");

let ws = null, wsOpen = false, meEmail = null, currentConvo = null;
let rsaPrivate = null, rsaPublicB64 = null; // private CryptoKey imported, public base64
let cachedAesKeys = {}; // convoId -> CryptoKey


history.pushState(null, '', location.href);
$(window).on("popstate", function(e) {
  history.pushState(null, '', location.href);
  if($(".main").hasClass("show")) {
    $(".sidebar").removeClass('hide');
    $(".main").removeClass('show');
    currentConvo = null;
    $(".convo-item").removeClass("active")
  }
  return;
})

/* ----------------- helpers ----------------- */
function show(view){
  loginView.addClass("hidden");
  signupView.addClass("hidden");
  chatView.addClass("hidden");
  view.removeClass("hidden");
}

function fmtTs(iso){
  try {
    const dt = new Date(iso);
    dt.setHours(dt.getHours() + 1);
    const now = new Date();
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    if (dt.toDateString() === now.toDateString()){
      return dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
    else if (dt.toDateString() === yesterday.toDateString()){
      return "Yesterday" + " " + dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
    else {
      return dt.toLocaleDateString() + " " + dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
  } catch(e){ return iso; }
}

function callTs(iso){
  try {
    const dt = new Date(iso);
    const now = new Date();
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    if (dt.toDateString() === now.toDateString()){
      return "Today at" + " " + dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
    else if (dt.toDateString() === yesterday.toDateString()){
      return "Yesterday at" + " " + dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
    else {
      return dt.toDateString() + " " + dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
    
    
  } catch(e){ return iso; }
}

function fmtTsConvo(iso){
  try {
    const dt = new Date(iso);
    dt.setHours(dt.getHours() + 1);
    const now = new Date();
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    if (dt.toDateString() === now.toDateString()){
      return dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:true});
    }
    else if (dt.toDateString() === yesterday.toDateString()){
      return "Yesterday";
    }
    else {
      return dt.toLocaleDateString();
    }
  } catch(e){ return iso; }
}

function showLoader(text="") {
  $("#loader-text").html(text)
  $(".page-load").addClass("active")
}
function hideLoader() {
  $("#loader-text").empty()
  $(".page-load").removeClass("active")
}

async function showUsername() {
  $("#user-username").html(await API.getUsername())
}

/* ----------------- Key management ----------------- */
async function ensureKeysRegistered(){
  // check for existing private key in idb
  const privB64 = await IDB.getKey("private_pkcs8");
  const pubB64 = await IDB.getKey("public_spki");
  if (privB64 && pubB64){
    rsaPrivate = await CRYPTO.importPrivateKeyFromPkcs8B64(privB64);
    rsaPublicB64 = pubB64;
    // also re-send public key to server to make sure it's present (idempotent)
    await API.putMyPublicKey(rsaPublicB64);
  }
  else {
    await registerKeyPairs()
    await ensureKeysRegistered()
  }
}

async function registerKeyPairs() {
  // check for existing private key in idb
  const privB64 = await IDB.getKey("private_pkcs8");
  const pubB64 = await IDB.getKey("public_spki");
  if (privB64 && pubB64) return;
  const kp = await CRYPTO.generateRSAKeyPair();
  const exportedPub = await CRYPTO.exportPublicKeySpkiB64(kp.publicKey);
  const exportedPriv = await CRYPTO.exportPrivateKeyPkcs8B64(kp.privateKey);
  await IDB.putKey("private_pkcs8", exportedPriv);
  await IDB.putKey("public_spki", exportedPub);
}

/* ----------------- Message Rendering and storage ----------------- */
// Save an encrypted message object into IDB (messageObj is raw from server or created)
async function saveEncryptedMessageToIDB(convoId, messageObj) {
  // messageObj should include id (or temp_id), body (encrypted iv.cipher), sender, ts
  const msgId = messageObj.id || messageObj.temp_id || (`tmp_${Date.now()}`);
  await IDB.putMessage(convoId, msgId, {
    id: msgId,
    body: messageObj.body,
    sender: messageObj.sender,
    file: messageObj.file || null,
    conversation: convoId,
    ts: messageObj.ts || new Date().toISOString(),
    encrypted: true
  });
}

// Update conversation metadata in IDB (used to keep last_timestamp/last_message)
async function updateConvoMetaFromMessage(convoId, messageObj, titleOrKeep) {
  const meta = (await IDB.getConvoMeta(convoId)) || { id: convoId, title: titleOrKeep || "Conversation", is_group: false, unread_count:0 };
  // last_timestamp is ISO string
  const ts = messageObj.ts || new Date().toISOString();
  meta.last_timestamp = ts;
  meta.last_msg_timestamp = ts;
  meta.last_message = messageObj.plain_preview || (typeof messageObj.body === "string" ? messageObj.body.slice(0, 200) : null);
  await IDB.putConvoMeta(convoId, meta);
}

/* ----------------- WebSocket ----------------- */
async function startWS(){
  const token = await API.getToken()
  ws = new WebSocket(API.WS_URL + "?token=" + encodeURIComponent(token));
  ws.onopen = ()=>{ wsOpen = true; console.log("WS open"); window._ws = ws; }
  ws.onclose = ()=>{ wsOpen = false; console.log("WS closed"); window._ws = null; }
  ws.onerror = (e)=>{ console.error("WS err", e) }
  ws.onmessage = async (ev)=>{
    const data = JSON.parse(ev.data);
    //console.log(data)
    console.log("ws received")
    // ack vs create
    if (data.type === "message.ack"){
      // reconcile optimistic UI: replace temp bubble (we keep simple: we will refresh view)
      if (String(data.conversation) === String(currentConvo)) {
        //await selectConversation(currentConvo)
        $(`#${data.temp_id}`).html(`<i class="fa fa-check"></i>`)
        // optionally update the existing message in IDB (replace temp id with real id)
        // move message in IDB from temp to real id if provided
        if (data.message_id && data.temp_id) {
          const convoId = data.conversation;
          // Always save the raw encrypted body to IDB (so offline/refresh works)
          const encryptedBody = data.body;
          const msgObj = {
            id: data.message_id,
            temp_id: data.temp_id,
            body: encryptedBody,
            sender: await API.getUsername(),
            file: data.file,
            conversation: convoId,
            ts: data.created_at || new Date().toISOString()
          };
                  
          await saveEncryptedMessageToIDB(convoId, msgObj);
          await updateConvoMetaFromMessage(convoId, { body: encryptedBody, ts: msgObj.ts });
        }
      }
      await loadConversations();
    }
    // message.create
    else if (data.type === "message.create"){
      // store + display if active
      const convoId = data.conversation;
      // Always save the raw encrypted body to IDB (so offline/refresh works)
      const encryptedBody = data.body;
      const msgObj = {
        id: data.message_id,
        temp_id: data.temp_id,
        body: encryptedBody,
        sender: data.sender,
        file: data.file,
        conversation: convoId,
        ts: data.ts || new Date().toISOString()
      };
      // Save encrypted message in IDB
      await saveEncryptedMessageToIDB(convoId, msgObj);
      //console.log("messaged saved")
      // Update convo metadata last_message / last_timestamp (store the encrypted body as preview for now)
      await updateConvoMetaFromMessage(convoId, { body: encryptedBody, ts: msgObj.ts });
      //console.log("convo meta updated")

      // lazy load key if needed
      if (!cachedAesKeys[convoId]) {
        try {
          await fetchAndUnwrapConvoKey(convoId);
        } catch(e){
          console.warn("no key for conversation", convoId);
        }
      }
      if (String(convoId) === String(currentConvo)){
        // decrypt and append
        const [ivB64, cipherB64] = (encryptedBody || "").split(".");
        let plain = "[encrypted]";
        try {
          const aesKey = cachedAesKeys[convoId];
          if (aesKey) plain = await CRYPTO.aesGcmDecrypt(aesKey, ivB64, cipherB64);
        } catch(e){ console.error("decrypt failed", e) }
        
        await appendMessage(data.sender, plain, msgObj.ts, data.sender === await API.getUsername(), false, null, data.file);
      }
      playTone("notification", false)
      // increment unread badge by reloading convos
      await loadConversations();
    }
    else if (data.type === "signal") {
      const { from, signalType, payload } = data;
      //console.log(data)
      switch (signalType) {
            case "call-offer":
              await WEBRTC.showIncomingCallModal(from, payload);
              break;
            case "call-answer":
              stopTone('calltone')
              WEBRTC.handleAnswer(payload);
              WEBRTC.updateCallStatus(`In call with ${from}`);
              break;
            case "ice-candidate":
              WEBRTC.handleCandidate(payload);
              break;
            case "call-decline":
              stopTone('calltone')
              pushNotification('n_info', `${from} declined your call.`, 3000);
              WEBRTC.closeCallModal();
              WEBRTC.endCallCleanup();
              loadCallLogs();
              break;
            case "call-end":
              stopTone('calltone')
              pushNotification('n_info', `${from} ended the call.`, 3000);
              WEBRTC.closeCallModal();
              WEBRTC.endCallCleanup();
              loadCallLogs();
              break;
      }
    }
  };
}

/* ----------------- Voice Call ----------------- */


/* ----------------- conversation key flow ----------------- */
async function fetchAndUnwrapConvoKey(convoId){
  // server should return { wrapped_key: "..." } (only for current user)
  const res = await API.getConvoWrappedKey(convoId);
  //console.log(res);
  const privB64 = await IDB.getKey("private_pkcs8");
  rsaPrivate = await CRYPTO.importPrivateKeyFromPkcs8B64(privB64);
  const wrapped = res && (res.wrapped_key || res.wrappedKey || res.key || res.wrapped);
  if (!wrapped) throw new Error("No wrapped key from server");
  // unwrap with local private
  const aesKey = await CRYPTO.unwrapAESFromWrapped(wrapped, rsaPrivate);
  cachedAesKeys[convoId] = aesKey;
  // also cache raw exported base64 in idb so we can reuse without unwrap
  const rawB64 = await CRYPTO.exportAESRawB64(aesKey);
  await IDB.putConvoKey(convoId, rawB64);
  return aesKey;
}



/* ----------------- messages ----------------- */
function clearMessages(){ messagesEl.innerHTML = "" }

async function appendMessage(sender, text, ts, mine=false, pending=false, tmp=null, file=null){
  let file_con = ""
  if(file) {
    let data = await API.getFile(file)
    //console.log(data)
    if(data.status == "success") {
      let d = data.data;
      let meta = d.meta_data;
      let content = "";
      let ref = d.reference;
      if(d.file_type == "image") {
        content = `
        <img src="${API.FILE_URL}${d.file}" alt="" loading="lazy" />
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${truncatePath(d.file)}</span>
        </div>
        <div class="w-flex w-flex-between w-align-center mt-1">
          <span>${meta.extension.toUpperCase()}</span>
          <span>${meta.size}</span>
          <a class="show-image-btn" data-name="${truncatePath(d.file, 30)}" data-id="${API.FILE_URL}${d.file}"><i class="fa fa-eye"></i></a>
        </div>`
      }
      if(d.file_type == "video") {
        content = `
        <video src="${API.FILE_URL}${d.file}" controls></video>
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${truncatePath(d.file)}</span>
        </div>
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${meta.extension.toUpperCase()}</span>
          <span>${meta.size}</span>
        </div>`
      }
      if(d.file_type == "audio") {
        content = `
        <audio src="${API.FILE_URL}${d.file}" controls></audio>
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${truncatePath(d.file)}</span>
        </div>
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${meta.extension.toUpperCase()}</span>
          <span>${meta.size}</span>
        </div>`
      }
      if(d.file_type == "document") {
        content = `
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${truncatePath(d.file)}</span>
        </div>
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${meta.extension.toUpperCase()}</span>
          <span>${meta.size}</span>
          <a href="${API.FILE_URL}${d.file}" download><i class="fa fa-download"></i></a>
        </div>`
      }
      if(d.file_type == "pdf") {
        content = `
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${truncatePath(d.file)}</span>
        </div>
        <div class="w-flex w-flex-between w-align-center mt-2">
          <span>${meta.extension.toUpperCase()}</span>
          <span>${meta.size}</span>
          <a class="show-pdf-btn" data-id="${API.FILE_URL}${d.file}"><i class="fa fa-eye"></i></a>
        </div>`
      }
      file_con = `<div class="file-con" data-id="${ref}">${content}</div>`
    }
    else {
      file_con = `<div class="file-con">Error loading file: ${data.message}</div>`
    }
  }
  const row = document.createElement("div");
  row.className = "msg-row " + (mine ? "me": "them");
  if (mine) row.classList.add("me");
  const bubble = document.createElement("div"); bubble.className = "bubble " + (mine ? "me" : "");
  bubble.innerHTML = `<strong>${mine? "": sender}</strong>
                      ${file_con}
                      <div>${escapeHtml(text)}</div>
                      <div class="meta-small">${fmtTs(ts)}${pending ? `
                        &nbsp;<span id="${tmp}"><i class="fa fa-clock-o"></i></span>` : `
                        ${mine ? `
                        &nbsp;<span><i class="fa fa-check"></i></span>` : ``}`}`;
  row.appendChild(bubble);
  messagesEl.appendChild(row);

  messagesCon.scrollTop = messagesCon.scrollHeight;
  $(".show-pdf-btn").on('click', function(e) {
    e.preventDefault();
    let id = $(this).data('id');
    showPDF(id)
  })

  $(".show-image-btn").on('click', function(e) {
    e.preventDefault();
    let id = $(this).data('id');
    let cap = $(this).data('name');
    showImage(id, cap)
  })
}

function escapeHtml(s){
  return (s || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\n","<br>");
}

function showPDF(url) {
  //console.log(url)
  document.querySelector('#pdf-viewer').innerHTML = ""
  document.querySelector('.pdf-viewer').classList.add("active")
  EmbedPDF.init({
    type: 'container',
    target: document.getElementById('pdf-viewer'),
    src: url
  });
}

function showImage(url, cap) {
  // Get the modal
  var modal = $("#imageModal");
  var modalImg = $("#img01");
  var captionText = $("#caption");
  
  modal.show()
  modalImg.attr('src', url)
  captionText.html(cap);

  // Get the <span> element that closes the modal
  var span = $(".close-image");

  // When the user clicks on <span> (x), close the modal
  span.click(function() {
    modal.hide()
  })
}

/* ----------------- select convo & load messages ----------------- */
function sortMessages(convos) {
  return convos.sort((b, a) => {
    const dateA = a.ts ? new Date(a.ts) : null;
    const dateB = b.ts ? new Date(b.ts) : null;

    if(dateA && dateB) {return dateB - dateA}
    if(dateA && !dateB) return -1;
    if(!dateA && dateB) return 1;
    return 0;
  })
}

async function selectConversation(convoId, title=null){
  if(title) {
    sessionStorage.current_convo = title
  }
  currentConvo = convoId;
  const convoMeta = await IDB.getConvoMeta(convoId);
  //console.log(convoMeta)
  activeTitle.text(convoMeta.title);
  $(".btn-call").css({'display': 'none'});
  if(convoMeta.is_group) {$(".gr").css({'display': 'block'});}
  else {$(".dm").css({'display': 'block'});}
  $(".btn-call").data('name', convoMeta.title);
  $(".btn-call").data('id', convoMeta.id);
  // visual highlight
  [...convoListEl.children].forEach(li=> li.classList.toggle("active", li.dataset.id==convoId));
  clearMessages();
  // ensure we have AES key in memory or idb
  let raw = await IDB.getConvoKey(convoId);
  //console.log(raw)
  if (raw && !cachedAesKeys[convoId]){
    cachedAesKeys[convoId] = await CRYPTO.importAESRawB64(raw);
  }
  if (!cachedAesKeys[convoId]){
    try { await fetchAndUnwrapConvoKey(convoId) } catch(e){ console.warn("cannot get key yet", e) }
  }
  const key = cachedAesKeys[currentConvo];
  // fetch messages via REST and decrypt
  $(".sidebar").addClass('hide');
  $(".main").addClass('show');
  // First, load cached messages from IndexedDB (if any)
  let cachedMsgs = await IDB.getAllMessagesForConvo(convoId);
  cachedMsgs = sortMessages(cachedMsgs)
  //console.log("cached mssgs", cachedMsgs)
  if (cachedMsgs && cachedMsgs.length){
    for (const m of cachedMsgs){
      let plain = "[encrypted]";
      try {
        if (key){
          const [iv, cipher] = (m.body || "").split(".");
          plain = await CRYPTO.aesGcmDecrypt(key, iv, cipher);
        }
      } catch(e){ console.error("decrypt fail", e) }
      appendMessage(m.sender, plain, m.ts, m.sender === await API.getUsername(), false, null, m.file);
    }
  }
  // Then fetch server messages only after last_timestamp to avoid duplicates
  let lastTs = convoMeta && convoMeta.last_msg_timestamp ? convoMeta.last_msg_timestamp : null;
  let msgs = [];
  try {
    if (lastTs) {
      lastTs = new Date(lastTs)
      lastTs.setHours(lastTs.getHours() + 1);
      lastTs = lastTs.toISOString()
      //console.log(lastTs)
      msgs = await API.getMessages(convoId, lastTs);
    } else {
      // no lastTs — fetch all (first time)
      msgs = await API.getMessages(convoId);
    }
    //console.log(msgs)
    //console.log("online mssgs", msgs)
    for (const m of msgs){
      // server m has body (encrypted) and created_at
      const encrypted = m.body;
      const msgId = m.id;
      await saveEncryptedMessageToIDB(convoId, { id: msgId, body: encrypted, sender: m.sender, ts: m.created_at, file: m.file });
      await updateConvoMetaFromMessage(convoId, { body: encrypted, ts: m.created_at, plain_preview: null });
  
      let plain = "[encrypted]";
      try {
        const key = cachedAesKeys[convoId];
        if (key){
          const [iv,cipher] = (m.body||"").split(".");
          plain = await CRYPTO.aesGcmDecrypt(key, iv, cipher);
          await updateConvoMetaFromMessage(convoId, { body: encrypted, ts: m.created_at, plain_preview: plain });
        }
      } catch(e){ console.error("decrypt fail", e) }
      await appendMessage(m.sender, plain, m.created_at, m.sender === await API.getUsername(), false, null, m.file);
    }
  }
  catch(err) {
    pushNotification("n_error", `No internet connection.`, 3000)
  }
  await loadConversations()
}

/* ----------------- send encrypted message ----------------- */
async function sendMessage(){
  const text = msgInput.val().trim();
  if(!ws || !wsOpen) await startWS();
  //console.log(text)
  if (!currentConvo) return;
  const key = cachedAesKeys[currentConvo];
  if (!key){
    pushNotification("n_warning", "No conversation key yet.", 3000);
    return;
  }
  
  // check if file exist and upload
  let file_input = $('input[name="chat-files"]');
  let file = undefined;
  let file_ref = null;

    if(file_input.get(0).files[0]) {
        file = file_input.get(0).files[0]
    }
    else if(file_input.get(1).files[0]) {
        file = file_input.get(1).files[0]
    }
    else if(file_input.get(2).files[0]) {
        file = file_input.get(2).files[0]
    }
    else if(file_input.get(3).files[0]) {
        file = file_input.get(3).files[0]
    }
    if (file) {
      showLoader("Uploading file...")
      const payload = {file: file}
      let resp = await API.uploadFile(payload);
      //console.log(resp)
      //alert(JSON.stringify(resp))
      if(resp.status == "error") {
        pushNotification("n_error", resp.message, 5000);
        hideLoader()
        return;
      }
      file_ref = resp.data.reference
      hideLoader()
      $('input[name="chat-files"]').val('');
      $('#file-preview').empty().removeClass('active');
    }
    else {
      if(!text) return;
    }

    const { iv, ciphertext } = await CRYPTO.aesGcmEncrypt(key, text);

  const body = `${iv}.${ciphertext}`;
  //console.log(body)
  const temp_id = "tmp-"+Math.random().toString(36).slice(2,10);
  ws.send(JSON.stringify({ conversation: currentConvo, body, temp_id, file: file_ref }));
  
  // optimistic render
  msgInput.val("");
  let ts = new Date()
  ts.setHours(ts.getHours() - 1);
  ts = ts.toISOString();
  //console.log(ts)
  await appendMessage(await API.getUsername(), text, ts, true, true, temp_id, file_ref);
  //await saveEncryptedMessageToIDB(currentConvo, { temp_id, body, sender: await API.getUsername(), ts, file: file_ref });
}

async function getFriendList() {
  $(".friend-list").empty().html(`<li>Loading...</li>`);

  let chats = await IDB.getAllConvosMeta();

  $(".friend-list").empty()

  for(let i in chats) {
    if(!chats[i].is_group) {
      let temp = `
      <li>
      <div class="h6 w-bold">${chats[i].title}</div>
      <button data-name="${chats[i].title}" class="friend-add">Add</button>
      </li>`;
      $(".friend-list").append(temp);
    }
  }

  $(".friend-add").click(async function() {
    var user = $(this).data('name');
    await addMember(user)
  })
}

/* ----------------- signup/login UI handlers ----------------- */
async function authenticate() {
  let key = await API.getKey();
  let email = ""; let pw = ""
  if(key) {
    email = key
    pw = ""
  }
  else {
    email = await API.getUsername();
    pw = $("#login-password").val();
    if(pw.trim() == "") {
      pushNotification("n_warning", "Kindly enter your password", 5000);
      return
    }

  }
  showLoader("Authenticating...")
  try {
    const data = await API.login(email, pw);
    //console.log(data)
    if(data['access_token']) {
      await API.saveToken(data.access_token)
      await API.saveKey(data.api_token)
      // ensure keypair generated & registered
      await ensureKeysRegistered();
      // start ws and load convos
      await startWS();
      await loadConversations();
      await loadCallLogs();
      show(chatView);
      hideLoader()
    }
    else {
      pushNotification("n_error", data['detail'], 5000);
      hideLoader()
      //$("#login-msg").text(data['detail'])
    }
    
  } catch(e){
    console.log(e)
    let txt = e?.body?.detail || JSON.stringify(e);
    pushNotification("n_error", txt, 5000);
    hideLoader()
    //$("#login-msg").text(txt)
  }
}



btnLogin.on("click", async ()=>{
  authenticate()
});

btnSignup.on("click", async ()=>{
  const email = $("#su-email").val().trim();
  const pw = $("#su-password").val();
  const cpw = $("#csu-password").val();
  if(email == "") {
    pushNotification("n_warning", "Invalid Username", 5000);
    return
  }
  if(pw.length < 8) {
    pushNotification("n_warning", "Password must be at least 8 characters long", 5000);
    return
  }
  if(cpw !== pw) {
    pushNotification("n_warning", "Passwords do not match!", 5000);
    return
  }
  showLoader("Creating Account...")
  try {
    let data = await API.signup(email, pw);
    await API.saveUsername(data.email)
    //console.log(data)
    await registerKeyPairs()
    hideLoader()
    pushNotification("n_success", "Account created successfully! please login", 5000);
    showUsername()
    show(loginView);
  } catch(e){
    hideLoader()
    let txt = e?.body?.detail || JSON.stringify(e);
    pushNotification("n_error", txt, 5000);
    $("#signup-msg").text(txt)
  }
});

toSignup.on("click", (e)=>{ e.preventDefault(); show(signupView); });
openUpload.on("click", (e)=>{
  e.preventDefault();
  $(".load-c").addClass('active')
});

btnLogout.on("click", async ()=>{
  await API.clearToken();
  await API.clearKey();
  meEmail = null;
  rsaPrivate = null;
  rsaPublicB64 = null;
  cachedAesKeys = {};
  show(loginView);
  if (ws) ws.close();
});
// Export: download base64 private key
btnExport.on("click",  ()=>{
  $("#backup-pass").val("")
  $(".backup-c").addClass("active");
});

$("#backup-btn").on('click', async function() {
  let password = $("#backup-pass").val();
  if(!password || password.trim() == "") {
    pushNotification("n_warning", "No password provided", 3000);
    return;
  }
  showLoader("Creating backup file...");
  await exportBackup(password);
  hideLoader();
  $(".backup-c").removeClass("active");
  pushNotification("n_success", "Backup file downloaded!", 4000)

})

// Import: prompt user to paste key
btnImport.on("click", async ()=>{
  const b64 = prompt("Paste your private key backup:");
  if (!b64) return;
  try {
    const priv = await CRYPTO.importPrivateKeyFromBackup(b64.trim());
    rsaPrivate = priv;
    await IDB.putKey("private_pkcs8", b64.trim());
    alert("Private key imported successfully.");
  } catch(e){
    alert("Import failed: " + e);
  }
});
btnSend.on("click", sendMessage);

btnNew.on("click", (e)=>{
  e.preventDefault();
  $("#group-title").val('')
  $(".mem-list").empty();
  $(".group-c").addClass("active")
  getFriendList()
});

$(".btn-cancel").on('click', function() {
  $(this).parent('div').parent('.new-con').parent(".new-c").removeClass("active")
})

$("#restore-btn").on('click', async function() {
  let file = $("#backup-file")[0].files[0];
  let password = $("#backup-password").val();

  if(!file) {
    pushNotification("n_warning", "No backup file provided", 3000);
    return;
  }

  if(!password || password.trim() == "") {
    pushNotification("n_warning", "No password provided", 3000);
    return;
  }

  let filename = file.name.split('/').pop();
  let dotIntex = filename.lastIndexOf('.');
  let ext = filename.substring(dotIntex);
  console.log(ext)
  if(ext !== ".ichat" || ext !== ".json") {
    pushNotification("n_warning", "Invalid backup file", 3000);
    return;
  }

  showLoader("Loading data...")
  try {
    await importBackupFile(file, password)
  }
  catch(e) {
    pushNotification("n_error", e, 3000);
  }
  finally {
    hideLoader();
  }
})

async function addMember(email) {
  let existing = null;
  $(".mem-item").each(function() {
    let username = $(this).data('action');
    if(username == email) {
      existing = true;
    }
  })

  if(existing) {
    pushNotification("n_info", "User has already been added", 3000);
    return;
  }

  showLoader("Searching user...")
  try {
    const other = await API.getUserByEmail(email);
    if (!other || !other.public_key) {
      pushNotification("n_warning", "User public key not found", 5000);
      hideLoader()
      return;
    }
    var temp = `
    <div class="mem-item" data-name="${other.public_key}" data-id="${other.id}" data-action="${email.trim()}">
            <div class="mem-name">${email}</div>
            <div class="mem-cancel fa fa-times"></div>
          </div>`
    $(".mem-list").append(temp);
    $("#add-user").val('')
    hideLoader()

    $(".mem-cancel").click(function() {
      $(this).parent(".mem-item").remove();
    })
  }
  catch(e) {
    if(e.status && e.status == 401) {
      await authenticate()
        pushNotification("n_warning", "Error occured. please try again.", 5000)
    }
    else {
      let txt = e?.body?.detail || JSON.stringify(e);
      pushNotification("n_error", txt, 5000)
    }
    hideLoader()
  }
}

$("#btn-add-2").on('click', async function() {
  const email = $("#add-user").val();
  if (!email || email.trim() == "") return;
  if(email.trim() == await API.getUsername()) {
    pushNotification("n_warning", "You cannot add yourself. You will be added automatically", 3000);
    return;
  }
  await addMember(email.trim())
})

$("#btn-add").on('click', async function() {
  const email = $("#add-email").val();
  if (!email || email.trim() == "") return;
  // create AES + wrap and call server
  const aes = await CRYPTO.generateAESKey();
  //console.log("AES Key", aes)
  // fetch recipient public key
  showLoader("Searching user...")
  try {
    const other = await API.getUserByEmail(email);
    const me = await API.getMe();
    if (!other || !other.public_key) {
      pushNotification("n_warning", "User public key not found", 5000);
      hideLoader()
      return;
    }
    const otherPub = await CRYPTO.importPublicKeyFromSpkiB64(other.public_key);
    const wrappedForOther = await CRYPTO.wrapAESForRecipient(aes, otherPub);
    // optionally wrap for self too with our public (we can wrap with our stored public)
    const myPubB64 = await IDB.getKey("public_spki"); // already stored
    const mypub = await CRYPTO.importPublicKeyFromSpkiB64(myPubB64)
    const wrappedForMe = await CRYPTO.wrapAESForRecipient(aes, mypub);
    // build payload
    const rawB64 = await CRYPTO.exportAESRawB64(aes);
    const payload = {
      email,
      wrapped_keys: [
        { user_id: other.id, wrapped_key: wrappedForOther },
        { user_id: me.id, wrapped_key: wrappedForMe }
      ], key_b64: rawB64 };
    //console.log(payload)
    showLoader("Creating chat...")
    try {
      const convo = await API.createDM(payload);
      //console.log(convo)
      await IDB.putConvoKey(convo.id, rawB64);
      await loadConversations();
      hideLoader()
      $(".new-c").removeClass("active");
      pushNotification("n_success", "Chat created", 4000);
    } catch(e){
      console.log(e)
      if(e.status && e.status == 401) {
        await authenticate()
        pushNotification("n_warning", "Error occured. please try again.", 5000)
      }
      else {
        let txt = e?.body?.detail || JSON.stringify(e);
        pushNotification("n_error", txt, 5000)
      }
      hideLoader()
    }
  }
  catch(e) {
    if(e.status && e.status == 401) {
      await authenticate()
        pushNotification("n_warning", "Error occured. please try again.", 5000)
    }
    else {
      let txt = e?.body?.detail || JSON.stringify(e);
      pushNotification("n_error", txt, 5000)
    }
    hideLoader()
  }
})

$('#add-email').on('input', function(e) {
  var val = $(this).val().toLowerCase();
  $("#convo-list .convo-item").each(function() {
    let datName = $(this).data('name').toLowerCase();
    if(datName.includes(val)) {
      $(this).show()
    }
    else {
      $(this).hide()
    }
  })
})

$('#add-group').on('input', function(e) {
  var val = $(this).val().toLowerCase();
  $("#convo-list-group .convo-item").each(function() {
    let datName = $(this).data('name').toLowerCase();
    if(datName.includes(val)) {
      $(this).show()
    }
    else {
      $(this).hide()
    }
  })
})


$("#group-btn").on('click', async function() {
  let emails = [];
  let wrapped_keys = [];
  let members = [];

  let title = $("#group-title").val();

  if (!title || title.trim() == "") {
    pushNotification("n_warning", "Group name not provided", 3000);
    return;
  }

  showLoader("Creating Group...")
  try {
    // create AES + wrap and call server
    const aes = await CRYPTO.generateAESKey();

    $(".mem-item").each(function() {
      let pub_key = $(this).data('name');
      let user_id = $(this).data('id');
      let username = $(this).data('action');

      members.push({pub_key, user_id, username})
    })

    for(let i in members) {
      let {pub_key, user_id, username} = members[i];
      let public_key = await CRYPTO.importPublicKeyFromSpkiB64(pub_key)
      let wrapped_key = await CRYPTO.wrapAESForRecipient(aes, public_key);
      
      let user_obj = { user_id, wrapped_key }
      emails.push(username)
      wrapped_keys.push(user_obj);
    }

    // console.log(emails)
    // console.log(wrapped_keys)

    if(emails.length == 0) {
      pushNotification("n_warning", "At least one member must be added.", 3000);
      hideLoader();
      return;
    }

    // build user object
    // get user profile
    const me = await API.getMe();
    const myPubB64 = await IDB.getKey("public_spki"); // already stored
    const mypub = await CRYPTO.importPublicKeyFromSpkiB64(myPubB64)
    const wrappedForMe = await CRYPTO.wrapAESForRecipient(aes, mypub);

    wrapped_keys.push({user_id: me.id, wrapped_key: wrappedForMe})

    // build payload
    const rawB64 = await CRYPTO.exportAESRawB64(aes);
    const payload = { title, participant_emails:emails, wrapped_keys, key_b64: rawB64 };

    //console.log(payload);
    //console.log(emails);
    try {
      const group = await API.createGroup(payload);
      console.log(group)
      await IDB.putConvoKey(group.id, rawB64);
      await loadConversations();
      hideLoader()
      $(".group-c").removeClass("active");
      pushNotification("n_success", "Group created", 4000);
      hideLoader()
    }
    catch(e){
      console.log(e)
      if(e.status && e.status == 401) {
        await authenticate()
        pushNotification("n_warning", "Error occured. please try again.", 5000)
      }
      else {
        let txt = e?.body?.detail || JSON.stringify(e);
        pushNotification("n_error", txt, 5000)
      }
      hideLoader()
    }
  }
  catch(e) {
    if(e.status && e.status == 401) {
      await authenticate()
        pushNotification("n_warning", "Error occured. please try again.", 5000)
    }
    else {
      let txt = e?.body?.detail || JSON.stringify(e);
      pushNotification("n_error", txt, 5000)
    }
    hideLoader()
  }
})

$(".back-btn").on('click', function(e) {
  e.preventDefault();
  $(".sidebar").removeClass('hide');
  $(".main").removeClass('show');
  currentConvo = null;
  $(".convo-item").removeClass("active")
})

$("#infoBtn").click(async function(e) {
  e.preventDefault();
  showLoader("Loading...");
  let id = $(this).data('id');
  let group = await IDB.getConvoMeta(id);
  let members = await API.getGroupMembers(id);
  let is_admin = false;
  //console.log(members)
  //console.log(group);

  // display group info
  $("#grp-title").text(group.title)
  // display member list
  $(".member-list").empty()

  for(let i in members) {
    if(members[i].is_admin && members[i].email == await API.getUsername()) {
      is_admin = true;
    }
    let temp = `
      <li>
      <div class="h6 w-bold w-flex w-flex-start w-align-center" style="gap:10px;">
      <span class="icon">👤</span> 
      ${members[i].email}
      </div>
      ${members[i].is_admin ? `<span class="badge">Admin</span>`: `<span class="badge">Member</span>`}
      </li>`;
    $(".member-list").append(temp);
  }
  if(is_admin) {$(".add-mem-field").show()}
  else {$(".add-mem-field").hide()}
  $(".groupinfo-c").addClass('active')
  hideLoader()
})

$(".emoji-but").on('click', function() {
  $(".dd-content").toggleClass("show")
})

$('.file-send-btn').click(function() {
  $('.translate-con').removeClass('active')
  $('.file-send-con').toggleClass('active')
})

$('.translate-btn').click(function() {
  $('.file-send-con').removeClass('active')
  $('.translate-con').toggleClass('active')
})

$('.chat-input').on('input', function() {
  //alert('hi')
  $(".dd-content").removeClass("show")
  $(".file-send-con").removeClass("active")
  $(this).css('height', 'auto');
  var scroll = Math.min(this.scrollHeight, 100) + 'px';
  //console.log(scroll + ' ' + typeof(scroll))
  $(this).css('height', scroll)
})

$(".pdf-close").on('click', function() {
  $(".pdf-viewer").removeClass("active")
})

$('input[name="chat-files"]').change(function() {
  $('input[name="chat-files"]').not(this).val('');
  var type = $(this).data('id')
  //console.log(type + ": " + this)
  previewFile(this, type);
});

$(".toggle-btn").on("click" , () =>{
  $("nav").toggleClass("open");
});

function previewFile(input, type) {
  showLoader("Processing...")
  $('#file-preview').empty()
  .html(`<div class="file-s-close fa fa-times"></div>`);
  if(input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
          var file = '';
          //console.log(input.files[0])
          var fileName = input.files[0].name;
          console.log(fileName)
          if(fileName.length > 30) {
              fileName = fileName.substring(0, 22) + "..." + fileName.split('.').pop();
          }
          switch(type) {
              case "image":
                  file = `<img src="${e.target.result}" alt="" />
                  <div class="file-det">
                  <i style="color:#fff;font-size:30px;margin-right:5px;" class="fa fa-photo"></i> 
                  <span style="color:#fff;font-size:20px;">${fileName} ${Math.floor(input.files[0].size/1024)}KB</span>
                  </div>`;
                  break;
              case "audio":
                  file = `<audio src="${e.target.result}" controls>Audio not supported</audio>
                  <div class="file-det">
                  <i style="color:#fff;font-size:30px;margin-right:5px;" class="fa fa-music"></i> 
                  <span style="color:#fff;font-size:20px;">${fileName} ${Math.floor(input.files[0].size/1024)}KB</span>
                  </div>`;
                  break
              case "video":
                      file = `<video src="${e.target.result}" width="100%" height="auto" controls>Video not supported</video>
                      <div class="file-det">
                      <i style="color:#fff;font-size:30px;margin-right:5px;" class="fa fa-video-camera"></i> 
                      <span style="color:#fff;font-size:20px;">${fileName} ${Math.floor(input.files[0].size/1024)}KB</span>
                      </div>`;
                  break
              case "doc":
                  file = `<div class="file-det">
                  <i style="color:#fff;margin-right:5px;" class="fa fa-file-o"></i> 
                  <span style="color:#fff;font-size:20px;">${fileName} ${Math.floor(input.files[0].size/1024)}KB</span>
                  </div>`;
                  break
          } 
      
      $('#file-preview').addClass('active').append(file);
      };
      reader.readAsDataURL(input.files[0]);
      $('.file-send-con').toggleClass('active')
  }
  hideLoader()
  $('.file-s-close').click(function() {
    $('input[name="chat-files"]').val('');
    $('#file-preview').empty().removeClass('active');
  })
}


/* ----------------- startup: show login ----------------- */
async function checkStatus() {
  let key = await API.getKey();
  const privB64 = await IDB.getKey("private_pkcs8");
  const pubB64 = await IDB.getKey("public_spki");
  // check if Key pair not present --> Signup
  if (!privB64 && !pubB64) {
    show(signupView)
    hideLoader()
  }
  // if key pairs present, check for api key --> login
  else {
    if(!key) {
      showUsername()
      show(loginView)
      hideLoader()
    }
    // if api key present, check for access_token
    else {
      // start ws and load convos
      let token = await API.getToken()
      if(token) {
        show(chatView)
        hideLoader()
        await startWS();
        await loadConversations();
      }
      else {
        await authenticate()
      }
    }
  }

  
}
checkStatus()


selectTag.forEach((tag, id) => {
  for (let country_code in languages) {
      let selected = id == 0 ? country_code == "en-GB" ? "selected" : "" : country_code == "ar-SA" ? "selected" : "";
      let option = `<option ${selected} value="${country_code}">${languages[country_code]}</option>`;
      tag.insertAdjacentHTML("beforeend", option);
  }
});

translateBtn.addEventListener("click", () => {
  let text = msgInput.val().trim(),
  translateFrom = selectTag[0].value,
  translateTo = selectTag[1].value;
  console.log(text)
  console.log(translateFrom, translateTo)
  if(!text) {
    pushNotification("n_warning", "No message to translate", 3000);
    return;
  };
  showLoader("Translating...")
  let apiUrl = `https://api.mymemory.translated.net/get?q=${text}&langpair=${translateFrom}|${translateTo}`;
  fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
      msgInput.val(data.responseData.translatedText);
      data.matches.forEach(data => {
          if(data.id === 0) {
            msgInput.val(data.translation);
          }
      });
      hideLoader();
  })
  .catch(err => {
    console.log(err)
    hideLoader()
    pushNotification("n_network", "Please check your internet connection!", 3000);
      
  })
});