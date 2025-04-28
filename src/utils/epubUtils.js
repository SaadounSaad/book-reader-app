// src/utils/epubUtils.js
import ePub from 'epubjs';

export const analyzeEpubFile = async (blob, filename) => {
  try {
    console.log("Début de l'analyse du fichier EPUB:", filename);
    
    // Approche alternative: utiliser directement le blob sans créer d'URL
    // Cela évite certains problèmes de chargement
    const book = ePub(blob);
    console.log("Instance ePub créée avec blob direct");
    
    // Extraction des informations de base sans attendre book.ready
    console.log("Tentative d'extraction des métadonnées sans attendre book.ready");
    
    // Ne pas essayer de créer un rendition puisque nous n'avons pas d'élément DOM
    // pour le contenir - nous allons extraire les données directement
    
    let title = filename.replace('.epub', '') || "Titre inconnu";
    let author = "Auteur inconnu";
    
    try {
      // Tentative d'obtenir les métadonnées
      if (book.packaging && book.packaging.metadata) {
        const metadata = book.packaging.metadata;
        if (metadata.title) title = metadata.title;
        if (metadata.creator) author = metadata.creator;
        console.log("Métadonnées extraites avec succès:", { title, author });
      }
    } catch (err) {
      console.warn("Impossible d'accéder aux métadonnées:", err);
    }
    
    // Extraction des chapitres (TOC)
    console.log("Tentative d'extraction de la table des matières");
    let chapters = [];
    
    try {
      const navigation = book.navigation;
      if (navigation && navigation.toc && navigation.toc.length > 0) {
        chapters = navigation.toc.map((item, index) => {
          return {
            id: index,
            title: item.label || `Chapitre ${index + 1}`,
            href: item.href || "",
            startPage: index + 1,
            content: `[Contenu du chapitre ${index + 1}]`
          };
        });
        console.log(`${chapters.length} chapitres extraits depuis la table des matières`);
      } else if (book.spine && book.spine.items) {
        chapters = book.spine.items.map((item, index) => {
          return {
            id: index,
            title: item.label || item.title || `Chapitre ${index + 1}`,
            href: item.href || "",
            startPage: index + 1,
            content: `[Contenu du chapitre ${index + 1}]`
          };
        });
        console.log(`${chapters.length} chapitres extraits depuis le spine`);
      }
    } catch (err) {
      console.warn("Erreur lors de l'extraction des chapitres:", err);
    }
    
    // Si aucun chapitre trouvé, créer un chapitre par défaut
    if (chapters.length === 0) {
      chapters = [{
        id: 0,
        title: "Livre complet",
        href: "",
        startPage: 1,
        content: "[Contenu non disponible]"
      }];
      console.log("Aucun chapitre trouvé, création d'un chapitre par défaut");
    }
    
    // Tentative d'extraction de la couverture
    let coverUrl = null;
    try {
      const coverPath = book.cover;
      if (coverPath) {
        console.log("Chemin de couverture trouvé:", coverPath);
        coverUrl = `data:image/jpeg;base64,${coverPath}`;
      }
    } catch (err) {
      console.warn("Erreur lors de l'extraction de la couverture:", err);
    }
    
    // Construction de l'objet livre
    const analyzedBook = {
      id: `epub-${Date.now()}`,
      title,
      author,
      totalPages: chapters.length,
      currentPage: 0,
      cover: coverUrl,
      chapters,
      bookmarks: [],
      annotations: [],
      source: 'drive',
      fileBlob: blob,
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    console.log("Analyse EPUB terminée avec succès (méthode alternative)");
    return analyzedBook;
  } catch (error) {
    console.error("Erreur critique d'analyse EPUB:", error);
    
    // Création d'un livre minimal en cas d'erreur
    const fallbackBook = {
      id: `epub-error-${Date.now()}`,
      title: filename || "Livre non analysé",
      author: "Auteur inconnu",
      totalPages: 1,
      currentPage: 0,
      chapters: [{
        id: 0,
        title: "Contenu non disponible",
        startPage: 1,
        content: "Impossible d'analyser le contenu de ce livre. Erreur: " + error.message
      }],
      bookmarks: [],
      annotations: [],
      source: 'drive',
      fileBlob: blob,
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      importError: error.message
    };
    
    console.log("Retour d'un livre minimal suite à une erreur");
    return fallbackBook;
  }
};

// Méthode alternative si celle ci-dessus ne fonctionne pas
export const analyzeEpubFileSimple = async (blob, filename) => {
  try {
    console.log("Début de l'analyse simplifiée du fichier EPUB:", filename);
    
    // Approche minimaliste sans ePub.js
    // Créer un livre minimal à partir du nom de fichier
    const title = filename.replace('.epub', '') || "Titre inconnu";
    
    const analyzedBook = {
      id: `epub-${Date.now()}`,
      title,
      author: "Auteur à déterminer",
      totalPages: 1,
      currentPage: 0,
      chapters: [{
        id: 0,
        title: "Livre complet",
        startPage: 1,
        content: "[Contenu à charger]"
      }],
      bookmarks: [],
      annotations: [],
      source: 'drive',
      fileBlob: blob,
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    console.log("Analyse EPUB simplifiée terminée");
    return analyzedBook;
  } catch (error) {
    console.error("Erreur critique d'analyse EPUB simplifiée:", error);
    
    // Création d'un livre minimal en cas d'erreur
    return {
      id: `epub-error-${Date.now()}`,
      title: filename || "Livre non analysé",
      author: "Auteur inconnu",
      totalPages: 1,
      currentPage: 0,
      chapters: [{
        id: 0,
        title: "Contenu non disponible",
        startPage: 1,
        content: "Impossible d'analyser le contenu de ce livre."
      }],
      bookmarks: [],
      annotations: [],
      source: 'drive',
      fileBlob: blob,
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
  }
};