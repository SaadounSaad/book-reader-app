// SettingsPanel.js
import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

const SettingsPanel = ({ theme, fontSize, onThemeChange, onFontSizeChange, onClose }) => {
  const [autoNightMode, setAutoNightMode] = useState(
    localStorage.getItem('autoNightMode') === 'true'
  );
  const [nightModeStartTime, setNightModeStartTime] = useState(
    localStorage.getItem('nightModeStartTime') || '20:00'
  );
  const [nightModeEndTime, setNightModeEndTime] = useState(
    localStorage.getItem('nightModeEndTime') || '07:00'
  );
  
  // Gérer le mode nuit automatique
  useEffect(() => {
    if (autoNightMode) {
      const checkNightMode = () => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Convertir les heures en minutes pour faciliter la comparaison
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = parseInt(nightModeStartTime.split(':')[0]) * 60 + parseInt(nightModeStartTime.split(':')[1]);
        const endMinutes = parseInt(nightModeEndTime.split(':')[0]) * 60 + parseInt(nightModeEndTime.split(':')[1]);
        
        // Vérifier si nous sommes dans la période nocturne
        let isNightTime;
        if (startMinutes < endMinutes) {
          // Période normale (ex: 20:00 à 07:00)
          isNightTime = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        } else {
          // Période qui chevauche minuit (ex: 22:00 à 06:00)
          isNightTime = currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
        
        // Appliquer le thème approprié
        if (isNightTime && theme !== 'dark') {
          onThemeChange('dark');
        } else if (!isNightTime && theme === 'dark' && localStorage.getItem('previousTheme')) {
          // Revenir au thème précédent (s'il y en a un)
          onThemeChange(localStorage.getItem('previousTheme'));
        }
      };
      
      // Vérifier immédiatement
      checkNightMode();
      
      // Puis vérifier toutes les minutes
      const interval = setInterval(checkNightMode, 60000);
      
      return () => clearInterval(interval);
    }
  }, [autoNightMode, nightModeStartTime, nightModeEndTime, theme, onThemeChange]);
  
  // Sauvegarder les préférences de mode nuit dans le stockage local
  useEffect(() => {
    localStorage.setItem('autoNightMode', autoNightMode);
    localStorage.setItem('nightModeStartTime', nightModeStartTime);
    localStorage.setItem('nightModeEndTime', nightModeEndTime);
    
    // Si le mode nuit automatique est activé, sauvegarder le thème actuel
    if (autoNightMode && theme !== 'dark') {
      localStorage.setItem('previousTheme', theme);
    }
  }, [autoNightMode, nightModeStartTime, nightModeEndTime, theme]);
  
  const handleThemeChange = (newTheme) => {
    onThemeChange(newTheme);
    
    // Si le mode nuit automatique est activé, le désactiver lorsque l'utilisateur
    // change manuellement le thème
    if (autoNightMode) {
      setAutoNightMode(false);
    }
  };
  
  const handleAutoNightModeToggle = () => {
    const newState = !autoNightMode;
    setAutoNightMode(newState);
    
    if (newState) {
      // Sauvegarder le thème actuel avant d'activer le mode nuit automatique
      localStorage.setItem('previousTheme', theme);
      
      // Vérifier immédiatement si le mode nuit doit être activé
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = parseInt(nightModeStartTime.split(':')[0]) * 60 + parseInt(nightModeStartTime.split(':')[1]);
      const endMinutes = parseInt(nightModeEndTime.split(':')[0]) * 60 + parseInt(nightModeEndTime.split(':')[1]);
      
      let isNightTime;
      if (startMinutes < endMinutes) {
        isNightTime = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        isNightTime = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
      
      if (isNightTime && theme !== 'dark') {
        onThemeChange('dark');
      }
    }
  };
  
  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Paramètres</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="settings-section">
        <h4>Thème</h4>
        <div className="theme-buttons">
          <button 
            className={`theme-button light ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            Clair
          </button>
          <button 
            className={`theme-button dark ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            Sombre
          </button>
          <button 
            className={`theme-button sepia ${theme === 'sepia' ? 'active' : ''}`}
            onClick={() => handleThemeChange('sepia')}
          >
            Sépia
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Taille du texte</h4>
        <div className="font-size-control">
          <button 
            className="font-size-button decrease"
            onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
            disabled={fontSize <= 12}
          >
            A-
          </button>
          <div className="font-size-value">{fontSize}px</div>
          <button 
            className="font-size-button increase"
            onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
            disabled={fontSize >= 24}
          >
            A+
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Mode nuit automatique</h4>
        <div className="auto-night-mode">
          <div className="toggle-container">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoNightMode}
                onChange={handleAutoNightModeToggle}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {autoNightMode ? 'Activé' : 'Désactivé'}
            </span>
          </div>
          
          <div className={`time-settings ${!autoNightMode ? 'disabled' : ''}`}>
            <div className="time-setting">
              <label>Début:</label>
              <input 
                type="time" 
                value={nightModeStartTime}
                onChange={(e) => setNightModeStartTime(e.target.value)}
                disabled={!autoNightMode}
              />
            </div>
            <div className="time-setting">
              <label>Fin:</label>
              <input 
                type="time" 
                value={nightModeEndTime}
                onChange={(e) => setNightModeEndTime(e.target.value)}
                disabled={!autoNightMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;