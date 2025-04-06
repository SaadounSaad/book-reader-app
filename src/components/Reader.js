// Reader.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ChapterMenu from './ChapterMenu';
import SettingsPanel from './SettingsPanel';
import BookmarksList from './BookmarksList';
import AnnotationPanel from './AnnotationPanel';
import SearchPanel from './SearchPanel';
import ReadingProgress from './ReadingProgress';
import AnnotationsList from './AnnotationsList';
import './Reader.css';
import { v4 as uuidv4 } from 'uuid';

const Reader = ({ 
  books, 
  updateBookProgress, 
  recordReadingSession, 
  addBookmark, 
  removeBookmark,
  addAnnotation,
  removeAnnotation 
}) => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(16);
  const [swipeStart, setSwipeStart] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookContent, setBookContent] = useState({});
  const [annotationsOpen, setAnnotationsOpen] = useState(false);
  const readerRef = useRef(null);

  // Enregistrement de la session
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [sessionPagesRead, setSessionPagesRead] = useState(0);
  const [lastRecordedPage, setLastRecordedPage] = useState(0);
  
  // Trouver le livre correspondant à l'ID
  useEffect(() => {
    if (books && bookId) {
      const foundBook = books.find(b => b.id.toString() === bookId.toString());
      if (foundBook) {
        setBook(foundBook);
        setCurrentPage(foundBook.currentPage || 1);
        
        // Trouver le chapitre actuel en fonction de la page
        const chapter = foundBook.chapters.findIndex(
          (ch, index, arr) => {
            const nextChapter = arr[index + 1];
            const pageToUse = foundBook.currentPage || 1;
            const startPage = ch.startPage || ch.pageNumber; // Support des deux formats
            
            return startPage <= pageToUse && 
                  (!nextChapter || (nextChapter.startPage || nextChapter.pageNumber) > pageToUse);
          }
        );
        
        setCurrentChapter(chapter !== -1 ? chapter : 0);
        setLastRecordedPage(foundBook.currentPage || 1);
        
        // Extraire le contenu réel du livre depuis les chapitres
        const content = {};
        foundBook.chapters.forEach((chapter, index) => {
          const startPage = chapter.startPage || chapter.pageNumber;
          const endPage = index < foundBook.chapters.length - 1 
            ? (foundBook.chapters[index + 1].startPage || foundBook.chapters[index + 1].pageNumber) - 1 
            : foundBook.totalPages;
            
          // Remplir les pages de ce chapitre avec son contenu
          for (let i = startPage; i <= endPage; i++) {
            content[i] = chapter.content || `Contenu de la page ${i}. ورد يوم الجمعة`;
          }
        });
        
        setBookContent(content);
      }
    }
    
    // Initialiser la session de lecture
    setSessionStartTime(Date.now());
    setSessionPagesRead(0);
  }, [books, bookId]);
  
  // Démarrer un chronomètre pour enregistrer des sessions courtes régulièrement
  useEffect(() => {
    let sessionTimer;
    
    if (book) {
      // Enregistrer une session toutes les 10 minutes
      sessionTimer = setInterval(() => {
        const elapsedMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);
        
        if (elapsedMinutes >= 10 && sessionPagesRead > 0) {
          // Enregistrer la session
          recordReadingSession(
            book.id,
            elapsedMinutes,
            sessionPagesRead,
            currentChapter
          );
          
          // Réinitialiser les compteurs de session
          setSessionStartTime(Date.now());
          setSessionPagesRead(0);
        }
      }, 60000); // Vérifier chaque minute
    }
    
    return () => {
      clearInterval(sessionTimer);
      
      // Enregistrer la session finale lors du démontage
      if (book && sessionPagesRead > 0) {
        const elapsedMinutes = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 60000));
        recordReadingSession(
          book.id,
          elapsedMinutes,
          sessionPagesRead,
          currentChapter
        );
      }
    };
  }, [book, sessionStartTime, sessionPagesRead, currentChapter, recordReadingSession]);

  // Mettre à jour les pages lues et la progression
  useEffect(() => {
    if (book && currentPage !== lastRecordedPage) {
      // Mettre à jour la progression du livre
      updateBookProgress(book.id, currentPage, currentChapter);
      
      // Mettre à jour les pages lues dans cette session
      setSessionPagesRead(prev => prev + Math.abs(currentPage - lastRecordedPage));
      setLastRecordedPage(currentPage);
    }
  }, [book, currentPage, lastRecordedPage, currentChapter, updateBookProgress]);
  
  // Gestionnaires de navigation
  const goToNextPage = () => {
    if (book && currentPage < book.totalPages) {
      setCurrentPage(prev => prev + 1);
      
      // Vérifier si on change de chapitre
      const nextChapter = book.chapters.findIndex(
        ch => (ch.startPage || ch.pageNumber) > currentPage && (ch.startPage || ch.pageNumber) <= currentPage + 1
      );
      
      if (nextChapter !== -1) {
        setCurrentChapter(nextChapter);
      }
    }
  };
  
  const goToPrevPage = () => {
    if (book && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      
      // Vérifier si on change de chapitre
      const prevChapter = book.chapters
        .slice()
        .reverse()
        .findIndex(ch => (ch.startPage || ch.pageNumber) <= currentPage - 1);
      
      if (prevChapter !== -1) {
        setCurrentChapter(book.chapters.length - 1 - prevChapter);
      }
    }
  };
  
  const goToChapter = (chapterIndex) => {
    if (book && book.chapters[chapterIndex]) {
      setCurrentPage(book.chapters[chapterIndex].startPage || book.chapters[chapterIndex].pageNumber);
      setCurrentChapter(chapterIndex);
      setMenuOpen(false);
    }
  };
  
  const goToPage = (pageNumber) => {
    if (book && pageNumber >= 1 && pageNumber <= book.totalPages) {
      setCurrentPage(pageNumber);
      
      // Mettre à jour le chapitre actuel
      const chapter = book.chapters.findIndex(
        (ch, index, arr) => {
          const nextChapter = arr[index + 1];
          const startPage = ch.startPage || ch.pageNumber;
          
          return startPage <= pageNumber && 
                (!nextChapter || (nextChapter.startPage || nextChapter.pageNumber) > pageNumber);
        }
      );
      
      if (chapter !== -1) {
        setCurrentChapter(chapter);
      }
      
      setBookmarksOpen(false);
    }
  };
  
  // Gestionnaire pour les résultats de recherche
  const handleSearchResult = (pageNumber, textIndex) => {
    goToPage(pageNumber);
    setSearchOpen(false);
    
    // Dans une application réelle, on pourrait aussi faire défiler la page jusqu'à la position du texte
    // et mettre en surbrillance le texte trouvé
  };
  
  // Gestionnaires de sélection de texte
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString());
    } else {
      setSelectedText('');
    }
  };
  
  const handleAddAnnotation = (noteText) => {
    if (selectedText && book) {
      addAnnotation(book.id, currentPage, selectedText, noteText);
      setSelectedText('');
      setAnnotationOpen(false);
    }
  };
  
  // Gestionnaires de signets
  const toggleBookmark = () => {
    if (book) {
      const hasBookmark = book.bookmarks && book.bookmarks.includes(currentPage);
      
      if (hasBookmark) {
        removeBookmark(book.id, currentPage);
      } else {
        addBookmark(book.id, currentPage);
      }
    }
  };
  
  // Gestionnaires de swipe
  const handleTouchStart = (e) => {
    setSwipeStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };
  
  const handleTouchEnd = (e) => {
    if (!swipeStart) return;
    
    const swipeEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const diffX = swipeStart.x - swipeEnd.x;
    const diffY = swipeStart.y - swipeEnd.y;
    
    // Si le mouvement horizontal est plus important que le vertical et suffisamment grand
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToNextPage(); // Swipe gauche
      } else {
        goToPrevPage(); // Swipe droit
      }
    }
  };
  
  // Gestionnaire de racccourcis clavier
  const handleKeyDown = (e) => {
    // Navigation avec les flèches
    if (e.key === 'ArrowRight') {
      goToNextPage();
    } else if (e.key === 'ArrowLeft') {
      goToPrevPage();
    } 
    // Raccourci de recherche (Ctrl+F)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  // Dans Reader.js
  useEffect(() => {
    if (book && book.source === 'epub') {
      // Créer un style scope pour l'EPUB qui n'affecte pas le reste de l'application
      const styleElement = document.createElement('style');
      styleElement.id = 'epub-styles';
      styleElement.innerHTML = `
        .page-content {
          overflow-y: auto;
          height: calc(100vh - 140px); /* Ajustez selon votre mise en page */
        }
        
        .page-content * {
          max-width: 100%;
        }
        
        .page-content img {
          display: block;
          margin: 0 auto;
          max-width: 100%;
          height: auto;
        }
      `;
      document.head.appendChild(styleElement);
      
      return () => {
        const existingStyle = document.getElementById('epub-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [book]);
  // Ajouter l'écouteur d'événements de clavier
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, book]); // eslint-disable-line react-hooks/exhaustive-deps
  
  if (!book) {
    return <div className="reader-loading">Chargement...</div>;
  }
  
  // Obtenir le contenu de la page actuelle
  const getCurrentChapterContent = () => {
    if (!book || !book.chapters || book.chapters.length === 0) {
      return null;
    }

    // Trouver le chapitre correspondant à la page actuelle
    const currentChapterContent = book.chapters.find((chapter, index) => {
      const nextChapter = book.chapters[index + 1];
      const startPage = chapter.startPage || chapter.pageNumber;
      
      return currentPage >= startPage && 
            (!nextChapter || currentPage < (nextChapter.startPage || nextChapter.pageNumber));
    });

    return currentChapterContent;
  };
  
  const currentChapterContent = getCurrentChapterContent();
  const currentBookmark = book.bookmarks && book.bookmarks.includes(currentPage);
  const progress = (currentPage / book.totalPages) * 100;
  const renderBookContent = () => {
    if (!book) return <p>Chargement...</p>;
    
    // Si c'est un livre EPUB
    if (book.source === 'epub') {
      const currentChapterContent = getCurrentChapterContent();
      
      if (currentChapterContent && currentChapterContent.content) {
        // Pour les EPUB, on affiche toujours avec dangerouslySetInnerHTML car c'est du HTML
        return (
          <div className="epub-content">
            <div dangerouslySetInnerHTML={{ __html: currentChapterContent.content }} />
          </div>
        );
      }
    } 
    // Livres standards créés manuellement
    else {
      const currentChapterContent = getCurrentChapterContent();
      
      if (currentChapterContent && currentChapterContent.content) {
        if (currentChapterContent.content.includes('<') && currentChapterContent.content.includes('>')) {
          return <div dangerouslySetInnerHTML={{ __html: currentChapterContent.content }} />;
        } else {
          return (
            <div>
              {currentChapterContent.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          );
        }
      }
    }
    
    return <p>Aucun contenu disponible pour cette page.</p>;
  };
  // Dans la partie rendu de votre Reader.js
return (
  <div 
    className={`reader-container theme-${theme}`} 
    ref={readerRef}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
  >
    {/* Barre de navigation supérieure */}
    <div className="reader-navbar">
      <Link to="/" className="nav-button">
        <span>←</span> Bibliothèque
      </Link>
      <div className="reader-title">
        <h2>{book.title}</h2>
        <p>{book.chapters[currentChapter]?.title || `Chapitre ${currentChapter + 1}`}</p>
      </div>
      <div className="reader-tools">
        <button
          className="nav-button search-button"
          onClick={() => setSearchOpen(true)}
          title="Rechercher"
        >
          <span>🔍</span>
        </button>
        <Link to={`/stats/${book.id}`} className="nav-button stats-button" title="Statistiques">
          <span>📊</span>
        </Link>
        <button 
          className="nav-button bookmark-button" 
          onClick={toggleBookmark}
          title={currentBookmark ? "Supprimer le signet" : "Ajouter un signet"}
        >
          <span>{currentBookmark ? "★" : "☆"}</span>
        </button>
        <button 
          className="nav-button bookmarks-button" 
          onClick={() => setBookmarksOpen(!bookmarksOpen)}
          title="Liste des signets"
        >
          <span>📑</span>
        </button>
        <button 
          className="nav-button settings-button" 
          onClick={() => setSettingsOpen(!settingsOpen)}
          title="Paramètres"
        >
          <span>⚙️</span>
        </button>
        <button 
          className="nav-button menu-button" 
          onClick={() => setMenuOpen(!menuOpen)}
          title="Chapitres"
        >
          <span>≡</span>
        </button>
        <button 
          className="nav-button annotations-button" 
          onClick={() => setAnnotationsOpen(!annotationsOpen)}
          title="Annotations"
        >
          <span>📝</span>
        </button>
      </div>
    </div>
    
    {/* Structure principale avec sidebar et contenu */}
    <div className="reader-layout">
      {/* Menu des chapitres à gauche (toujours visible) */}
      <div className={`chapters-sidebar ${menuOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3>Chapitres</h3>
          <button 
            className="close-sidebar" 
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="chapters-list">
          {book.chapters.map((chapter, index) => (
            <div 
              key={index} 
              className={`chapter-item ${index === currentChapter ? 'active' : ''}`}
              onClick={() => goToChapter(index)}
            >
              {chapter.title || `Chapitre ${index + 1}`}
            </div>
          ))}
        </div>
      </div>
      
      {/* Contenu principal du livre */}
      <div 
        className="reader-content" 
        style={{ fontSize: `${fontSize}px` }}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <div className="page-content">
          {renderBookContent()}
        </div>
        
        {/* Boutons de navigation simplifiés (sans numéros de page) */}
        <div className="page-navigation">
          <button 
            className="nav-button prev-page" 
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            ←
          </button>
          <button 
            className="nav-button next-page" 
            onClick={goToNextPage}
            disabled={currentPage >= book.totalPages}
          >
            →
          </button>
        </div>
      </div>
    </div>
    
    {/* Panneaux flottants */}
    {settingsOpen && (
      <SettingsPanel 
        theme={theme}
        fontSize={fontSize}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onClose={() => setSettingsOpen(false)}
      />
    )}
    
    {bookmarksOpen && (
      <BookmarksList 
        bookmarks={book.bookmarks || []}
        onBookmarkSelect={goToPage}
        onClose={() => setBookmarksOpen(false)}
      />
    )}
    
    {searchOpen && (
      <SearchPanel 
        bookContent={bookContent}
        currentPage={currentPage}
        onResultClick={handleSearchResult}
        onClose={() => setSearchOpen(false)}
      />
    )}
    
    {selectedText && (
      <div className="text-selection-menu">
        <button onClick={() => setAnnotationOpen(true)}>Annoter</button>
      </div>
    )}
    
    {annotationOpen && (
      <AnnotationPanel 
        selectedText={selectedText}
        onSave={handleAddAnnotation}
        onCancel={() => {
          setAnnotationOpen(false);
          setSelectedText('');
        }}
      />
    )}
    {annotationsOpen && (
      <AnnotationsList 
        annotations={book.annotations || []}
        onAnnotationSelect={goToPage}
        onDeleteAnnotation={(index) => removeAnnotation(book.id, index)}
        onClose={() => setAnnotationsOpen(false)}
      />
    )}
  </div>
);
};

export default Reader;