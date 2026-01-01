/// <reference types="vite/client" />
import CryptoJS from 'crypto-js';

const getEnv = (key: string) => {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
        return (import.meta as any).env[key];
    }
    return undefined;
};

const SECRET_KEY = getEnv('VITE_BACKUP_ENCRYPTION_KEY') || 'default-fallback-key-do-not-use-in-prod';

export const EncryptionService = {
    /**
     * Encrypts a JSON object into a string
     */
    encrypt: (data: any): string => {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    },

    /**
     * Decrypts an encrypted string back to a JSON object
     */
    decrypt: (encryptedString: string): any => {
        const bytes = CryptoJS.AES.decrypt(encryptedString, SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    }
};
