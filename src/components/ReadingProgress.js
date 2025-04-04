// ReadingProgress.js
import React from 'react';
import './ReadingProgress.css';

const ReadingProgress = ({ currentPage, totalPages, onPageChange }) => {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  
  const handleBarClick = (e) => {
    if (!onPageChange) return;
    
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newPage = Math.max(1, Math.min(totalPages, Math.round(percentage * totalPages)));
    
    onPageChange(newPage);
  };
  
  const formatReadingTime = (pages, avgPagesPerHour = 30) => {
    if (pages <= 0) return '0 min';
    
    const hours = pages / avgPagesPerHour;
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 2) {
      const mins = Math.round((hours - Math.floor(hours)) * 60);
      return `${Math.floor(hours)} h ${mins} min`;
    } else {
      return `${Math.round(hours)} h`;
    }
  };
  
  // Estimer le temps de lecture restant
  const remainingPages = totalPages - currentPage;
  const remainingTime = formatReadingTime(remainingPages);
  
  // Créer des marqueurs pour les chapitres (simulé ici, en pratique vous utiliseriez les vrais chapitres)
  const chapterMarkers = Array.from({ length: 5 }, (_, i) => (
    <div 
      key={i}
      className="chapter-marker"
      style={{ left: `${((i + 1) * totalPages / 6) / totalPages * 100}%` }}
      title={`Chapitre ${i + 1}`}
    />
  ));
  
  return (
    <div className="reading-progress-container">
      <div className="progress-info">
        <span className="current-page">Page {currentPage}/{totalPages}</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      
      <div className="progress-bar-container" onClick={handleBarClick}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        {chapterMarkers}
      </div>
      
      <div className="reading-time">
        <span>Temps de lecture restant: {remainingTime}</span>
      </div>
    </div>
  );
};

export default ReadingProgress;