import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Library.css';
import AddBookForm from './AddBookForm';
import EpubImport from './EpubImport';

// Composant pour afficher la couverture du livre
const BookCover = ({ coverPath }) => {
  const [coverSrc, setCoverSrc] = useState('/covers/default.jpg');
  
  useEffect(() => {
    const loadCover = async () => {
      if (coverPath && coverPath.startsWith('cover_')) {
        // Récupérer l'image depuis localStorage
        const image = localStorage.getItem(coverPath);
        if (image) {
          setCoverSrc(image);
        }
      } else if (coverPath) {
        // Chemin d'image standard (fichier local ou URL)
        setCoverSrc(coverPath);
      }
    };
    
    loadCover();
  }, [coverPath]);
  
  return <img src={coverSrc} alt="Couverture du livre" />;
};

const Library = ({ books, addBook }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [filterBy, setFilterBy] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEpubImport, setShowEpubImport] = useState(false);

  const handleEpubImport = (newBook) => {
    addBook(newBook);
    setShowEpubImport(false);
  };
  // Filtrer et trier les livres (code existant)
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'reading') return matchesSearch && book.currentPage > 0 && book.currentPage < book.totalPages;
    if (filterBy === 'completed') return matchesSearch && book.currentPage >= book.totalPages;
    if (filterBy === 'notStarted') return matchesSearch && book.currentPage === 0;
    
    return matchesSearch;
  });

  // Trier les livres (code existant)
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'author') return a.author.localeCompare(b.author);
    if (sortBy === 'recent') {
      const dateA = a.lastModified ? new Date(a.lastModified) : new Date(0);
      const dateB = b.lastModified ? new Date(b.lastModified) : new Date(0);
      return dateB - dateA;
    }
    if (sortBy === 'progress') return (b.currentPage / b.totalPages) - (a.currentPage / a.totalPages);
    return 0;
  });

  // Calculer la progression de lecture
  const calculateProgress = (currentPage, totalPages) => {
    if (!totalPages || totalPages === 0) return 0;
    return Math.floor((currentPage / totalPages) * 100);
  };

  // Fonction pour gérer l'ajout d'un livre
  const handleAddBook = (newBook) => {
    setIsLoading(true);
    
    try {
      // Appeler la fonction d'ajout de livre passée en prop
      addBook(newBook);
      console.log("Livre ajouté avec succès:", newBook);
      
      // Fermer le formulaire après ajout réussi
      setShowAddForm(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du livre:", error);
      alert("Une erreur est survenue lors de l'ajout du livre. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="header-top">
          <h1>Ma Bibliothèque</h1>
          <Link to="/settings" className="settings-link">
            <span className="settings-icon">⚙️</span>
            <span className="settings-text">Paramètres</span>
          </Link>
        </div>
        <div className="library-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher par titre ou auteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="all">Tous les livres</option>
              <option value="reading">En cours de lecture</option>
              <option value="completed">Terminés</option>
              <option value="notStarted">Non commencés</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="title">Trier par titre</option>
              <option value="author">Trier par auteur</option>
              <option value="recent">Récemment lus</option>
              <option value="progress">Progression</option>
            </select>
          </div>
        </div>
      </div>
      <div className="library-footer">
        <p>Nombre de livres: {books.length}</p>
        <div className="library-actions">
          <button className="add-book-button" onClick={() => setShowAddForm(true)}>
            + Ajouter un livre
          </button>
          <button className="import-epub-button" onClick={() => setShowEpubImport(true)}>
            Importer EPUB
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner">Chargement...</div>
        </div>
      ) : (
        <div className="books-grid">
          {sortedBooks.length > 0 ? (
            sortedBooks.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-cover">
                  <BookCover coverPath={book.cover} />
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(book.currentPage, book.totalPages)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p className="author">par {book.author}</p>
                  <p className="progress-text">
                    {book.currentPage} / {book.totalPages} pages ({calculateProgress(book.currentPage, book.totalPages)}%)
                  </p>
                  <div className="book-actions">
                    <Link to={`/reader/${book.id}`} className="continue-button">
                      {book.currentPage > 0 ? 'Continuer' : 'Commencer'}
                    </Link>
                    <Link to={`/stats/${book.id}`} className="stats-button">
                      <span className="stats-icon">📊</span>
                      <span className="stats-text">Statistiques</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-books-message">
              <p>Aucun livre ne correspond à votre recherche</p>
            </div>
          )}
        </div>
      )}

      <div className="library-footer">
        <p>Nombre de livres: {books.length}</p>
        <button className="add-book-button" onClick={() => setShowAddForm(true)}>
          + Ajouter un livre
        </button>
      </div>
      
      {/* Formulaire d'ajout de livre */}
      {showAddForm && (
        <AddBookForm 
          onAddBook={handleAddBook} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}
      {/* Importation EPUB */}
      {showEpubImport && (
        <EpubImport 
          onImportComplete={handleEpubImport}
          onCancel={() => setShowEpubImport(false)}
        />
      )}
    </div>
  );
};

export default Library;