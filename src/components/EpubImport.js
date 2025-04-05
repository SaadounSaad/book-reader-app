// EpubImport.js
import React, { useState } from 'react';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { xml2js } from 'xml-js';
import './EpubImport.css';

const EpubImport = ({ onImportComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier EPUB");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Lire le fichier EPUB (qui est un zip)
      const fileArrayBuffer = await readFileAsArrayBuffer(file);
      const zip = new JSZip();
      const contents = await zip.loadAsync(fileArrayBuffer);
      
      // Extraire les métadonnées depuis le fichier OPF
      let opfPath = '';
      let opfContent = '';
      let containerXml = '';
      
      try {
        // 1. Lire le fichier META-INF/container.xml pour trouver le chemin du fichier OPF
        containerXml = await contents.file('META-INF/container.xml').async('text');
        const containerData = xml2js(containerXml, { compact: true });
        opfPath = containerData.container.rootfiles.rootfile._attributes['full-path'];
      } catch (e) {
        console.error('Erreur lors de la lecture du fichier container.xml', e);
        // Chercher manuellement un fichier OPF
        for (const path in contents.files) {
          if (path.endsWith('.opf')) {
            opfPath = path;
            break;
          }
        }
      }
      
      if (!opfPath) {
        throw new Error("Impossible de trouver le fichier de métadonnées (.opf) dans l'EPUB");
      }
      
      // 2. Lire le fichier OPF
      opfContent = await contents.file(opfPath).async('text');
      const opfData = xml2js(opfContent, { compact: true });
      
      // Extraire les métadonnées de base
      const metadata = opfData.package.metadata;
      const title = getMetadataValue(metadata, 'title') || file.name.replace('.epub', '');
      const author = getMetadataValue(metadata, 'creator') || 'Auteur inconnu';
      
      // Trouver la couverture
      let coverPath = '';
      try {
        // Essayer de trouver l'ID de la couverture
        const coverId = findCoverId(metadata, opfData.package.manifest);
        if (coverId) {
          // Trouver le chemin du fichier de couverture
          const manifestItems = opfData.package.manifest.item;
          const coverItem = Array.isArray(manifestItems) 
            ? manifestItems.find(item => item._attributes.id === coverId)
            : manifestItems._attributes.id === coverId ? manifestItems : null;
            
          if (coverItem) {
            coverPath = coverItem._attributes.href;
            // Si le chemin est relatif au répertoire OPF
            if (opfPath.includes('/')) {
              const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
              coverPath = opfDir + coverPath;
            }
          }
        }
      } catch (e) {
        console.error('Erreur lors de la recherche de la couverture', e);
      }
      
      // Extraire la table des matières et le contenu
      const spine = opfData.package.spine;
      const spineItems = spine.itemref;
      const orderedItems = Array.isArray(spineItems) ? spineItems : [spineItems];
      
      // Extraire les items du manifest pour trouver les chemins des fichiers
      const manifest = opfData.package.manifest;
      const manifestItems = manifest.item;
      const manifestMap = {};
      
      if (Array.isArray(manifestItems)) {
        manifestItems.forEach(item => {
          manifestMap[item._attributes.id] = item._attributes.href;
        });
      } else {
        manifestMap[manifestItems._attributes.id] = manifestItems._attributes.href;
      }
      
      // Préparer les chapitres
      const chapters = [];
      let totalChapters = orderedItems.length;
      let processedChapters = 0;
      let pageNumber = 1;
      
      // Fonction pour extraire et formater le contenu HTML
      const processChapter = async (idref, index) => {
        try {
          // Trouver le chemin du fichier
          const itemPath = manifestMap[idref];
          if (!itemPath) throw new Error(`Chemin non trouvé pour l'ID: ${idref}`);
          
          // Chemin complet du fichier
          let fullPath = itemPath;
          if (opfPath.includes('/')) {
            const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
            fullPath = opfDir + itemPath;
          }
          
          // Lire le contenu du chapitre
          const chapterFile = contents.file(fullPath);
          if (!chapterFile) {
            console.warn(`Fichier non trouvé: ${fullPath}`);
            return null;
          }
          
          const chapterContent = await chapterFile.async('text');
          
          // Titre du chapitre (extrait du HTML ou généré)
          let chapterTitle = `Chapitre ${index + 1}`;
          try {
            const titleMatch = chapterContent.match(/<title>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              chapterTitle = titleMatch[1].trim();
            } else {
              const h1Match = chapterContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
              if (h1Match && h1Match[1]) {
                chapterTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
              }
            }
          } catch (e) {
            console.warn('Erreur lors de l\'extraction du titre du chapitre', e);
          }
          
          // Estimation de la longueur (1 page = ~3000 caractères)
          const chapterLength = Math.max(1, Math.ceil(chapterContent.length / 3000));
          
          return {
            title: chapterTitle,
            pageNumber: pageNumber,
            content: chapterContent,
            length: chapterLength
          };
        } catch (e) {
          console.error(`Erreur lors du traitement du chapitre ${idref}:`, e);
          return null;
        }
      };
      
      // Traiter les chapitres
      for (let i = 0; i < orderedItems.length; i++) {
        const idref = orderedItems[i]._attributes.idref;
        setProgress(Math.floor((i / orderedItems.length) * 100));
        
        const chapter = await processChapter(idref, i);
        if (chapter) {
          chapters.push(chapter);
          pageNumber += chapter.length;
        }
        
        processedChapters++;
      }
      
      // Extraire la couverture si trouvée
      let coverDataUrl = '/covers/default.jpg';
      if (coverPath) {
        try {
          const coverFile = contents.file(coverPath);
          if (coverFile) {
            const coverData = await coverFile.async('blob');
            coverDataUrl = await blobToDataUrl(coverData);
          }
        } catch (e) {
          console.error('Erreur lors de l\'extraction de la couverture', e);
        }
      }
      
      // Calculer le nombre total de pages
      const totalPages = chapters.reduce((total, chapter) => total + chapter.length, 0);
      
      // Créer l'objet livre
      const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        cover: coverDataUrl,
        totalPages: totalPages,
        currentPage: 1,
        lastModified: new Date().toISOString(),
        chapters: chapters.map(ch => ({
          title: ch.title,
          pageNumber: ch.pageNumber,
          content: ch.content
        })),
        bookmarks: [],
        annotations: [],
        source: 'epub',
        originalFileName: file.name
      };
      
      onImportComplete(newBook);
    } catch (err) {
      console.error("Erreur lors de l'importation du EPUB:", err);
      setError(`Une erreur s'est produite lors de l'importation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour extraire une valeur de métadonnée
  const getMetadataValue = (metadata, name) => {
    try {
      const element = metadata[`dc:${name}`];
      if (!element) return null;
      
      if (Array.isArray(element)) {
        return element[0]._text || element[0]._cdata || null;
      }
      
      return element._text || element._cdata || null;
    } catch (e) {
      console.warn(`Erreur lors de l'extraction de la métadonnée ${name}:`, e);
      return null;
    }
  };
  
  // Fonction pour trouver l'ID de la couverture
  const findCoverId = (metadata, manifest) => {
    try {
      // Méthode 1: chercher dans les métadonnées
      if (metadata.meta) {
        const metas = Array.isArray(metadata.meta) ? metadata.meta : [metadata.meta];
        const coverMeta = metas.find(meta => 
          meta._attributes && meta._attributes.name === 'cover'
        );
        
        if (coverMeta) {
          return coverMeta._attributes.content;
        }
      }
      
      // Méthode 2: chercher dans le manifest
      const items = manifest.item;
      if (Array.isArray(items)) {
        // Chercher un item avec properties="cover-image"
        const coverItem = items.find(item => 
          item._attributes.properties === 'cover-image'
        );
        
        if (coverItem) {
          return coverItem._attributes.id;
        }
        
        // Chercher un item avec id contenant "cover"
        const coverIdItem = items.find(item => 
          item._attributes.id.toLowerCase().includes('cover') &&
          (item._attributes['media-type'] || '').startsWith('image/')
        );
        
        if (coverIdItem) {
          return coverIdItem._attributes.id;
        }
      }
      
      return null;
    } catch (e) {
      console.warn('Erreur lors de la recherche de l\'ID de couverture:', e);
      return null;
    }
  };

  // Fonction pour lire le fichier comme ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Fonction pour convertir un Blob en DataURL
  const blobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Erreur de conversion de l'image"));
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="epub-import-container">
      <div className="epub-import-form">
        <h2>Importer un fichier EPUB</h2>
        
        <div className="import-field">
          <label htmlFor="epub-file">Sélectionner un fichier EPUB</label>
          <input 
            type="file" 
            id="epub-file" 
            accept=".epub"
            onChange={handleFileChange}
          />
        </div>
        
        {error && <div className="import-error">{error}</div>}
        
        {loading ? (
          <div className="import-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p>Importation en cours... {progress}%</p>
          </div>
        ) : (
          <div className="import-actions">
            <button className="cancel-btn" onClick={onCancel}>Annuler</button>
            <button 
              className="import-btn" 
              onClick={handleImport}
              disabled={!file}
            >
              Importer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpubImport;