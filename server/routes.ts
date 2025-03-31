import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { bookContentSchema, insertUserSchema } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// EPUB generation library
import Epub from 'epub-gen';

// Service d'IA pour la génération de livres
import { AIService, AIBookRequest } from "./services/ai-service";

// Service Dropbox pour la synchronisation des livres
import { DropboxService } from "./services/dropbox-service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temporary directory for storing generated EPUB files
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for book management
  app.get('/api/books', async (req: Request, res: Response) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Failed to fetch books' });
    }
  });

  app.get('/api/books/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({ message: 'Failed to fetch book' });
    }
  });

  app.get('/api/books/:id/content', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const content = await storage.getBookContent(id);
      if (!content) {
        return res.status(404).json({ message: 'Book content not found' });
      }
      
      res.json(content);
    } catch (error) {
      console.error('Error fetching book content:', error);
      res.status(500).json({ message: 'Failed to fetch book content' });
    }
  });

  app.post('/api/books', async (req: Request, res: Response) => {
    try {
      const bookData = req.body;
      // Initial validation
      if (!bookData.title || !bookData.author) {
        return res.status(400).json({ message: 'Title and author are required' });
      }
      
      // Validation de l'ID utilisateur s'il est fourni
      if (bookData.userId && (isNaN(parseInt(bookData.userId)) || parseInt(bookData.userId) <= 0)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Create default book structure if not provided
      if (!bookData.chapters) {
        bookData.chapters = [];
      }
      
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({ message: 'Failed to create book' });
    }
  });

  app.put('/api/books/:id/content', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      // Afficher le contenu reçu pour déboguer
      console.log("Contenu reçu pour mise à jour:", JSON.stringify(req.body, null, 2).substring(0, 200) + "...");
      
      // Validate the request body
      const contentResult = bookContentSchema.safeParse(req.body);
      if (!contentResult.success) {
        console.error("Erreur de validation:", JSON.stringify(contentResult.error.errors, null, 2));
        return res.status(400).json({ 
          message: 'Invalid book content',
          errors: contentResult.error.errors
        });
      }
      
      const updatedBook = await storage.updateBookContent(id, contentResult.data);
      if (!updatedBook) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Essayer de synchroniser explicitement avec Dropbox après la sauvegarde
      let dropboxSyncStatus = { success: false, message: "Non synchronisé avec Dropbox" };
      try {
        await DropboxService.saveBook(id, contentResult.data);
        dropboxSyncStatus = { success: true, message: "Synchronisé avec Dropbox" };
      } catch (error) {
        console.error("Erreur lors de la synchronisation avec Dropbox:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        dropboxSyncStatus = { success: false, message: errorMessage };
      }
      
      // Retourner le livre mis à jour avec le statut de synchronisation Dropbox
      res.json({
        ...updatedBook,
        dropboxSync: dropboxSyncStatus
      });
    } catch (error) {
      console.error('Error updating book content:', error);
      res.status(500).json({ message: 'Failed to update book content' });
    }
  });

  app.delete('/api/books/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const success = await storage.deleteBook(id);
      if (!success) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ message: 'Failed to delete book' });
    }
  });

  // Endpoint pour la génération de livre avec l'IA
  app.post('/api/books/generate-ai', async (req: Request, res: Response) => {
    try {
      // Validations du prompt et des options
      const aiBookRequestSchema = z.object({
        prompt: z.string().min(3, { message: "Le prompt doit contenir au moins 3 caractères" }),
        chaptersCount: z.number().int().min(1).max(10).optional().default(3),
        pagesPerChapter: z.number().int().min(1).max(5).optional().default(1)
      });
      
      const validationResult = aiBookRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Données invalides pour la génération AI',
          errors: validationResult.error.errors
        });
      }
      
      // Génération du livre avec l'IA
      const bookContent = await AIService.generateBook(validationResult.data);
      
      // Création du livre dans le stockage
      const book = await storage.createBook({
        title: bookContent.title,
        author: bookContent.author,
      });
      
      // Mise à jour du contenu du livre 
      const updatedBook = await storage.updateBookContent(book.id, bookContent);
      
      res.status(201).json(updatedBook);
    } catch (error) {
      console.error('Erreur lors de la génération du livre avec l\'IA:', error);
      res.status(500).json({ message: 'Échec de la génération du livre avec l\'IA' });
    }
  });

  // EPUB export endpoint
  app.post('/api/books/:id/export', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const content = await storage.getBookContent(id);
      if (!content) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Validate export options
      const exportOptionsSchema = z.object({
        language: z.string().default('fr'),
        includeCover: z.boolean().default(true)
      });
      
      const exportOptions = exportOptionsSchema.parse(req.body);
      
      // Generate EPUB
      const filename = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.epub`;
      const outputPath = path.join(tempDir, filename);
      
      // Prepare content for EPUB
      let epubContent = [];
      
      // Add cover page as first chapter if it exists
      if (content.coverPage) {
        epubContent.push({
          title: 'Couverture',
          data: content.coverPage.content
        });
      }
      
      // Add regular chapters
      content.chapters.forEach(chapter => {
        const chapterContent = chapter.pages.map(page => page.content).join('');
        epubContent.push({
          title: chapter.title,
          data: chapterContent
        });
      });
      
      // Create EPUB with basic content
      const epubOptions = {
        title: content.title,
        author: content.author,
        publisher: 'Clustica Magical',
        content: epubContent,
        lang: exportOptions.language,
        tocTitle: 'Table des matières',
        cover: exportOptions.includeCover ? 
          `data:image/svg+xml;base64,${Buffer.from(`
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
              <rect width="600" height="800" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                </linearGradient>
              </defs>
              <text x="300" y="350" font-family="sans-serif" font-size="40" text-anchor="middle" fill="white">${content.title}</text>
              <text x="300" y="450" font-family="sans-serif" font-size="30" text-anchor="middle" fill="white">par ${content.author}</text>
            </svg>
          `).toString('base64')}` : undefined
      };
      
      await new Promise<void>((resolve, reject) => {
        new Epub(epubOptions, outputPath).promise
          .then(() => resolve())
          .catch((err: Error) => reject(err));
      });
      
      // Send the file back to the client
      res.download(outputPath, filename, (err: Error | null) => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).json({ message: 'Failed to send EPUB file' });
        }
        
        // Clean up the file after sending
        fs.unlink(outputPath, (unlinkErr: NodeJS.ErrnoException | null) => {
          if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
        });
      });
    } catch (error) {
      console.error('Error exporting book to EPUB:', error);
      res.status(500).json({ message: 'Failed to export book to EPUB' });
    }
  });

  // Endpoint pour synchroniser manuellement les livres avec Dropbox
  app.post('/api/dropbox/sync', async (req: Request, res: Response) => {
    try {
      // Récupère tous les livres
      const books = await storage.getBooks();
      const results = [];
      
      // Synchronise chaque livre avec Dropbox
      for (const book of books) {
        try {
          const content = await storage.getBookContent(book.id);
          if (content) {
            await DropboxService.saveBook(book.id, content);
            results.push({ id: book.id, title: book.title, status: 'success' });
          } else {
            results.push({ id: book.id, title: book.title, status: 'error', message: 'Contenu introuvable' });
          }
        } catch (error) {
          console.error(`Erreur lors de la synchronisation du livre ${book.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          results.push({ id: book.id, title: book.title, status: 'error', message: errorMessage });
        }
      }
      
      res.json({ 
        message: `Synchronisation terminée pour ${books.length} livres`,
        results 
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec Dropbox:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      res.status(500).json({ message: 'Échec de la synchronisation avec Dropbox', error: errorMessage });
    }
  });
  
  // Endpoint pour lister les livres stockés sur Dropbox
  app.get('/api/dropbox/books', async (req: Request, res: Response) => {
    try {
      const books = await DropboxService.listBooks();
      res.json(books);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres depuis Dropbox:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      res.status(500).json({ message: 'Échec de la récupération des livres depuis Dropbox', error: errorMessage });
    }
  });
  
  // Routes d'authentification Firebase
  
  // Endpoint pour créer un nouvel utilisateur après inscription via Firebase
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Valider les données utilisateur avec le schéma Zod
      const userDataSchema = insertUserSchema.extend({
        firebaseUid: z.string().min(1, { message: "L'UID Firebase est requis" }),
        email: z.string().email({ message: "Format d'email invalide" }),
      });
      
      const validationResult = userDataSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Données utilisateur invalides',
          errors: validationResult.error.errors
        });
      }
      
      // Vérifier si l'utilisateur existe déjà (par email ou firebaseUid)
      const existingUserByUid = await storage.getUserByFirebaseUid(validationResult.data.firebaseUid);
      const existingUserByEmail = await storage.getUserByEmail(validationResult.data.email);
      
      if (existingUserByUid || existingUserByEmail) {
        return res.status(409).json({ message: 'Un utilisateur avec cet email ou cet UID Firebase existe déjà' });
      }
      
      // Créer le nouvel utilisateur
      const user = await storage.createUser({
        email: validationResult.data.email,
        firebaseUid: validationResult.data.firebaseUid,
        displayName: validationResult.data.displayName
      });
      
      res.status(201).json({
        id: user.id,
        email: user.email,
        displayName: user.displayName
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      res.status(500).json({ message: 'Échec de la création de l\'utilisateur' });
    }
  });
  
  // Endpoint pour obtenir les informations de l'utilisateur
  app.get('/api/auth/user/:firebaseUid', async (req: Request, res: Response) => {
    try {
      const { firebaseUid } = req.params;
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      res.status(500).json({ message: 'Échec de la récupération des informations utilisateur' });
    }
  });
  
  // Endpoint pour récupérer les livres d'un utilisateur spécifique
  app.get('/api/auth/user/:userId/books', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      const books = await storage.getBooks(userId);
      res.json(books);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres de l\'utilisateur:', error);
      res.status(500).json({ message: 'Échec de la récupération des livres de l\'utilisateur' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
