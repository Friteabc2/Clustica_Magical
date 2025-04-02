import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';

/**
 * Interface pour les options de téléchargement d'image
 */
export interface PostImageUploadOptions {
  source: Buffer | string; // Données binaires (Buffer) ou URL d'image
  title?: string;
  description?: string;
  tags?: string[];
  nsfw?: boolean;
}

/**
 * Interface pour la réponse du téléchargement d'image
 */
export interface PostImageResponse {
  url: string;
  display_url: string;
  thumb_url?: string;
  delete_url?: string;
}

/**
 * Service pour télécharger des images sur PostImage.me
 */
export class PostImagesService {
  private static readonly API_KEY = process.env.POSTIMAGES_API_KEY || '442c1196f61793728f933be13f35cba416756a1598c5f5e1f97a0316c24db0ae'; // Clé publique par défaut
  private static readonly API_URL = 'https://postimages.me/api/1/upload';
  
  /**
   * Initialise le service PostImages
   */
  static initialize() {
    if (this.API_KEY) {
      console.log('✅ Service PostImages initialisé');
    } else {
      console.warn('⚠️ Service PostImages initialisé avec la clé API publique');
    }
  }
  
  /**
   * Télécharge une image sur PostImage.me
   * @param options Options de téléchargement
   * @returns URL de l'image téléchargée ou null en cas d'erreur
   */
  static async uploadImage(options: PostImageUploadOptions): Promise<PostImageResponse | null> {
    try {
      const formData = new FormData();
      
      if (typeof options.source === 'string' && options.source.startsWith('http')) {
        // Si c'est une URL, on l'envoie directement
        formData.append('source', options.source);
      } else if (Buffer.isBuffer(options.source)) {
        // Si c'est un Buffer, on crée un nom de fichier unique et on l'ajoute au formulaire
        const hash = crypto.createHash('md5').update(options.source).digest('hex').substring(0, 10);
        const filename = `image_${hash}_${Date.now()}.png`;
        formData.append('source', options.source, { filename });
      } else {
        throw new Error('La source doit être un Buffer ou une URL');
      }
      
      // Ajout des métadonnées
      if (options.title) formData.append('title', options.title);
      if (options.description) formData.append('description', options.description);
      if (options.tags && options.tags.length > 0) formData.append('tags', options.tags.join(','));
      if (options.nsfw !== undefined) formData.append('nsfw', options.nsfw ? '1' : '0');
      
      // Format de retour JSON
      formData.append('format', 'json');
      
      // Envoi de la requête avec l'en-tête d'autorisation
      const response = await axios.post(this.API_URL, formData, {
        headers: {
          'X-API-Key': this.API_KEY,
          ...formData.getHeaders()
        }
      });
      
      // Vérification de la réponse
      if (response.data && response.data.status_code === 200 && response.data.image) {
        return {
          url: response.data.image.url,
          display_url: response.data.image.display_url,
          thumb_url: response.data.image.url_frame || response.data.image.thumb?.url,
          delete_url: response.data.image.delete_url
        };
      }
      
      console.error('❌ Erreur lors du téléchargement de l\'image sur PostImage.me:', response.data);
      return null;
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement de l\'image sur PostImage.me:', error);
      return null;
    }
  }
  
  /**
   * Convertit base64 en Buffer pour le téléchargement
   * @param base64String Chaîne base64 à convertir
   * @returns Buffer des données
   */
  static base64ToBuffer(base64String: string): Buffer {
    return Buffer.from(base64String, 'base64');
  }
}