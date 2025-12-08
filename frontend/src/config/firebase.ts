// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCh5UNTfCBMzWQ93_YrfdOADYCFBY6cDws",
  authDomain: "subcribe-cff45.firebaseapp.com",
  databaseURL: "https://subcribe-cff45-default-rtdb.firebaseio.com",
  projectId: "subcribe-cff45",
  storageBucket: "subcribe-cff45.firebasestorage.app",
  messagingSenderId: "256862201274",
  appId: "1:256862201274:web:cfebcb02cb91ee87f5a983",
  measurementId: "G-MRH6P3Z8G8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
export default app;
