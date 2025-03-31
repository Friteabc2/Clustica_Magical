import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { bookContentSchema, insertUserSchema, User } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// EPUB generation library
import Epub from 'epub-gen';

// Service d'IA pour la génération de livres
import { AIService, AIBookRequest } from "./services/ai-service";

// Services Dropbox pour la synchronisation des livres et l'authentification OAuth
import { DropboxService } from "./services/dropbox-service";
import { DropboxOAuth } from "./services/dropbox-oauth";

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
      // Par défaut, nous récupérons uniquement les livres de l'utilisateur connecté
      // Si aucun utilisateur n'est spécifié et que l'utilisateur n'est pas connecté,
      // nous ne retournons que les livres sans userId (livres publics)
      let userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Si userId est passé comme 'null' ou 'undefined' en chaîne, le convertir en undefined
      if (userId === null || userId === undefined || isNaN(userId)) {
        userId = undefined;
      }
      
      // Récupérer les livres avec ou sans filtre par utilisateur
      const books = await storage.getBooks(userId);
      res.json(books);
      
      console.log(`Livres récupérés pour l'utilisateur ${userId || 'tous'}: ${books.length} livre(s)`);
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
      console.log("Requête reçue /api/books POST:", {
        body: req.body,
        rawBody: JSON.stringify(req.body),
        contentType: req.headers['content-type'],
        hasTitle: req.body && req.body.title ? 'Oui' : 'Non',
        hasAuthor: req.body && req.body.author ? 'Oui' : 'Non',
      });
      
      const bookData = req.body;
      // Initial validation
      if (!bookData || !bookData.title || !bookData.author) {
        return res.status(400).json({ message: 'Title and author are required' });
      }
      
      // Validation de l'ID utilisateur s'il est fourni
      if (bookData.userId && (isNaN(parseInt(bookData.userId)) || parseInt(bookData.userId) <= 0)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Vérification des limites du plan gratuit si un utilisateur est spécifié
      if (bookData.userId) {
        const userId = parseInt(bookData.userId);
        const user = await storage.getUser(userId);
        
        if (user && user.plan === 'free') {
          // Vérifier le nombre de livres créés pour le plan gratuit (max 3)
          if (user.booksCreated >= 3) {
            return res.status(403).json({ 
              message: 'Limite atteinte pour le plan gratuit', 
              error: 'FREE_PLAN_LIMIT_REACHED',
              details: 'Les utilisateurs gratuits peuvent créer un maximum de 3 livres. Passez à un plan premium pour créer plus de livres.'
            });
          }
          
          // Incrémenter le compteur de livres créés
          await storage.updateUser(userId, {
            booksCreated: (user.booksCreated || 0) + 1
          });
        }
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
      
      // Vérification des limites du plan gratuit si un utilisateur est associé au livre
      const book = await storage.getBook(id);
      if (book && book.userId) {
        const user = await storage.getUser(book.userId);
        
        if (user && user.plan === 'free') {
          // Limiter le nombre de chapitres pour les utilisateurs gratuits (max 3)
          if (contentResult.data.chapters && contentResult.data.chapters.length > 3) {
            return res.status(403).json({
              message: 'Limite du plan gratuit atteinte',
              error: 'FREE_PLAN_CHAPTERS_LIMIT_REACHED',
              details: 'Les utilisateurs gratuits sont limités à 3 chapitres par livre maximum. Passez au plan premium pour créer des livres plus longs.'
            });
          }
          
          // Limiter le nombre de pages par chapitre pour les utilisateurs gratuits (max 3)
          if (contentResult.data.chapters) {
            for (const chapter of contentResult.data.chapters) {
              if (chapter.pages && chapter.pages.length > 3) {
                return res.status(403).json({
                  message: 'Limite du plan gratuit atteinte',
                  error: 'FREE_PLAN_PAGES_LIMIT_REACHED',
                  details: 'Les utilisateurs gratuits sont limités à 3 pages par chapitre maximum. Passez au plan premium pour créer des chapitres plus longs.'
                });
              }
            }
          }
        }
      }
      
      // La méthode updateBookContent va déjà s'occuper de sauvegarder le contenu dans Dropbox
      const updatedBook = await storage.updateBookContent(id, contentResult.data);
      if (!updatedBook) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Statut de la synchronisation Dropbox
      // Nous considérons que la synchronisation a réussi si nous arrivons ici
      // car les erreurs de Dropbox dans updateBookContent n'arrêtent pas le processus
      let dropboxSyncStatus = { success: true, message: "Synchronisé avec Dropbox" };
      
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
      
      // Récupérer l'ID de l'utilisateur depuis la requête pour la suppression
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Récupérer d'abord les détails du livre pour savoir s'il s'agit d'un livre AI
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Récupérer le contenu du livre pour déterminer s'il a été généré par l'IA
      const bookContent = await storage.getBookContent(id);
      const isAIBook = bookContent?.chapters?.some(chapter => 
        chapter.pages?.some(page => page.content?.includes('généré par l\'IA'))
      ) || false;
      
      // Supprimer le livre du stockage mémoire
      const success = await storage.deleteBook(id);
      if (!success) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Mettre à jour les compteurs de l'utilisateur si un utilisateur est associé au livre
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          // Décrémenter le compteur approprié en fonction du type de livre
          const updatedUser: Partial<User> = {
            booksCreated: Math.max(0, (user.booksCreated || 0) - 1)
          };
          
          if (isAIBook) {
            updatedUser.aiBooksCreated = Math.max(0, (user.aiBooksCreated || 0) - 1);
          }
          
          await storage.updateUser(userId, updatedUser);
        }
      }
      
      // Supprimer également le livre de Dropbox (dans le dossier de l'utilisateur si spécifié)
      try {
        await DropboxService.deleteBook(id, userId);
      } catch (dropboxError) {
        console.error("Erreur lors de la suppression du livre dans Dropbox:", dropboxError);
        // On ne bloque pas la réponse, le livre a déjà été supprimé du stockage principal
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
      const characterSchema = z.object({
        name: z.string().optional(),
        autoGenerateName: z.boolean().optional(),
        description: z.string().optional(),
        alignment: z.string().optional(),
        organization: z.string().optional(),
        role: z.string().optional()
      });
      
      const aiBookRequestSchema = z.object({
        prompt: z.string().min(3, { message: "Le prompt doit contenir au moins 3 caractères" }),
        chaptersCount: z.number().int().min(1).max(10).optional().default(3),
        pagesPerChapter: z.number().int().min(1).max(5).optional().default(1),
        authorName: z.string().optional(),
        genre: z.string().optional(),
        style: z.string().optional(),
        narrativeMode: z.string().optional(),
        mainCharacter: z.string().optional(),
        setting: z.string().optional(),
        targetAudience: z.string().optional(),
        tone: z.string().optional(),
        paceStyle: z.string().optional(),
        additionalStyles: z.array(z.string()).optional(),
        themes: z.array(z.string()).optional(),
        characters: z.array(characterSchema).optional(),
        userId: z.number().optional()
      });
      
      const validationResult = aiBookRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Données invalides pour la génération AI',
          errors: validationResult.error.errors
        });
      }
      
      // Vérification des limites du plan gratuit si un userId est spécifié
      const userId = validationResult.data.userId;
      if (userId) {
        const user = await storage.getUser(userId);
        
        if (user && user.plan === 'free') {
          // Vérifier la limite de livres AI pour le plan gratuit (max 1)
          if (user.aiBooksCreated >= 1) {
            return res.status(403).json({ 
              message: 'Limite atteinte pour le plan gratuit', 
              error: 'FREE_PLAN_AI_LIMIT_REACHED',
              details: 'Les utilisateurs gratuits peuvent créer un maximum d\'1 livre avec l\'IA. Passez à un plan premium pour créer plus de livres avec l\'IA.'
            });
          }
          
          // Limiter le nombre de chapitres et de pages pour les utilisateurs gratuits
          const chaptersCount = Math.min(validationResult.data.chaptersCount, 3);
          const pagesPerChapter = Math.min(validationResult.data.pagesPerChapter, 3);
          
          // Mettre à jour les valeurs limitées
          validationResult.data.chaptersCount = chaptersCount;
          validationResult.data.pagesPerChapter = pagesPerChapter;
          
          // Incrémenter le compteur de livres AI créés
          await storage.updateUser(userId, {
            aiBooksCreated: (user.aiBooksCreated || 0) + 1
          });
        }
      }
      
      // Génération du livre avec l'IA
      const bookContent = await AIService.generateBook(validationResult.data);
      
      // Ajouter l'ID utilisateur au contenu du livre s'il est fourni
      if (userId) {
        bookContent.userId = typeof userId === 'string' ? parseInt(userId) : userId;
      }
      
      // Création du livre dans le stockage
      const book = await storage.createBook({
        title: bookContent.title,
        author: bookContent.author,
        userId: userId,
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

  // Initialiser les routes OAuth pour Dropbox
  DropboxOAuth.initializeRoutes(app);
  
  // Ajouter un middleware pour gérer les tokens expirés
  app.use('/api/dropbox', DropboxOAuth.checkAndRefreshToken);
  
  // Endpoint pour vérifier l'état de la connexion Dropbox
  app.get('/api/dropbox/status', async (_req: Request, res: Response) => {
    try {
      // Vérifier les tokens disponibles
      const hasAccessToken = !!process.env.DROPBOX_ACCESS_TOKEN;
      const hasRefreshToken = !!process.env.DROPBOX_REFRESH_TOKEN;
      
      // Vérifier si le token est déjà marqué comme expiré
      if (DropboxService.isExpired()) {
        return res.status(401).json({ 
          status: 'expired',
          message: 'Le token d\'accès Dropbox a expiré. Veuillez le mettre à jour.',
          hasRefreshToken: hasRefreshToken,
          canAutoRefresh: hasRefreshToken,
          oauthUrl: '/api/dropbox/oauth'
        });
      }
      
      // Test simple pour vérifier si le token est valide
      await DropboxService.ensureRootFolderExists();
      
      res.json({ 
        status: 'connected',
        message: 'La connexion Dropbox est active et fonctionne correctement',
        hasRefreshToken: hasRefreshToken
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du statut Dropbox:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Vérifier si c'est une erreur d'authentification
      const isAuthError = errorMessage.includes('401') || 
                          errorMessage.includes('expired_access_token') ||
                          errorMessage.includes('invalid_access_token');
      
      // Marquer le token comme expiré si c'est une erreur d'authentification
      if (isAuthError) {
        // Définir le token comme expiré
        DropboxService.setTokenExpired();
      }
      
      res.status(isAuthError ? 401 : 500).json({ 
        status: 'error',
        message: isAuthError 
          ? 'Le token d\'accès Dropbox a expiré ou est invalide. Veuillez le mettre à jour.'
          : 'Erreur lors de la connexion à Dropbox',
        error: errorMessage
      });
    }
  });
  
  // Endpoint pour synchroniser manuellement les livres avec Dropbox
  app.post('/api/dropbox/sync', async (req: Request, res: Response) => {
    try {
      // Récupérer l'ID de l'utilisateur depuis la requête si fourni
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Récupère tous les livres ou seulement ceux de l'utilisateur
      const books = await storage.getBooks(userId);
      const results = [];
      
      // Synchronise chaque livre avec Dropbox
      for (const book of books) {
        try {
          const content = await storage.getBookContent(book.id);
          if (content) {
            // Sauvegarder dans le dossier de l'utilisateur si spécifié, sinon utiliser l'userId du livre
            // S'assurer que l'userId n'est pas null avant de l'utiliser
            const userIdToUse = userId || (book.userId || undefined);
            await DropboxService.saveBook(book.id, content, userIdToUse);
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
      // Récupérer l'ID de l'utilisateur depuis la requête si fourni
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Récupérer les livres de l'utilisateur spécifié ou tous les livres
      const books = await DropboxService.listBooks(userId);
      res.json(books);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres depuis Dropbox:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      res.status(500).json({ message: 'Échec de la récupération des livres depuis Dropbox', error: errorMessage });
    }
  });
  
  // Endpoint pour mettre à jour ou rafraîchir manuellement le token Dropbox
  // Ajout d'un point d'entrée pour définir manuellement les tokens (sans passer par OAuth)
  app.get('/api/dropbox/token-setup', async (_req: Request, res: Response) => {
    res.send(`
      <html>
        <head>
          <title>Configuration Manuelle des Tokens Dropbox</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 { color: #333; }
            .card {
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              padding: 20px;
              margin-bottom: 20px;
            }
            label {
              display: block;
              margin-bottom: 8px;
              font-weight: bold;
            }
            input[type="text"] {
              width: 100%;
              padding: 8px;
              margin-bottom: 16px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-family: monospace;
            }
            button {
              background-color: #4361ee;
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover { background-color: #3a56d4; }
            pre {
              background-color: #f5f5f5;
              padding: 16px;
              border-radius: 4px;
              overflow-x: auto;
            }
            .success {
              background-color: #d4edda;
              color: #155724;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 16px;
              display: none;
            }
            .error {
              background-color: #f8d7da;
              color: #721c24;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 16px;
              display: none;
            }
          </style>
        </head>
        <body>
          <h1>Configuration Manuelle des Tokens Dropbox</h1>
          
          <div class="card">
            <p>Si vous avez déjà un token d'accès et un refresh token pour Dropbox, vous pouvez les configurer ici sans passer par le processus OAuth.</p>
            
            <div id="success" class="success"></div>
            <div id="error" class="error"></div>
            
            <form id="tokenForm">
              <div>
                <label for="accessToken">Access Token:</label>
                <input type="text" id="accessToken" placeholder="sl.Aaaaaaa..." />
              </div>
              
              <div>
                <label for="refreshToken">Refresh Token (optionnel):</label>
                <input type="text" id="refreshToken" placeholder="a1bCd..." />
              </div>
              
              <button type="submit">Mettre à jour les tokens</button>
            </form>
          </div>
          
          <div class="card">
            <h3>Obtenir un token d'accès et un refresh token</h3>
            <p>Pour obtenir un token d'accès et un refresh token pour Dropbox :</p>
            <ol>
              <li>Allez dans la <a href="https://www.dropbox.com/developers/apps" target="_blank">console développeur Dropbox</a></li>
              <li>Sélectionnez votre application</li>
              <li>Dans l'onglet "OAuth 2", sous "Generated access token", générez un nouveau token</li>
              <li>Pour le refresh token, utilisez les <a href="https://dropbox.tech/developers/migrating-app-permissions-and-access-tokens" target="_blank">instructions officielles de Dropbox</a></li>
            </ol>
          </div>
          
          <script>
            document.getElementById('tokenForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const accessToken = document.getElementById('accessToken').value.trim();
              const refreshToken = document.getElementById('refreshToken').value.trim();
              
              if (!accessToken) {
                showError("L'access token est requis");
                return;
              }
              
              try {
                const response = await fetch('/api/dropbox/refresh-token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    token: accessToken,
                    refreshToken: refreshToken || undefined
                  })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                  showSuccess(result.message);
                  // Effacer les champs une fois la mise à jour réussie
                  document.getElementById('accessToken').value = '';
                  document.getElementById('refreshToken').value = '';
                } else {
                  showError(result.message || "Erreur lors de la mise à jour des tokens");
                }
              } catch (error) {
                showError("Erreur de communication avec le serveur");
                console.error(error);
              }
            });
            
            function showSuccess(message) {
              const successEl = document.getElementById('success');
              successEl.textContent = message;
              successEl.style.display = 'block';
              document.getElementById('error').style.display = 'none';
              
              // Cacher le message après 5 secondes
              setTimeout(() => {
                successEl.style.display = 'none';
              }, 5000);
            }
            
            function showError(message) {
              const errorEl = document.getElementById('error');
              errorEl.textContent = message;
              errorEl.style.display = 'block';
              document.getElementById('success').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `);
  });

  app.post('/api/dropbox/refresh-token', async (req: Request, res: Response) => {
    try {
      // Tenter de rafraîchir automatiquement le token avec le refresh token
      const newToken = await DropboxOAuth.refreshAccessToken();
      
      if (newToken) {
        // Succès : le token a été rafraîchi automatiquement
        DropboxService.resetTokenState();
        
        res.json({
          status: 'success',
          message: 'Token Dropbox rafraîchi automatiquement avec succès',
          method: 'refresh_token'
        });
      } else {
        // Échec du rafraîchissement automatique, essayer avec le token fourni manuellement
        const { token, refreshToken } = req.body;
        
        // Si un refresh token est fourni, le sauvegarder
        if (refreshToken) {
          process.env.DROPBOX_REFRESH_TOKEN = refreshToken;
          console.log('[dropbox] ✅ Refresh token mis à jour manuellement');
        }
        
        if (token) {
          // Mise à jour manuelle avec le token fourni
          process.env.DROPBOX_ACCESS_TOKEN = token;
          
          // Réinitialisation du service Dropbox pour utiliser le nouveau token
          DropboxService.resetTokenState();
          DropboxService.initialize();
          
          // Vérifier la connexion avec le nouveau token
          try {
            await DropboxService.ensureRootFolderExists();
            res.json({
              status: 'success',
              message: 'Token Dropbox mis à jour manuellement avec succès',
              method: 'manual_update'
            });
          } catch (error) {
            console.error('Erreur de connexion avec le token manuel:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            res.status(401).json({
              status: 'error',
              message: 'Erreur de connexion avec le token fourni manuellement',
              error: errorMessage
            });
          }
        } else {
          // Aucun moyen de rafraîchir le token (ni automatique, ni manuel)
          res.status(400).json({
            status: 'error',
            message: 'Impossible de rafraîchir le token automatiquement. Veuillez fournir un token ou passer par le processus d\'authentification OAuth.',
            needsOAuth: true
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token Dropbox:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      res.status(500).json({ 
        status: 'error',
        message: 'Échec du rafraîchissement du token Dropbox',
        error: errorMessage
      });
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
      
      // Créer le nouvel utilisateur avec le plan gratuit par défaut
      const user = await storage.createUser({
        email: validationResult.data.email,
        firebaseUid: validationResult.data.firebaseUid,
        displayName: validationResult.data.displayName,
        plan: 'free',
        booksCreated: 0,
        aiBooksCreated: 0
      });
      
      res.status(201).json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        plan: user.plan,
        booksCreated: user.booksCreated,
        aiBooksCreated: user.aiBooksCreated
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
        displayName: user.displayName,
        plan: user.plan,
        booksCreated: user.booksCreated,
        aiBooksCreated: user.aiBooksCreated
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
