import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';

const adminConfig = {
  // projectId: process.env.FIREBASE_PROJECT_ID,
  // privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

function getAdminApp(): App {
  if (getApps().length) {
    return getApp();
  } else {
    return initializeApp(adminConfig);
  }
}

export { getAdminApp };
