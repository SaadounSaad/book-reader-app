// fileParser.js
// Cette classe gère l'extraction de contenu à partir de différents formats de fichiers

export default class FileParser {
    static async parseFile(file, fileType) {
      // Vérifier le type de fichier
      if (fileType.includes('text/plain') || file.name.endsWith('.txt')) {
        return await this.parseTxtFile(file);
      } else if (fileType.includes('application/pdf') || file.name.endsWith('.pdf')) {
        return await this.parsePdfFile(file);
      } else if (file.name.endsWith('.epub')) {
        return await this.parseEpubFile(file);
      } else {
        throw new Error(`Format de fichier non supporté: ${fileType}`);
      }
    }
    
    // Extraire le contenu d'un fichier texte simple
    static async parseTxtFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const content = event.target.result;
          const pages = this.splitIntoPages(content);
          
          resolve({
            content: content,
            pages: pages,
            totalPages: pages.length
          });
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
        
        reader.readAsText(file);
      });
    }
    
    // Simuler la lecture d'un fichier PDF
    // Dans une vraie application, vous utiliseriez une bibliothèque comme PDF.js
    static async parsePdfFile(file) {
      return new Promise((resolve) => {
        // Simuler le temps de traitement d'un PDF
        setTimeout(() => {
          const estimatedPages = Math.floor(file.size / 3000);
          // Générer un contenu fictif pour la démo
          let content = "Contenu simulé du PDF:\n\n";
          
          for (let i = 0; i < estimatedPages; i++) {
            content += `Page ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, 
            ultricies sed, dolor.\n\n`;
          }
          
          const pages = this.splitIntoPages(content);
          
          resolve({
            content: content,
            pages: pages,
            totalPages: pages.length
          });
        }, 1000);
      });
    }
    
    // Simuler la lecture d'un fichier EPUB
    // Dans une vraie application, vous utiliseriez une bibliothèque comme epubjs
    static async parseEpubFile(file) {
      return new Promise((resolve) => {
        // Simuler le temps de traitement d'un EPUB
        setTimeout(() => {
          const estimatedPages = Math.floor(file.size / 2500);
          // Générer un contenu fictif pour la démo
          let content = "Contenu simulé de l'EPUB:\n\n";
          
          for (let i = 0; i < estimatedPages; i++) {
            content += `Page ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Maecenas porttitor congue massa. Fusce posuere, magna sed pulvinar ultricies, 
            purus lectus malesuada libero, sit amet commodo magna eros quis urna.\n\n`;
          }
          
          const pages = this.splitIntoPages(content);
          
          resolve({
            content: content,
            pages: pages,
            totalPages: pages.length
          });
        }, 1500);
      });
    }
    
    // Diviser le contenu en pages pour la navigation
    static splitIntoPages(content, wordsPerPage = 300) {
      const words = content.split(/\s+/);
      const pages = [];
      
      for (let i = 0; i < words.length; i += wordsPerPage) {
        // Stocker chaque page comme une chaîne de caractères simple
        pages.push(words.slice(i, i + wordsPerPage).join(' '));
      }
      
      // S'assurer qu'il y a au moins une page
      if (pages.length === 0) {
        pages.push(content);
      }
      
      return pages;
    }
    
    // Extraire les métadonnées du titre et de l'auteur à partir du nom du fichier
    static extractMetadataFromFilename(filename) {
      // Retirer l'extension
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      
      // Essayer de détecter un format auteur - titre
      const authorTitleMatch = nameWithoutExt.match(/^(.*?)\s*-\s*(.*?)$/);
      
      if (authorTitleMatch) {
        return {
          author: authorTitleMatch[1].trim(),
          title: authorTitleMatch[2].trim()
        };
      }
      
      // Si pas de format détecté, utiliser le nom de fichier comme titre
      return {
        author: "Auteur inconnu",
        title: nameWithoutExt
      };
    }
  }