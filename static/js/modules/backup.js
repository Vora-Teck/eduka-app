import * as IDB from "./idb-keys.js";

export async function exportBackup(password) {
  // collect meta (email, api_token) from IDB and full dump
  const username = await IDB.getMeta("username");
  const api_token = await IDB.getMeta("api_key");
  const dump = await IDB.dumpAll();

  const payload = {
    meta: { version: 1, exported_at: new Date().toISOString() },
    auth: { username, api_token },
    dump
  };

  // derive key & encrypt (same algorithm you used previously)
  const enc = new TextEncoder();
  const raw = enc.encode(JSON.stringify(payload));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey({ name:"PBKDF2", salt, iterations:100000, hash:"SHA-256" }, baseKey, { name:"AES-GCM", length:256 }, false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, aesKey, raw);

  const packed = {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ct)))
  };

  const blob = new Blob([JSON.stringify(packed)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ichat-backup-${Date.now()}.ichat`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackupFile(file, password) {
  const text = await file.text();
  const packed = JSON.parse(text);
  const salt = Uint8Array.from(atob(packed.salt), c=>c.charCodeAt(0));
  const iv = Uint8Array.from(atob(packed.iv), c=>c.charCodeAt(0));
  const dataArr = Uint8Array.from(atob(packed.data), c=>c.charCodeAt(0));

  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey({ name:"PBKDF2", salt, iterations:100000, hash:"SHA-256" }, baseKey, { name:"AES-GCM", length:256 }, false, ["decrypt"]);
  let decrypted;
  try {
    const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, aesKey, dataArr);
    decrypted = new TextDecoder().decode(pt);
  } catch(e){
    throw new Error("Decryption failed - wrong password or corrupted file");
  }
  const parsed = JSON.parse(decrypted);
  // Restore meta/auth in IDB
  if (parsed.auth) {
    if (parsed.auth.username) await IDB.setMeta("username", parsed.auth.username);
    if (parsed.auth.api_token) await IDB.setMeta("api_key", parsed.auth.api_token);
  }
  // Restore the full DB dump (this will overwrite existing stores)
  if (parsed.dump) {
    await IDB.restoreDump(parsed.dump);
  }
  // After restore, reload the app state as needed
  location.reload();
}