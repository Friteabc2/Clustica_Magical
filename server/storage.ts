import { books, type Book, type InsertBook, type BookContent } from "@shared/schema";
import { DropboxService } from "./services/dropbox-service";

export interface IStorage {
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  getBookContent(id: number): Promise<BookContent | undefined>;
  updateBookContent(id: number, content: BookContent): Promise<Book | undefined>;
}

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  private currentId: number;

  constructor() {
    this.books = new Map();
    this.currentId = 1;
  }

  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const now = Math.floor(Date.now() / 1000);
    const id = this.currentId++;
    
    // Ensure coverPage is defined even if it's null
    const bookData = {
      ...insertBook,
      coverPage: insertBook.coverPage || null,
    };
    
    const book = {
      ...bookData,
      id,
      createdAt: now,
      updatedAt: now,
    } as Book;
    
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, bookUpdate: Partial<Book>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;

    const updatedBook: Book = {
      ...book,
      ...bookUpdate,
      updatedAt: Math.floor(Date.now() / 1000),
    };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }

  async getBookContent(id: number): Promise<BookContent | undefined> {
    const book = await this.getBook(id);
    if (!book) return undefined;
    
    return {
      title: book.title,
      author: book.author,
      coverPage: book.coverPage ? book.coverPage as any : undefined,
      chapters: book.chapters as any[], // Cast to any[] since we're storing JSON
    };
  }

  async updateBookContent(id: number, content: BookContent): Promise<Book | undefined> {
    const book = await this.getBook(id);
    if (!book) return undefined;
    
    return this.updateBook(id, {
      title: content.title,
      author: content.author,
      coverPage: content.coverPage as any,
      chapters: content.chapters as any,
    });
  }
}

/**
 * Stockage hybride qui utilise à la fois la mémoire locale et Dropbox
 * - Les métadonnées des livres sont stockées en mémoire
 * - Le contenu complet des livres est stocké dans Dropbox
 */
export class DropboxStorage implements IStorage {
  private memStorage: MemStorage;
  
  constructor() {
    this.memStorage = new MemStorage();
    // Initialisation du service Dropbox
    try {
      DropboxService.initialize();
    } catch (error) {
      console.error("Erreur d'initialisation du service Dropbox:", error);
    }
  }

  // Méthodes de gestion des métadonnées du livre - utilise le stockage mémoire
  async getBooks(): Promise<Book[]> {
    return this.memStorage.getBooks();
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.memStorage.getBook(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const book = await this.memStorage.createBook(insertBook);
    
    // Sauvegarde du contenu initial dans Dropbox
    try {
      const bookContent: BookContent = {
        title: book.title,
        author: book.author,
        coverPage: book.coverPage as any,
        chapters: book.chapters as any[] || [],
      };
      
      await DropboxService.saveBook(book.id, bookContent);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde initiale dans Dropbox:", error);
      // Continuons même en cas d'erreur pour ne pas bloquer l'utilisateur
    }
    
    return book;
  }

  async updateBook(id: number, bookUpdate: Partial<Book>): Promise<Book | undefined> {
    return this.memStorage.updateBook(id, bookUpdate);
  }

  async deleteBook(id: number): Promise<boolean> {
    const success = await this.memStorage.deleteBook(id);
    
    // Si la suppression en mémoire a réussi, supprime aussi de Dropbox
    if (success) {
      try {
        await DropboxService.deleteBook(id);
      } catch (error) {
        console.error("Erreur lors de la suppression du livre de Dropbox:", error);
        // Continuons même en cas d'erreur
      }
    }
    
    return success;
  }

  // Méthodes de gestion du contenu du livre - utilise Dropbox
  async getBookContent(id: number): Promise<BookContent | undefined> {
    try {
      // Tente d'abord de récupérer depuis Dropbox
      const dropboxContent = await DropboxService.getBook(id);
      
      if (dropboxContent) {
        return dropboxContent;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération depuis Dropbox:", error);
    }
    
    // Sinon utilise la mémoire comme fallback
    return this.memStorage.getBookContent(id);
  }

  async updateBookContent(id: number, content: BookContent): Promise<Book | undefined> {
    // Mise à jour des métadonnées en mémoire
    const updatedBook = await this.memStorage.updateBookContent(id, content);
    
    // Si la mise à jour a réussi, sauvegarde aussi dans Dropbox
    if (updatedBook) {
      try {
        await DropboxService.saveBook(id, content);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde dans Dropbox:", error);
        // Continuons même en cas d'erreur
      }
    }
    
    return updatedBook;
  }
}

// Utiliser le stockage Dropbox comme stockage principal
export const storage = new DropboxStorage();
