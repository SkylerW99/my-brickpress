import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeQEUkGaKombpn-nCKHElslc2w6ZwCvKk",
  authDomain: "my-brickpress.firebaseapp.com",
  projectId: "my-brickpress",
  storageBucket: "my-brickpress.firebasestorage.app",
  messagingSenderId: "664541025332",
  appId: "1:664541025332:web:0dd076f47dcb44ec832661",
  measurementId: "G-P7DHYXGVME",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
