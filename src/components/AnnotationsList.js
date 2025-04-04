// AnnotationsList.js
import React from 'react';
import './AnnotationsList.css';

const AnnotationsList = ({ annotations, onAnnotationSelect, onDeleteAnnotation, onClose }) => {
  // Trier les annotations par numéro de page
  const sortedAnnotations = [...annotations].sort((a, b) => a.page - b.page);
  
  return (
    <div className="annotations-panel">
      <div className="annotations-header">
        <h3>Annotations</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {sortedAnnotations.length > 0 ? (
        <div className="annotations-list">
          {sortedAnnotations.map((annotation, index) => (
            <div key={index} className="annotation-item">
              <div className="annotation-info">
                <span className="annotation-page">Page {annotation.page}</span>
                <button 
                  className="delete-annotation" 
                  onClick={() => onDeleteAnnotation(index)}
                  title="Supprimer l'annotation"
                >
                  ×
                </button>
              </div>
              <div className="annotation-highlight">"{annotation.highlight}"</div>
              {annotation.text && (
                <div className="annotation-note">{annotation.text}</div>
              )}
              <button 
                className="go-to-annotation"
                onClick={() => onAnnotationSelect(annotation.page)}
              >
                Aller à cette page
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-annotations">
          <p>Aucune annotation pour ce livre.</p>
          <p>Pour ajouter une annotation, sélectionnez du texte pendant la lecture.</p>
        </div>
      )}
    </div>
  );
};

export default AnnotationsList;