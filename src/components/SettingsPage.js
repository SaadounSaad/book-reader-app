// SettingsPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SyncManager from './SyncManager';
import './SettingsPage.css';

const SettingsPage = ({ 
  books, 
  readingHistory, 
  updateBooks, 
  updateReadingHistory,
  themeSettings,
  updateThemeSettings,
  appSettings,
  updateAppSettings
}) => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Paramètres de l'application
  const [pageTurnAnimation, setPageTurnAnimation] = useState(
    appSettings.pageTurnAnimation || 'slide'
  );
  const [fontFamily, setFontFamily] = useState(
    appSettings.fontFamily || 'system-ui'
  );
  const [lineSpacing, setLineSpacing] = useState(
    appSettings.lineSpacing || 1.5
  );
  const [pagePadding, setPagePadding] = useState(
    appSettings.pagePadding || 20
  );
  
  // Paramètres du thème automatique
  const [autoNightMode, setAutoNightMode] = useState(
    themeSettings.autoNightMode || false
  );
  const [nightModeStartTime, setNightModeStartTime] = useState(
    themeSettings.nightModeStartTime || '20:00'
  );
  const [nightModeEndTime, setNightModeEndTime] = useState(
    themeSettings.nightModeEndTime || '07:00'
  );
  
  // Sauvegarder les paramètres généraux
  const saveGeneralSettings = () => {
    const newSettings = {
      ...appSettings,
      pageTurnAnimation,
      fontFamily,
      lineSpacing,
      pagePadding
    };
    updateAppSettings(newSettings);
    showSaveNotification();
  };
  
  // Sauvegarder les paramètres de thème
  const saveThemeSettings = () => {
    const newSettings = {
      ...themeSettings,
      autoNightMode,
      nightModeStartTime,
      nightModeEndTime
    };
    updateThemeSettings(newSettings);
    showSaveNotification();
  };
  
  // Afficher une notification de sauvegarde
  const [saveNotification, setSaveNotification] = useState(false);
  const showSaveNotification = () => {
    setSaveNotification(true);
    setTimeout(() => {
      setSaveNotification(false);
    }, 3000);
  };
  
  // Exporter toutes les données
  const exportData = () => {
    const data = {
      books,
      readingHistory,
      appSettings,
      themeSettings,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `e-reader-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Importer des données
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Vérifier la structure des données
        if (data.books && data.readingHistory) {
          updateBooks(data.books);
          updateReadingHistory(data.readingHistory);
          
          if (data.appSettings) {
            updateAppSettings(data.appSettings);
          }
          
          if (data.themeSettings) {
            updateThemeSettings(data.themeSettings);
          }
          
          showImportSuccessNotification();
        } else {
          showImportErrorNotification("Format de fichier invalide");
        }
      } catch (error) {
        showImportErrorNotification(error.message);
      }
    };
    reader.readAsText(file);
  };
  
  // Notifications d'importation
  const [importNotification, setImportNotification] = useState({ show: false, type: '', message: '' });
  
  const showImportSuccessNotification = () => {
    setImportNotification({ show: true, type: 'success', message: 'Importation réussie!' });
    setTimeout(() => {
      setImportNotification({ show: false, type: '', message: '' });
    }, 3000);
  };
  
  const showImportErrorNotification = (message) => {
    setImportNotification({ show: true, type: 'error', message: `Erreur d'importation: ${message}` });
    setTimeout(() => {
      setImportNotification({ show: false, type: '', message: '' });
    }, 5000);
  };
  
  return (
    <div className="settings-page-container">
      <div className="settings-header">
        <Link to="/" className="back-button">
          &larr; Retour à la bibliothèque
        </Link>
        <h2>Paramètres</h2>
      </div>
      
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Général
        </button>
        <button 
          className={`tab-button ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          Affichage
        </button>
        <button 
          className={`tab-button ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          Synchronisation
        </button>
        <button 
          className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Données
        </button>
      </div>
      
      <div className="settings-content">
        {/* Onglet Général */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3>Paramètres généraux</h3>
            
            <div className="setting-group">
              <label htmlFor="pageTurnAnimation">Animation de changement de page</label>
              <select 
                id="pageTurnAnimation" 
                value={pageTurnAnimation}
                onChange={(e) => setPageTurnAnimation(e.target.value)}
              >
                <option value="slide">Glissement</option>
                <option value="fade">Fondu</option>
                <option value="flip">Retournement</option>
                <option value="none">Aucune</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label htmlFor="fontFamily">Police de caractères</label>
              <select 
                id="fontFamily" 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <option value="system-ui">Police système</option>
                <option value="'Merriweather', serif">Merriweather</option>
                <option value="'Lora', serif">Lora</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label htmlFor="lineSpacing">Interligne</label>
              <div className="range-control">
                <input 
                  type="range" 
                  id="lineSpacing" 
                  min="1" 
                  max="2.5" 
                  step="0.1" 
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                />
                <span className="range-value">{lineSpacing}</span>
              </div>
            </div>
            
            <div className="setting-group">
              <label htmlFor="pagePadding">Marge de page</label>
              <div className="range-control">
                <input 
                  type="range" 
                  id="pagePadding" 
                  min="10" 
                  max="40" 
                  step="5" 
                  value={pagePadding}
                  onChange={(e) => setPagePadding(parseInt(e.target.value))}
                />
                <span className="range-value">{pagePadding}px</span>
              </div>
            </div>
            
            <button className="save-button" onClick={saveGeneralSettings}>
              Enregistrer
            </button>
          </div>
        )}
        
        {/* Onglet Thème */}
        {activeTab === 'theme' && (
          <div className="settings-section">
            <h3>Paramètres d'affichage</h3>
            
            <div className="setting-group">
              <div className="toggle-container">
                <span>Mode nuit automatique</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={autoNightMode}
                    onChange={() => setAutoNightMode(!autoNightMode)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className={`setting-group ${!autoNightMode ? 'disabled' : ''}`}>
              <label htmlFor="nightStart">Heure de début</label>
              <input 
                type="time" 
                id="nightStart" 
                value={nightModeStartTime}
                onChange={(e) => setNightModeStartTime(e.target.value)}
                disabled={!autoNightMode}
              />
            </div>
            
            <div className={`setting-group ${!autoNightMode ? 'disabled' : ''}`}>
              <label htmlFor="nightEnd">Heure de fin</label>
              <input 
                type="time" 
                id="nightEnd" 
                value={nightModeEndTime}
                onChange={(e) => setNightModeEndTime(e.target.value)}
                disabled={!autoNightMode}
              />
            </div>
            
            <button className="save-button" onClick={saveThemeSettings}>
              Enregistrer
            </button>
          </div>
        )}
        
        {/* Onglet Synchronisation */}
        {activeTab === 'sync' && (
          <div className="settings-section">
            <h3>Synchronisation</h3>
            
            <SyncManager 
              books={books}
              readingHistory={readingHistory}
              updateBooks={updateBooks}
              updateReadingHistory={updateReadingHistory}
            />
            
            <div className="sync-info">
              <h4>À propos de la synchronisation</h4>
              <p>
                La synchronisation avec Google Drive vous permet de sauvegarder vos livres, annotations, signets et progrès de lecture sur le cloud.
              </p>
              <p>
                Vos données sont stockées de manière privée et sécurisée dans votre propre compte Google Drive.
              </p>
            </div>
          </div>
        )}
        
        {/* Onglet Données */}
        {activeTab === 'data' && (
          <div className="settings-section">
            <h3>Gestion des données</h3>
            
            <div className="data-action-group">
              <div className="data-action-info">
                <h4>Exporter les données</h4>
                <p>
                  Téléchargez une sauvegarde de vos livres, annotations, signets et historique de lecture.
                </p>
              </div>
              <button className="export-button" onClick={exportData}>
                Exporter
              </button>
            </div>
            
            <div className="data-action-group">
              <div className="data-action-info">
                <h4>Importer des données</h4>
                <p>
                  Restaurez vos données depuis un fichier de sauvegarde.
                </p>
                <p className="warning-text">
                  Attention: Cette action écrasera vos données actuelles.
                </p>
              </div>
              <label className="import-button">
                Importer
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importData}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <div className="data-action-group">
              <div className="data-action-info">
                <h4>Statistiques de stockage</h4>
                <p>
                  Espace utilisé: {(JSON.stringify(books).length / 1024).toFixed(2)} Ko
                </p>
                <p>
                  Nombre de livres: {books.length}
                </p>
                <p>
                  Sessions de lecture: {readingHistory.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification de sauvegarde */}
      {saveNotification && (
        <div className="save-notification">
          Paramètres enregistrés!
        </div>
      )}
      
      {/* Notification d'importation */}
      {importNotification.show && (
        <div className={`import-notification ${importNotification.type}`}>
          {importNotification.message}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;