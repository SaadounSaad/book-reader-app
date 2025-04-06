// src/services/bookService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Obtenir tous les livres d'un utilisateur
export const getUserBooks = async (userId) => {
  try {
    const q = query(
      collection(db, "books"), 
      where("userId", "==", userId),
      orderBy("lastModified", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const books = [];
    
    querySnapshot.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() });
    });
    
    return books;
  } catch (error) {
    console.error("Erreur lors de la récupération des livres:", error);
    throw error;
  }
};

// Ajouter un nouveau livre
export const addBook = async (userId, bookData) => {
  try {
    // Ajouter le livre principal
    const bookRef = await addDoc(collection(db, "books"), {
      ...bookData,
      userId,
      lastModified: serverTimestamp()
    });
    
    // Ajouter les chapitres séparément
    if (bookData.chapters && bookData.chapters.length > 0) {
      const chaptersPromises = bookData.chapters.map((chapter, index) => 
        addDoc(collection(db, "chapters"), {
          bookId: bookRef.id,
          title: chapter.title || `Chapitre ${index + 1}`,
          position: index,
          startPage: chapter.pageNumber || chapter.startPage || (index * 10 + 1),
          content: chapter.content || ""
        })
      );
      
      await Promise.all(chaptersPromises);
    }
    
    // Initialiser la progression de lecture
    await addDoc(collection(db, "readingProgress"), {
      userId,
      bookId: bookRef.id,
      currentChapter: 0,
      currentPage: 1,
      scrollPositions: {},
      lastRead: serverTimestamp()
    });
    
    return bookRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du livre:", error);
    throw error;
  }
};

// Mettre à jour la progression de lecture
export const updateReadingProgress = async (userId, bookId, progressData) => {
  try {
    const q = query(
      collection(db, "readingProgress"),
      where("userId", "==", userId),
      where("bookId", "==", bookId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const progressDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "readingProgress", progressDoc.id), {
        ...progressData,
        lastRead: serverTimestamp()
      });
    } else {
      // Si aucun document de progression n'existe, en créer un
      await addDoc(collection(db, "readingProgress"), {
        userId,
        bookId,
        ...progressData,
        lastRead: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    throw error;
  }
};

// Obtenir la progression de lecture
export const getReadingProgress = async (userId, bookId) => {
  try {
    const q = query(
      collection(db, "readingProgress"),
      where("userId", "==", userId),
      where("bookId", "==", bookId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la progression:", error);
    throw error;
  }
};

// Gérer les signets
export const addBookmark = async (userId, bookId, bookmarkData) => {
  try {
    return await addDoc(collection(db, "bookmarks"), {
      userId,
      bookId,
      ...bookmarkData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du signet:", error);
    throw error;
  }
};

export const getBookmarks = async (userId, bookId) => {
  try {
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId),
      where("bookId", "==", bookId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookmarks = [];
    
    querySnapshot.forEach((doc) => {
      bookmarks.push({ id: doc.id, ...doc.data() });
    });
    
    return bookmarks;
  } catch (error) {
    console.error("Erreur lors de la récupération des signets:", error);
    throw error;
  }
};

export const removeBookmark = async (bookmarkId) => {
  try {
    await deleteDoc(doc(db, "bookmarks", bookmarkId));
  } catch (error) {
    console.error("Erreur lors de la suppression du signet:", error);
    throw error;
  }
};

// Gérer les annotations
export const addAnnotation = async (userId, bookId, annotationData) => {
  try {
    return await addDoc(collection(db, "annotations"), {
      userId,
      bookId,
      ...annotationData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'annotation:", error);
    throw error;
  }
};

export const getAnnotations = async (userId, bookId) => {
  try {
    const q = query(
      collection(db, "annotations"),
      where("userId", "==", userId),
      where("bookId", "==", bookId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const annotations = [];
    
    querySnapshot.forEach((doc) => {
      annotations.push({ id: doc.id, ...doc.data() });
    });
    
    return annotations;
  } catch (error) {
    console.error("Erreur lors de la récupération des annotations:", error);
    throw error;
  }
};

export const removeAnnotation = async (annotationId) => {
  try {
    await deleteDoc(doc(db, "annotations", annotationId));
  } catch (error) {
    console.error("Erreur lors de la suppression de l'annotation:", error);
    throw error;
  }
};

// Obtenir les chapitres d'un livre
export const getBookChapters = async (bookId) => {
  try {
    const q = query(
      collection(db, "chapters"),
      where("bookId", "==", bookId),
      orderBy("position")
    );
    
    const querySnapshot = await getDocs(q);
    const chapters = [];
    
    querySnapshot.forEach((doc) => {
      chapters.push({ id: doc.id, ...doc.data() });
    });
    
    return chapters;
  } catch (error) {
    console.error("Erreur lors de la récupération des chapitres:", error);
    throw error;
  }
};