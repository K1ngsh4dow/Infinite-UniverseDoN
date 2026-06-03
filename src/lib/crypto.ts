
'use client';

// This file uses the Web Crypto API, which is only available in the browser.
// Ensure it is only called from client-side components.

/**
 * Derives a cryptographic key from a password using PBKDF2.
 */
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a file Blob using a password.
 * The output Blob is structured as: [16-byte salt][12-byte IV][encrypted data]
 */
export async function encryptBlob(blob: Blob, password: string): Promise<Blob> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);

  const fileBuffer = await blob.arrayBuffer();
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );

  const encryptedBlob = new Blob([salt, iv, new Uint8Array(encryptedContent)]);
  return encryptedBlob;
}

/**
 * Decrypts a file Blob using a password.
 * Assumes the input Blob is structured as: [16-byte salt][12-byte IV][encrypted data]
 */
export async function decryptBlob(encryptedBlob: Blob, password: string): Promise<Blob> {
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const salt = encryptedBuffer.slice(0, 16);
  const iv = encryptedBuffer.slice(16, 28);
  const data = encryptedBuffer.slice(28);

  const key = await getKey(password, new Uint8Array(salt));
  
  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      data
    );
    
    // We need to determine the original file type. This is tricky.
    // For now, let's just return a generic blob. The user can name it.
    // A more advanced implementation would store metadata.
    return new Blob([decryptedContent]);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed. Check password or file integrity.');
  }
}
