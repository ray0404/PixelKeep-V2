// Web Crypto API Utilities (Modern Encryption)

// Generate a key from the password using PBKDF2
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    } as Pbkdf2Params,
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data using AES-GCM
export async function encryptWebCrypto(data: any, password: string): Promise<{ cipher: string, salt: string, iv: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedData
  );

  // Convert to Base64 for storage
  const bufferToBase64 = (buffer: ArrayBuffer | ArrayBufferView) => {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
  };

  return {
    cipher: bufferToBase64(encrypted),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv)
  };
}

// Decrypt data using AES-GCM
export async function decryptWebCrypto(cipher: string, saltStr: string, ivStr: string, password: string): Promise<any> {
  try {
      const base64ToBuffer = (base64: string) => {
          const binary_string = window.atob(base64);
          const len = binary_string.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              bytes[i] = binary_string.charCodeAt(i);
          }
          return bytes.buffer as ArrayBuffer;
      };

      const salt = new Uint8Array(base64ToBuffer(saltStr));
      const iv = new Uint8Array(base64ToBuffer(ivStr));
      const encryptedData = base64ToBuffer(cipher);
      
      const key = await getKey(password, salt);
      
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        encryptedData
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
  } catch (e) {
      console.error("WebCrypto Decryption failed:", e);
      return null;
  }
}
