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

        if (serviceAccountJson) {
            // Primarily for production (Azure/Heroku/Vercel)
            serviceAccount = JSON.parse(serviceAccountJson);
        } else if (serviceAccountPath) {
            // Primarily for local development
            const fullPath = path.resolve(process.cwd(), serviceAccountPath);
            serviceAccount = require(fullPath);
        } else {
            console.warn("⚠️  Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH found. Firebase Admin will not be initialized.");
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
