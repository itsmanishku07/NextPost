// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: Replace with your own Firebase configuration or use environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBqOxrhgv6iV3is7txQdZnrDRzJUEBdu5I",
  authDomain: "reflex-blog-9fbfa.firebaseapp.com",
  projectId: "reflex-blog-9fbfa",
  storageBucket: "reflex-blog-9fbfa.firebasestorage.app",
  messagingSenderId: "893349655192",
  appId: "1:893349655192:web:79ead6785d7f91a35116ed",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
