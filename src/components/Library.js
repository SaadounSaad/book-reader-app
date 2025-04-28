import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Library.css';
import AddBookForm from './AddBookForm';
import EpubImport from './EpubImport';
import DrivePickerButton from './DrivePickerButton';
import BookCover from './BookCover'; // Ton composant d'affichage des couvertures

const Library = ({ books, setBooks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [filterBy, setFilterBy] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEpubImport, setShowEpubImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Ajouter un livre localement
  const handleAddBook = (newBook) => {
    setIsLoading(true);
    try {
      setBooks(prevBooks => [...prevBooks, newBook]);
      setShowAddForm(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du livre :", error);
      alert("Erreur d'ajout du livre.");
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un livre importé depuis Drive
  const handleDriveImport = (analyzedBook) => {
    console.log("📚 Livre importé depuis Drive :", analyzedBook);
    setBooks(prevBooks => [...prevBooks, analyzedBook]);
  };

  // Recherche et filtrage
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'reading') return matchesSearch && book.currentPage > 0 && book.currentPage < book.totalPages;
    if (filterBy === 'completed') return matchesSearch && book.currentPage >= book.totalPages;
    if (filterBy === 'notStarted') return matchesSearch && book.currentPage === 0;

    return matchesSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
    if (sortBy === 'recent') {
      const dateA = new Date(a.dateAdded || 0);
      const dateB = new Date(b.dateAdded || 0);
      return dateB - dateA;
    }
    if (sortBy === 'progress') {
      return (b.currentPage / b.totalPages) - (a.currentPage / a.totalPages);
    }
    return 0;
  });

  const calculateProgress = (currentPage, totalPages) => {
    if (!totalPages) return 0;
    return Math.floor((currentPage / totalPages) * 100);
  };

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="header-top">
          <h1>Ma Bibliothèque</h1>
          <Link to="/settings" className="settings-link">
            ⚙️ Paramètres
          </Link>
        </div>

        <div className="library-controls">
          <input
            type="text"
            placeholder="Rechercher un livre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="all">Tous</option>
            <option value="reading">En cours</option>
            <option value="completed">Terminés</option>
            <option value="notStarted">Non commencés</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="title">Titre</option>
            <option value="author">Auteur</option>
            <option value="recent">Ajouté récemment</option>
            <option value="progress">Progression</option>
          </select>
        </div>

        <div className="library-actions">
          <button onClick={() => setShowAddForm(true)}>+ Ajouter un livre</button>
          <button onClick={() => setShowEpubImport(true)}>Importer EPUB</button>
          <DrivePickerButton onImport={handleDriveImport} />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-overlay">
          Chargement...
        </div>
      ) : (
        <div className="books-grid">
          {sortedBooks.map(book => (
            <div key={book.id} className="book-card">
              <div className="book-cover">
                <BookCover coverPath={book.cover} />
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateProgress(book.currentPage, book.totalPages)}%` }}
                  />
                </div>
              </div>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p>par {book.author || "Auteur inconnu"}</p>
                <p>Progression: {calculateProgress(book.currentPage, book.totalPages)}%</p>
                <Link to={`/reader/${book.id}`} className="continue-button">
                  {book.currentPage > 0 ? "Continuer" : "Commencer"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <AddBookForm
          onAddBook={handleAddBook}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showEpubImport && (
        <EpubImport
          onImportComplete={handleAddBook}
          onCancel={() => setShowEpubImport(false)}
        />
      )}
    </div>
  );
};

export default Library;
