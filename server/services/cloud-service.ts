import { Dropbox, files } from 'dropbox';
import { BookContent } from '@shared/schema';

// Emplacement du dossier racine dans Cloud où les livres seront stockés
const BOOKS_ROOT_FOLDER = '/clustica_books';

// Fonction pour obtenir le chemin du dossier spécifique à un utilisateur
function getUserBooksFolder(userId: number | string): string {
  return `${BOOKS_ROOT_FOLDER}/user_${userId}`;
}

// Événements liés au token
export interface TokenExpirationEvent {
  type: 'token_expired';
}

export type CloudServiceEvent = TokenExpirationEvent;

export interface UserProfileData {
  userId: number;
  email: string;
  displayName: string | null;
  plan: 'free' | 'premium';
  booksCreated: number;
  aiBooksCreated: number;
  createdAt: string;
  updatedAt: string;
}

type EventListener = (event: CloudServiceEvent) => void;

export class CloudService {
  private static dbx: Dropbox;
  private static isTokenExpired: boolean = false;
  private static eventListeners: EventListener[] = [];
  
  // Codes d'erreur Cloud connus pour les problèmes d'authentification
  private static AUTH_ERROR_CODES = [
    'expired_access_token',
    'invalid_access_token',
    'invalid_token',
    'user_no_auth',
    'auth_error'
  ];

  /**
   * Vérifie si le token Cloud est expiré
   */
  static isExpired(): boolean {
    return this.isTokenExpired;
  }
  
  /**
   * Marque le token comme expiré
   */
  static setTokenExpired(): void {
    this.isTokenExpired = true;
    console.log('[cloud] ⚠️ Token marqué comme expiré');
    
    // Notifier les écouteurs d'événements
    this.notifyListeners({ type: 'token_expired' });
  }

  /**
   * Réinitialise l'état du token (utilisé après avoir mis à jour le token)
   */
  static resetTokenState(): void {
    this.isTokenExpired = false;
    console.log('[cloud] ✅ État du token réinitialisé');
  }
  
  /**
   * Ajoute un écouteur pour les événements du service Cloud
   */
  static addEventListener(listener: EventListener): void {
    this.eventListeners.push(listener);
  }
  
  /**
   * Supprime un écouteur d'événements
   */
  static removeEventListener(listener: EventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }
  
  /**
   * Notifie tous les écouteurs enregistrés d'un événement
   */
  private static notifyListeners(event: CloudServiceEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[cloud] Erreur lors de la notification d\'un écouteur:', error);
      }
    });
  }
  
  /**
   * Vérifie si une erreur est liée à l'authentification Cloud
   * @private
   */
  static checkForAuthError(error: any): boolean {
    // Vérification explicite de tous les types d'erreurs d'authentification Cloud connus
    const isAuthError = 
      // Erreur HTTP 401 Unauthorized
      (error && typeof error === 'object' && 'status' in error && error.status === 401) ||
      // Message d'erreur d'authentification
      (error && typeof error === 'object' && 'error' in error && 
        typeof error.error === 'object' && 
        'error_summary' in error.error && 
        this.AUTH_ERROR_CODES.some(code => String(error.error.error_summary).includes(code))
      ) ||
      // Erreur dans le résultat
      (error && typeof error === 'object' && 'result' in error && 
        typeof error.result === 'object' && 
        'error' in error.result && 
        typeof error.result.error === 'string' && 
        this.AUTH_ERROR_CODES.some(code => String(error.result.error).includes(code))
      ) ||
      // Chaîne d'erreur contenant des mots-clés
      (error && typeof error === 'string' && 
        (
          this.AUTH_ERROR_CODES.some(code => error.includes(code)) ||
          error.includes('401')
        )
      ) ||
      // Vérifier le message dans l'objet Error
      (error && error instanceof Error && 
        (
          this.AUTH_ERROR_CODES.some(code => error.message.includes(code)) ||
          error.message.includes('401')
        )
      );
    
    if (isAuthError) {
      // Marquer le token comme expiré
      this.setTokenExpired();
      return true;
    }
    
    return false;
  }

  /**
   * Initialise la connexion Cloud avec les identifiants d'application
   */
  static initialize(): void {
    try {
      // Récupérer les tokens dans les variables d'environnement
      const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
      const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
      const clientId = process.env.DROPBOX_APP_KEY;
      const clientSecret = process.env.DROPBOX_APP_SECRET;
      
      // Vérifier qu'au moins un mode d'authentification est disponible
      if (!accessToken && !refreshToken) {
        throw new Error('Token d\'accès Cloud manquant. Vous devez fournir DROPBOX_ACCESS_TOKEN ou DROPBOX_REFRESH_TOKEN.');
      }
      
      // Configurer Cloud
      const config: any = {};
      
      // Si un token d'accès est disponible, l'utiliser en priorité
      if (accessToken) {
        config.accessToken = accessToken;
        console.log('[cloud] ✅ Variable d\'environnement DROPBOX_ACCESS_TOKEN détectée');
      }
      
      // Si on a un refresh token, configurer les paramètres pour le refresh automatique
      if (refreshToken && clientId && clientSecret) {
        config.clientId = clientId;
        config.clientSecret = clientSecret;
        config.refreshToken = refreshToken;
        console.log('[cloud] ✅ Variables d\'environnement pour refresh token détectées');
      }
      
      // Création de l'instance Cloud
      this.dbx = new Dropbox(config);
      
      this.isTokenExpired = false;
      console.log('[cloud] ✅ Service Cloud initialisé avec succès');
    } catch (error) {
      console.error('[cloud] ❌ Erreur lors de l\'initialisation du service Cloud:', error);
      throw new Error('Impossible d\'initialiser le service Cloud. Vérifiez vos variables d\'environnement.');
    }
  }

  /**
   * Vérifie si le dossier racine des livres existe, sinon le crée
   */
  static async ensureRootFolderExists(): Promise<void> {
    try {
      // Vérifier si le token est déjà marqué comme expiré
      if (this.isExpired()) {
        throw new Error('Token Cloud expiré. Impossible de vérifier ou créer le dossier racine.');
      }
      
      // Vérifie si le dossier racine existe
      await this.dbx.filesGetMetadata({
        path: BOOKS_ROOT_FOLDER
      });
    } catch (error) {
      // Vérifier si c'est une erreur d'authentification
      if (this.checkForAuthError(error)) {
        throw new Error('Token Cloud expiré ou invalide. Impossible de vérifier ou créer le dossier racine.');
      }
      
      // Si le dossier n'existe pas, on le crée
      try {
        await this.dbx.filesCreateFolderV2({
          path: BOOKS_ROOT_FOLDER,
          autorename: false
        });
        console.log(`Dossier racine ${BOOKS_ROOT_FOLDER} créé dans Cloud`);
      } catch (createError) {
        // Vérifier si c'est une erreur d'authentification lors de la création
        this.checkForAuthError(createError);
        throw createError;
      }
    }
  }

  /**
   * Vérifie si le dossier d'un utilisateur existe, sinon le crée
   */
  static async ensureUserFolderExists(userId: number | string): Promise<void> {
    try {
      // Assure d'abord que le dossier racine existe
      await this.ensureRootFolderExists();
      
      const userFolder = getUserBooksFolder(userId);
      
      // Vérifie si le dossier de l'utilisateur existe
      await this.dbx.filesGetMetadata({
        path: userFolder
      });
    } catch (error) {
      // Si le dossier n'existe pas, on le crée
      const userFolder = getUserBooksFolder(userId);
      await this.dbx.filesCreateFolderV2({
        path: userFolder,
        autorename: false
      });
      console.log(`Dossier utilisateur ${userFolder} créé dans Cloud`);
    }
  }

  /**
   * Sauvegarde le contenu d'un livre dans Cloud dans le dossier de l'utilisateur
   */
  static async saveBook(bookId: number, content: BookContent, userId?: number | string): Promise<void> {
    try {
      // Si userId n'est pas fourni, on utilise l'ID de l'utilisateur du livre si disponible
      const userIdToUse = userId || content.userId;
      
      // Vérification que toutes les données nécessaires sont présentes
      if (!content.title) {
        content.title = "Livre sans titre";
      }
      
      if (!content.author) {
        content.author = "Auteur inconnu";
      }
      
      if (!content.chapters || !Array.isArray(content.chapters)) {
        content.chapters = [];
      }
      
      // Ajouter l'ID utilisateur au contenu pour les futures récupérations
      if (userIdToUse && !content.userId) {
        content.userId = userIdToUse;
      }
      
      if (!userIdToUse) {
        // Compatibilité avec les anciens livres sans userId
        await this.ensureRootFolderExists();
        
        const filePath = `${BOOKS_ROOT_FOLDER}/book_${bookId}.json`;
        const contentStr = JSON.stringify(content, null, 2);
        
        await this.dbx.filesUpload({
          path: filePath,
          contents: contentStr,
          mode: { '.tag': 'overwrite' }
        });
        
        console.log(`Livre ${bookId} sauvegardé dans le dossier racine Cloud: ${filePath}`);
      } else {
        // Crée le dossier utilisateur si nécessaire
        await this.ensureUserFolderExists(userIdToUse);
        
        // Chemin du fichier dans le dossier de l'utilisateur
        const userFolder = getUserBooksFolder(userIdToUse);
        const filePath = `${userFolder}/book_${bookId}.json`;
        const contentStr = JSON.stringify(content, null, 2);
        
        await this.dbx.filesUpload({
          path: filePath,
          contents: contentStr,
          mode: { '.tag': 'overwrite' }
        });
        
        console.log(`Livre ${bookId} sauvegardé dans le dossier utilisateur Cloud: ${filePath}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du livre sur Cloud:', error);
      throw new Error('Impossible de sauvegarder le livre sur Cloud');
    }
  }

  /**
   * Récupère le contenu d'un livre depuis Cloud
   * Si userId est fourni, recherche d'abord dans le dossier de l'utilisateur
   */
  static async getBook(bookId: number, userId?: number | string): Promise<BookContent | null> {
    try {
      // Définir le chemin du fichier en fonction de userId
      let filePath: string;
      let content: BookContent | null = null;
      
      // Essayer d'abord dans le dossier de l'utilisateur si un userId est fourni
      if (userId) {
        try {
          const userFolder = getUserBooksFolder(userId);
          filePath = `${userFolder}/book_${bookId}.json`;
          
          // S'assurer que le dossier utilisateur existe
          await this.ensureUserFolderExists(userId);
          
          content = await this.downloadAndParseBook(filePath);
          if (content) {
            console.log(`Livre ${bookId} trouvé dans le dossier de l'utilisateur ${userId}`);
            return content;
          }
        } catch (userFolderError) {
          console.log(`Livre ${bookId} non trouvé dans le dossier de l'utilisateur ${userId}, recherche dans le dossier racine...`);
        }
      }
      
      // Si le livre n'a pas été trouvé dans le dossier utilisateur ou si pas d'userId,
      // essayer dans le dossier racine
      try {
        filePath = `${BOOKS_ROOT_FOLDER}/book_${bookId}.json`;
        content = await this.downloadAndParseBook(filePath);
        if (content) {
          console.log(`Livre ${bookId} trouvé dans le dossier racine`);
          return content;
        }
      } catch (rootFolderError) {
        console.log(`Livre ${bookId} non trouvé dans le dossier racine`);
      }
      
      // Si on arrive ici, c'est que le livre n'a pas été trouvé
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du livre ${bookId} depuis Cloud:`, error);
      return null;
    }
  }
  
  /**
   * Télécharge et parse un fichier JSON depuis Cloud
   * @private
   */
  private static async downloadAndParseBook(filePath: string): Promise<BookContent | null> {
    try {
      const response = await this.dbx.filesDownload({
        path: filePath
      });
      
      // Les définitions de type pour filesDownload peuvent varier
      // Nous devons accéder directement au contenu téléchargé
      let contentText = '';
      const data = response.result as files.FileMetadata;
      
      if (typeof Buffer !== 'undefined' && (data as any).fileBinary) {
        // Environnement Node.js
        contentText = (data as any).fileBinary.toString('utf8');
      } else if ((data as any).fileBlob) {
        // Environnement navigateur
        const fileBlob = (data as any).fileBlob;
        contentText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = function() {
            resolve(reader.result as string);
          };
          reader.readAsText(fileBlob);
        });
      } else {
        // Autre méthode pour accéder au contenu
        const content = JSON.stringify(data);
        // Supprime les métadonnées pour extraire le contenu réel
        const contentMatchResult = content.match(/"content":"(.+?)(?<!\\)"(?:,|})/) || 
                                  content.match(/"content":(.+?)(?:,|})/);
        
        if (contentMatchResult && contentMatchResult[1]) {
          contentText = contentMatchResult[1].replace(/\\"/g, '"');
          try {
            // Si c'est du JSON encodé, décodons-le
            contentText = JSON.parse(contentText);
          } catch {
            // Sinon gardons-le tel quel
          }
        } else {
          console.error("Impossible d'extraire le contenu de la réponse Cloud");
        }
      }
      
      if (!contentText) {
        throw new Error("Impossible de lire le contenu du fichier depuis Cloud");
      }
      
      // Parse le contenu JSON
      return typeof contentText === 'string' 
        ? JSON.parse(contentText) as BookContent 
        : contentText as BookContent;
    } catch (error) {
      console.error(`Erreur lors du téléchargement/parsing du fichier ${filePath}:`, error);
      
      // Vérifier si c'est une erreur d'authentification
      this.checkForAuthError(error);
      
      return null;
    }
  }

  /**
   * Supprime un livre de Cloud
   * Si userId est fourni, supprime dans le dossier de l'utilisateur
   */
  static async deleteBook(bookId: number, userId?: number | string): Promise<boolean> {
    try {
      // Vérifier si le token est déjà marqué comme expiré
      if (this.isExpired()) {
        throw new Error('Token Cloud expiré. Impossible de supprimer le livre.');
      }
      
      // Définir le chemin du fichier en fonction de userId
      let filePath: string;
      
      if (userId) {
        // Chemin dans le dossier de l'utilisateur
        const userFolder = getUserBooksFolder(userId);
        filePath = `${userFolder}/book_${bookId}.json`;
      } else {
        // Chemin dans le dossier racine (compatibilité avec les anciens livres)
        filePath = `${BOOKS_ROOT_FOLDER}/book_${bookId}.json`;
      }
      
      await this.dbx.filesDeleteV2({
        path: filePath
      });
      
      console.log(`Livre ${bookId} supprimé de Cloud`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du livre ${bookId} de Cloud:`, error);
      
      // Vérifier si c'est une erreur d'authentification
      this.checkForAuthError(error);
      
      return false;
    }
  }

  /**
   * Liste tous les livres stockés dans Cloud
   * Si userId est fourni, liste uniquement les livres de cet utilisateur
   */
  static async listBooks(userId?: number | string): Promise<{ id: number, path: string, userId?: number | string }[]> {
    try {
      const books: { id: number, path: string, userId?: number | string }[] = [];
      
      // Vérifier si le token est déjà marqué comme expiré
      if (this.isExpired()) {
        throw new Error('Token Cloud expiré. Impossible de lister les livres.');
      }
      
      if (userId) {
        // Si userId est fourni, lister uniquement les livres de cet utilisateur
        const userFolder = getUserBooksFolder(userId);
        
        try {
          // S'assurer que le dossier utilisateur existe
          await this.ensureUserFolderExists(userId);
          
          // Lister les fichiers dans le dossier de l'utilisateur
          const result = await this.dbx.filesListFolder({
            path: userFolder
          });
          
          for (const entry of result.result.entries) {
            if (entry['.tag'] === 'file' && entry.name.startsWith('book_') && entry.name.endsWith('.json')) {
              const bookIdMatch = entry.name.match(/book_(\d+)\.json/);
              if (bookIdMatch && bookIdMatch[1]) {
                const bookId = parseInt(bookIdMatch[1]);
                if (!isNaN(bookId)) {
                  books.push({ id: bookId, path: entry.path_lower || entry.path_display || '', userId });
                }
              }
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la liste des livres de l'utilisateur ${userId}:`, error);
          // Vérifier si c'est une erreur d'authentification
          this.checkForAuthError(error);
          // Ne pas bloquer l'opération complète, continuer avec la liste racine
        }
      }
      
      // Si aucun userId n'est fourni ou si l'on souhaite également lister les livres racine
      if (!userId || books.length === 0) {
        try {
          const rootBooks = await this.listRootBooks();
          books.push(...rootBooks);
        } catch (error) {
          console.error('Erreur lors de la liste des livres racine:', error);
          // Vérifier si c'est une erreur d'authentification
          this.checkForAuthError(error);
        }
      }
      
      return books;
    } catch (error) {
      console.error('Erreur lors de la liste des livres:', error);
      return [];
    }
  }

  /**
   * Méthodes d'accès à l'API Cloud à travers l'objet dbx
   */
  static async filesDownload(args: any): Promise<any> {
    return this.dbx.filesDownload(args);
  }

  static async filesUpload(args: any): Promise<any> {
    return this.dbx.filesUpload(args);
  }

  /**
   * Liste les livres stockés à la racine du dossier Cloud (anciens livres)
   * @private
   */
  private static async listRootBooks(): Promise<{ id: number, path: string }[]> {
    // S'assurer que le dossier racine existe
    await this.ensureRootFolderExists();
    
    // Lister les fichiers dans le dossier racine
    const result = await this.dbx.filesListFolder({
      path: BOOKS_ROOT_FOLDER
    });
    
    const books: { id: number, path: string }[] = [];
    
    for (const entry of result.result.entries) {
      if (entry['.tag'] === 'file' && entry.name.startsWith('book_') && entry.name.endsWith('.json')) {
        const bookIdMatch = entry.name.match(/book_(\d+)\.json/);
        if (bookIdMatch && bookIdMatch[1]) {
          const bookId = parseInt(bookIdMatch[1]);
          if (!isNaN(bookId)) {
            books.push({ id: bookId, path: entry.path_lower || entry.path_display || '' });
          }
        }
      }
    }
    
    return books;
  }
}

/**
 * Gère le profil des utilisateurs dans Cloud
 * Maintient un fichier protégé pour chaque utilisateur avec son plan et ses statistiques
 */
export class UserProfileManager {
  private static readonly PROFILE_FILENAME = "user_profile.json";

  /**
   * Construit le chemin vers le fichier de profil d'un utilisateur
   */
  private static getProfilePath(userId: number | string): string {
    return `${getUserBooksFolder(userId)}/${this.PROFILE_FILENAME}`;
  }

  /**
   * Récupère le profil d'un utilisateur depuis Cloud
   * Si le profil n'existe pas, en crée un nouveau avec des valeurs par défaut
   */
  static async getUserProfile(userId: number | string, email?: string): Promise<UserProfileData> {
    try {
      // S'assurer que le dossier utilisateur existe
      await CloudService.ensureUserFolderExists(userId);
      
      const profilePath = this.getProfilePath(userId);
      
      try {
        // Essayer de récupérer le profil
        const response = await CloudService.filesDownload({
          path: profilePath
        });
        
        let profileText = '';
        const data = response.result as files.FileMetadata;
        
        if (typeof Buffer !== 'undefined' && (data as any).fileBinary) {
          // Environnement Node.js
          profileText = (data as any).fileBinary.toString('utf8');
        } else if ((data as any).fileBlob) {
          // Environnement navigateur
          const fileBlob = (data as any).fileBlob;
          profileText = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function() {
              resolve(reader.result as string);
            };
            reader.readAsText(fileBlob);
          });
        }
        
        if (!profileText) {
          throw new Error("Impossible de lire le contenu du fichier profile depuis Cloud");
        }
        
        // Parser le profil JSON
        const profile = JSON.parse(profileText) as Partial<UserProfileData>;
        console.log(`Profil utilisateur ${userId} récupéré depuis Cloud`);
        
        // Valider et compléter le profil avec les valeurs par défaut si nécessaire
        return this.validateAndUpdateProfile(profile, userId, email);
      } catch (error) {
        // Si le profil n'existe pas ou s'il y a une erreur, créer un nouveau profil
        return await this.createDefaultProfile(userId, email);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil utilisateur ${userId}:`, error);
      // En cas d'erreur, retourner un profil par défaut pour ne pas bloquer l'application
      return this.getDefaultProfile(userId, email);
    }
  }

  /**
   * Crée un profil par défaut pour un utilisateur
   */
  private static async createDefaultProfile(userId: number | string, email?: string): Promise<UserProfileData> {
    try {
      const profile = this.getDefaultProfile(userId, email);
      
      // Sauvegarder le profil dans Cloud
      const result = await this.saveUserProfile(profile);
      
      if (result) {
        console.log(`Profil Cloud créé pour l'utilisateur ${userId}:`, profile);
        return profile;
      } else {
        throw new Error("Échec de la sauvegarde du profil utilisateur");
      }
    } catch (error) {
      console.error(`Erreur lors de la création du profil utilisateur ${userId}:`, error);
      return this.getDefaultProfile(userId, email);
    }
  }

  /**
   * Retourne un objet de profil par défaut
   */
  private static getDefaultProfile(userId: number | string, email?: string): UserProfileData {
    const now = new Date().toISOString();
    return {
      userId: typeof userId === 'string' ? parseInt(userId) : userId,
      email: email || '',
      displayName: null,
      plan: 'free',
      booksCreated: 0,
      aiBooksCreated: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Valide un profil utilisateur et ajoute des champs manquants si nécessaire
   */
  private static validateAndUpdateProfile(profile: Partial<UserProfileData>, userId: number | string, email?: string): UserProfileData {
    const now = new Date().toISOString();
    userId = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const validatedProfile: UserProfileData = {
      userId: profile.userId !== undefined ? profile.userId : userId,
      email: profile.email || email || '',
      displayName: profile.displayName || null,
      plan: profile.plan || 'free',
      booksCreated: profile.booksCreated || 0,
      aiBooksCreated: profile.aiBooksCreated || 0,
      createdAt: profile.createdAt || now,
      updatedAt: now // Toujours mettre à jour la date de dernière modification
    };
    
    return validatedProfile;
  }

  /**
   * Sauvegarde le profil d'un utilisateur dans Cloud
   */
  static async saveUserProfile(profile: UserProfileData): Promise<boolean> {
    try {
      // S'assurer que le dossier utilisateur existe
      await CloudService.ensureUserFolderExists(profile.userId);
      
      const profilePath = this.getProfilePath(profile.userId);
      const profileContent = JSON.stringify(profile, null, 2);
      
      await CloudService.filesUpload({
        path: profilePath,
        contents: profileContent,
        mode: { '.tag': 'overwrite' }
      });
      
      console.log(`Profil utilisateur ${profile.userId} sauvegardé dans Cloud`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du profil utilisateur ${profile.userId}:`, error);
      return false;
    }
  }

  /**
   * Met à jour le plan d'un utilisateur (free ou premium)
   */
  static async updateUserPlan(userId: number | string, plan: 'free' | 'premium'): Promise<UserProfileData | null> {
    try {
      const profile = await this.getUserProfile(userId);
      profile.plan = plan;
      profile.updatedAt = new Date().toISOString();
      
      const saved = await this.saveUserProfile(profile);
      return saved ? profile : null;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du plan utilisateur ${userId}:`, error);
      return null;
    }
  }

  /**
   * Incrémente le compteur de livres créés pour un utilisateur
   */
  static async incrementBooksCreated(userId: number | string): Promise<UserProfileData | null> {
    try {
      const profile = await this.getUserProfile(userId);
      profile.booksCreated = (profile.booksCreated || 0) + 1;
      profile.updatedAt = new Date().toISOString();
      
      const saved = await this.saveUserProfile(profile);
      return saved ? profile : null;
    } catch (error) {
      console.error(`Erreur lors de l'incrémentation du compteur de livres pour l'utilisateur ${userId}:`, error);
      return null;
    }
  }

  /**
   * Incrémente le compteur de livres IA créés pour un utilisateur
   */
  static async incrementAIBooksCreated(userId: number | string): Promise<UserProfileData | null> {
    try {
      const profile = await this.getUserProfile(userId);
      profile.aiBooksCreated = (profile.aiBooksCreated || 0) + 1;
      profile.updatedAt = new Date().toISOString();
      
      const saved = await this.saveUserProfile(profile);
      return saved ? profile : null;
    } catch (error) {
      console.error(`Erreur lors de l'incrémentation du compteur de livres IA pour l'utilisateur ${userId}:`, error);
      return null;
    }
  }

  /**
   * Met à jour les informations de profil d'un utilisateur
   */
  static async updateUserInfo(userId: number | string, info: Partial<UserProfileData>): Promise<UserProfileData | null> {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Mettre à jour uniquement les champs fournis
      if (info.displayName !== undefined) profile.displayName = info.displayName;
      if (info.email !== undefined) profile.email = info.email;
      if (info.plan !== undefined) profile.plan = info.plan;
      if (info.booksCreated !== undefined) profile.booksCreated = info.booksCreated;
      if (info.aiBooksCreated !== undefined) profile.aiBooksCreated = info.aiBooksCreated;
      
      profile.updatedAt = new Date().toISOString();
      
      const saved = await this.saveUserProfile(profile);
      return saved ? profile : null;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des informations utilisateur ${userId}:`, error);
      return null;
    }
  }

  /**
   * Vérifie si un utilisateur est premium
   */
  static async isUserPremium(userId: number | string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile.plan === 'premium';
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut premium de l'utilisateur ${userId}:`, error);
      return false;
    }
  }

  /**
   * Compte le nombre de livres créés par l'utilisateur
   */
  static async getUserBooksCount(userId: number | string): Promise<{ total: number, ai: number }> {
    try {
      const profile = await this.getUserProfile(userId);
      return {
        total: profile.booksCreated || 0,
        ai: profile.aiBooksCreated || 0
      };
    } catch (error) {
      console.error(`Erreur lors du comptage des livres de l'utilisateur ${userId}:`, error);
      return { total: 0, ai: 0 };
    }
  }
}