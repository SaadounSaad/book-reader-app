// AnnotationPanel.js
import React, { useState } from 'react';
import './AnnotationPanel.css';

const AnnotationPanel = ({ selectedText, onSave, onCancel }) => {
  const [noteText, setNoteText] = useState('');
  
  const handleSave = () => {
    onSave(noteText);
  };
  
  return (
    <div className="annotation-panel">
      <div className="annotation-header">
        <h3>Ajouter une annotation</h3>
        <button className="close-button" onClick={onCancel}>×</button>
      </div>
      <div className="annotation-content">
        <div className="selected-text">
          <h4>Texte sélectionné:</h4>
          <p className="highlighted-text">{selectedText}</p>
        </div>
        <div className="note-input">
          <h4>Votre note:</h4>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Ajoutez votre commentaire ici..."
          />
        </div>
        <div className="annotation-actions">
          <button className="cancel-button" onClick={onCancel}>Annuler</button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={noteText.trim() === ''}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationPanel;