// AddBookForm.js
import React, { useState } from 'react';
import './AddBookForm.css'; // N'oubliez pas de créer ce fichier CSS

const AddBookForm = ({ onAddBook, onCancel }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [chapters, setChapters] = useState([{ title: 'Chapitre 1', startPage: 1 }]);
  
  // Fonction pour gérer la sélection de fichier de couverture
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fonction pour sauvegarder l'image dans localStorage
  const saveImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Générer un nom unique pour l'image
        const fileName = `cover_${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        // Stocker l'image en base64 dans localStorage
        localStorage.setItem(fileName, reader.result);
        resolve(fileName);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Définir le chemin de la couverture
    let coverPath = '/covers/default.jpg'; // Par défaut
    
    if (coverFile) {
      // Sauvegarder l'image et obtenir son chemin
      coverPath = await saveImage(coverFile);
    }
    
    // Créer un nouvel objet livre
    const newBook = {
      id: Date.now(),
      title,
      author,
      cover: coverPath,
      totalPages: parseInt(totalPages),
      currentPage: 0,
      lastModified: new Date().toISOString(),
      chapters,
      bookmarks: [],
      annotations: []
    };
    
    onAddBook(newBook);
  };
  
  // Gestion des chapitres
  const addChapter = () => {
    const lastChapter = chapters[chapters.length - 1];
    const newChapter = {
      title: `Chapitre ${chapters.length + 1}`,
      startPage: lastChapter ? lastChapter.startPage + 10 : 1
    };
    setChapters([...chapters, newChapter]);
  };
  
  const updateChapter = (index, field, value) => {
    const updatedChapters = [...chapters];
    updatedChapters[index] = {
      ...updatedChapters[index],
      [field]: field === 'startPage' ? parseInt(value) : value
    };
    setChapters(updatedChapters);
  };
  
  const removeChapter = (index) => {
    const updatedChapters = chapters.filter((_, i) => i !== index);
    setChapters(updatedChapters);
  };
  
  return (
    <div className="add-book-form">
      <div className="form-header">
        <h2>Ajouter un nouveau livre</h2>
        <button className="close-button" onClick={onCancel}>×</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titre*</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="author">Auteur*</label>
          <input 
            type="text" 
            id="author" 
            value={author} 
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="coverFile">Couverture du livre</label>
          <input 
            type="file" 
            id="coverFile" 
            accept="image/*"
            onChange={handleCoverChange}
          />
          
          {coverPreview && (
            <div className="cover-preview">
              <img src={coverPreview} alt="Aperçu de la couverture" />
            </div>
          )}
          
          <p className="form-help">Laissez vide pour une couverture par défaut</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="totalPages">Nombre total de pages*</label>
          <input 
            type="number" 
            id="totalPages" 
            value={totalPages} 
            onChange={(e) => setTotalPages(e.target.value)}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Chapitres</label>
          {chapters.map((chapter, index) => (
            <div key={index} className="chapter-input">
              <input 
                type="text"
                value={chapter.title}
                onChange={(e) => updateChapter(index, 'title', e.target.value)}
                placeholder="Titre du chapitre"
              />
              <input 
                type="number"
                value={chapter.startPage}
                onChange={(e) => updateChapter(index, 'startPage', e.target.value)}
                min="1"
                max={totalPages}
                placeholder="Page de début"
              />
              <button 
                type="button" 
                className="remove-chapter"
                onClick={() => removeChapter(index)}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="add-chapter" onClick={addChapter}>
            + Ajouter un chapitre
          </button>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="submit-button">
            Ajouter le livre
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookForm;