import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// You can either pass a service account key path or rely on GOOGLE_APPLICATION_CREDENTIALS
// or pass the JSON via an environment variable FIREBASE_SERVICE_ACCOUNT.

let db = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // Fix escaped newlines in the private key that might occur from dotenv string parsing
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    db = getFirestore();
    console.log('[Firebase] Initialized with FIREBASE_SERVICE_ACCOUNT');
  } else {
    if (!getApps().length) {
      // Attempt default initialization (works if GOOGLE_APPLICATION_CREDENTIALS is set)
      initializeApp();
    }
    db = getFirestore();
    console.log('[Firebase] Initialized with default credentials');
  }
} catch (error) {
  console.warn('[Firebase] Initialization warning:', error.message);
  console.warn('[Firebase] Ensure FIREBASE_SERVICE_ACCOUNT is set in your .env for the Private Feedback module to work.');
}

export { db };
