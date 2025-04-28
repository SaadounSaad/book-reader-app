// src/components/DrivePickerButton.jsx
import React, { useState, useEffect } from 'react';
import { analyzeEpubFile, analyzeEpubFileSimple } from '../utils/epubUtils';

const CLIENT_ID = "443966164827-jc7almkdkjvc11udru8lhiq5h0882gop.apps.googleusercontent.com";
const DEVELOPER_KEY = "AIzaSyAmPwru6TF9aJXoivSaBJD90ZVZti_aVZk";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const DrivePickerButton = ({ onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Chargement des APIs Google nécessaires
    const loadGoogleAPIs = async () => {
      try {
        // Charge l'API Google principale
        await loadScript("https://apis.google.com/js/api.js");
        
        // Charge l'API Picker
        await new Promise((resolve) => {
          window.gapi.load("picker", { callback: resolve });
        });
        
        // Charge l'API client OAuth2
        await loadScript("https://accounts.google.com/gsi/client");
        
        console.log("APIs Google chargées avec succès");
      } catch (error) {
        console.error("Erreur de chargement des APIs Google:", error);
        setErrorMsg("Impossible de charger les API Google");
      }
    };

    loadGoogleAPIs();
  }, []);

  // Fonction utilitaire pour charger un script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const handleDriveImport = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // Vérification que les APIs sont bien chargées
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        throw new Error("API Google OAuth non disponible");
      }
      
      if (!window.google.picker) {
        throw new Error("API Google Picker non disponible");
      }
      
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setErrorMsg(`Erreur d'authentification: ${tokenResponse.error}`);
            setIsLoading(false);
            return;
          }
          
          const accessToken = tokenResponse.access_token;
          
          try {
            const view = new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(false)
              .setMimeTypes("application/epub+zip");

            const picker = new window.google.picker.PickerBuilder()
              .addView(view)
              .setOAuthToken(accessToken)
              .setDeveloperKey(DEVELOPER_KEY)
              .setCallback(async (data) => {
                if (data.action === "picked") {
                  const file = data.docs[0];
                  console.log("Fichier sélectionné:", file);
                  
                  // Déclaration de la variable blob en dehors des blocs try-catch
                  let blob = null;
                  
                  try {
                    const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                    
                    const response = await fetch(url, {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    });
                    
                    if (!response.ok) {
                      throw new Error(`Erreur de téléchargement: ${response.status} ${response.statusText}`);
                    }
                    
                    blob = await response.blob();
                    console.log("Fichier téléchargé avec succès, taille:", blob.size);
                    
                    // Analyse du fichier EPUB avec système de fallback
                    let analyzedBook;
                    try {
                      // Première tentative: analyse complète
                      console.log("Tentative d'analyse complète...");
                      analyzedBook = await analyzeEpubFile(blob, file.name);
                    } catch (analysisError) {
                      console.error("Échec de l'analyse complète:", analysisError);
                      
                      // Seconde tentative: analyse simplifiée
                      console.log("Tentative d'analyse simplifiée...");
                      analyzedBook = await analyzeEpubFileSimple(blob, file.name);
                    }
                    
                    console.log("Analyse terminée:", analyzedBook.title);
                    
                    onImport(analyzedBook);
                  } catch (err) {
                    console.error("Erreur lors du traitement du fichier:", err);
                    
                    // Création d'un livre minimal même en cas d'erreur
                    const minimalBook = {
                      id: `epub-fallback-${Date.now()}`,
                      title: file.name.replace('.epub', '') || "Livre importé",
                      author: "Auteur inconnu",
                      totalPages: 1,
                      currentPage: 0,
                      chapters: [{
                        id: 0,
                        title: "Livre complet",
                        startPage: 1,
                        content: "Le contenu de ce livre sera disponible ultérieurement."
                      }],
                      bookmarks: [],
                      annotations: [],
                      source: 'drive',
                      fileBlob: blob, // Peut être null si le téléchargement a échoué
                      dateAdded: new Date().toISOString(),
                      lastModified: new Date().toISOString(),
                      importError: err.message
                    };
                    
                    console.log("Utilisation d'un livre minimal de secours");
                    onImport(minimalBook);
                    
                    setErrorMsg(`Avertissement: Livre importé avec des informations minimales.`);
                  } finally {
                    setIsLoading(false);
                  }
                } else if (data.action === "cancel") {
                  console.log("Sélection annulée par l'utilisateur");
                  setIsLoading(false);
                }
              })
              .build();

            picker.setVisible(true);
          } catch (err) {
            console.error("Erreur d'initialisation du Picker:", err);
            setErrorMsg(`Erreur d'initialisation: ${err.message}`);
            setIsLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      console.error("Erreur globale:", err);
      setErrorMsg(`Erreur: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleDriveImport} 
        className="btn btn-outline-secondary"
        disabled={isLoading}
      >
        {isLoading ? "Chargement..." : "📂 Importer depuis Google Drive"}
      </button>
      {errorMsg && <div className="text-danger mt-2">{errorMsg}</div>}
    </div>
  );
};

export default DrivePickerButton;