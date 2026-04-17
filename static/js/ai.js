import * as CRYPTO from "./modules/crypto.js";
import * as IDB from "./modules/idb-keys.js";
import * as API from "./modules/api.js";
// pdf reader
import EmbedPDF from "./modules/embedpdf.js";
// translator
import { languages } from "./modules/countries.js";


async function checkStatus() {
        try {
                let data = await API.authStatus();
                //console.log(data)
                if(data.status == "success") {
                        if(data.authenticated === false) {
                          pushNotification("n_warning", "Your session has expired!", 3000)
                                window.location.href = "/login/"
                        }
                }
        }
        catch(err) {
                console.log(err)
                pushNotification("n_error", err.body, 3000)
        }
}


var chatBody = document.querySelector(".chat-body");
var messageInput = document.querySelector(".message-input");
var sendMessage = document.querySelector("#send-message");
var fileInput = document.querySelector("#file-input");
var fileUploadWrapper = document.querySelector(".file-upload-wrapper");
var fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");

// API setup
var API_KEY = "";
var API_URL = `${API.AI_URL}/jobs`;
var metadata = {}
var currentConvo = ""
var lastestConvo = "";
// Initialize user message and file data
var userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};
// Store chat history
var chatHistory = [];
var initialInputHeight = messageInput.scrollHeight;

async function setup() {
  showLoader("Loading...")
  await checkStatus()
  try {
    let data = await API.schoolMetadata();
    //console.log(data)
    if(data.status == "success") {
      API_KEY = data.api_key,
      metadata = data.data
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
setup()


function renderMarkdown(markdownText) {
    const rawHtml = marked.parse(markdownText);
    //return DOMPurify.sanitize(rawHtml);
    return rawHtml
}

function highlightCode() {
document.querySelectorAll("pre code").forEach(block => {
    hljs.highlightElement(block);
});
}

async function simulateTyping(
    elementId,
    textToType,
    typingSpeed,
    onComplete = () => {},
    addCursor = true
) {
    const targetElement = elementId;

    if (!targetElement) {
        console.error(`Element with ID "${elementId}" not found.`);
        return;
    }

    // Clear any existing content in the target element
    targetElement.innerHTML = '';

    // Ensure typing speed is not negative
    const actualTypingSpeed = Math.max(0, typingSpeed);

    let cursorElement = null;

if (addCursor) {
        cursorElement = document.createElement('span');
        cursorElement.className = 'typing-cursor';
        cursorElement.innerHTML = '|'; // You can change this to anything like '_' or '' if using CSS for cursor style
        targetElement.appendChild(cursorElement);
    }

    for (let i = 0; i < textToType.length; i++) {
        const char = textToType[i];

        if (cursorElement) {
            // Insert character before the cursor
            cursorElement.before(char);
        } else {
            // Append character directly
            targetElement.innerHTML += char;
        }

        // Wait for the specified typing speed before typing the next character
        await new Promise(resolve => setTimeout(resolve, actualTypingSpeed));
    }

    // After typing is complete
if (cursorElement) {
        // You can choose to remove the cursor, hide it, or stop its animation
        cursorElement.remove();
        // Or: cursorElement.style.display = 'none';
        // Or: cursorElement.classList.remove('typing-cursor');
    }

    // Execute the optional callback function
    onComplete();
}

function sortConversations(convos) {
    return convos.sort((a, b) => {
      const dateA = a.last_timestamp ? new Date(a.last_timestamp) : null;
      const dateB = b.last_timestamp ? new Date(b.last_timestamp) : null;
  
      if(dateA && dateB) {return dateB - dateA}
      if(dateA && !dateB) return -1;
      if(!dateA && dateB) return 1;
      return 0;
    })
}

function sortMessages(convos) {
    return convos.sort((b, a) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : null;
      const dateB = b.timestamp ? new Date(b.timestamp) : null;
  
      if(dateA && dateB) {return dateB - dateA}
      if(dateA && !dateB) return -1;
      if(!dateA && dateB) return 1;
      return 0;
    })
}

async function loadMessages(messages) {
  showLoader("Loading messages...")
    $(".chat-body").empty();
    chatHistory.length = 0;

    for(let i in messages) {
        let c = messages[i];

        chatHistory.push({
          "role": c.role,
          "content": c.message
          //"content": [{ text: c.message }, ...(c.file ? [{ inline_data: c.file }] : [])]
        })
        let temp = `
        <div class="message ${c.role == 'assistant' ? 'bot' : 'user'}-message">
        ${c.role == 'assistant' ? `
            <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                <path
                d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
                />
            </svg>` : ''}  
            <div class="message-text">${c.message}</div>
            ${c.file ? `<img src="data:${c.file.mime_type};base64,${c.file.data}" class="attachment" />` : ``}
        </div>`;
        $(".chat-body").append(temp)
    }
    hideLoader()
}

async function selectConversation(convoId=lastestConvo) {
  currentConvo = convoId;
  //console.log(currentConvo)

  let messages = await IDB.getAllMessagesForConvo(currentConvo)
  //console.log(messages)
    if(messages.length == 0) {
        let new_message = `Hey there  <br /> How can I help you today?`;
        await saveMessage("assistant", new_message, null)
        messages = await IDB.getAllMessagesForConvo(currentConvo)
    }
    messages = sortMessages(messages)
    await loadMessages(messages)
}

async function loadConversations() {
    let cached = await IDB.getAllConvosMeta();
    if(cached.length == 0) {
        let new_convo = {
            id: safeUUID(),
            title: "New Conversation",
            last_timestamp: new Date().toISOString()
        };
        await IDB.putConvoMeta(new_convo.id, new_convo);
        cached = await IDB.getAllConvosMeta();
    }
    cached = sortConversations(cached);
    lastestConvo = cached[0].id;
    if(currentConvo == "") {
      currentConvo = lastestConvo;
      selectConversation(currentConvo)
    }
    // display convos
    $(".convo-list").empty();
    for(let i in cached) {
      let temp = `
      <li data-id="${cached[i].id}" class="convo-item">
        ${truncateWord(cached[i].title, 40)}
      </li>`;
      $(".convo-list").append(temp)
    }
    $(".convo-item").click(async function() {
      let convo_id = $(this).data('id');
      $(".convo-menu").removeClass("active")
      await selectConversation(convo_id);
    })
}

async function initiate() {
  showLoader("Loading...")
  await loadConversations()
}

initiate()


$(".convo-menu-button").click(function() {
  $(".convo-menu").addClass("active")
})

$(".clear-chat").click(async function(e) {
  e.preventDefault();
  let selectedConvo = currentConvo;
  let is_delete = confirm("Are you sure you want to clear this chat?")
  if(is_delete) {
    showLoader("Clearing chat...")
    await IDB.clearMessagesForConvo(selectedConvo)
    await selectConversation(selectedConvo)
  }
})

$(".new-convo-btn").click(async function() {
  showLoader("Creating conversation...")
  let new_convo = {
    id: safeUUID(),
    title: "New Conversation",
    last_timestamp: new Date().toISOString()
  };
  await IDB.putConvoMeta(new_convo.id, new_convo);
  await selectConversation(new_convo.id)
  $(".convo-menu").removeClass("active")
  await loadConversations()
})


async function saveMessage (role, message, file) {
  let new_message =  {
    id: safeUUID(),
    role: role,
    message: message,
    file: file,
    timestamp: new Date().toISOString()
  };
  let convo = await IDB.getConvoMeta(currentConvo)
  //console.log(convo)
  await IDB.putMessage(currentConvo, new_message.id, new_message)
  await IDB.putConvoMeta(currentConvo, {
    id: convo.id,
    title: (role == "user" ? message : convo.title),
    last_timestamp: new_message.timestamp
  })

  await loadConversations()
}

// Create message element with dynamic classes and return it
function createMessageElement(content, ...classes) {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
async function generateBotResponse(incomingMessageDiv) {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  var user = await API.getUserInfo();
  var site = await API.getSiteInfo()

  let formData = {
    tenant_id: site['school_id'],
    user_id: user['studentId'],
    task: "ai_assistant",
    callback_url: "",
    payload: {
      query: userData.message,
      school_metadata: metadata,
      conversation_history: chatHistory
    },
  }

  //console.log(formData)

  // API request options
  const requestOptions = {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-api-key": API_KEY
     },
    body: JSON.stringify(formData),
  };

    // Fetch bot response from API
    try {
      const response = await fetch(API_URL, requestOptions);
      console.log(response)
      const data = await response.json();

      console.log(data)

      if (!response.ok) {
        messageElement.innerText = data.detail;
        messageElement.style.color = "#ff0000";
      }
      else {
        // Extract and display bot's response text
      let responseText = JSON.parse(data.result.response)
      const apiResponseText = responseText.answer//.replace(/\*\*(.*?)\*\*/g, "$1").trim();
      const apiResponseMarkdown = responseText.answer;
      messageElement.innerHTML = renderMarkdown(apiResponseMarkdown);
      highlightCode();


      if(data.status == "completed") {
        let new_message1 =  {
          message: userData.message,
          //file: userData.file
          file: null
        };
        await saveMessage("user", new_message1.message, new_message1.file)
  

        let new_message =  {
          message: apiResponseMarkdown
        };
  
        await saveMessage("assistant", new_message.message, null)
        //await simulateTyping(messageElement, renderMarkdown(apiResponseMarkdown), 30, highlightCode);
  
        // Add user message to chat history
        chatHistory.push({
          role: "user",
          content: userData.message
          //content: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])],
        });
        // Add bot response to chat history
        chatHistory.push({
          role: "assistant",
          content: apiResponseText
        });
      }
      }

      
      
    }
    catch (error) {
      // Handle error in API response
      console.log(error);
      messageElement.innerText = error.detail;
      messageElement.style.color = "#ff0000";
    }
    finally {
      // Reset user's file data, removing thinking indicator and scroll chat to bottom
      userData.file = {};
      incomingMessageDiv.classList.remove("thinking");
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }

};

// Handle outgoing user messages
async function handleOutgoingMessage(e) {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");

  // Create and display user message
  let msg_file = null
  if(userData.file.data) {
    msg_file = userData.file
  }
  const messageContent = `<div class="message-text"></div>
                          ${msg_file ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // let new_message =  {
    //     message: userData.message,
    //     file: msg_file
    // };
    // await saveMessage("user", new_message.message, new_message.file)

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/></svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;

    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && userMessage && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];

    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
  };

  reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle emoji selection
var picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

document.querySelector(".chat-form").appendChild(picker);

sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());


window.addEventListener('online', checkNetwork)
window.addEventListener('offline', checkNetwork)
