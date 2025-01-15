import { useCallback } from 'react';
import { encryptFile, decryptFile } from '../utils/encryption';

interface EncryptionProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface EncryptionResult {
  encryptedBlob: Blob;
  key: string;
}

export const useFileEncryption = () => {
  const encrypt = useCallback(
    async (
      file: File,
      onProgress?: (progress: EncryptionProgress) => void
    ): Promise<EncryptionResult> => {
      const chunkSize = parseInt(import.meta.env.VITE_FILE_CHUNK_SIZE || '1048576'); // 1MB default
      const fileSize = file.size;
      let processedSize = 0;

      // Read the file in chunks
      const chunks: Uint8Array[] = [];
      const reader = new FileReader();

      const readChunk = (start: number, end: number): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
          const chunk = file.slice(start, end);
          reader.onload = () => {
            const result = reader.result as ArrayBuffer;
            resolve(new Uint8Array(result));
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(chunk);
        });
      };

      // Process file in chunks
      while (processedSize < fileSize) {
        const end = Math.min(processedSize + chunkSize, fileSize);
        const chunk = await readChunk(processedSize, end);
        chunks.push(chunk);
        processedSize = end;

        if (onProgress) {
          onProgress({
            loaded: processedSize,
            total: fileSize,
            percentage: Math.round((processedSize * 100) / fileSize),
          });
        }
      }

      // Combine chunks and encrypt
      const combinedArray = new Uint8Array(fileSize);
      let offset = 0;
      chunks.forEach((chunk) => {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      });

      return await encryptFile(new Blob([combinedArray], { type: file.type }));
    },
    []
  );

  const decrypt = useCallback(
    async (
      encryptedBlob: Blob,
      key: string,
      onProgress?: (progress: EncryptionProgress) => void
    ): Promise<Blob> => {
      const chunkSize = parseInt(import.meta.env.VITE_FILE_CHUNK_SIZE || '1048576'); // 1MB default
      const fileSize = encryptedBlob.size;
      let processedSize = 0;

      // Read the encrypted file in chunks
      const chunks: Uint8Array[] = [];
      const reader = new FileReader();

      const readChunk = (start: number, end: number): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
          const chunk = encryptedBlob.slice(start, end);
          reader.onload = () => {
            const result = reader.result as ArrayBuffer;
            resolve(new Uint8Array(result));
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(chunk);
        });
      };

      // Process file in chunks
      while (processedSize < fileSize) {
        const end = Math.min(processedSize + chunkSize, fileSize);
        const chunk = await readChunk(processedSize, end);
        chunks.push(chunk);
        processedSize = end;

        if (onProgress) {
          onProgress({
            loaded: processedSize,
            total: fileSize,
            percentage: Math.round((processedSize * 100) / fileSize),
          });
        }
      }

      // Combine chunks and decrypt
      const combinedArray = new Uint8Array(fileSize);
      let offset = 0;
      chunks.forEach((chunk) => {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      });

      return await decryptFile(new Blob([combinedArray]), key);
    },
    []
  );

  return {
    encrypt,
    decrypt,
  };
}; 