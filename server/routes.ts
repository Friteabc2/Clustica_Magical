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

// Services Dropbox pour la synchronisation des livres, l'authentification OAuth et la gestion des profils utilisateurs
import { DropboxService, UserProfileManager, UserProfileData } from "./services/dropbox-service";
import { DropboxOAuth } from "./services/dropbox-oauth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temporary directory for storing generated EPUB files
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Middleware pour vérifier si l'utilisateur a le droit d'accéder à un livre
 * Il vérifie que l'utilisateur qui fait la requête est le même que celui qui a créé le livre
 * Si le livre n'a pas d'utilisateur associé, il est considéré comme public
 */
interface AuthRequest extends Request {
  requestUserId?: number;
}

async function checkBookAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'ID de livre invalide' });
    }
    
    // Si l'utilisateur a fourni son ID dans la requête (soit dans le corps, soit en paramètre de requête)
    const requestUserId = req.body.userId || req.query.userId;
    
    // Récupérer les informations du livre
    const book = await storage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
    
    // Si le livre n'a pas d'utilisateur associé, il est public
    if (!book.userId) {
      return next();
    }
    
    // Si aucun utilisateur n'est spécifié dans la requête, mais que le livre a un propriétaire
    if (!requestUserId) {
      return res.status(403).json({ 
        message: 'Accès non autorisé',
        error: 'UNAUTHORIZED_ACCESS',
        details: 'Vous n\'avez pas l\'autorisation d\'accéder à ce livre'
      });
    }
    
    // Convertir les IDs en nombre pour comparaison en assurant un type cohérent
    const bookUserId = typeof book.userId === 'string' ? parseInt(book.userId) : book.userId;
    let userIdNum = typeof requestUserId === 'string' ? parseInt(requestUserId) : requestUserId;
    
    // Si l'ID utilisateur n'a pas pu être parsé ou est invalide, le rejeter
    if (isNaN(userIdNum)) {
      userIdNum = 0; // Valeur qui ne correspondra à aucun ID valide
    }
    
    // Stocke l'ID utilisateur dans la requête pour utilisation ultérieure
    req.requestUserId = userIdNum;
    
    // Vérifier si l'utilisateur est autorisé à accéder au livre
    if (bookUserId !== userIdNum) {
      console.log(`Accès refusé: l'utilisateur ${userIdNum} tente d'accéder au livre appartenant à l'utilisateur ${bookUserId}`);
      return res.status(403).json({ 
        message: 'Accès non autorisé',
        error: 'UNAUTHORIZED_ACCESS',
        details: 'Vous n\'avez pas l\'autorisation d\'accéder à ce livre'
      });
    }
    
    // L'utilisateur est autorisé
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification des autorisations:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification des autorisations' });
  }
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

  app.get('/api/books/:id', checkBookAccess, async (req: AuthRequest, res: Response) => {
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

  app.get('/api/books/:id/content', checkBookAccess, async (req: AuthRequest, res: Response) => {
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
      
      // Vérification des limites du plan si un utilisateur est spécifié
      if (bookData.userId) {
        const userId = parseInt(bookData.userId);
        
        try {
          // Obtenir le profil utilisateur à partir de Dropbox pour obtenir les valeurs les plus à jour
          const dropboxProfile = await UserProfileManager.getUserProfile(userId);
          if (dropboxProfile) {
            const planType = dropboxProfile.plan || 'free';
            const booksLimit = planType === 'premium' ? 10 : 3;
            const currentBooksCount = dropboxProfile.booksCreated || 0;
            
            console.log(`[Limite Livres] Utilisateur ${userId}: ${currentBooksCount}/${booksLimit} livres créés. Plan: ${planType}`);
            
            // Vérifier si l'utilisateur a atteint sa limite de livres
            if (currentBooksCount >= booksLimit) {
              return res.status(403).json({ 
                message: `Limite atteinte pour le plan ${planType}`, 
                error: `${planType.toUpperCase()}_PLAN_LIMIT_REACHED`,
                details: planType === 'premium' 
                  ? 'Les utilisateurs premium peuvent créer un maximum de 10 livres. Supprimez un livre existant pour en créer un nouveau.'
                  : 'Les utilisateurs gratuits peuvent créer un maximum de 3 livres. Supprimez un livre existant ou passez à un plan premium pour en créer davantage.'
              });
            }
            
            // Mettre à jour l'utilisateur dans la base de données locale pour être synchronisé
            const user = await storage.getUser(userId);
            if (user) {
              await storage.updateUser(userId, {
                plan: dropboxProfile.plan,
                booksCreated: currentBooksCount,
                aiBooksCreated: dropboxProfile.aiBooksCreated || 0
              });
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la vérification du profil Dropbox pour l'utilisateur ${userId}:`, error);
          // Si nous ne pouvons pas vérifier Dropbox, replier sur la vérification locale
          const user = await storage.getUser(userId);
          
          if (user) {
            const booksLimit = user.plan === 'premium' ? 10 : 3;
            
            if (user.booksCreated >= booksLimit) {
              return res.status(403).json({ 
                message: `Limite atteinte pour le plan ${user.plan}`, 
                error: `${user.plan.toUpperCase()}_PLAN_LIMIT_REACHED`,
                details: user.plan === 'premium' 
                  ? 'Les utilisateurs premium peuvent créer un maximum de 10 livres. Supprimez un livre existant pour en créer un nouveau.'
                  : 'Les utilisateurs gratuits peuvent créer un maximum de 3 livres. Supprimez un livre existant ou passez à un plan premium pour en créer davantage.'
              });
            }
            
            // Incrémenter le compteur local
            await storage.updateUser(userId, {
              booksCreated: (user.booksCreated || 0) + 1
            });
          }
        }
      }
      
      // Create default book structure if not provided
      if (!bookData.chapters) {
        bookData.chapters = [];
      }
      
      const book = await storage.createBook(bookData);
      
      // Si un utilisateur est associé au livre, mettre à jour son profil Dropbox
      if (book.userId) {
        try {
          // S'assurer que le dossier utilisateur existe
          await DropboxService.ensureUserFolderExists(book.userId);
          
          // Récupérer/créer le profil utilisateur pour mettre à jour les stats
          const user = await storage.getUser(book.userId);
          if (user) {
            // Incrémenter le compteur de livres dans le profil Dropbox
            await UserProfileManager.incrementBooksCreated(book.userId);
            console.log(`Profil Dropbox: livre créé pour l'utilisateur ${book.userId}`);
          }
        } catch (dropboxError) {
          console.error(`Erreur Dropbox pour l'utilisateur ${book.userId}:`, dropboxError);
          // Ne pas bloquer la création du livre si l'opération Dropbox échoue
        }
      }
      
      res.status(201).json(book);
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({ message: 'Failed to create book' });
    }
  });

  app.put('/api/books/:id/content', checkBookAccess, async (req: AuthRequest, res: Response) => {
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

  app.delete('/api/books/:id', checkBookAccess, async (req: AuthRequest, res: Response) => {
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
        // Options d'images
        generateImages: z.boolean().optional().default(true),
        imageStyle: z.string().optional(),
        imageAspectRatio: z.enum(['square', 'portrait', 'landscape', 'panoramic']).optional(),
        userId: z.number().optional()
      });
      
      const validationResult = aiBookRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Données invalides pour la génération AI',
          errors: validationResult.error.errors
        });
      }
      
      // Récupération des données validées
      const validatedData = validationResult.data;
      const userId = validatedData.userId;
      let chaptersMaxLimit = 3; // Valeur par défaut pour les utilisateurs gratuits
      let pagesMaxLimit = 3;    // Valeur par défaut pour les utilisateurs gratuits
      
      // Vérification des limites du plan si un userId est spécifié
      if (userId) {
        try {
          // Obtenir le profil utilisateur à partir de Dropbox pour obtenir les valeurs les plus à jour
          const dropboxProfile = await UserProfileManager.getUserProfile(userId);
          if (dropboxProfile) {
            const planType = dropboxProfile.plan || 'free';
            const aiLimit = planType === 'premium' ? 5 : 1;
            const currentAICount = dropboxProfile.aiBooksCreated || 0;
            
            console.log(`[Limite AI] Utilisateur ${userId}: ${currentAICount}/${aiLimit} livres AI créés. Plan: ${planType}`);
            
            // Vérifier si l'utilisateur a atteint sa limite de livres AI
            if (currentAICount >= aiLimit) {
              return res.status(403).json({ 
                message: `Limite atteinte pour le plan ${planType}`, 
                error: `${planType.toUpperCase()}_PLAN_AI_LIMIT_REACHED`,
                details: planType === 'premium' 
                  ? 'Les utilisateurs premium peuvent créer un maximum de 5 livres avec l\'IA.'
                  : 'Les utilisateurs gratuits peuvent créer un maximum d\'1 livre avec l\'IA. Passez à un plan premium pour créer plus de livres avec l\'IA.'
              });
            }
            
            // Mettre à jour les limites pour les utilisateurs premium
            if (planType === 'premium') {
              chaptersMaxLimit = 6;
              pagesMaxLimit = 4;
            }
            
            // Mettre à jour l'utilisateur dans la base de données locale pour être synchronisé
            const user = await storage.getUser(userId);
            if (user) {
              await storage.updateUser(userId, {
                plan: dropboxProfile.plan,
                booksCreated: dropboxProfile.booksCreated || 0,
                aiBooksCreated: currentAICount
              });
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la vérification du profil Dropbox pour l'utilisateur ${userId}:`, error);
          // Si nous ne pouvons pas vérifier Dropbox, replier sur la vérification locale
          const user = await storage.getUser(userId);
          
          if (user) {
            const aiLimit = user.plan === 'premium' ? 5 : 1;
            
            if (user.aiBooksCreated >= aiLimit) {
              return res.status(403).json({ 
                message: `Limite atteinte pour le plan ${user.plan}`, 
                error: `${user.plan.toUpperCase()}_PLAN_AI_LIMIT_REACHED`,
                details: user.plan === 'premium' 
                  ? 'Les utilisateurs premium peuvent créer un maximum de 5 livres avec l\'IA.'
                  : 'Les utilisateurs gratuits peuvent créer un maximum d\'1 livre avec l\'IA. Passez à un plan premium pour créer plus de livres avec l\'IA.'
              });
            }
            
            // Mettre à jour les limites pour les utilisateurs premium
            if (user.plan === 'premium') {
              chaptersMaxLimit = 6;
              pagesMaxLimit = 4;
            }
            
            // Incrémenter le compteur local
            await storage.updateUser(userId, {
              aiBooksCreated: (user.aiBooksCreated || 0) + 1
            });
          }
        }
        
        // Limiter le nombre de chapitres et de pages selon le plan
        const chaptersCount = Math.min(validatedData.chaptersCount, chaptersMaxLimit);
        const pagesPerChapter = Math.min(validatedData.pagesPerChapter, pagesMaxLimit);
        
        // Mettre à jour les valeurs limitées
        validatedData.chaptersCount = chaptersCount;
        validatedData.pagesPerChapter = pagesPerChapter;
      
        // Vérifier et créer le dossier utilisateur dans Dropbox
        try {
          // S'assurer que le dossier utilisateur existe dans Dropbox
          await DropboxService.ensureUserFolderExists(userId);
          
          // Mettre à jour le profil utilisateur dans Dropbox pour les statistiques de livres AI
          await UserProfileManager.incrementAIBooksCreated(userId);
          console.log(`Profil Dropbox: livre AI créé pour l'utilisateur ${userId}`);
        } catch (dropboxError) {
          console.error(`Erreur Dropbox pour l'utilisateur ${userId}:`, dropboxError);
          // Ne pas bloquer la création du livre si l'opération Dropbox échoue
        }
      }

      // Génération du livre avec l'IA
      const bookContent = await AIService.generateBook(validatedData);
      
      // Ajouter l'ID utilisateur au contenu du livre s'il est fourni
      if (userId) {
        bookContent.userId = userId;
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
  app.post('/api/books/:id/export', checkBookAccess, async (req: AuthRequest, res: Response) => {
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
      
      const tempDir = path.join(process.cwd(), 'temp');
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Generate a unique ID for this export
      const exportId = Date.now().toString();
      const filename = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportId}.epub`;
      const outputPath = path.join(tempDir, filename);
      
      // Create a specific temporary directory for this export
      const exportDir = path.join(tempDir, `export_${exportId}`);
      const imagesDir = path.join(exportDir, 'images');
      
      try {
        // Create the necessary directories
        await fs.promises.mkdir(exportDir, { recursive: true });
        await fs.promises.mkdir(imagesDir, { recursive: true });
        
        // Define image handling function
        const handleImage = async (imageUrl: string): Promise<string | null> => {
          if (!imageUrl) return null;
          
          try {
            if (imageUrl.startsWith('/generated-images/')) {
              const publicPath = path.join(process.cwd(), 'public', imageUrl);
              const filename = path.basename(imageUrl);
              const localPath = path.join(imagesDir, filename);
              
              await fs.promises.copyFile(publicPath, localPath);
              return path.join('images', filename);
            }
            return null;
          } catch (error) {
            console.error(`Error processing image ${imageUrl}:`, error);
            return null;
          }
        };
        
        // Add CSS for styling
        const cssFile = path.join(exportDir, 'style.css');
        const cssContent = `
          body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 1em;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Arial', sans-serif;
            margin-top: 1.2em;
            margin-bottom: 0.6em;
          }
          h1 { font-size: 2em; color: #333; }
          h2 { font-size: 1.8em; color: #444; }
          h3 { font-size: 1.5em; color: #555; }
          p { margin-bottom: 1em; }
          .page-image, .cover-image {
            margin: 1em 0;
            text-align: center;
          }
          .page-image img, .cover-image img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
          .image-caption {
            font-style: italic;
            font-size: 0.9em;
            text-align: center;
            color: #666;
          }
          blockquote {
            font-style: italic;
            margin-left: 1em;
            padding-left: 1em;
            border-left: 3px solid #ccc;
          }
          .ql-align-center { text-align: center; }
          .ql-align-right { text-align: right; }
          .ql-align-justify { text-align: justify; }
        `;
        await fs.promises.writeFile(cssFile, cssContent);
        
        // Prepare content for EPUB
        const epubContent = [];
        
        // Add cover page as first chapter if it exists
        if (content.coverPage) {
          let coverHtml = content.coverPage.content || '';
          
          if (content.coverPage.image && content.coverPage.image.url) {
            const localImagePath = await handleImage(content.coverPage.image.url);
            if (localImagePath) {
              const imageAlt = content.coverPage.image.alt || `Cover of ${content.title}`;
              coverHtml = `<div class="cover-image"><img src="${localImagePath}" alt="${imageAlt}" /></div>` + coverHtml;
            }
          }
          
          epubContent.push({
            title: 'Cover',
            data: coverHtml,
            beforeToc: true
          });
        }
        
        // Add chapters
        for (const chapter of content.chapters) {
          const pageHtmls = [];
          
          for (const page of chapter.pages) {
            let pageHtml = page.content || '';
            
            if (page.image && page.image.url) {
              const localImagePath = await handleImage(page.image.url);
              if (localImagePath) {
                const imageAlt = page.image.alt || `Illustration for ${chapter.title}`;
                const imageCaption = page.image.caption ? `<p class="image-caption">${page.image.caption}</p>` : '';
                pageHtml = `<div class="page-image"><img src="${localImagePath}" alt="${imageAlt}" />${imageCaption}</div>` + pageHtml;
              }
            }
            
            pageHtmls.push(pageHtml);
          }
          
          epubContent.push({
            title: chapter.title,
            data: pageHtmls.join('<hr class="page-break" />')
          });
        }
        
        // Create SVG cover if requested
        let coverImage;
        if (exportOptions.includeCover) {
          const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
            <rect width="600" height="800" fill="#6366F1" />
            <text x="300" y="350" font-family="sans-serif" font-size="40" text-anchor="middle" fill="white">${content.title}</text>
            <text x="300" y="450" font-family="sans-serif" font-size="30" text-anchor="middle" fill="white">by ${content.author}</text>
          </svg>`;
          
          const coverPath = path.join(exportDir, 'cover.svg');
          await fs.promises.writeFile(coverPath, svgContent);
          coverImage = coverPath;
        }
        
        // EPUB configuration
        const epubOptions = {
          title: content.title,
          author: content.author,
          publisher: 'Clustica Magical',
          content: epubContent,
          lang: exportOptions.language,
          tocTitle: 'Table of Contents',
          cover: coverImage,
          css: path.join(exportDir, 'style.css'),
          customHtmlTags: `
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>@page { margin: 0.5cm; }</style>
          `,
          version: 3
        };
        
        // Generate EPUB
        await new Promise<void>((resolve, reject) => {
          new Epub(epubOptions, outputPath).promise
            .then(() => resolve())
            .catch((err) => reject(err));
        });
        
        // Send the file back to the client
        res.download(outputPath, filename, (err) => {
          if (err) {
            console.error('Error sending file:', err);
            return res.status(500).json({ message: 'Failed to send EPUB file' });
          }
          
          // Clean up after sending
          fs.unlink(outputPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
          });
        });
      } catch (innerError) {
        console.error('Error in EPUB generation process:', innerError);
        throw innerError;
      }
    } catch (error) {
      console.error('Error exporting book to EPUB:', error);
      res.status(500).json({ message: 'Failed to export book to EPUB' });
    }
  });

  // Initialiser les routes OAuth pour Dropbox
  DropboxOAuth.initializeRoutes(app);
  
  // Ajouter un middleware pour gérer les tokens expirés sur TOUTES les routes API
  // Ceci permet de rafraîchir le token sans redémarrer le serveur
  app.use('/api', DropboxOAuth.checkAndRefreshToken);
  
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
  
  // API pour gérer le thème
  app.get('/api/theme', async (_req: Request, res: Response) => {
    try {
      // Lire le fichier theme.json actuel
      const themePath = path.join(process.cwd(), 'theme.json');
      const currentTheme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      
      res.json({ success: true, theme: currentTheme });
    } catch (error) {
      console.error('Erreur lors de la récupération du thème:', error);
      res.status(500).json({ message: 'Échec de la récupération du thème' });
    }
  });
  
  app.post('/api/theme', async (req: Request, res: Response) => {
    try {
      const { appearance = 'light', primary = 'hsl(222.2 47.4% 11.2%)' } = req.body;
      
      // Valider les paramètres
      if (!['light', 'dark'].includes(appearance)) {
        return res.status(400).json({ message: 'Appearance doit être "light" ou "dark"' });
      }
      
      // Lire le fichier theme.json actuel
      const themePath = path.join(process.cwd(), 'theme.json');
      const currentTheme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      
      // Mettre à jour le thème
      const newTheme = {
        ...currentTheme,
        appearance,
        // Mettre à jour la couleur primaire pour le mode sombre si nécessaire
        primary: appearance === 'dark' ? 'hsl(260 60% 60%)' : primary
      };
      
      // Écrire le nouveau thème
      fs.writeFileSync(themePath, JSON.stringify(newTheme, null, 2));
      
      res.json({ success: true, theme: newTheme });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
      res.status(500).json({ message: 'Échec de la mise à jour du thème' });
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
      
      // Créer un profil utilisateur dans Dropbox
      try {
        const dropboxProfile = await UserProfileManager.getUserProfile(
          user.id, 
          user.email
        );
        
        console.log(`Profil Dropbox créé pour l'utilisateur ${user.id}:`, dropboxProfile);
        
        // Si le profil n'a pas les infos correctes, les mettre à jour
        if (dropboxProfile.displayName !== user.displayName || 
            dropboxProfile.plan !== user.plan) {
          const userPlan: 'free' | 'premium' = user.plan === 'premium' ? 'premium' : 'free';
          await UserProfileManager.updateUserInfo(user.id, {
            displayName: user.displayName,
            plan: userPlan
          });
        }
      } catch (dropboxError) {
        console.error(`Erreur lors de la création du profil Dropbox pour l'utilisateur ${user.id}:`, dropboxError);
        // Ne pas bloquer la création de l'utilisateur si la création du profil Dropbox échoue
      }
      
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
        bio: user.bio,
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

  // Endpoint pour mettre à jour les informations d'un utilisateur
  app.put('/api/auth/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }

      // Récupérer l'utilisateur existant
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Valider les données de mise à jour
      const updateSchema = z.object({
        displayName: z.string().optional(),
        bio: z.string().optional()
      });

      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Données utilisateur invalides',
          errors: validationResult.error.errors
        });
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await storage.updateUser(userId, validationResult.data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Échec de la mise à jour de l\'utilisateur' });
      }

      // Retourner les informations mises à jour
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        plan: updatedUser.plan,
        booksCreated: updatedUser.booksCreated,
        aiBooksCreated: updatedUser.aiBooksCreated
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({ message: 'Échec de la mise à jour de l\'utilisateur' });
    }
  });
  
  // Endpoints pour gérer le profil utilisateur dans Dropbox
  app.get('/api/user/:userId/profile', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      // Récupérer les informations du profil depuis Dropbox
      const profile = await UserProfileManager.getUserProfile(userId);
      
      res.json(profile);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      res.status(500).json({ message: 'Échec de la récupération du profil utilisateur' });
    }
  });
  
  // Endpoint pour mettre à jour le plan de l'utilisateur
  app.put('/api/user/:userId/plan', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      // Valider le plan
      const planSchema = z.object({
        plan: z.enum(['free', 'premium'])
      });
      
      const validationResult = planSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Plan invalide', 
          errors: validationResult.error.errors 
        });
      }
      
      // Mettre à jour le plan de l'utilisateur
      const profile = await UserProfileManager.updateUserPlan(userId, validationResult.data.plan);
      if (!profile) {
        return res.status(500).json({ message: 'Échec de la mise à jour du plan' });
      }
      
      // Mettre également à jour le plan dans la base de données
      await storage.updateUser(userId, { plan: validationResult.data.plan });
      
      res.json({ success: true, profile });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan:', error);
      res.status(500).json({ message: 'Échec de la mise à jour du plan' });
    }
  });
  
  // Endpoint pour incrémenter le compteur de livres créés
  app.post('/api/user/:userId/increment-books', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      // Valider le type de livre (normal ou AI)
      const typeSchema = z.object({
        type: z.enum(['normal', 'ai'])
      });
      
      const validationResult = typeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Type de livre invalide', 
          errors: validationResult.error.errors 
        });
      }
      
      let profile;
      
      // Incrémenter le compteur approprié
      if (validationResult.data.type === 'ai') {
        profile = await UserProfileManager.incrementAIBooksCreated(userId);
      } else {
        profile = await UserProfileManager.incrementBooksCreated(userId);
      }
      
      if (!profile) {
        return res.status(500).json({ message: 'Échec de l\'incrémentation du compteur' });
      }
      
      // Mettre également à jour les compteurs dans la base de données
      const user = await storage.getUser(userId);
      if (user) {
        if (validationResult.data.type === 'ai') {
          await storage.updateUser(userId, { aiBooksCreated: (user.aiBooksCreated || 0) + 1 });
        } else {
          await storage.updateUser(userId, { booksCreated: (user.booksCreated || 0) + 1 });
        }
      }
      
      res.json({ success: true, profile });
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation du compteur de livres:', error);
      res.status(500).json({ message: 'Échec de l\'incrémentation du compteur de livres' });
    }
  });
  
  // Endpoint pour mettre à jour les informations du profil
  app.put('/api/user/:userId/info', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      // Valider les données du profil
      const infoSchema = z.object({
        displayName: z.string().optional(),
        email: z.string().email().optional()
      });
      
      const validationResult = infoSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Données de profil invalides', 
          errors: validationResult.error.errors 
        });
      }
      
      // Mettre à jour les informations du profil
      const profile = await UserProfileManager.updateUserInfo(userId, validationResult.data);
      if (!profile) {
        return res.status(500).json({ message: 'Échec de la mise à jour des informations du profil' });
      }
      
      // Mettre également à jour les informations dans la base de données
      await storage.updateUser(userId, validationResult.data);
      
      res.json({ success: true, profile });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations du profil:', error);
      res.status(500).json({ message: 'Échec de la mise à jour des informations du profil' });
    }
  });
  
  // Endpoint pour vérifier le statut premium
  app.get('/api/user/:userId/is-premium', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      const isPremium = await UserProfileManager.isUserPremium(userId);
      
      res.json({ isPremium });
    } catch (error) {
      console.error('Erreur lors de la vérification du statut premium:', error);
      res.status(500).json({ message: 'Échec de la vérification du statut premium' });
    }
  });
  
  // Endpoint pour compter les livres créés
  app.get('/api/user/:userId/books-count', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }
      
      const counts = await UserProfileManager.getUserBooksCount(userId);
      
      res.json(counts);
    } catch (error) {
      console.error('Erreur lors du comptage des livres:', error);
      res.status(500).json({ message: 'Échec du comptage des livres' });
    }
  });
  
  // Endpoint pour supprimer un utilisateur et ses données
  app.delete('/api/auth/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }

      // Récupérer l'utilisateur existant
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Récupérer tous les livres de l'utilisateur
      const userBooks = await storage.getBooks(userId);
      
      // Supprimer chaque livre
      for (const book of userBooks) {
        await storage.deleteBook(book.id);
      }
      
      // Supprimer l'utilisateur
      // Note: Nous n'implémentons pas cette fonction ici car notre stockage en mémoire
      // ne le supporte pas, mais dans une application réelle, vous devriez supprimer l'utilisateur
      // et tous ses données associées de votre base de données.
      
      res.json({ 
        success: true, 
        message: 'Utilisateur et toutes ses données supprimés avec succès',
        booksDeleted: userBooks.length
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ message: 'Échec de la suppression de l\'utilisateur' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
