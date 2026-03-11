import agoraToken from "agora-token";
const { RtcTokenBuilder, RtcRole } = agoraToken;

export const getAgoraToken = (req, res) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        return res.status(500).json({ error: "Agora credentials not configured on server." });
    }

    const { channelName } = req.query;

    if (!channelName) {
        return res.status(400).json({ error: "channelName query parameter is required." });
    }

    // Use the authenticated user's MongoDB _id as the UID (numeric hash)
    // Agora expects a numeric UID, so we convert the string _id to a number
    const uid = 0; // 0 means Agora assigns a dynamic UID

    const role = RtcRole.PUBLISHER;

    // Token expires in 1 hour (3600 seconds)
    const expireTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            uid,
            role,
            expireTimeInSeconds,  // token expire
            privilegeExpiredTs    // privilege expire
        );

        return res.json({ token, uid, channelName, appId });
    } catch (error) {
        console.error("Error generating Agora token:", error);
        return res.status(500).json({ error: "Failed to generate token." });
    }
};
