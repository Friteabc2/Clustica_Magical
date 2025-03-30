import { books, type Book, type InsertBook, type BookContent } from "@shared/schema";

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
    const book: Book = {
      ...insertBook,
      id,
      createdAt: now,
      updatedAt: now,
    };
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
      chapters: book.chapters as any[], // Cast to any[] since we're storing JSON
    };
  }

  async updateBookContent(id: number, content: BookContent): Promise<Book | undefined> {
    const book = await this.getBook(id);
    if (!book) return undefined;
    
    return this.updateBook(id, {
      title: content.title,
      author: content.author,
      chapters: content.chapters as any,
    });
  }
}

export const storage = new MemStorage();
