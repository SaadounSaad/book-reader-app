// BookLibrary.jsx
import React, { useState, useEffect } from 'react';
import db from './db';
import { useNavigate } from 'react-router-dom';
import FileParser from './fileParser';

const BookLibrary = () => {
  const [books, setBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger les livres et les paramètres au démarrage
    const loadData = async () => {
      try {
        const allBooks = await db.books.toArray();
        setBooks(allBooks);
        
        const recentlyRead = await db.getRecentlyReadBooks();
        setRecentBooks(recentlyRead);
        
        const userSettings = await db.getSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fonction pour importer un nouveau livre
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      // Dans une application réelle, vous auriez un parser pour différents formats
      // de livres (EPUB, PDF, etc.). Ici, nous simulons simplement le métadata.
      
      const bookData = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Retirer l'extension
        author: "Auteur inconnu", // Dans une app réelle, vous extrairiez cela du fichier
        filePath: URL.createObjectURL(file), // Créer une URL pour le fichier
        fileType: file.type
      };
      
      const bookId = await db.addBook(bookData);
      
      // Simuler le nombre total de pages (dans une app réelle, à extraire du fichier)
      const estimatedPages = Math.floor(file.size / 2000);
      
      await db.updateReadingProgress(bookId, 1, estimatedPages);
      
      // Rafraîchir la liste des livres
      const updatedBooks = await db.books.toArray();
      setBooks(updatedBooks);
      
    } catch (error) {
      console.error("Erreur lors de l'ajout du livre :", error);
    }
  };

  // Fonction pour sauvegarder les paramètres
  const saveUserSettings = async (newSettings) => {
    try {
      await db.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres :", error);
    }
  };

  if (isLoading) {
    return <div>Chargement de votre bibliothèque...</div>;
  }

  return (
    <div className="book-library">
      <div className="header">
        <h1>Ma Bibliothèque</h1>
        <div className="actions">
          <label className="upload-btn">
            Ajouter un livre
            <input
              type="file"
              accept=".epub,.pdf,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      
      {recentBooks.length > 0 && (
        <div className="recent-books">
          <h2>Lecture récente</h2>
          <div className="book-list">
            {recentBooks.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-cover">
                  {/* Placeholder pour la couverture */}
                  <div className="cover-placeholder">{book.title.substring(0, 2)}</div>
                </div>
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${book.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{book.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="all-books">
        <h2>Tous les livres ({books.length})</h2>
        {books.length === 0 ? (
          <div className="empty-library">
            <p>Votre bibliothèque est vide. Ajoutez des livres pour commencer à lire.</p>
          </div>
        ) : (
          <div className="book-grid">
            {books.map(book => (
              <div key={book.id} className="book-item">
                <div className="book-cover">
                  <div className="cover-placeholder">{book.title.substring(0, 2)}</div>
                </div>
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <p className="added-date">
                  Ajouté le {new Date(book.addedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {settings && (
        <div className="settings-panel">
          <h2>Paramètres de lecture</h2>
          <div className="setting-option">
            <label>Thème</label>
            <select
              value={settings.theme}
              onChange={(e) => saveUserSettings({...settings, theme: e.target.value})}
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
              onChange={(e) => saveUserSettings({...settings, fontSize: Number(e.target.value)})}
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
              onChange={(e) => saveUserSettings({...settings, lineSpacing: Number(e.target.value)})}
            />
            <span>{settings.lineSpacing}</span>
          </div>
          <div className="setting-option">
            <label>Police</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => saveUserSettings({...settings, fontFamily: e.target.value})}
            >
              <option value="Georgia">Georgia</option>
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookLibrary;