window.addEventListener('message', async function(ev) {
  try {
    const data = ev.data;
    if (data && data.type === 'BIOMETRIC_FAILED') {
      //console.log(data.payload?.message);
    }
    else if (data && data.type === 'BIOMETRIC_SUCCESS') {
      //console.log(data.payload?.password);
    }
    else if (data && data.type === 'BIOMETRIC_REGISTERED') {
      //console.log(data.payload?.message);
    }
    else if (data && data.type === 'DEVICE_INFO') {
      //console.log(data.payload) {brand, modelName, osName, osVersion, deviceType, manufacturer, uniqueId};
    }
    else if (data && data.type === 'SAVE_RESULT') {
      //console.log(data.payload);  {success:boolean, message}
    }
    else if (data && data.type === 'PONG') {
      //console.log(data.payload?.ts);
    }
  }
  catch (e) {
    console.log(e)
  }
});


// basic pinging
window.ReactNativeWebView.postMessage(
JSON.stringify({ 
  type: 'PING'
}));


// Register biometric
window.ReactNativeWebView.postMessage(
JSON.stringify({ 
  type: 'REGISTER_BIOMETRIC',
  password: "password"
})
);

// biometric login
window.ReactNativeWebView.postMessage(
JSON.stringify({ 
  type: 'REQUEST_BIOMETRIC_LOGIN'
}));

// Request link opening
window.ReactNativeWebView.postMessage(
JSON.stringify({ 
  type: 'OPEN_EXTERNAL',
  payload: {url: "https://...."}
})
);

// request device info
window.ReactNativeWebView.postMessage(
JSON.stringify({ 
  type: 'REQUEST_DEVICE_INFO'
}));

// request file saving
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: "REQUEST_SAVE_FILE",
  payload: {
    name: "example.jpg",
    type: "base64/url",
    data: "BASE64_STRING_HERE/link"
  }
}));
