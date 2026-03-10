const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * Generate an Agora RTC token for a specific channel.
 */
exports.generateToken = async (req, res) => {
    try {
        const { channelName } = req.query;
        const uid = 0; // 0 allows Agora to assign a UID
        const role = RtcRole.PUBLISHER;

        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE;

        if (!appId || !appCertificate) {
            return res.status(500).json({ error: 'Agora credentials not configured on server.' });
        }

        if (!channelName) {
            return res.status(400).json({ error: 'Channel name is required.' });
        }

        // Token expires in 1 hour
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );

        return res.status(200).json({
            success: true,
            token: token,
            uid: uid,
            appId: appId
        });

    } catch (error) {
        console.error("Token generation error:", error.message);
        return res.status(500).json({ error: 'Internal server error during token generation.' });
    }
};
