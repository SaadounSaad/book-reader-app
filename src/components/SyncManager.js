// SyncManager.js
import React, { useState, useEffect } from 'react';
import useGoogleDriveSync from '../services/GoogleDriveService';
import './SyncManager.css';

const SyncManager = ({ 
  books, 
  readingHistory, 
  updateBooks, 
  updateReadingHistory 
}) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [autoSync, setAutoSync] = useState(
    localStorage.getItem('autoSync') === 'true'
  );
  const [showDetails, setShowDetails] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  
  const {
    isInitialized,
    isSignedIn,
    isSyncing,
    lastSyncDate,
    error,
    signIn,
    signOut,
    syncData,
    loadData,
    isLocalDataNewer
  } = useGoogleDriveSync();

  // Sauvegarder la préférence de synchronisation automatique
  useEffect(() => {
    localStorage.setItem('autoSync', autoSync);
  }, [autoSync]);

  // Effectuer une synchronisation automatique au chargement
  useEffect(() => {
    if (isInitialized && isSignedIn && autoSync) {
      synchronizeData();
    }
  }, [isInitialized, isSignedIn, autoSync]);

  // Synchronisation périodique si activée
  useEffect(() => {
    let syncInterval;
    if (isInitialized && isSignedIn && autoSync) {
      syncInterval = setInterval(() => {
        synchronizeData();
      }, 15 * 60 * 1000); // Synchroniser toutes les 15 minutes
    }
    
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isInitialized, isSignedIn, autoSync]);

  // Gérer la synchronisation complète
  const synchronizeData = async () => {
    if (!isInitialized || !isSignedIn) {
      return;
    }

    setSyncStatus('syncing');
    setConflicts([]);
    
    try {
      // Charger les données depuis le cloud
      const cloudBooks = await loadData('BOOKS');
      const cloudHistory = await loadData('READING_HISTORY');

      // Timestamp des dernières modifications locales
      const localBooksTimestamp = localStorage.getItem('booksLastModified');
      const localHistoryTimestamp = localStorage.getItem('historyLastModified');

      // Timestamp des dernières modifications dans le cloud
      const cloudBooksTimestamp = cloudBooks?.lastModified;
      const cloudHistoryTimestamp = cloudHistory?.lastModified;

      // Synchroniser les livres
      if (cloudBooks) {
        if (isLocalDataNewer(localBooksTimestamp, cloudBooksTimestamp)) {
          // Données locales plus récentes, envoyer vers le cloud
          const result = await syncData('BOOKS', {
            data: books,
            lastModified: new Date().toISOString()
          });
          if (!result) throw new Error('Échec de la synchronisation des livres');
        } else {
          // Données du cloud plus récentes, comparer et résoudre les conflits
          const bookConflicts = findDataConflicts(books, cloudBooks.data);
          if (bookConflicts.length > 0) {
            setConflicts(prev => [...prev, ...bookConflicts]);
          } else {
            // Pas de conflit, mettre à jour les données locales
            updateBooks(cloudBooks.data);
            localStorage.setItem('booksLastModified', cloudBooks.lastModified);
          }
        }
      } else {
        // Aucune donnée dans le cloud, envoyer les données locales
        const result = await syncData('BOOKS', {
          data: books,
          lastModified: new Date().toISOString()
        });
        if (!result) throw new Error('Échec de la synchronisation des livres');
      }

      // Synchroniser l'historique de lecture (même logique)
      if (cloudHistory) {
        if (isLocalDataNewer(localHistoryTimestamp, cloudHistoryTimestamp)) {
          const result = await syncData('READING_HISTORY', {
            data: readingHistory,
            lastModified: new Date().toISOString()
          });
          if (!result) throw new Error('Échec de la synchronisation de l\'historique');
        } else {
          // Fusionner l'historique sans créer de conflits (ajouter uniquement)
          const mergedHistory = mergeReadingHistory(readingHistory, cloudHistory.data);
          updateReadingHistory(mergedHistory);
          localStorage.setItem('historyLastModified', cloudHistory.lastModified);
        }
      } else {
        const result = await syncData('READING_HISTORY', {
          data: readingHistory,
          lastModified: new Date().toISOString()
        });
        if (!result) throw new Error('Échec de la synchronisation de l\'historique');
      }

      setSyncStatus('success');
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      setSyncStatus('error');
    }
  };

  // Trouver les conflits entre les données locales et distantes
  const findDataConflicts = (localData, cloudData) => {
    const conflicts = [];
    
    // Pour les livres, comparer les dates de modification
    localData.forEach(localBook => {
      const cloudBook = cloudData.find(book => book.id === localBook.id);
      if (cloudBook) {
        const localModified = new Date(localBook.lastModified || 0);
        const cloudModified = new Date(cloudBook.lastModified || 0);
        
        if (localModified > 0 && cloudModified > 0 && 
            localModified.getTime() !== cloudModified.getTime()) {
          conflicts.push({
            type: 'book',
            id: localBook.id,
            local: localBook,
            cloud: cloudBook
          });
        }
      }
    });
    
    return conflicts;
  };

  // Fusionner les historiques de lecture sans créer de conflits
  const mergeReadingHistory = (local, cloud) => {
    // Créer une map des sessions par ID pour une recherche plus rapide
    const sessionsMap = new Map();
    local.forEach(session => {
      sessionsMap.set(session.id, session);
    });
    
    // Ajouter les sessions du cloud qui n'existent pas localement
    cloud.forEach(cloudSession => {
      if (!sessionsMap.has(cloudSession.id)) {
        sessionsMap.set(cloudSession.id, cloudSession);
      }
    });
    
    // Convertir la map en tableau
    return Array.from(sessionsMap.values());
  };

  // Résoudre les conflits
  const resolveConflict = (conflict, choice) => {
    if (choice === 'local') {
      // Garder la version locale et mettre à jour le cloud
      syncData('BOOKS', {
        data: books, // Les données locales incluent déjà la version locale du conflit
        lastModified: new Date().toISOString()
      });
    } else if (choice === 'cloud') {
      // Adopter la version du cloud
      const updatedBooks = books.map(book => 
        book.id === conflict.id ? conflict.cloud : book
      );
      updateBooks(updatedBooks);
    } else if (choice === 'merge') {
      // Fusionner les deux versions (stratégie simple)
      const merged = {
        ...conflict.cloud,
        currentPage: Math.max(conflict.local.currentPage, conflict.cloud.currentPage),
        bookmarks: [...new Set([...conflict.local.bookmarks, ...conflict.cloud.bookmarks])],
        annotations: [...conflict.local.annotations, ...conflict.cloud.annotations]
      };
      
      const updatedBooks = books.map(book => 
        book.id === conflict.id ? merged : book
      );
      updateBooks(updatedBooks);
      
      // Mettre à jour le cloud avec la version fusionnée
      syncData('BOOKS', {
        data: updatedBooks,
        lastModified: new Date().toISOString()
      });
    }

    // Retirer le conflit de la liste
    setConflicts(conflicts.filter(c => c.id !== conflict.id));
  };

  const formatDate = (date) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="sync-manager">
      <div className="sync-header">
        <h3>Synchronisation Google Drive</h3>
        <button 
          className="toggle-details-button"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲' : '▼'}
        </button>
      </div>
      
      {showDetails && (
        <div className="sync-details">
          <div className="sync-status-info">
            <div className="status-item">
              <span className="status-label">État:</span>
              <span className={`status-value status-${isSignedIn ? 'connected' : 'disconnected'}`}>
                {isSignedIn ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Dernière synchro:</span>
              <span className="status-value">
                {formatDate(lastSyncDate)}
              </span>
            </div>
          </div>

          {error && (
            <div className="sync-error">
              {error}
            </div>
          )}
          
          <div className="sync-controls">
            <div className="auto-sync-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoSync}
                  onChange={() => setAutoSync(!autoSync)}
                  disabled={!isSignedIn}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">
                Synchronisation automatique
              </span>
            </div>
            
            {isSignedIn ? (
              <button 
                className="sync-button"
                onClick={synchronizeData}
                disabled={isSyncing || syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </button>
            ) : (
              <button 
                className="signin-button"
                onClick={signIn}
                disabled={!isInitialized}
              >
                Se connecter à Google Drive
              </button>
            )}
            
            {isSignedIn && (
              <button 
                className="signout-button"
                onClick={signOut}
              >
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Affichage des conflits à résoudre */}
      {conflicts.length > 0 && (
        <div className="conflicts-panel">
          <h4>Conflits à résoudre</h4>
          <div className="conflicts-list">
            {conflicts.map((conflict, index) => (
              <div key={index} className="conflict-item">
                <div className="conflict-info">
                  <strong>{conflict.local.title}</strong>
                  <div className="conflict-details">
                    <div>
                      <span>Local: Page {conflict.local.currentPage}</span>, 
                      <span>Modifié le {formatDate(conflict.local.lastModified)}</span>
                    </div>
                    <div>
                      <span>Cloud: Page {conflict.cloud.currentPage}</span>, 
                      <span>Modifié le {formatDate(conflict.cloud.lastModified)}</span>
                    </div>
                  </div>
                </div>
                <div className="conflict-actions">
                  <button onClick={() => resolveConflict(conflict, 'local')}>
                    Garder local
                  </button>
                  <button onClick={() => resolveConflict(conflict, 'cloud')}>
                    Garder cloud
                  </button>
                  <button onClick={() => resolveConflict(conflict, 'merge')}>
                    Fusionner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Notification de synchronisation */}
      {syncStatus === 'success' && (
        <div className="sync-notification success">
          Synchronisation réussie!
        </div>
      )}
      
      {syncStatus === 'error' && (
        <div className="sync-notification error">
          Échec de la synchronisation.
        </div>
      )}
    </div>
  );
};

export default SyncManager;