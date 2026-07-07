import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIWIaLo8iQmNM37O_kgePYxzv_Vc6s6vw",
  authDomain: "pure-dimension-s8gvj.firebaseapp.com",
  projectId: "pure-dimension-s8gvj",
  storageBucket: "pure-dimension-s8gvj.firebasestorage.app",
  messagingSenderId: "369682426562",
  appId: "1:369682426562:web:470181eaa2e3cb4f12695b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
