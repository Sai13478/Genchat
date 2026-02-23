import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./src/models/message.model.js";

dotenv.config();

async function testEncryption() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for testing.");

        const senderId = new mongoose.Types.ObjectId();
        const receiverId = new mongoose.Types.ObjectId();
        const testText = "Hello, this is a secret message!";

        // Create a new message (encryption should happen in setter)
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: testText,
        });

        console.log("Message created ID:", newMessage._id);
        console.log("Decrypted text (via getter):", newMessage.text);

        // Verify it is encrypted in the DB
        const rawMessage = await Message.collection.findOne({ _id: newMessage._id });
        console.log("Raw text in DB:", rawMessage.text);

        if (rawMessage.text.includes(":")) {
            console.log("SUCCESS: Message is encrypted in DB.");
        } else {
            console.error("FAILURE: Message is NOT encrypted in DB.");
        }

        if (newMessage.text === testText) {
            console.log("SUCCESS: Message is correctly decrypted via getter.");
        } else {
            console.error("FAILURE: Decryption Mismatch.");
        }

        // Test backward compatibility
        console.log("\nTesting backward compatibility...");
        const legacyId = new mongoose.Types.ObjectId();
        await Message.collection.insertOne({
            _id: legacyId,
            senderId,
            receiverId,
            text: "Legacy plain text message",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const legacyMsg = await Message.findById(legacyId);
        console.log("Legacy decrypted text:", legacyMsg.text);

        if (legacyMsg.text === "Legacy plain text message") {
            console.log("SUCCESS: Legacy message handled correctly.");
        } else {
            console.error("FAILURE: Legacy message failed.");
        }

        // Cleanup
        await Message.deleteOne({ _id: newMessage._id });
        await Message.collection.deleteOne({ _id: legacyId });
        console.log("\nTest data cleaned up.");

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

testEncryption();
