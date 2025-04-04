// SearchPanel.js
import React, { useState, useEffect } from 'react';
import './SearchPanel.css';

const SearchPanel = ({ bookContent, currentPage, onResultClick, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  
  // Effectuer la recherche lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    
    // Simuler un délai pour éviter de bloquer l'interface
    const searchTimeout = setTimeout(() => {
      const searchResults = performSearch(searchTerm, bookContent);
      setResults(searchResults);
      setIsLoading(false);
      
      // Si des résultats sont trouvés, mettre en évidence le premier
      if (searchResults.length > 0) {
        setCurrentResultIndex(0);
      }
    }, 300);
    
    return () => clearTimeout(searchTimeout);
  }, [searchTerm, bookContent]);
  
  // Fonction de recherche
  const performSearch = (term, content) => {
    const searchResults = [];
    const termLower = term.toLowerCase();
    
    // Simuler la recherche dans le contenu du livre
    // Note: Dans une implémentation réelle, nous parcouririons le contenu réel du livre
    Object.entries(content).forEach(([pageNum, pageContent]) => {
      const pageNumber = parseInt(pageNum);
      const pageLower = pageContent.toLowerCase();
      let index = 0;
      
      while ((index = pageLower.indexOf(termLower, index)) !== -1) {
        // Extraire un extrait du texte autour de la correspondance
        const start = Math.max(0, index - 30);
        const end = Math.min(pageContent.length, index + term.length + 30);
        const prefix = pageContent.substring(start, index);
        const match = pageContent.substring(index, index + term.length);
        const suffix = pageContent.substring(index + term.length, end);
        
        searchResults.push({
          pageNumber,
          textBefore: prefix,
          matchedText: match,
          textAfter: suffix,
          index
        });
        
        index += term.length;
      }
    });
    
    // Trier les résultats par proximité avec la page actuelle
    return searchResults.sort((a, b) => {
      const distA = Math.abs(a.pageNumber - currentPage);
      const distB = Math.abs(b.pageNumber - currentPage);
      return distA - distB;
    });
  };
  
  const handleResultClick = (result) => {
    onResultClick(result.pageNumber, result.index);
  };
  
  const goToPreviousResult = () => {
    if (results.length > 0 && currentResultIndex > 0) {
      setCurrentResultIndex(currentResultIndex - 1);
    }
  };
  
  const goToNextResult = () => {
    if (results.length > 0 && currentResultIndex < results.length - 1) {
      setCurrentResultIndex(currentResultIndex + 1);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (results.length > 0) {
        handleResultClick(results[currentResultIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  return (
    <div className="search-panel">
      <div className="search-header">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher dans le livre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
        <button className="close-search" onClick={onClose}>
          ×
        </button>
      </div>
      
      <div className="search-results-container">
        {isLoading ? (
          <div className="search-loading">Recherche en cours...</div>
        ) : (
          <>
            {results.length > 0 ? (
              <div className="search-results-info">
                <span>{results.length} résultats trouvés</span>
                <div className="search-navigation">
                  <button 
                    className="search-nav-button" 
                    onClick={goToPreviousResult}
                    disabled={currentResultIndex <= 0}
                  >
                    ↑
                  </button>
                  <span>{currentResultIndex + 1} / {results.length}</span>
                  <button 
                    className="search-nav-button" 
                    onClick={goToNextResult}
                    disabled={currentResultIndex >= results.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ) : (
              searchTerm.trim().length >= 2 && (
                <div className="no-results">Aucun résultat trouvé</div>
              )
            )}
            
            <ul className="search-results-list">
              {results.map((result, index) => (
                <li 
                  key={`${result.pageNumber}-${result.index}`}
                  className={`search-result ${index === currentResultIndex ? 'highlighted' : ''}`}
                  onClick={() => {
                    setCurrentResultIndex(index);
                    handleResultClick(result);
                  }}
                >
                  <div className="result-page">Page {result.pageNumber}</div>
                  <div className="result-excerpt">
                    <span className="text-before">{result.textBefore}</span>
                    <span className="text-match">{result.matchedText}</span>
                    <span className="text-after">{result.textAfter}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;