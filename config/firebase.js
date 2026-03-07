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
            console.log("📍 Detected JSON string. Cleaning and parsing...");
            try {
                // Remove potential whitespace/newlines around the string and handle common escaping issues
                const cleanedValue = rawValue.trim()
                    .replace(/\\n/g, '\n') // Fix double-escaped newlines if they exist
                    .replace(/\\"/g, '"'); // Fix escaped quotes if they exist

                serviceAccount = JSON.parse(rawValue); // Try parsing original first
            } catch (firstError) {
                console.warn("⚠️  Direct JSON parse failed, attempting secondary cleanup...");
                try {
                    // Try to fix common "escaped newline" issues that Azure/Shells sometimes introduce
                    const fixedValue = rawValue.trim().replace(/\\n/g, '\\\\n');
                    serviceAccount = JSON.parse(fixedValue);
                } catch (secondError) {
                    console.error(`❌ JSON Parse Error at pos ${firstError.message.match(/\d+/)}:`, firstError.message);
                    throw firstError; // Re-throw the original for visibility
                }
            }
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
