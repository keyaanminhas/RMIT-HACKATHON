// WebCrypto Cryptographic Engine & TideCloak Bridge
// Implements client-side ineffable key simulation and real WebCrypto primitives

// Master Ineffable Hash Key (simulates Tide Ineffable Hash Key held by Cybersecurity Fabric)
const INEFFABLE_HASH_KEY = "TIDE_FABRIC_INEFFABLE_HASH_KEY_2026_MULE_SIGNALS";

// Normalizes bank account, IC number, or phone number
export function normalizeIdentifier(type, raw) {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/[-\s]/g, "").toUpperCase();
  return `${type}:${cleaned}`;
}

// SHA-256 helper
export async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// HMAC-SHA256 for blinded identifier matching
export async function computeAccountHmac(normalizedId) {
  const enc = new TextEncoder();
  const keyData = enc.encode(INEFFABLE_HASH_KEY);
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(normalizedId)
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// AES-GCM 256 client-side encryption
export async function encryptPayload(dataObj, tag) {
  const enc = new TextEncoder();
  const plaintext = typeof dataObj === "string" ? dataObj : JSON.stringify(dataObj);
  
  // Deterministic salt/key derived from tag + ineffable fabric secret
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(`TIDE_TAG_KEY_${tag}_FABRIC_DECENTRALIZED`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`SALT_${tag}_2026`),
      iterations: 10000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enc.encode(plaintext)
  );

  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

  return {
    cipherText: cipherB64,
    iv: ivB64,
    tag: tag,
    encryptedAt: new Date().toISOString()
  };
}

// AES-GCM 256 client-side decryption
export async function decryptPayload(encryptedObj, userRoles) {
  const { cipherText, iv, tag } = encryptedObj;
  
  // Verify user has the required TideCloak role for this tag
  const requiredRole = `_tide_${tag}.selfdecrypt`;
  if (!userRoles || !userRoles.includes(requiredRole)) {
    throw new Error(`TideCloak Permission Denied: Missing role '${requiredRole}'. Only authorized parties can decrypt tag '${tag}'.`);
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(`TIDE_TAG_KEY_${tag}_FABRIC_DECENTRALIZED`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`SALT_${tag}_2026`),
      iterations: 10000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const ivBytes = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)));
  const cipherBytes = new Uint8Array(atob(cipherText).split("").map(c => c.charCodeAt(0)));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    cipherBytes
  );

  const decryptedString = new TextDecoder().decode(decryptedBuffer);
  try {
    return JSON.parse(decryptedString);
  } catch {
    return decryptedString;
  }
}

// Cryptographic Audit Hash-Chain generator
export async function generateAuditHash(prevHash, entry) {
  const content = `${prevHash}|${entry.timestamp}|${entry.actor}|${entry.org}|${entry.action}|${entry.target}|${entry.details || ""}`;
  return await sha256(content);
}
