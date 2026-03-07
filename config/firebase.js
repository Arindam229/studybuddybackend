const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let initialized = false;

function initFirebase() {
    if (initialized) return admin;

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    try {
        let serviceAccount;

        const rawValue = serviceAccountJson || serviceAccountPath;

        if (rawValue && rawValue.trim().startsWith('{')) {
            console.log("📍 Detected JSON string in environment variable. Attempting to parse...");
            serviceAccount = JSON.parse(rawValue);
        } else if (serviceAccountPath) {
            console.log(`📍 Detected file path in FIREBASE_SERVICE_ACCOUNT_PATH: ${serviceAccountPath}`);
            const fullPath = path.resolve(process.cwd(), serviceAccountPath);
            serviceAccount = require(fullPath);
        } else {
            console.error("❌ ERROR: No valid Firebase credentials found. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set with JSON content.");
            return null;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log("✅ Firebase Admin SDK initialized successfully.");
        initialized = true;
        return admin;
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
        return null;
    }
}

module.exports = { initFirebase, admin };
