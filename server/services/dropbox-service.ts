import { Dropbox, files } from 'dropbox';
import { BookContent } from '@shared/schema';

// Emplacement du dossier dans Dropbox où les livres seront stockés
const BOOKS_FOLDER = '/clustica_books';

export class DropboxService {
  private static dbx: Dropbox;

  /**
   * Initialise la connexion Dropbox avec les identifiants d'application
   */
  static initialize(): void {
    const appKey = process.env.DROPBOX_APP_KEY;
    const appSecret = process.env.DROPBOX_APP_SECRET;
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

    if (!appKey || !appSecret || !refreshToken) {
      throw new Error('Les identifiants Dropbox ne sont pas configurés');
    }

    this.dbx = new Dropbox({
      clientId: appKey,
      clientSecret: appSecret,
      refreshToken: refreshToken
    });

    console.log('Service Dropbox initialisé');
  }

  /**
   * Vérifie si le dossier des livres existe, sinon le crée
   */
  static async ensureBooksFolderExists(): Promise<void> {
    try {
      // Vérifie si le dossier existe
      await this.dbx.filesGetMetadata({
        path: BOOKS_FOLDER
      });
    } catch (error) {
      // Si le dossier n'existe pas, on le crée
      await this.dbx.filesCreateFolderV2({
        path: BOOKS_FOLDER,
        autorename: false
      });
      console.log(`Dossier ${BOOKS_FOLDER} créé dans Dropbox`);
    }
  }

  /**
   * Sauvegarde le contenu d'un livre dans Dropbox
   */
  static async saveBook(bookId: number, content: BookContent): Promise<void> {
    try {
      await this.ensureBooksFolderExists();
      
      const filePath = `${BOOKS_FOLDER}/book_${bookId}.json`;
      const contentStr = JSON.stringify(content, null, 2);
      
      await this.dbx.filesUpload({
        path: filePath,
        contents: contentStr,
        mode: { '.tag': 'overwrite' }
      });
      
      console.log(`Livre ${bookId} sauvegardé sur Dropbox`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du livre sur Dropbox:', error);
      throw new Error('Impossible de sauvegarder le livre sur Dropbox');
    }
  }

  /**
   * Récupère le contenu d'un livre depuis Dropbox
   */
  static async getBook(bookId: number): Promise<BookContent | null> {
    try {
      const filePath = `${BOOKS_FOLDER}/book_${bookId}.json`;
      
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
   */
  static async deleteBook(bookId: number): Promise<boolean> {
    try {
      const filePath = `${BOOKS_FOLDER}/book_${bookId}.json`;
      
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
   */
  static async listBooks(): Promise<{ id: number, path: string }[]> {
    try {
      await this.ensureBooksFolderExists();
      
      const response = await this.dbx.filesListFolder({
        path: BOOKS_FOLDER
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
      console.error('Erreur lors du listage des livres sur Dropbox:', error);
      return [];
    }
  }
}