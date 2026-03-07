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

        if (rawValue) {
            const trimmed = rawValue.trim();

            if (trimmed.startsWith('{')) {
                console.log("📍 Detected JSON string. Cleaning and parsing...");
                try {
                    // Fix double-escaped newlines and problematic characters
                    const cleaned = trimmed
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"');
                    serviceAccount = JSON.parse(cleaned);
                } catch (e) {
                    console.error("❌ Failed to parse JSON string:", e.message);
                    throw e;
                }
            } else {
                // Try Base64 fallback (safest for Cloud Env)
                try {
                    console.log("📍 String is not JSON. Attempting Base64 decode...");
                    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
                    if (decoded.startsWith('{')) {
                        serviceAccount = JSON.parse(decoded);
                        console.log("✅ Successfully decoded Base64 Firebase credentials.");
                    } else {
                        throw new Error("Decoded string is not a JSON object.");
                    }
                } catch (e) {
                    console.error("❌ Failed to decode Base64 or string is invalid:", e.message);
                }
            }
        }

        if (!serviceAccount && serviceAccountPath) {
            console.log(`📍 Detected file path in FIREBASE_SERVICE_ACCOUNT_PATH: ${serviceAccountPath}`);
            const fullPath = path.resolve(process.cwd(), serviceAccountPath);
            serviceAccount = require(fullPath);
        } else if (!serviceAccount) {
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
