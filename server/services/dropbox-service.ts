import { Dropbox, files } from 'dropbox';
import { BookContent } from '@shared/schema';

// Emplacement du dossier racine dans Dropbox où les livres seront stockés
const BOOKS_ROOT_FOLDER = '/clustica_books';

// Fonction pour obtenir le chemin du dossier spécifique à un utilisateur
function getUserBooksFolder(userId: number | string): string {
  return `${BOOKS_ROOT_FOLDER}/user_${userId}`;
}

export class DropboxService {
  private static dbx: Dropbox;

  /**
   * Initialise la connexion Dropbox avec les identifiants d'application
   */
  static initialize(): void {
    // Utilisez les valeurs des variables d'environnement ou les valeurs par défaut fournies par l'utilisateur
    const appKey = process.env.DROPBOX_APP_KEY || 'g3lekas6q1y461d';
    const appSecret = process.env.DROPBOX_APP_SECRET || 'ngfbyt2hgst4fzx';
    
    // Le token fourni est un accessToken et non un refreshToken
    const accessToken = process.env.DROPBOX_REFRESH_TOKEN || 'sl.u.AFqjuDyQBWkseNZZglc-Ol4_vu-UjIlXDJKHNJJED-Uw_oScHRaGsJBcrWdmAaYHYJp0yuGNH_-DdqESBU_N5_Qi33q2SE6sl7KgFQljv-SHacpIqK25-qQpsGdZVTkMSYQYDLeudX1gn8BW7dTtADX5rg0bGS6fIDoC230Zu8t7OEVpaq2Tnh7Yvuah4eXMO_XzI3WVNf0Fg-Mo5OEnP2W6znOsdh3Lnjw6U05gDz1jqsbwVMpEXf7gi4MuejQmhMKG9swjE6jDgI3oaKUCgP3Kacr0nbnV4KtvfzOBlQ_pqjgNy0LcMHbV_0zm09oSgb8RsrovEO-jtXFqYik0jPtSPdIfXCk1z-k-CTp4pqqNjSVPwTkWy8WskdUrqpPHVjeKwsGOcfCAxVuTKfvmKtZq-l4W812bREqci4rMMZ9jo62AOdADwaDl5JRwEZJqoxkHCOrE31l916pwyYcosYi4Nk9KJ1a7i7u3Bwt7Pls_CHWBndaCv0xkg5QmKUnl27Bo2qDHdgWdhpXcgupB6BDCvPdJurYN7YEOfYM-yP0gavKrYvGw3K7azzGeHf6LdHWD_OO_mS1riJJ0ALPA3_BqwiMXs7Y0Qs4LjuBM0sIKe3iz23htSOF3q3b6khAO7RyXWnkD4-QKG3WaBFXo9IYKEalGed8Iuu_BlPOha6l-F-EpOnDD7QHj5NSKAtuY_fCvkBzYKp02zYftDEUmMkP0ORsi9yxfei8C6eoxAkh6KHmYSiNrpgQQknhJORfAEXf2HdkznZcv43xU-z55yWIelzWmVioA7vLbZa3SkD7jbcnJ01j9Dzb6riZSBmdbZ33jR7tTdT-BX_yOdyM-HwvjZZUOpjNQdV2UzQ1s9Ux36Oz8oVtjnG_5mubzANvzARD8W14WNpgPurkufQzCRk0w5sZwRmv_f4iel-CX5mXDgObZ2btyJyg27Wcics2-hkUOONxYpHshKWCFbPuWC-QeBo52QAB5Cc_TROXUxJmJjOVkAZH2vUOjsHqdt-owIKfsgjC6m9rOVPSqWtLF6yHU7R9cbU-oFah6n1eFY3SYuJp-S7uBNt5F8uAqqBMzgHmeah694t6P7B7fNdKpv71yHMRMCIORoEczAJ3_Mr9KESmPDlzIsAaCWxEBDHD7R0qvBnH-CG1Lky4rNnfXlEey9z90jLGhMC-4iTLTzVH0DiU6Q5Ni3Nf3a3tjld5uA7csTpEx71YBu1WbG_qkbtF3eJQM5-BUT1Otk1yyKJf7wtARzEQmy3-CA8IZvXmr0iVCGIk5ZLE1cgSvC55YQxvA0sYYiQggKoAOeQ9Qj9WpkXYMJWgHYKX7lo8N3ss2F_ZOs3XmLUjMh_RsggAOsU7cxVNGEUboETkAgEYac-ktaNnwQeaDLqaIBuSse3VNb2ZyqXPyZH0Zg-taEf46YH3j';

    try {
      // Utiliser l'accessToken directement, sans refreshToken
      this.dbx = new Dropbox({
        accessToken: accessToken
      });
      
      console.log('Service Dropbox initialisé avec accessToken');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service Dropbox:', error);
      throw new Error('Impossible d\'initialiser le service Dropbox');
    }
  }

  /**
   * Vérifie si le dossier racine des livres existe, sinon le crée
   */
  static async ensureRootFolderExists(): Promise<void> {
    try {
      // Vérifie si le dossier racine existe
      await this.dbx.filesGetMetadata({
        path: BOOKS_ROOT_FOLDER
      });
    } catch (error) {
      // Si le dossier n'existe pas, on le crée
      await this.dbx.filesCreateFolderV2({
        path: BOOKS_ROOT_FOLDER,
        autorename: false
      });
      console.log(`Dossier racine ${BOOKS_ROOT_FOLDER} créé dans Dropbox`);
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
      console.log(`Dossier utilisateur ${userFolder} créé dans Dropbox`);
    }
  }

  /**
   * Sauvegarde le contenu d'un livre dans Dropbox dans le dossier de l'utilisateur
   */
  static async saveBook(bookId: number, content: BookContent, userId?: number | string): Promise<void> {
    try {
      // Si userId n'est pas fourni, on utilise l'ID de l'utilisateur du livre si disponible
      const userIdToUse = userId || content.userId;
      
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
      }
      
      console.log(`Livre ${bookId} sauvegardé sur Dropbox`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du livre sur Dropbox:', error);
      throw new Error('Impossible de sauvegarder le livre sur Dropbox');
    }
  }

  /**
   * Récupère le contenu d'un livre depuis Dropbox
   * Si userId est fourni, recherche d'abord dans le dossier de l'utilisateur
   */
  static async getBook(bookId: number, userId?: number | string): Promise<BookContent | null> {
    try {
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
          console.error("Impossible d'extraire le contenu de la réponse Dropbox");
        }
      }
      
      if (!contentText) {
        throw new Error("Impossible de lire le contenu du fichier depuis Dropbox");
      }
      
      // Parse le contenu JSON
      return typeof contentText === 'string' 
        ? JSON.parse(contentText) as BookContent 
        : contentText as BookContent;
    } catch (error) {
      console.error(`Erreur lors de la récupération du livre ${bookId} depuis Dropbox:`, error);
      // Si le fichier n'existe pas, on retourne null plutôt que de lancer une erreur
      return null;
    }
  }

  /**
   * Supprime un livre de Dropbox
   * Si userId est fourni, supprime dans le dossier de l'utilisateur
   */
  static async deleteBook(bookId: number, userId?: number | string): Promise<boolean> {
    try {
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
      
      console.log(`Livre ${bookId} supprimé de Dropbox`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du livre ${bookId} de Dropbox:`, error);
      return false;
    }
  }

  /**
   * Liste tous les livres stockés dans Dropbox
   * Si userId est fourni, liste uniquement les livres de cet utilisateur
   */
  static async listBooks(userId?: number | string): Promise<{ id: number, path: string, userId?: number | string }[]> {
    try {
      if (userId) {
        // Liste uniquement les livres de l'utilisateur spécifié
        const userFolder = getUserBooksFolder(userId);
        
        try {
          // Vérifie d'abord si le dossier utilisateur existe
          await this.ensureUserFolderExists(userId);
          
          const response = await this.dbx.filesListFolder({
            path: userFolder
          });
          
          return response.result.entries
            .filter(entry => entry['.tag'] === 'file' && entry.name.endsWith('.json'))
            .map(entry => {
              // Extrait l'ID du livre à partir du nom de fichier (book_123.json -> 123)
              const match = entry.name.match(/book_(\d+)\.json/);
              const id = match ? parseInt(match[1]) : 0;
              return { 
                id, 
                path: entry.path_display || '',
                userId: userId
              };
            })
            .filter(book => book.id > 0); // Filtre les livres avec ID valide
        } catch (error) {
          console.error(`Erreur lors du listage des livres de l'utilisateur ${userId}:`, error);
          return [];
        }
      } else {
        // Liste tous les livres (y compris ceux dans les dossiers utilisateurs)
        await this.ensureRootFolderExists();
        
        // D'abord, récupérer les livres à la racine
        const rootBooks = await this.listRootBooks();
        
        // Ensuite, récupérer les dossiers utilisateurs
        const foldersResponse = await this.dbx.filesListFolder({
          path: BOOKS_ROOT_FOLDER
        });
        
        const userFolders = foldersResponse.result.entries
          .filter(entry => entry['.tag'] === 'folder' && entry.name.startsWith('user_'));
        
        // Pour chaque dossier utilisateur, récupérer les livres
        const userBooksPromises = userFolders.map(async (folder) => {
          const userIdMatch = folder.name.match(/user_(\d+)/);
          if (!userIdMatch) return [];
          
          const userId = userIdMatch[1];
          const folderPath = folder.path_display || '';
          
          try {
            const response = await this.dbx.filesListFolder({
              path: folderPath
            });
            
            return response.result.entries
              .filter(entry => entry['.tag'] === 'file' && entry.name.endsWith('.json'))
              .map(entry => {
                const match = entry.name.match(/book_(\d+)\.json/);
                const id = match ? parseInt(match[1]) : 0;
                return { 
                  id, 
                  path: entry.path_display || '',
                  userId: parseInt(userId)
                };
              })
              .filter(book => book.id > 0);
          } catch (error) {
            console.error(`Erreur lors du listage des livres dans ${folderPath}:`, error);
            return [];
          }
        });
        
        const userBooks = await Promise.all(userBooksPromises);
        
        // Combiner les livres à la racine avec les livres des utilisateurs
        return [...rootBooks, ...userBooks.flat()];
      }
    } catch (error) {
      console.error('Erreur lors du listage des livres sur Dropbox:', error);
      return [];
    }
  }
  
  /**
   * Liste les livres stockés à la racine du dossier Dropbox (anciens livres)
   * @private
   */
  private static async listRootBooks(): Promise<{ id: number, path: string }[]> {
    try {
      const response = await this.dbx.filesListFolder({
        path: BOOKS_ROOT_FOLDER
      });
      
      return response.result.entries
        .filter(entry => entry['.tag'] === 'file' && entry.name.endsWith('.json'))
        .map(entry => {
          // Extrait l'ID du livre à partir du nom de fichier (book_123.json -> 123)
          const match = entry.name.match(/book_(\d+)\.json/);
          const id = match ? parseInt(match[1]) : 0;
          return { 
            id, 
            path: entry.path_display || '' 
          };
        })
        .filter(book => book.id > 0); // Filtre les livres avec ID valide
    } catch (error) {
      console.error('Erreur lors du listage des livres à la racine:', error);
      return [];
    }
  }
}