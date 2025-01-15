import { Buffer } from 'buffer';

interface EncryptionResult {
  encryptedBlob: Blob;
  key: string;
}

/**
 * Generates a random encryption key
 */
const generateKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: import.meta.env.VITE_ENCRYPTION_ALGORITHM || 'AES-GCM',
      length: parseInt(import.meta.env.VITE_KEY_LENGTH || '256'),
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Exports a CryptoKey to base64 string
 */
const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('base64');
};

/**
 * Imports a base64 string key to CryptoKey
 */
const importKey = async (keyStr: string): Promise<CryptoKey> => {
  const keyBuffer = Buffer.from(keyStr, 'base64');
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts data using AES-GCM
 */
const encryptData = async (data: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );

  // Combine IV and encrypted content
  const combinedBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
  combinedBuffer.set(iv);
  combinedBuffer.set(new Uint8Array(encryptedContent), iv.length);

  return combinedBuffer.buffer;
};

/**
 * Decrypts data using AES-GCM
 */
const decryptData = async (data: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> => {
  const dataArray = new Uint8Array(data);
  const iv = dataArray.slice(0, 12);
  const encryptedContent = dataArray.slice(12);

  return await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedContent
  );
};

/**
 * Encrypts a Blob or File using AES-GCM
 */
export const encryptFile = async (input: Blob | File): Promise<EncryptionResult> => {
  const key = await generateKey();
  const data = await input.arrayBuffer();
  const encryptedData = await encryptData(data, key);
  const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
  const exportedKey = await exportKey(key);

  return {
    encryptedBlob,
    key: exportedKey,
  };
};

/**
 * Decrypts an encrypted blob using AES-GCM
 */
export const decryptFile = async (encryptedBlob: Blob, keyStr: string): Promise<Blob> => {
  const key = await importKey(keyStr);
  const encryptedData = await encryptedBlob.arrayBuffer();
  const decryptedData = await decryptData(encryptedData, key);
  return new Blob([decryptedData]);
}; 