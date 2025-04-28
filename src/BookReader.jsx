// BookReader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from './db';

// Composant pour la lecture d'un livre
const BookReader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookmarks, setBookmarks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState('');
  
  const contentRef = useRef(null);
  
  useEffect(() => {
    const loadBook = async () => {
      try {
        if (!bookId) return;
        
        // Charger le livre
        const bookData = await db.books.get(parseInt(bookId));
        if (!bookData) {
          navigate('/'); // Retour à la bibliothèque si le livre n'existe pas
          return;
        }
        
        setBook(bookData);
        
        // Charger les paramètres
        const userSettings = await db.getSettings();
        setSettings(userSettings);
        
        // Charger la progression
        const progress = await db.readingProgress.get(parseInt(bookId));
        if (progress) {
          setCurrentPage(progress.currentPage);
          setTotalPages(progress.totalPages);
        }
        
        // Charger les signets
        const bookmarkList = await db.getBookmarksForBook(parseInt(bookId));
        setBookmarks(bookmarkList);
        
        // Charger le contenu du livre
        await loadBookContent(bookData);
        
      } catch (error) {
        console.error("Erreur lors du chargement du livre :", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBook();
  }, [bookId, navigate]);
  
  // Fonction pour charger le contenu du livre
  const loadBookContent = async (bookData) => {
    try {
      // Si le livre a déjà des pages stockées
      if (bookData.pages && bookData.pages.length > 0) {
        setPages(bookData.pages);
        setTotalPages(bookData.pages.length);
        return;
      }
      
      // Si le livre a du contenu mais pas de pages (pour la compatibilité)
      if (bookData.content) {
        // Diviser le contenu en pages
        const splitPages = bookData.content.split('\n\n').filter(p => p.trim() !== '');
        setPages(splitPages);
        setTotalPages(splitPages.length);
        
        // Mettre à jour le livre avec les pages extraites
        await db.books.update(bookData.id, { pages: splitPages });
        return;
      }
      
      // Fallback au cas où il n'y a pas de contenu
      setPages(["Ce livre ne semble pas avoir de contenu. Veuillez réimporter le fichier."]);
      setTotalPages(1);
      
    } catch (error) {
      console.error("Erreur lors du chargement du contenu:", error);
      setPages(["Erreur lors du chargement du contenu du livre."]);
      setTotalPages(1);
    }
  };
  
  // Fonction pour afficher le contenu de la page en cours
  const renderPageContent = () => {
    if (currentPage > pages.length) {
      return <p>Fin du livre.</p>;
    }
    
    const currentPageContent = pages[currentPage - 1];
    
    // Si la page est une chaîne de caractères
    if (typeof currentPageContent === 'string') {
      return <p>{currentPageContent}</p>;
    }
    
    // Si la page est un objet avec une propriété 'text'
    if (typeof currentPageContent === 'object' && currentPageContent !== null) {
      if (currentPageContent.text) {
        return <p>{currentPageContent.text}</p>;
      }
      
      // Retourner une représentation en chaîne de l'objet s'il n'a pas de propriété 'text'
      try {
        return <p>{"Contenu non textuel : " + JSON.stringify(currentPageContent)}</p>;
      } catch (e) {
        return <p>Contenu non affichable</p>;
      }
    }
    
    // Fallback pour tout autre type
    return <p>Contenu non disponible</p>;
  };
  
  // Sauvegarder la progression de lecture
  const saveProgress = async () => {
    if (!book) return;
    
    try {
      await db.updateReadingProgress(parseInt(bookId), currentPage, totalPages);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la progression :", error);
    }
  };
  
  // Changer de page
  const changePage = (direction) => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Effet pour sauvegarder la progression quand la page change
  useEffect(() => {
    if (book) {
      saveProgress();
    }
  }, [currentPage, book, bookId]);
  
  // Gestionnaire pour les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        changePage('next');
      } else if (e.key === 'ArrowLeft') {
        changePage('prev');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]);
  
  // Ajouter un signet
  const addBookmark = async () => {
    try {
      await db.addBookmark(parseInt(bookId), currentPage, note);
      const updatedBookmarks = await db.getBookmarksForBook(parseInt(bookId));
      setBookmarks(updatedBookmarks);
      setNote('');
    } catch (error) {
      console.error("Erreur lors de l'ajout du signet :", error);
    }
  };
  
  // Aller à une page spécifique
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (showBookmarks) setShowBookmarks(false);
    }
  };
  
  // Appliquer les paramètres de lecture
  const applyReaderStyles = () => {
    if (!settings) return {};
    
    return {
      fontFamily: settings.fontFamily,
      fontSize: `${settings.fontSize}px`,
      lineHeight: settings.lineSpacing,
    };
  };
  
  if (isLoading) {
    return <div className="loading">Chargement du livre...</div>;
  }
  
  if (!book) {
    return <div className="error">Ce livre n'existe pas dans votre bibliothèque.</div>;
  }
  
  return (
    <div className={`book-reader ${settings?.theme}-theme`}>
      <div className="reader-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Bibliothèque
        </button>
        <h2>{book.title}</h2>
        <div className="reader-actions">
          <button onClick={() => setShowBookmarks(!showBookmarks)} className="icon-button">
            {showBookmarks ? 'Masquer signets' : 'Signets'}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="icon-button">
            {showSettings ? 'Masquer paramètres' : 'Paramètres'}
          </button>
        </div>
      </div>
      
      <div className="reader-container">
        {/* Panneau latéral pour les signets */}
        {showBookmarks && (
          <div className="bookmarks-panel">
            <h3>Signets</h3>
            
            <div className="add-bookmark">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optionnelle)"
                rows="2"
              />
              <button onClick={addBookmark}>Ajouter signet à la page actuelle</button>
            </div>
            
            <div className="bookmarks-list">
              {bookmarks.length === 0 ? (
                <p>Aucun signet pour ce livre.</p>
              ) : (
                bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bookmark-item">
                    <div className="bookmark-header">
                      <span className="bookmark-page" onClick={() => goToPage(bookmark.page)}>
                        Page {bookmark.page}
                      </span>
                      <span className="bookmark-date">
                        {bookmark.createdAt instanceof Date 
                          ? bookmark.createdAt.toLocaleDateString() 
                          : new Date(bookmark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {bookmark.note && <p className="bookmark-note">{bookmark.note}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Panneau latéral pour les paramètres */}
        {showSettings && (
          <div className="settings-panel reader-settings">
            <h3>Paramètres de lecture</h3>
            
            <div className="setting-option">
              <label>Thème</label>
              <select
                value={settings.theme}
                onChange={(e) => db.saveSettings({...settings, theme: e.target.value}).then(setSettings)}
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="sepia">Sépia</option>
              </select>
            </div>
            
            <div className="setting-option">
              <label>Taille de police</label>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => db.saveSettings({...settings, fontSize: Number(e.target.value)}).then(setSettings)}
              />
              <span>{settings.fontSize}px</span>
            </div>
            
            <div className="setting-option">
              <label>Interligne</label>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={settings.lineSpacing}
                onChange={(e) => db.saveSettings({...settings, lineSpacing: Number(e.target.value)}).then(setSettings)}
              />
              <span>{settings.lineSpacing}</span>
            </div>
            
            <div className="setting-option">
              <label>Police</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => db.saveSettings({...settings, fontFamily: e.target.value}).then(setSettings)}
              >
                <option value="Georgia">Georgia</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Zone de contenu du livre */}
        <div 
          className="reader-content" 
          style={applyReaderStyles()} 
          ref={contentRef}
        >
          {/* Contenu de la page */}
          <div className="page-content">
            <p>Page {currentPage} sur {totalPages}</p>
            <div className="book-text">
              {renderPageContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Contrôles de navigation */}
      <div className="page-navigation">
        <button 
          onClick={() => changePage('prev')}
          disabled={currentPage <= 1}
          className="nav-button"
        >
          Page précédente
        </button>
        
        <div className="page-indicator">
          <input 
            type="number" 
            value={currentPage} 
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            min="1" 
            max={totalPages} 
          />
          <span> / {totalPages}</span>
        </div>
        
        <button 
          onClick={() => changePage('next')}
          disabled={currentPage >= totalPages}
          className="nav-button"
        >
          Page suivante
        </button>
      </div>
    </div>
  );
};

export default BookReader;