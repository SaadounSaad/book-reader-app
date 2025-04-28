// db.js - Configuration de Dexie pour l'application de lecture
import Dexie from 'dexie';

export class BookReaderDB extends Dexie {
  constructor() {
    super('BookReaderDB');
    
    // Définition du schéma de la base de données
    this.version(1).stores({
      books: '++id, title, author, &filePath, addedAt',
      readingProgress: 'bookId, currentPage, totalPages, lastReadAt',
      bookmarks: '++id, bookId, page, note, createdAt',
      settings: 'id, theme, fontSize, lineSpacing, fontFamily'
    });
    
    // Définition des classes pour les méthodes
    this.books = this.table('books');
    this.readingProgress = this.table('readingProgress');
    this.bookmarks = this.table('bookmarks');
    this.settings = this.table('settings');
  }
  
  // Méthode pour ajouter un nouveau livre
  async addBook(book) {
    // Vérification si le livre existe déjà via son chemin de fichier
    const existingBook = await this.books.where('filePath').equals(book.filePath).first();
    
    if (existingBook) {
      return existingBook.id; // Retourner l'ID du livre existant
    }
    
    // Ajouter le livre avec la date actuelle
    const bookWithDate = {
      ...book,
      addedAt: new Date()
    };
    
    return await this.books.add(bookWithDate);
  }
  
  // Méthode pour mettre à jour la progression de lecture
  async updateReadingProgress(bookId, currentPage, totalPages) {
    const now = new Date();
    
    const existingProgress = await this.readingProgress.get(bookId);
    
    if (existingProgress) {
      return await this.readingProgress.update(bookId, {
        currentPage,
        totalPages,
        lastReadAt: now
      });
    } else {
      return await this.readingProgress.add({
        bookId,
        currentPage,
        totalPages,
        lastReadAt: now
      });
    }
  }
  
  // Méthode pour ajouter un signet
  async addBookmark(bookId, page, note = '') {
    return await this.bookmarks.add({
      bookId,
      page,
      note,
      createdAt: new Date()
    });
  }
  
  // Méthode pour récupérer les signets d'un livre
  async getBookmarksForBook(bookId) {
    return await this.bookmarks.where('bookId').equals(bookId).toArray();
  }
  
  // Méthode pour sauvegarder les paramètres utilisateur
  async saveSettings(settings) {
    const defaultId = 1; // Un seul enregistrement de paramètres
    const existingSettings = await this.settings.get(defaultId);
    
    if (existingSettings) {
      return await this.settings.update(defaultId, settings);
    } else {
      return await this.settings.add({
        id: defaultId,
        ...settings
      });
    }
  }
  
  // Méthode pour récupérer les paramètres utilisateur
  async getSettings() {
    const defaultId = 1;
    const settings = await this.settings.get(defaultId);
    
    // Paramètres par défaut si aucun n'existe
    return settings || {
      id: defaultId,
      theme: 'light',
      fontSize: 16,
      lineSpacing: 1.5,
      fontFamily: 'Georgia'
    };
  }
  
  // Méthode pour obtenir la liste des livres récemment lus
  async getRecentlyReadBooks(limit = 5) {
    const progresses = await this.readingProgress
      .orderBy('lastReadAt')
      .reverse()
      .limit(limit)
      .toArray();
    
    const bookIds = progresses.map(p => p.bookId);
    
    return await Promise.all(
      bookIds.map(async (id) => {
        const book = await this.books.get(id);
        const progress = await this.readingProgress.get(id);
        return {
          ...book,
          progress: Math.floor((progress.currentPage / progress.totalPages) * 100)
        };
      })
    );
  }
}

// Instance unique de la base de données
const db = new BookReaderDB();

export default db;