// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
const db = getFirestore(app);

// Activer la persistance pour le mode hors ligne
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('La persistance est impossible car plusieurs onglets sont ouverts');
    } else if (err.code === 'unimplemented') {
      console.warn('Votre navigateur ne prend pas en charge toutes les fonctionnalités nécessaires');
    }
  });

// Initialiser Authentication
const auth = getAuth(app);

export { db, auth };