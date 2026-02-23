import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // IV Length for GCM
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    console.error("CRITICAL: MESSAGE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
}

/**
 * Encrypts plain text into a string format: iv:authTag:encryptedData (all hex)
 */
export const encrypt = (text) => {
    if (!text) return text;
    if (!ENCRYPTION_KEY) return text; // Fallback if key missing

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag().toString("hex");

        // Return format: iv:authTag:encryptedData
        return `${iv.toString("hex")}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error("Encryption failed:", error);
        return text;
    }
};

/**
 * Decrypts text in format iv:authTag:encryptedData
 * Returns plain text, or original text if decryption fails (backward compatibility)
 */
export const decrypt = (encryptedText) => {
    if (!encryptedText || typeof encryptedText !== "string") return encryptedText;
    if (!ENCRYPTION_KEY) return encryptedText;

    // Check if it's in our format (iv:authTag:data)
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
        return encryptedText; // Not encrypted by our system, return as is
    }

    try {
        const [ivHex, authTagHex, encryptedDataHex] = parts;

        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const encryptedData = Buffer.from(encryptedDataHex, "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        // Fallback for non-encrypted or incorrectly formatted data
        console.warn("Decryption failed (returning plain text):", error.message);
        return encryptedText;
    }
};
