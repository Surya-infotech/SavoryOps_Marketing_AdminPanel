import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY;

export const encryptData = (plainText) => {
    if (!plainText) return "";
    try {
        return CryptoJS.AES.encrypt(String(plainText), SECRET_KEY).toString();
    } catch (error) {
        console.error("Encryption error:", error);
        return plainText;
    }
};

export const decryptData = (cipherText) => {
    if (!cipherText) return "";
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || cipherText;
    } catch {
        return cipherText;
    }
};

export const setEncryptedRole = (role) => {
    if (!role) {
        localStorage.removeItem("role");
        return;
    }
    const encrypted = encryptData(role);
    localStorage.setItem("role", encrypted);
};

export const getDecryptedRole = () => {
    const raw = localStorage.getItem("role");
    if (!raw) return "";
    // If plain text (like currently stored "Admin"), encrypt it in-place immediately
    if (raw === "Admin" || raw === "Employee" || !raw.startsWith("U2FsdGVkX1")) {
        const encrypted = encryptData(raw);
        localStorage.setItem("role", encrypted);
        return raw;
    }
    const decrypted = decryptData(raw);
    return decrypted || raw;
};