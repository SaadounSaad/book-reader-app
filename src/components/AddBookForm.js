// src/components/AddBookForm.js
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './AddBookForm.css';

const AddBookForm = ({ onAddBook, onCancel }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [chapters, setChapters] = useState([
    { title: '', pageNumber: 1, content: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gestion du changement de chapitre
  const handleChapterChange = (index, field, value) => {
    const updatedChapters = [...chapters];
    updatedChapters[index][field] = value;
    setChapters(updatedChapters);
  };
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Préparer les données du livre
      let coverImage = '/covers/default.jpg';
      
      // Si une couverture a été sélectionnée, la convertir en base64
      if (coverFile) {
        coverImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(coverFile);
        });
      }
      
      // Créer l'objet livre
      const newBook = {
        title,
        author,
        cover: coverImage,
        totalPages: parseInt(totalPages),
        chapters: chapters.map((chapter, index) => ({
          title: chapter.title || `Chapitre ${index + 1}`,
          pageNumber: parseInt(chapter.pageNumber) || (index + 1),
          content: chapter.content || ''
        })),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      // Ajouter le livre via la fonction passée en prop
      await onAddBook(newBook);
      
    } catch (error) {
      console.error("Erreur lors de l'ajout du livre:", error);
      alert("Une erreur est survenue lors de l'ajout du livre.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Gestion des chapitres
  const addChapter = () => {
    setChapters([...chapters, { 
      title: '', 
      pageNumber: chapters.length > 0 ? chapters[chapters.length - 1].pageNumber + 10 : 1, 
      content: '' 
    }]);
  };
  
  const removeChapter = (index) => {
    if (chapters.length > 1) {
      const updatedChapters = [...chapters];
      updatedChapters.splice(index, 1);
      setChapters(updatedChapters);
    }
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
            <div key={index} className="chapter-container">
              <div className="chapter-input">
                <input
                  type="text"
                  placeholder="Titre du chapitre"
                  value={chapter.title}
                  onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Page"
                  value={chapter.pageNumber}
                  onChange={(e) => handleChapterChange(index, 'pageNumber', parseInt(e.target.value) || 1)}
                  min="1"
                />
                <button 
                  type="button" 
                  className="remove-chapter"
                  onClick={() => removeChapter(index)}
                >
                  &times;
                </button>
              </div>
              <textarea
                className="chapter-content"
                placeholder="Contenu du chapitre"
                value={chapter.content}
                onChange={(e) => handleChapterChange(index, 'content', e.target.value)}
                rows={5}
              />
            </div>
          ))}
          <button 
            type="button" 
            className="add-chapter"
            onClick={addChapter}
          >
            + Ajouter un chapitre
          </button>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Annuler
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter le livre'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookForm;