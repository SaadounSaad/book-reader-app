// BookmarksList.js
import React from 'react';
import './BookmarksList.css';

const BookmarksList = ({ bookmarks, onBookmarkSelect, onClose }) => {
  return (
    <div className="bookmarks-panel">
      <div className="bookmarks-header">
        <h3>Signets</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      {bookmarks.length > 0 ? (
        <div className="bookmarks-list">
          {bookmarks.sort((a, b) => a - b).map((pageNumber) => (
            <div 
              key={pageNumber}
              className="bookmark-item"
              onClick={() => onBookmarkSelect(pageNumber)}
            >
              <span className="bookmark-icon">★</span>
              <span className="bookmark-page">Page {pageNumber}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-bookmarks">
          <p>Vous n'avez pas encore de signets.</p>
          <p>Ajoutez-en en cliquant sur l'icône ☆ pendant la lecture.</p>
        </div>
      )}
    </div>
  );
};

export default BookmarksList;