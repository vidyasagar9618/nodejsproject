// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth'

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyBtF8XzrU3JwPYx_D9vDlvygYBeUK5OUBQ",
  authDomain: "insta-post-8caab.firebaseapp.com",
  projectId: "insta-post-8caab",
  storageBucket: "insta-post-8caab.appspot.com",
  messagingSenderId: "784514631659",
  appId: "1:784514631659:web:c78d42cf088efcf4d63bae",
  measurementId: "G-N3PCBFQSPC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth(app);
export default app;