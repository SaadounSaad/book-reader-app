// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from './components/Library';
import Reader from './components/Reader';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/SettingsPage';
import './App.css';

const App = () => {
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
  // Dans App.js, ajoutez :
  const addBook = (newBook) => {
    setBooks(prevBooks => [...prevBooks, newBook]);
  };
  // Charger les livres depuis le stockage local au démarrage
  useEffect(() => {
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
              // ...autres chapitres
            ],
            bookmarks: [15, 67, 198],
            annotations: [
              { page: 25, text: "Passage important", highlight: "Jean Valjean regarda..." },
              { page: 67, text: "Contexte historique", highlight: "La révolution française..." },
              // ...autres annotations
            ]
          },
          // ...autres livres
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
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // il y a 6 jours
            duration: 45, // minutes
            pagesRead: 20,
            chapterId: 0
          },
          {
            id: 2,
            bookId: 1,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // il y a 5 jours
            duration: 60,
            pagesRead: 30,
            chapterId: 0
          },
          {
            id: 3,
            bookId: 1,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // il y a 3 jours
            duration: 75,
            pagesRead: 40,
            chapterId: 1
          },
          {
            id: 4,
            bookId: 1,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // il y a 2 jours
            duration: 50,
            pagesRead: 25,
            chapterId: 1
          },
          {
            id: 5,
            bookId: 1,
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // hier
            duration: 90,
            pagesRead: 55,
            chapterId: 2
          },
          {
            id: 6,
            bookId: 1,
            date: new Date().toISOString(), // aujourd'hui
            duration: 35,
            pagesRead: 20,
            chapterId: 2
          }
        ];
        setReadingHistory(exampleHistory);
        localStorage.setItem('readingHistory', JSON.stringify(exampleHistory));
        localStorage.setItem('historyLastModified', new Date().toISOString());
      }
      
      // Charger les paramètres de l'application
      const savedAppSettings = localStorage.getItem('appSettings');
      if (savedAppSettings) {
        setAppSettings(JSON.parse(savedAppSettings));
      }
      
      // Charger les paramètres de thème
      const savedThemeSettings = localStorage.getItem('themeSettings');
      if (savedThemeSettings) {
        setThemeSettings(JSON.parse(savedThemeSettings));
      }
    };
    
    loadLocalData();
  }, []);
  
  // Sauvegarder les livres lorsqu'ils sont modifiés
  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem('books', JSON.stringify(books));
      localStorage.setItem('booksLastModified', new Date().toISOString());
    }
  }, [books]);
  
  // Sauvegarder l'historique de lecture lorsqu'il est modifié
  useEffect(() => {
    if (readingHistory.length > 0) {
      localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
      localStorage.setItem('historyLastModified', new Date().toISOString());
    }
  }, [readingHistory]);
  
  // Sauvegarder les paramètres de l'application lorsqu'ils sont modifiés
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);
  
  // Sauvegarder les paramètres de thème lorsqu'ils sont modifiés
  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings]);
  
  // Générer un nouvel ID pour les sessions de lecture
  const generateSessionId = () => {
    const maxId = readingHistory.reduce((max, session) => Math.max(max, session.id || 0), 0);
    return maxId + 1;
  };
  
  // Fonction pour enregistrer une session de lecture
  const recordReadingSession = (bookId, duration, pagesRead, chapterId) => {
    const newSession = {
      id: generateSessionId(),
      bookId,
      date: new Date().toISOString(),
      duration,
      pagesRead,
      chapterId
    };
    
    setReadingHistory(prevHistory => [...prevHistory, newSession]);
  };
  
  // Fonction pour mettre à jour la progression d'un livre
  const updateBookProgress = (bookId, currentPage, chapterId) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              currentPage, 
              lastReadChapter: chapterId,
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
  };
  
  // Fonction pour ajouter un signet
  const addBookmark = (bookId, pageNumber) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              bookmarks: book.bookmarks 
                ? [...new Set([...book.bookmarks, pageNumber])] 
                : [pageNumber],
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
  };
  
  // Fonction pour supprimer un signet
  const removeBookmark = (bookId, pageNumber) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              bookmarks: book.bookmarks 
                ? book.bookmarks.filter(bookmark => bookmark !== pageNumber) 
                : [],
              lastModified: new Date().toISOString()
            } 
          : book
      )
    );
  };
  
  // Fonction pour ajouter une annotation
  const addAnnotation = (bookId, pageNumber, highlightedText, noteText) => {
    const newAnnotation = {
      page: pageNumber,
      highlight: highlightedText,
      text: noteText,
      date: new Date().toISOString()
    };
    
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
  };
  
  // Fonction pour supprimer une annotation
  const removeAnnotation = (bookId, annotationIndex) => {
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
  };
  
  // Fonction pour mettre à jour les paramètres de l'application
  const updateAppSettings = (newSettings) => {
    setAppSettings(newSettings);
  };
  
  // Fonction pour mettre à jour les paramètres de thème
  const updateThemeSettings = (newSettings) => {
    setThemeSettings(newSettings);
  };
  
  // Fonction pour mettre à jour les livres (utilisée pour la synchronisation)
  const updateBooks = (newBooks) => {
    setBooks(newBooks);
  };
  
  // Fonction pour mettre à jour l'historique de lecture (utilisée pour la synchronisation)
  const updateReadingHistory = (newHistory) => {
    setReadingHistory(newHistory);
  };
  
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
              path="/" 
              element={
                <Library 
                  books={books} 
                  addBook={addBook} 
                  setBooks={setBooks} // ✅ on l’ajoute ici
                />
              }
            />

          <Route 
            path="/reader/:bookId" 
            element={
              <Reader 
                books={books}
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
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;