import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let db: Firestore | null = null;
let isFirestoreFallback = false;

// Determine if we have credentials in the environment or config file
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let configProjectId: string | undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    configProjectId = config.projectId;
  }
} catch (e) {
  // ignore reading error
}

try {
  const apps = getApps();
  if (apps.length > 0) {
    db = getFirestore();
  } else if (serviceAccountKeyJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKeyJson);
      initializeApp({
        credential: cert(serviceAccount)
      });
      db = getFirestore();
      console.log('[Firebase] Initialized Admin SDK with FIREBASE_SERVICE_ACCOUNT_KEY JSON string.');
    } catch (parseError) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON. It must be the full JSON object. Falling back to Project ID initialization.');
      const activeProjectId = projectId || configProjectId;
      if (activeProjectId) {
        initializeApp({ projectId: activeProjectId });
        db = getFirestore();
        console.log(`[Firebase] Initialized Admin SDK with Project ID: ${activeProjectId} (using Google Application Default Credentials).`);
      } else {
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY and no Project ID found.');
      }
    }
  } else if (projectId && clientEmail && privateKey) {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      })
    });
    db = getFirestore();
    console.log(`[Firebase] Initialized Admin SDK with FIREBASE_PROJECT_ID: ${projectId}`);
  } else if (googleAppCreds) {
    initializeApp();
    db = getFirestore();
    console.log('[Firebase] Initialized Admin SDK with GOOGLE_APPLICATION_CREDENTIALS path.');
  } else if (projectId || configProjectId) {
    const activeProjectId = projectId || configProjectId;
    initializeApp({
      projectId: activeProjectId
    });
    db = getFirestore();
    console.log(`[Firebase] Initialized Admin SDK with Project ID: ${activeProjectId} (using Google Application Default Credentials).`);
  } else {
    console.warn(
      '[Firebase] WARNING: No Firebase credentials found in environment. Falling back to IN-MEMORY storage.\n' +
      'Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY inside .env.local'
    );
    isFirestoreFallback = true;
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase Admin SDK. Falling back to IN-MEMORY storage.', error);
  isFirestoreFallback = true;
}

/**
 * Clean data recursively to remove any undefined properties before writing to Firestore,
 * as Firestore throws an error when trying to write fields of type 'undefined'.
 */
export function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item));
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanData(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

export { db, isFirestoreFallback };
