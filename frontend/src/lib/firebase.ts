import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔹 Configuração correta do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAA-gdNsgQ-6Pv42IFV3cdyl6f2bjTB2tI",
  authDomain: "pousadabd-c1391.firebaseapp.com",
  projectId: "pousadabd-c1391",
  storageBucket: "pousadabd-c1391.appspot.com", // ✅ corrigido (.app -> .appspot.com)
  messagingSenderId: "841738983465",
  appId: "1:841738983465:web:899d45c193ba9f5f112438",
  measurementId: "G-5JL49OLVY3",
};

// 🔹 Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
