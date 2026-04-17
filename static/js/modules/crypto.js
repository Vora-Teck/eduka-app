// crypto.js
// Utilities: base64 <-> ArrayBuffer
function abToB64(buf){
  const bytes = new Uint8Array(buf), len = bytes.length;
  let s = "";
  for(let i=0;i<len;i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64ToAb(b64){
  const bin = atob(b64), len = bin.length, arr = new Uint8Array(len);
  for(let i=0;i<len;i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

// RSA key pair generation (RSA-OAEP 4096)
export async function generateRSAKeyPair(){
  return window.crypto.subtle.generateKey(
    { name:"RSA-OAEP", modulusLength:4096, publicExponent:new Uint8Array([1,0,1]), hash:"SHA-256" },
    true,
    ["wrapKey","unwrapKey","encrypt","decrypt"]
  );
}
export async function exportPublicKeySpkiB64(publicKey){
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return abToB64(spki);
}
export async function exportPrivateKeyPkcs8B64(privateKey){
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  return abToB64(pkcs8);
}
export async function importPublicKeyFromSpkiB64(spkiB64){
  const ab = b64ToAb(spkiB64);
  return crypto.subtle.importKey("spki", ab, { name:"RSA-OAEP", hash:"SHA-256" }, true, ["encrypt","wrapKey"]);
}
export async function importPrivateKeyFromPkcs8B64(pkcs8B64){
  const ab = b64ToAb(pkcs8B64);
  return crypto.subtle.importKey("pkcs8", ab, { name:"RSA-OAEP", hash:"SHA-256" }, true, ["decrypt","unwrapKey"]);
}

// ---- Key export / import ----
export async function exportPrivateKeyForBackup(privateKey) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  return abToB64(pkcs8);
}
export async function importPrivateKeyFromBackup(b64) {
  return importPrivateKeyFromPkcs8B64(b64);
}

// AES-GCM (256)
export async function generateAESKey(){
  return crypto.subtle.generateKey({ name:"AES-GCM", length:256 }, true, ["encrypt","decrypt","wrapKey","unwrapKey"]);
}
export async function exportAESRawB64(aesKey){
  const raw = await crypto.subtle.exportKey("raw", aesKey);
  return abToB64(raw);
}
export async function importAESRawB64(rawB64){
  const ab = b64ToAb(rawB64);
  return crypto.subtle.importKey("raw", ab, { name:"AES-GCM" }, true, ["encrypt","decrypt"]);
}

// wrap AES for recipient RSA public key
export async function wrapAESForRecipient(aesKey, recipientPubKey){
  const wrapped = await crypto.subtle.wrapKey("raw", aesKey, recipientPubKey, { name:"RSA-OAEP" });
  return abToB64(wrapped);
}
export async function unwrapAESFromWrapped(wrappedB64, myPrivateKey){
  const buf = b64ToAb(wrappedB64);
  return crypto.subtle.unwrapKey("raw", buf, myPrivateKey, { name:"RSA-OAEP" }, { name:"AES-GCM", length:256 }, true, ["encrypt","decrypt"]);
}

// AES-GCM encrypt/decrypt (iv: 12 bytes)
export async function aesGcmEncrypt(aesKey, plaintext){
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, aesKey, data);
  return { iv: abToB64(iv.buffer), ciphertext: abToB64(ct) };
}
export async function aesGcmDecrypt(aesKey, ivB64, ctB64){
  const iv = new Uint8Array(b64ToAb(ivB64));
  const ct = b64ToAb(ctB64);
  const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, aesKey, ct);
  return new TextDecoder().decode(pt);
}