import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.replace(
  /^(\$HOME|~)(?=\/|$)/,
  homedir(),
);

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is missing");
}

export const hasFirebaseServiceAccount = Boolean(
  credentialsPath && existsSync(credentialsPath),
);

if (hasFirebaseServiceAccount && credentialsPath) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
} else {
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    console.warn(
      `Firebase credentials file not found: ${credentialsPath}. ID token signatures can still be verified. Revocation checks and user creation need this file.`,
    );
  }
}

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export const adminAuth = getAuth();
