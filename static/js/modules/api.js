// api.js
import * as IDB from "./idb-keys.js";

let base_url = "", base_ai_url = ""

if(window.location.protocol == "http:") {
  base_url = `http://127.0.0.1:8000`;
  base_ai_url = `http://127.0.0.1:10000`
}
else {
  base_url = `https://api.eduka.ng`;
  base_ai_url = `https://ai.eduka.ng`
}

export const BASE_URL = base_url;
export const BASE_AI_URL = base_ai_url;


//export const BASE_AI_URL = ;

export const API_URL = `${BASE_URL}/v3`;
export const ADMIN_API_URL = `${BASE_URL}/v1`;
export const AI_URL = `${BASE_AI_URL}/orchestrator`



// Device ID (now in IndexedDB meta store)
export async function saveDeviceId(id) { return IDB.setMeta("device_id", id); }
export async function getDeviceId() { return IDB.getMeta("device_id"); }
export async function clearDeviceId() { return IDB.delMeta("device_id"); }


// School Info (now in IndexedDB meta store)
export async function saveSiteInfo(obj) { return IDB.setMeta("site_info", obj); }
export async function getSiteInfo() { return IDB.getMeta("site_info"); }
export async function clearSiteInfo() { return IDB.delMeta("site_info"); }


// User Info (now in IndexedDB meta store)
export async function saveUserInfo(obj) { return IDB.setMeta("user_info", obj); }
export async function getUserInfo() { return IDB.getMeta("user_info"); }
export async function clearUserInfo() { return IDB.delMeta("user_info"); }


// User Info (now in IndexedDB meta store)
export async function updateBioLogin(value) { return IDB.setMeta("enable_biometric", value); }
export async function isBiometricEnabled() { return IDB.getMeta("enable_biometric"); }


const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  for (const key in params) {
    if (Array.isArray(params[key])) {
      params[key].forEach((val) => query.append(key, val));
    } else {
      query.append(key, params[key]);
    }
  }

  return query.toString() ? `?${query.toString()}` : '';
};


const request = async ({ method = 'GET', url, data = null, params = {}}) => {
  const queryString = buildQueryString(params);
  const fullUrl = `${API_URL}${url}${queryString}`;
  const device_id = await getDeviceId();
  const site_id = await getSiteInfo();

  const isFormData = data instanceof FormData;

  const headers = {
    //...({ 'Accept': 'application/json' }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...({'X-SITE-ID': site_id?.school_id}),
    ...({'X-DEVICE-ID': device_id})
  };

  //console.log(headers)

  const options = {
    method: method.toUpperCase(),
    credentials: "include",
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD' && data) {
    options.body = isFormData ? data : JSON.stringify(data);
  }
  try {
    let response = await fetch(fullUrl, options);
    //console.log(response)

    if (!response.ok) {
      let responseData = {status: "error"}
      responseData['message'] = `Error ${response.status}: ${response.statusText}` || "";
      responseData['statusCode'] = response.status;
      return responseData;
    }

    // If access token expired
    //  if (response.status === 401) {
    //    if(location.pathname !== '/login/')
    //    window.location.href = "/login/";
    //    return;
    //  }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();

    

    return responseData;
  }
  catch (error) {
    throw error;
  }
};

const admin_request = async ({ method = 'GET', url, data = null, params = {}}) => {
  const queryString = buildQueryString(params);
  const fullUrl = `${ADMIN_API_URL}${url}${queryString}`;

  const isFormData = data instanceof FormData;

  const headers = {
    //...({ 'Accept': 'application/json' }),
    ...(!isFormData && { 'Content-Type': 'application/json' })
  };

  const options = {
    method: method.toUpperCase(),
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD' && data) {
    options.body = isFormData ? data : JSON.stringify(data);
  }
  try {
    let response = await fetch(fullUrl, options);

    if (!response.ok) {
      let responseData = {status: "error"}
      responseData['message'] = `Error ${response.status}: ${response.statusText}` || "";
      responseData['statusCode'] = response.status;
      return responseData;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();

    // if (!response.ok) {
    //     // responseData['statusText'] = response.statusText;
    //     // responseData['statusCode'] = response.status;
    //     return responseData;
    // }

    return responseData;
  }
  catch (error) {
    throw error;
  }
};

// extra endpoint
export async function getSchools(params = {}){ 
  return await admin_request({ url: "/school/school_list/", params }) 
}

// authentication endpoints
export async function login(payload) {
  return await request({ method: 'POST', url: "/auth/login/", data: payload }) 
}
export async function logout() {
  return await request({ method: 'POST', url: "/profile/user_logout/" }) 
}
export async function authStatus() {
  return await request({ method: 'GET', url: "/profile/auth_status/" }) 
}
export async function schoolMetadata() {
  return await request({ method: 'GET', url: "/school/get_metadata/" }) 
}
export async function userProfile() {
  return await request({ method: 'GET', url: "/profile/get_profile/" }) 
}
export async function verifyPassword(payload) {
  return await request({ method: 'POST', url: "/profile/verify_password/", data: payload }) 
}
export async function updatePassword(payload) {
  return await request({ method: 'POST', url: "/profile/change_password/", data: payload }) 
}
export async function getClassmates() {
  return await request({ method: 'GET', url: "/classroom/get_classmates/" }) 
}
export async function getTimetable() {
  return await request({ method: 'GET', url: "/classroom/get_timetable/" }) 
}
export async function getSubjects() {
  return await request({ method: 'GET', url: "/courses/get_subjects/" }) 
}

export async function getTopics(payload = {}) {
  return await request({ method: 'GET', url: "/courses/get_syllabus_topics/", params: payload }) 
}



