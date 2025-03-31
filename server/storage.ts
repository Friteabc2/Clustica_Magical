import { books, users, type Book, type InsertBook, type BookContent, type User, type InsertUser } from "@shared/schema";
import { DropboxService } from "./services/dropbox-service";

export interface IStorage {
  // Méthodes de gestion des livres
  getBooks(userId?: number): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  getBookContent(id: number): Promise<BookContent | undefined>;
  updateBookContent(id: number, content: BookContent): Promise<Book | undefined>;
  
  // Méthodes de gestion des utilisateurs
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  private users: Map<number, User>;
  private bookCurrentId: number;
  private userCurrentId: number;

  constructor() {
    this.books = new Map();
    this.users = new Map();
    this.bookCurrentId = 1;
    this.userCurrentId = 1;
  }

  async getBooks(userId?: number): Promise<Book[]> {
    const allBooks = Array.from(this.books.values());
    
    // Si un ID utilisateur est fourni, filtrer les livres de cet utilisateur
    if (userId) {
      return allBooks.filter(book => book.userId === userId);
    }
    
    return allBooks;
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const now = Math.floor(Date.now() / 1000);
    // Si l'ID est fourni (cas des livres importés de Dropbox), utiliser cet ID
    // Sinon générer un nouvel ID
    const id = (insertBook as any).id || this.bookCurrentId++;
    
    // Mettre à jour bookCurrentId si nécessaire pour éviter les conflits
    if (typeof id === 'number' && id >= this.bookCurrentId) {
      this.bookCurrentId = id + 1;
    }
    
    // Ensure coverPage is defined even if it's null
    const bookData = {
      ...insertBook,
      coverPage: insertBook.coverPage || null,
    };
    
    const book = {
      ...bookData,
      id,
      createdAt: (insertBook as any).createdAt || now,
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
  
  // Méthodes de gestion des utilisateurs
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    // Recherche l'utilisateur par son UID Firebase
    const allUsers = Array.from(this.users.values());
    for (let i = 0; i < allUsers.length; i++) {
      if (allUsers[i].firebaseUid === firebaseUid) {
        return allUsers[i];
      }
    }
    return undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Recherche l'utilisateur par son email
    const allUsers = Array.from(this.users.values());
    for (let i = 0; i < allUsers.length; i++) {
      if (allUsers[i].email === email) {
        return allUsers[i];
      }
    }
    return undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const now = Math.floor(Date.now() / 1000);
    const id = this.userCurrentId++;
    
    const user = {
      ...insertUser,
      id,
      displayName: insertUser.displayName || null,
      createdAt: now,
      updatedAt: now,
    } as User;
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userUpdate,
      updatedAt: Math.floor(Date.now() / 1000),
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

/**
 * Stockage hybride qui utilise à la fois la mémoire locale et Dropbox
 * - Les métadonnées des livres sont stockées en mémoire
 * - Le contenu complet des livres est stocké dans Dropbox
 */
export class DropboxStorage implements IStorage {
  private memStorage: MemStorage;
  private initialized: boolean = false;
  
  constructor() {
    this.memStorage = new MemStorage();
    // Initialisation du service Dropbox
    try {
      DropboxService.initialize();
      // Chargement asynchrone des livres depuis Dropbox au démarrage
      this.loadBooksFromDropbox();
    } catch (error) {
      console.error("Erreur d'initialisation du service Dropbox:", error);
    }
  }
  
  /**
   * Charge les livres depuis Dropbox et les importe dans le stockage mémoire
   */
  private async loadBooksFromDropbox() {
    try {
      console.log("Chargement des livres depuis Dropbox...");
      // Récupère la liste des livres disponibles sur Dropbox
      const dropboxBooks = await DropboxService.listBooks();
      
      // Pour chaque livre trouvé sur Dropbox
      for (const bookInfo of dropboxBooks) {
        try {
          // Récupère le contenu complet du livre
          const bookContent = await DropboxService.getBook(bookInfo.id);
          if (bookContent) {
            console.log(`Chargement du livre ${bookInfo.id} depuis Dropbox: ${bookContent.title}`);
            
            // Crée ou met à jour le livre dans le stockage mémoire
            const existingBook = await this.memStorage.getBook(bookInfo.id);
            if (!existingBook) {
              // Si le livre n'existe pas localement, le créer
              await this.memStorage.createBook({
                id: bookInfo.id,
                title: bookContent.title,
                author: bookContent.author,
                coverPage: bookContent.coverPage,
                chapters: bookContent.chapters
              } as any);
            }
          }
        } catch (error) {
          console.error(`Erreur lors du chargement du livre ${bookInfo.id} depuis Dropbox:`, error);
        }
      }
      
      this.initialized = true;
      console.log(`${dropboxBooks.length} livres chargés depuis Dropbox.`);
    } catch (error) {
      console.error("Erreur lors du chargement des livres depuis Dropbox:", error);
    }
  }

  // Méthodes de gestion des métadonnées du livre - utilise le stockage mémoire
  async getBooks(userId?: number): Promise<Book[]> {
    return this.memStorage.getBooks(userId);
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
  
  // Méthodes de gestion des utilisateurs - délégation à MemStorage
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.memStorage.getUserByFirebaseUid(firebaseUid);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.memStorage.getUserByEmail(email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    return this.memStorage.createUser(user);
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    return this.memStorage.updateUser(id, user);
  }
}

// Utiliser le stockage Dropbox comme stockage principal
export const storage = new DropboxStorage();
