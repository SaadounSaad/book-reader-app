// src/services/authService.js
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Inscription d'un utilisateur
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    throw error;
  }
};

// Connexion d'un utilisateur
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    throw error;
  }
};

// Déconnexion
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
};

// Observer les changements d'état de l'authentification
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = () => {
  return auth.currentUser;
};