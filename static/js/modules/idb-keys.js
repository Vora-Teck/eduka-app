// idb-keys.js
//import * as API from "./api.js";

const DB_NAME = "eduka_keys_v1";
const DB_VERSION = 2;
const STORE_META = "meta";           // key -> value (school_info, email, api_token, device_id, etc)
const STORE_KEYS = "keys";           // keyName -> value (eg private_pkcs8, public_spki)
const STORE_CONVOS = "convos";       // convoId -> {id, title, is_group, last_timestamp, last_message, unread_count}
const STORE_CONVO_KEYS = "convo_keys";// convoId -> raw AES base64
const STORE_MESSAGES = "messages";   // composite key: "convoId!msgId" -> { id, body, sender, conversation, ts, encrypted:true }
const STORE_TOKEN = "tokens";
//const EXPIRY_HOURS = 24;


async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      //console.log(db.objectStoreNames)
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      if (!db.objectStoreNames.contains(STORE_KEYS)) db.createObjectStore(STORE_KEYS);
      if (!db.objectStoreNames.contains(STORE_CONVOS)) db.createObjectStore(STORE_CONVOS);
      if (!db.objectStoreNames.contains(STORE_CONVO_KEYS)) db.createObjectStore(STORE_CONVO_KEYS);
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) db.createObjectStore(STORE_MESSAGES);
      if (!db.objectStoreNames.contains(STORE_TOKEN)) db.createObjectStore(STORE_TOKEN, { keyPath: "id" });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function idbPut(storeName, key, value) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => res(true);
    tx.onerror = (e) => rej(e.target.error);
  });
}

export async function idbGet(storeName, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, "readonly");
    const rq = tx.objectStore(storeName).get(key);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = (e) => rej(e.target.error);
  });
}

export async function idbDelete(storeName, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => res(true);
    tx.onerror = (e) => rej(e.target.error);
  });
}

// --- Meta helpers (school_info, user_info)
export function setMeta(key, value) { return idbPut(STORE_META, key, value); }
export function getMeta(key) { return idbGet(STORE_META, key); }
export function delMeta(key) { return idbDelete(STORE_META, key); }


// --- Key helpers (public/private)
export function putKey(keyName, data){ return idbPut(STORE_KEYS, keyName, data) }
export function getKey(keyName){ return idbGet(STORE_KEYS, keyName) }
export function deleteKey(keyName) { return idbDelete(STORE_KEYS, keyName); }


// --- Conversation meta helpers
export async function putConvoMeta(convoId, obj) {
  // obj should include id, title, is_group, last_timestamp, last_message, unread_count
  return idbPut(STORE_CONVOS, String(convoId), obj);
}
export async function getConvoMeta(convoId) {
  return idbGet(STORE_CONVOS, String(convoId));
}
export async function getAllConvosMeta() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_CONVOS, "readonly");
    const cursor = tx.objectStore(STORE_CONVOS).openCursor();
    const out = [];
    cursor.onsuccess = (e) => {
      const c = e.target.result;
      if (!c) { res(out); return; }
      out.push(c.value);
      c.continue();
    };
    cursor.onerror = (e) => rej(e.target.error);
  });
}
export async function deleteConvoMeta(convoId) { return idbDelete(STORE_CONVOS, String(convoId)); }


// --- Convo key helpers (AES raw base64)
export async function putConvoKey(convoId, data){ return idbPut(STORE_CONVO_KEYS, String(convoId), data) }
export async  function getConvoKey(convoId){ return idbGet(STORE_CONVO_KEYS, String(convoId)) }
export async  function deleteConvoKey(convoId) { return idbDelete(STORE_CONVO_KEYS, String(convoId)); }

// --- Messages helpers
// key format: `${convoId}!${msgId}` (msgId is server id or temp id)
export async function putMessage(convoId, msgId, messageObj) {
  const k = `${convoId}!${msgId}`;
  return idbPut(STORE_MESSAGES, k, messageObj);
}
export async function getMessage(convoId, msgId) {
  const k = `${convoId}!${msgId}`;
  return idbGet(STORE_MESSAGES, k);
}
export async function deleteMessage(convoId, msgId) {
  const k = `${convoId}!${msgId}`;
  return idbDelete(STORE_MESSAGES, k);
}
export async function getAllMessagesForConvo(convoId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_MESSAGES, "readonly");
    const store = tx.objectStore(STORE_MESSAGES);
    const list = [];
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cur = e.target.result;
      if (!cur) { res(list); return; }
      const key = cur.key;
      if (String(key).startsWith(`${convoId}!`)) list.push(cur.value);
      cur.continue();
    };
    req.onerror = (e) => rej(e.target.error);
  });
}
export async function clearMessagesForConvo(convoId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_MESSAGES, "readwrite");
    const store = tx.objectStore(STORE_MESSAGES);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cur = e.target.result;
      if (!cur) { res(true); return; }
      if (String(cur.key).startsWith(`${convoId}!`)) cur.delete();
      cur.continue();
    };
    req.onerror = (e) => rej(e.target.error);
  });
}


// --- Utility: dump entire DB (for backup)
export async function dumpAll() {
  const db = await openDB();
  const out = {};
  const stores = db.objectStoreNames;
  for (let i = 0; i < stores.length; i++) {
    const name = stores[i];
    out[name] = [];
    const tx = db.transaction(name, "readonly");
    const req = tx.objectStore(name).openCursor();
    await new Promise((res, rej) => {
      req.onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) { res(); return; }
        out[name].push({ key: cur.key, value: cur.value });
        cur.continue();
      };
      req.onerror = (e) => rej(e.target.error);
    });
  }
  return out;
}

// --- Utility: restore dump (overwrite)
export async function restoreDump(dump) {
  const db = await openDB();
  const txAll = db.transaction(db.objectStoreNames, "readwrite");
  // For simplicity: clear and write per store
  for (let i = 0; i < db.objectStoreNames.length; i++) {
    const storeName = db.objectStoreNames[i];
    const store = txAll.objectStore(storeName);
    // clear first (synchronous in transaction)
    store.clear();
    const entries = dump[storeName] || [];
    for (const entry of entries) {
      store.put(entry.value, entry.key);
    }
  }
  return new Promise((res, rej) => {
    txAll.oncomplete = () => res(true);
    txAll.onerror = (e) => rej(e.target.error);
  });
}

