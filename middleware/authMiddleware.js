const { admin, initFirebase } = require('../config/firebase');

/**
 * Middleware to verify Firebase JWT tokens in API requests.
 */
const verifyToken = async (req, res, next) => {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log(`[AUTH DEBUG] Missing or invalid Authorization header for ${req.url}`);
        return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log(`[AUTH DEBUG] Verifying token for ${req.url}...`);

    try {
        // Ensure Firebase SDK is initialized before checking
        const firebaseApp = initFirebase();
        if (!firebaseApp) {
            return res.status(500).json({ error: 'Authentication service is not configured on the server.' });
        }

        // Verify the token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach the user object to the request so controllers can use it
        req.user = decodedToken;

        // Pass control to the next handler
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(403).json({ error: 'Unauthorized. Invalid or expired token.' });
    }
};

module.exports = { verifyToken };
