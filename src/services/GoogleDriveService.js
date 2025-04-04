// GoogleDriveService.js
import { useState, useEffect } from 'react';

// Configuration de l'API Google Drive
const API_KEY = 'AIzaSyAS3l5oHFl0CY_s3yn9hrgJNWAnuoR7TH8'; // À remplacer par votre clé d'API
const CLIENT_ID = '153233780785-7ieh2i2fts2cul92b4o7qid5seofgcnc.apps.googleusercontent.com'; // À remplacer par votre ID client
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
const APP_FOLDER_NAME = 'E-Reader App Data';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Fichiers de données
const DATA_FILES = {
  BOOKS: 'books.json',
  READING_HISTORY: 'reading_history.json',
  SETTINGS: 'settings.json'
};

// Hooks personnalisé pour la synchronisation avec Google Drive
export const useGoogleDriveSync = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  const [error, setError] = useState(null);
  const [appFolderId, setAppFolderId] = useState(null);
  const [dataFileIds, setDataFileIds] = useState({});

  // Charger le script de l'API Google
  useEffect(() => {
    const loadGoogleApi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = initGoogleApi;
      script.onerror = () => setError('Impossible de charger l\'API Google');
      document.body.appendChild(script);
    };

    const initGoogleApi = () => {
      window.gapi.load('client:auth2', initGoogleClient);
    };

    const initGoogleClient = async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        });

        // Écouter les changements d'état de connexion
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        
        // Définir l'état initial
        updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
        
        setIsInitialized(true);
      } catch (error) {
        setError('Erreur d\'initialisation de l\'API Google: ' + error.message);
      }
    };

    const updateSigninStatus = (isSignedIn) => {
      setIsSignedIn(isSignedIn);
      if (isSignedIn) {
        // Initialiser le dossier de l'application après la connexion
        initializeAppFolder();
      } else {
        setAppFolderId(null);
        setDataFileIds({});
      }
    };

    loadGoogleApi();

    return () => {
      // Nettoyage si nécessaire
    };
  }, []);

  // Initialiser le dossier de l'application dans Google Drive
  const initializeAppFolder = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      // Rechercher le dossier de l'application
      const response = await window.gapi.client.drive.files.list({
        q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)'
      });

      let folderId;
      if (response.result.files.length > 0) {
        // Utiliser le dossier existant
        folderId = response.result.files[0].id;
      } else {
        // Créer un nouveau dossier pour l'application
        const folderResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: APP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
        folderId = folderResponse.result.id;
      }

      setAppFolderId(folderId);

      // Trouver les IDs des fichiers de données existants
      await findDataFiles(folderId);

      setIsSyncing(false);
    } catch (error) {
      setError('Erreur lors de l\'initialisation du dossier: ' + error.message);
      setIsSyncing(false);
    }
  };

  // Trouver les fichiers de données dans le dossier de l'application
  const findDataFiles = async (folderId) => {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)'
      });

      const fileIds = {};
      response.result.files.forEach(file => {
        if (Object.values(DATA_FILES).includes(file.name)) {
          const key = Object.keys(DATA_FILES).find(key => DATA_FILES[key] === file.name);
          fileIds[key] = file.id;
        }
      });

      setDataFileIds(fileIds);
    } catch (error) {
      setError('Erreur lors de la recherche des fichiers: ' + error.message);
    }
  };

  // Synchroniser les données avec Google Drive
  const syncData = async (dataType, data) => {
    if (!isSignedIn || !appFolderId) {
      setError('Veuillez vous connecter à Google Drive d\'abord');
      return null;
    }

    try {
      setIsSyncing(true);
      setError(null);

      const fileName = DATA_FILES[dataType];
      if (!fileName) {
        throw new Error('Type de données non valide');
      }

      const fileContent = JSON.stringify(data);
      const fileBlob = new Blob([fileContent], { type: 'application/json' });

      if (dataFileIds[dataType]) {
        // Mettre à jour le fichier existant
        await window.gapi.client.request({
          path: `/upload/drive/v3/files/${dataFileIds[dataType]}`,
          method: 'PATCH',
          params: { uploadType: 'media' },
          body: fileBlob
        });
      } else {
        // Créer un nouveau fichier
        const metadata = {
          name: fileName,
          parents: [appFolderId],
          mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileBlob);

        const token = window.gapi.auth.getToken().access_token;
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });

        const responseData = await response.json();
        setDataFileIds(prev => ({ ...prev, [dataType]: responseData.id }));
      }

      setLastSyncDate(new Date());
      setIsSyncing(false);
      return true;
    } catch (error) {
      setError('Erreur de synchronisation: ' + error.message);
      setIsSyncing(false);
      return false;
    }
  };

  // Charger les données depuis Google Drive
  const loadData = async (dataType) => {
    if (!isSignedIn || !appFolderId) {
      setError('Veuillez vous connecter à Google Drive d\'abord');
      return null;
    }

    if (!dataFileIds[dataType]) {
      return null; // Le fichier n'existe pas encore
    }

    try {
      setIsSyncing(true);
      setError(null);

      const response = await window.gapi.client.drive.files.get({
        fileId: dataFileIds[dataType],
        alt: 'media'
      });

      setIsSyncing(false);
      return JSON.parse(response.body);
    } catch (error) {
      setError('Erreur lors du chargement des données: ' + error.message);
      setIsSyncing(false);
      return null;
    }
  };

  // Fonctions d'authentification
  const signIn = () => {
    if (isInitialized) {
      window.gapi.auth2.getAuthInstance().signIn();
    }
  };

  const signOut = () => {
    if (isInitialized) {
      window.gapi.auth2.getAuthInstance().signOut();
    }
  };

  // Vérifier si des données locales sont plus récentes
  const isLocalDataNewer = (localTimestamp, cloudTimestamp) => {
    if (!cloudTimestamp) return true;
    return new Date(localTimestamp) > new Date(cloudTimestamp);
  };

  return {
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
  };
};

export default useGoogleDriveSync;