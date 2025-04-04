// StatsPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReadingStats from './ReadingStats';
import './ReadingStats.css';

const StatsPage = ({ books, readingHistory }) => {
  const { bookId } = useParams();
  const [currentBook, setCurrentBook] = useState(null);
  const [bookReadingData, setBookReadingData] = useState([]);
  
  useEffect(() => {
    // Trouver le livre actuel
    if (books && bookId) {
      const book = books.find(book => book.id === parseInt(bookId));
      setCurrentBook(book);
    }
    
    // Filtrer l'historique de lecture pour ce livre
    if (readingHistory && bookId) {
      const filteredHistory = readingHistory.filter(
        session => session.bookId === parseInt(bookId)
      );
      setBookReadingData(filteredHistory);
    }
  }, [books, bookId, readingHistory]);
  
  if (!currentBook) {
    return (
      <div className="stats-page-container">
        <div className="stats-header">
          <Link to="/" className="back-button">
            &larr; Retour à la bibliothèque
          </Link>
          <h2>Statistiques</h2>
        </div>
        <p>Chargement des données...</p>
      </div>
    );
  }
  
  return (
    <div className="stats-page-container">
      <div className="stats-header">
        <Link to="/" className="back-button">
          &larr; Retour à la bibliothèque
        </Link>
        <h2>Statistiques: {currentBook.title}</h2>
        <Link to={`/reader/${bookId}`} className="continue-reading-button">
          Continuer la lecture &rarr;
        </Link>
      </div>
      
      {bookReadingData.length === 0 ? (
        <div className="no-stats-message">
          <p>Vous n'avez pas encore de statistiques de lecture pour ce livre.</p>
          <p>Commencez à lire pour générer des statistiques!</p>
        </div>
      ) : (
        <ReadingStats 
          readingData={bookReadingData} 
          bookData={{
            totalPages: currentBook.totalPages,
            currentPage: currentBook.currentPage,
            chapters: currentBook.chapters
          }}
        />
      )}
    </div>
  );
};

export default StatsPage;