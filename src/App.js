// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, getCurrentUser } from './services/authService';
import { 
  getUserBooks, 
  getReadingHistory,
  updateReadingProgress,
  addBookmark as addFirebaseBookmark,
  removeBookmark as removeFirebaseBookmark,
  addAnnotation as addFirebaseAnnotation,
  removeAnnotation as removeFirebaseAnnotation
} from './services/bookService';
import ConnectionStatus from './components/ConnectionStatus';
import Login from './components/Login';
import Register from './components/Register';
import Library from './components/Library';
import Reader from './components/Reader';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/SettingsPage';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [appSettings, setAppSettings] = useState({
    pageTurnAnimation: 'slide',
    fontFamily: 'system-ui',
    lineSpacing: 1.5,
    pagePadding: 20,
  });
  const [themeSettings, setThemeSettings] = useState({
    defaultTheme: 'light',
    autoNightMode: false,
    nightModeStartTime: '20:00',
    nightModeEndTime: '07:00',
  });

  // Observer l'état de l'authentification
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      if (!user) {
        // Si déconnecté, on peut charger les données locales
        loadLocalData();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Charger les données depuis Firebase quand l'utilisateur est connecté
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          setLoading(true);
          
          // Charger les livres depuis Firebase
          const userBooks = await getUserBooks(user.uid);
          if (userBooks.length > 0) {
            setBooks(userBooks);
          } else {
            // Si aucun livre sur Firebase, utiliser les livres locaux
            const localBooks = JSON.parse(localStorage.getItem('books') || '[]');
            setBooks(localBooks);
            
            // Optionnel : synchroniser les livres locaux vers Firebase
            // Cette étape peut être omise si vous préférez ne pas importer automatiquement
            // TODO: ajouter code pour synchroniser vers Firebase
          }
          
          // Charger l'historique depuis Firebase (à implémenter)
          // const userHistory = await getReadingHistory(user.uid);
          // setReadingHistory(userHistory);
          
          // Charger les paramètres (à implémenter)
          // TODO: ajouter chargement des paramètres depuis Firebase
          
          setLoading(false);
        } catch (error) {
          console.error("Erreur lors du chargement des données Firebase:", error);
          // En cas d'erreur, utiliser les données locales
          loadLocalData();
          setLoading(false);
        }
      }
    };
    
    loadUserData();
  }, [user]);

  // Fonction pour charger les données depuis localStorage
  const loadLocalData = () => {
    // Charger les livres
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    } else {
      // Livres d'exemple si aucun n'est trouvé
      const exampleBooks = [
        {
          id: 1,
          title: "Les Misérables",
          author: "Victor Hugo",
          cover: "/covers/les-miserables.jpg",
          totalPages: 1500,
          currentPage: 245,
          lastModified: new Date().toISOString(),
          chapters: [
            { id: 1, title: "Chapitre 1", startPage: 1 },
            { id: 2, title: "Chapitre 2", startPage: 35 },
            { id: 3, title: "Chapitre 3", startPage: 78 },
          ],
          bookmarks: [15, 67, 198],
          annotations: [
            { page: 25, text: "Passage important", highlight: "Jean Valjean regarda..." },
            { page: 67, text: "Contexte historique", highlight: "La révolution française..." },
          ]
        },
      ];
      setBooks(exampleBooks);
      localStorage.setItem('books', JSON.stringify(exampleBooks));
      localStorage.setItem('booksLastModified', new Date().toISOString());
    }
    
    // Charger l'historique de lecture
    const savedHistory = localStorage.getItem('readingHistory');
    if (savedHistory) {
      setReadingHistory(JSON.parse(savedHistory));
    } else {
      // Exemple d'historique de lecture
      const exampleHistory = [
        {
          id: 1,
          bookId: 1,
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          pagesRead: 20,
          chapterId: 0
        },
        // ...autres entrées
      ];
      setReadingHistory(exampleHistory);
      localStorage.setItem('readingHistory', JSON.stringify(exampleHistory));
    }
    
    // Charger les paramètres
    const savedAppSettings = localStorage.getItem('appSettings');
    if (savedAppSettings) {
      setAppSettings(JSON.parse(savedAppSettings));
    }
    
    const savedThemeSettings = localStorage.getItem('themeSettings');
    if (savedThemeSettings) {
      setThemeSettings(JSON.parse(savedThemeSettings));
    }
  };
  
  // Sauvegarder les données dans localStorage (comme backup)
  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem('books', JSON.stringify(books));
      localStorage.setItem('booksLastModified', new Date().toISOString());
    }
  }, [books]);
  
  useEffect(() => {
    if (readingHistory.length > 0) {
      localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
      localStorage.setItem('historyLastModified', new Date().toISOString());
    }
  }, [readingHistory]);
  
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);
  
  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings]);
  
  // Fonction pour ajouter un livre
  const addBook = async (newBook) => {
    // Générer un ID unique pour le livre
    const bookWithId = {
      ...newBook,
      id: Date.now(),
      lastModified: new Date().toISOString()
    };
    
    // Mise à jour de l'état local
    setBooks(prevBooks => [...prevBooks, bookWithId]);
    
    // Si l'utilisateur est connecté, sauvegarder dans Firebase
    if (user) {
      try {
        // Utiliser le service pour ajouter le livre dans Firebase
        // Cette fonction retournera l'ID généré par Firebase que nous pourrons utiliser
        // Mais pour l'instant, nous utilisons l'ID local
        const firebaseBookId = await addBook(user.uid, bookWithId);
        // Si besoin, mettre à jour l'ID local avec celui de Firebase
      } catch (error) {
        console.error("Erreur lors de l'ajout du livre dans Firebase:", error);
        // L'ajout local a déjà été fait, donc pas besoin de revenir en arrière
      }
    }
  };
  
  // Générer un nouvel ID pour les sessions de lecture
  const generateSessionId = () => {
    const maxId = readingHistory.reduce((max, session) => Math.max(max, session.id || 0), 0);
    return maxId + 1;
  };
  
  // Fonction pour enregistrer une session de lecture
  const recordReadingSession = async (bookId, duration, pagesRead, chapterId) => {
    const newSession = {
      id: generateSessionId(),
      bookId,
      date: new Date().toISOString(),
      duration,
      pagesRead,
      chapterId
    };
    
    // Mise à jour de l'état local
    setReadingHistory(prevHistory => [...prevHistory, newSession]);
    
    // Si l'utilisateur est connecté, sauvegarder dans Firebase
    if (user) {
      try {
        // TODO: Implémenter la fonction pour ajouter la session dans Firebase
        // await addReadingSession(user.uid, bookId, newSession);
      } catch (error) {
        console.error("Erreur lors de l'ajout de la session dans Firebase:", error);
      }
    }
  };
  
  // Fonction pour mettre à jour la progression d'un livre
  const updateBookProgress = async (bookId, currentPage, chapterId, updatedBook = null) => {
    // Mise à jour de l'état local
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? updatedBook || { 
              ...book, 
              currentPage, 
              lastReadChapter: chapterId,
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
    
    // Si l'utilisateur est connecté, sauvegarder dans Firebase
    if (user) {
      try {
        // Mise à jour de la progression dans Firebase
        await updateReadingProgress(user.uid, bookId, {
          currentChapter: chapterId,
          currentPage,
          lastModified: new Date().toISOString()
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la progression dans Firebase:", error);
      }
    }
  };
  
  // Fonction pour ajouter un signet
  const addBookmark = async (bookId, bookmarkData) => {
    // Pour compatibilité avec l'ancien système
    const isLegacyBookmark = typeof bookmarkData === 'number';
    
    // Mise à jour de l'état local
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              bookmarks: book.bookmarks 
                ? isLegacyBookmark
                  ? [...new Set([...book.bookmarks, bookmarkData])]
                  : [...book.bookmarks, bookmarkData]
                : [bookmarkData],
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
    
    // Si l'utilisateur est connecté, sauvegarder dans Firebase
    if (user) {
      try {
        // Utiliser le service Firebase pour ajouter le signet
        await addFirebaseBookmark(user.uid, bookId, isLegacyBookmark
          ? { pageNumber: bookmarkData, date: new Date().toISOString() }
          : bookmarkData
        );
      } catch (error) {
        console.error("Erreur lors de l'ajout du signet dans Firebase:", error);
      }
    }
  };
  
  // Fonction pour supprimer un signet
  const removeBookmark = async (bookId, bookmarkId) => {
    // Mise à jour de l'état local
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              bookmarks: book.bookmarks 
                ? typeof bookmarkId === 'number'
                  ? book.bookmarks.filter(bookmark => bookmark !== bookmarkId) // Ancien système
                  : book.bookmarks.filter((_, index) => index !== bookmarkId) // Nouveau système
                : [],
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
    
    // Si l'utilisateur est connecté, supprimer dans Firebase
    if (user) {
      try {
        await removeFirebaseBookmark(user.uid, bookId, bookmarkId);
      } catch (error) {
        console.error("Erreur lors de la suppression du signet dans Firebase:", error);
      }
    }
  };
  
  // Fonction pour ajouter une annotation
  const addAnnotation = async (bookId, pageNumber, highlightedText, noteText) => {
    const newAnnotation = {
      page: pageNumber,
      highlight: highlightedText,
      text: noteText,
      date: new Date().toISOString()
    };
    
    // Mise à jour de l'état local
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              annotations: book.annotations 
                ? [...book.annotations, newAnnotation] 
                : [newAnnotation],
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
    
    // Si l'utilisateur est connecté, sauvegarder dans Firebase
    if (user) {
      try {
        await addFirebaseAnnotation(user.uid, bookId, newAnnotation);
      } catch (error) {
        console.error("Erreur lors de l'ajout de l'annotation dans Firebase:", error);
      }
    }
  };
  
  // Fonction pour supprimer une annotation
  const removeAnnotation = async (bookId, annotationIndex) => {
    // Mise à jour de l'état local
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              annotations: book.annotations 
                ? book.annotations.filter((_, index) => index !== annotationIndex) 
                : [],
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
    
    // Si l'utilisateur est connecté, supprimer dans Firebase
    if (user) {
      try {
        await removeFirebaseAnnotation(user.uid, bookId, annotationIndex);
      } catch (error) {
        console.error("Erreur lors de la suppression de l'annotation dans Firebase:", error);
      }
    }
  };
  
  // Autres fonctions existantes
  const updateAppSettings = (newSettings) => {
    setAppSettings(newSettings);
    // TODO: Synchroniser avec Firebase
  };
  
  const updateThemeSettings = (newSettings) => {
    setThemeSettings(newSettings);
    // TODO: Synchroniser avec Firebase
  };
  
  const updateBooks = (newBooks) => {
    setBooks(newBooks);
    // TODO: Synchroniser avec Firebase
  };
  
  const updateReadingHistory = (newHistory) => {
    setReadingHistory(newHistory);
    // TODO: Synchroniser avec Firebase
  };
  
  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }
  
  return (
    <Router>
      <div className="app-container">
        <ConnectionStatus />
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" /> : <Register />} 
          />
          <Route 
            path="/" 
            element={
              <Library 
                books={books} 
                addBook={addBook}
                user={user} 
              />
            }  
          />
          <Route 
            path="/reader/:bookId" 
            element={
              <Reader 
                books={books}
                user={user}
                updateBookProgress={updateBookProgress}
                recordReadingSession={recordReadingSession}
                addBookmark={addBookmark}
                removeBookmark={removeBookmark}
                addAnnotation={addAnnotation}
                removeAnnotation={removeAnnotation}
                appSettings={appSettings}
                themeSettings={themeSettings}
              />
            } 
          />
          <Route 
            path="/stats/:bookId" 
            element={
              <StatsPage 
                books={books}
                readingHistory={readingHistory}
                user={user}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <SettingsPage 
                books={books}
                readingHistory={readingHistory}
                updateBooks={updateBooks}
                updateReadingHistory={updateReadingHistory}
                appSettings={appSettings}
                updateAppSettings={updateAppSettings}
                themeSettings={themeSettings}
                updateThemeSettings={updateThemeSettings}
                user={user}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;