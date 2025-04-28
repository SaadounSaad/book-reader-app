// Reader.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ChapterMenu from './ChapterMenu';
import SettingsPanel from './SettingsPanel';
import BookmarksList from './BookmarksList';
import AnnotationPanel from './AnnotationPanel';
import SearchPanel from './SearchPanel';
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
  const [chapterScrollPositions, setChapterScrollPositions] = useState({});
  const readerRef = useRef(null);
  const contentRef = useRef(null);

  // Enregistrement de la session
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [sessionPagesRead, setSessionPagesRead] = useState(0);
  const [lastRecordedPage, setLastRecordedPage] = useState(0);
  
  // Fonction pour sauvegarder la position de défilement
  const saveScrollPosition = () => {
    if (contentRef.current && book) {
      setChapterScrollPositions(prev => ({
        ...prev,
        [currentChapter]: contentRef.current.scrollTop
      }));
    }
  };
  
  // Trouver le livre correspondant à l'ID
  useEffect(() => {
    if (!bookId || !books || books.length === 0) return;
  
    const foundBook = books.find(b => b.id?.toString() === bookId.toString());
  
    if (foundBook && Array.isArray(foundBook.chapters)) {
      setBook(foundBook);
      setCurrentPage(foundBook.currentPage || 1);
  
      const chapter = foundBook.chapters.findIndex((ch, index, arr) => {
        const nextChapter = arr[index + 1];
        const pageToUse = foundBook.currentPage || 1;
        const startPage = ch.startPage || ch.pageNumber;
  
        return startPage <= pageToUse &&
          (!nextChapter || (nextChapter.startPage || nextChapter.pageNumber) > pageToUse);
      });
  
      setCurrentChapter(chapter !== -1 ? chapter : 0);
      setLastRecordedPage(foundBook.currentPage || 1);
  
      // Création du contenu
      const content = {};
      foundBook.chapters.forEach((chapter, index) => {
        const startPage = chapter.startPage || chapter.pageNumber;
        const endPage = index < foundBook.chapters.length - 1
          ? (foundBook.chapters[index + 1].startPage || foundBook.chapters[index + 1].pageNumber) - 1
          : foundBook.totalPages;
  
        for (let i = startPage; i <= endPage; i++) {
          content[i] = chapter.content || `Page ${i}`;
        }
      });
  
      setBookContent(content);
    } else {
      console.warn("❗️ Le livre trouvé n’a pas de structure de chapitres valide. Vérifiez l'import.");
      setBook(null); // ou rediriger vers la bibliothèque
    }
  
    setSessionStartTime(Date.now());
    setSessionPagesRead(0);
  }, [books, bookId]);
  
  
  // Restaurer la position de défilement lors du changement de chapitre
  useEffect(() => {
    if (contentRef.current && book) {
      // Si nous avons une position sauvegardée pour ce chapitre, l'utiliser
      if (chapterScrollPositions[currentChapter]) {
        contentRef.current.scrollTop = chapterScrollPositions[currentChapter];
      } else {
        // Sinon, aller au début du chapitre
        contentRef.current.scrollTop = 0;
      }
    }
  }, [currentChapter, book, chapterScrollPositions]);
  
  // Sauvegardez la position avant de quitter
  useEffect(() => {
    return () => {
      saveScrollPosition();
    };
  }, []);
  
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
  
  // Gestionnaires de navigation par chapitre
  const goToNextChapter = () => {
    if (book && currentChapter < book.chapters.length - 1) {
      goToChapter(currentChapter + 1);
    }
  };
  
  const goToPrevChapter = () => {
    if (book && currentChapter > 0) {
      goToChapter(currentChapter - 1);
    }
  };
  
  const goToChapter = (chapterIndex) => {
    if (book && book.chapters[chapterIndex]) {
      // Sauvegarder la position actuelle avant de changer
      saveScrollPosition();
      
      const pageNumber = book.chapters[chapterIndex].startPage || book.chapters[chapterIndex].pageNumber || 1;
      
      setCurrentPage(pageNumber);
      setCurrentChapter(chapterIndex);
      updateBookProgress(book.id, pageNumber, chapterIndex);
      
      // Réinitialiser la position de défilement (scrollTop à 0)
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      
      setMenuOpen(false);
    }
  };
  
  const goToPage = (pageNumber) => {
    if (book && pageNumber >= 1 && pageNumber <= book.totalPages) {
      setCurrentPage(pageNumber);
      
      // Mettre à jour le chapitre actuel
      const chapter = Array.isArray(book.chapters)
  ? book.chapters.findIndex((ch, index, arr) => {
      const nextChapter = arr[index + 1];
      const startPage = ch.startPage || ch.pageNumber;

      return startPage <= pageNumber &&
        (!nextChapter || (nextChapter.startPage || nextChapter.pageNumber) > pageNumber);
    })
  : -1;
     
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
  
  // Fonction pour extraire du texte à la position actuelle (pour le contexte du signet)
  const getTextAtCurrentPosition = () => {
    if (contentRef.current) {
      // Calculez la position visible approximative
      const scrollPos = contentRef.current.scrollTop;
      const visibleHeight = contentRef.current.clientHeight;
      const midPoint = scrollPos + (visibleHeight / 2);
      
      // Trouvez l'élément le plus proche du milieu de l'écran
      const elements = contentRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
      let closestElement = null;
      let minDistance = Infinity;
      
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + (rect.height / 2);
        const distance = Math.abs(elementMiddle - midPoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestElement = element;
        }
      });
      
      // Retournez le texte ou une chaîne vide si rien n'est trouvé
      return closestElement ? closestElement.textContent.substring(0, 50) + '...' : '';
    }
    return '';
  };
  
  // Fonction pour vérifier si la position actuelle est déjà marquée
  const isCurrentPositionBookmarked = () => {
    if (!book || !book.bookmarks || !contentRef.current) return false;
    
    return book.bookmarks.some(bm => 
      bm.chapterIndex === currentChapter && 
      Math.abs(bm.scrollPosition - contentRef.current.scrollTop) < 100
    );
  };
  
  // Fonction pour ajouter un signet à la position actuelle
  const addBookmarkAtCurrentPosition = () => {
    if (book && contentRef.current) {
      const scrollPosition = contentRef.current.scrollTop;
      const bookmarkData = {
        chapterIndex: currentChapter,
        scrollPosition: scrollPosition,
        text: getTextAtCurrentPosition(),
        date: new Date().toISOString()
      };
      
      addBookmark(book.id, bookmarkData);
    }
  };
  
  // Gestionnaires de signets
  const toggleBookmark = () => {
    if (book && contentRef.current) {
      if (isCurrentPositionBookmarked()) {
        // Trouver l'index du signet à supprimer
        const bookmarkIndex = book.bookmarks.findIndex(bm => 
          bm.chapterIndex === currentChapter && 
          Math.abs(bm.scrollPosition - contentRef.current.scrollTop) < 100
        );
        
        if (bookmarkIndex !== -1) {
          removeBookmark(book.id, bookmarkIndex);
        }
      } else {
        addBookmarkAtCurrentPosition();
      }
    }
  };
  
  // Navigation vers un signet spécifique
  const goToBookmark = (chapterIndex, scrollPosition) => {
    if (book && book.chapters[chapterIndex]) {
      // Sauvegarder d'abord la position actuelle
      saveScrollPosition();
      
      setCurrentChapter(chapterIndex);
      const pageNumber = book.chapters[chapterIndex].startPage || book.chapters[chapterIndex].pageNumber || 1;
      setCurrentPage(pageNumber);
      updateBookProgress(book.id, pageNumber, chapterIndex);
      
      // Définir immédiatement la position de défilement
      if (contentRef.current) {
        // On fixe d'abord à 0 pour s'assurer qu'on est au début du chapitre
        contentRef.current.scrollTop = 0;
        
        // Puis on utilise un setTimeout pour s'assurer que le contenu est chargé
        setTimeout(() => {
          contentRef.current.scrollTop = scrollPosition;
        }, 50);
      }
      
      setBookmarksOpen(false);
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
        goToNextChapter();
      } else {
        goToPrevChapter();
      }
    }
  };
  
  // Gestionnaire de raccourcis clavier
  const handleKeyDown = (e) => {
    // Navigation avec les flèches
    if (e.key === 'ArrowRight') {
      goToNextChapter();
    } else if (e.key === 'ArrowLeft') {
      goToPrevChapter();
    } 
    // Raccourci de recherche (Ctrl+F)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  
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
  
  // Fonction de rendu du contenu du livre
  const renderBookContent = () => {
    if (!book) return <p>Chargement...</p>;
    
    // Si c'est un livre EPUB ou un format standard
    const currentChapterContent = getCurrentChapterContent();
    
    if (currentChapterContent && currentChapterContent.content) {
      // Si le contenu contient du HTML
      if (currentChapterContent.content.includes('<') && currentChapterContent.content.includes('>')) {
        return (
          <div className="epub-content">
            <div dangerouslySetInnerHTML={{ __html: currentChapterContent.content }} />
          </div>
        );
      } else {
        // Sinon, c'est du texte simple
        return (
          <div>
            {currentChapterContent.content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        );
      }
    }
    
    return <p>Aucun contenu disponible pour cette page.</p>;
  };
  
  const currentBookmark = isCurrentPositionBookmarked();
  
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
        
        {/* Bouton de menu latéral juste après le lien vers la bibliothèque */}
        <button
          className="nav-button chapters-button"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Chapitres"
        >
          <span>≡</span> Chapitres
        </button>
        
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
        {/* Menu des chapitres à gauche */}
        <div className={`chapters-sidebar ${menuOpen ? 'open' : ''}`}>
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
            {(Array.isArray(book.chapters) ? book.chapters : []).map((chapter, index) => (
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
          ref={contentRef}
          onScroll={() => {
            // Optionnel: sauvegarder la position pendant le défilement
            // Pour des performances optimales, utiliser un débounce
            saveScrollPosition();
          }}
        >
          <div className="page-content">
            {renderBookContent()}
          </div>
        </div>
      </div>
      
      {/* Boutons de navigation (pour changer de chapitre) */}
      <div className="page-navigation">
        <button 
          className="nav-button prev-page" 
          onClick={goToPrevChapter}
          disabled={currentChapter <= 0}
        >
          ←
        </button>
        <button 
          className="nav-button next-page" 
          onClick={goToNextChapter}
          disabled={currentChapter >= book.chapters.length - 1}
        >
          →
        </button>
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
          onBookmarkSelect={goToBookmark}
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