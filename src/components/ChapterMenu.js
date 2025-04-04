// ChapterMenu.js
import React from 'react';
import './ChapterMenu.css';

const ChapterMenu = ({ chapters, currentChapter, onChapterSelect, onClose }) => {
  return (
    <div className="chapter-menu">
      <div className="chapter-menu-header">
        <h3>Chapitres</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="chapters-list">
        {chapters.map((chapter, index) => (
          <div 
            key={chapter.id || index}
            className={`chapter-item ${index === currentChapter ? 'active' : ''}`}
            onClick={() => onChapterSelect(index)}
          >
            <span className="chapter-number">{index + 1}</span>
            <span className="chapter-title">{chapter.title || `Chapitre ${index + 1}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterMenu;