import { encrypt, decrypt } from "./src/lib/encryption.js";

function testUtility() {
    const originalText = "Hello, this is a secret message!";

    console.log("Original Text:", originalText);

    const encryptedText = encrypt(originalText);
    console.log("Encrypted Text:", encryptedText);

    if (encryptedText === originalText) {
        console.error("FAILURE: Text was not encrypted.");
    } else if (!encryptedText.includes(":")) {
        console.error("FAILURE: Encrypted text format is invalid.");
    } else {
        console.log("SUCCESS: Text encrypted and format is correct.");
    }

    const decryptedText = decrypt(encryptedText);
    console.log("Decrypted Text:", decryptedText);

    if (decryptedText === originalText) {
        console.log("SUCCESS: Text decrypted correctly.");
    } else {
        console.error("FAILURE: Decryption mismatch.");
    }

    // Test backward compatibility
    const plainText = "Legacy plain text";
    const result = decrypt(plainText);
    console.log("Legacy Text result:", result);
    if (result === plainText) {
        console.log("SUCCESS: Legacy plain text handled correctly.");
    } else {
        console.error("FAILURE: Legacy plain text corrupted.");
    }

    // Test with invalid encrypted string
    const invalidEncrypted = "bad:data:format";
    const invalidResult = decrypt(invalidEncrypted);
    console.log("Invalid Encrypted result:", invalidResult);
    // Should return original if decryption fails or format is bad but looks like 3 parts
    // Actually if it has 3 parts it tries to decrypt and might return original on error
}

testUtility();
