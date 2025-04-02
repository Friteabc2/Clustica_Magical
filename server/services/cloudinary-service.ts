import { v2 as cloudinary } from 'cloudinary';
import * as crypto from 'crypto';

// Configuration des identifiants Cloudinary
cloudinary.config({
  cloud_name: 'doh47zakc',
  api_key: '996277487595637',
  api_secret: 'Gh0d3OsdKROiEjGB8Vy7aosMKuI'
});

export interface CloudinaryUploadOptions {
  source: Buffer | string;
  folderPath?: string;
  publicId?: string;
  tags?: string[];
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
    quality?: string | number;
    format?: string;
  };
}

/**
 * Service pour gérer l'upload et la manipulation d'images sur Cloudinary
 */
export class CloudinaryService {
  /**
   * Initialise le service Cloudinary
   */
  static initialize() {
    console.log('✅ Service Cloudinary initialisé avec succès');
  }

  /**
   * Télécharge une image sur Cloudinary
   * @param options Options de téléchargement
   * @returns URL de l'image téléchargée
   */
  static async uploadImage(options: CloudinaryUploadOptions): Promise<{ 
    public_id: string; 
    secure_url: string;
    width: number;
    height: number;
  } | null> {
    try {
      // Générer un ID unique si non fourni
      const publicId = options.publicId || `image_${crypto.randomBytes(8).toString('hex')}`;
      const folder = options.folderPath || 'clustica_images';
      
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadOptions: any = {
          public_id: publicId,
          folder: folder,
          overwrite: true,
          resource_type: 'image',
        };
        
        // Ajouter les tags si fournis
        if (options.tags && options.tags.length > 0) {
          uploadOptions.tags = options.tags;
        }
        
        // Ajouter les transformations si fournies
        if (options.transformation) {
          const { width, height, crop, gravity, quality, format } = options.transformation;
          
          if (width) uploadOptions.width = width;
          if (height) uploadOptions.height = height;
          if (crop) uploadOptions.crop = crop;
          if (gravity) uploadOptions.gravity = gravity;
          if (quality) uploadOptions.quality = quality;
          if (format) uploadOptions.format = format;
        }
        
        // Télécharger l'image
        if (typeof options.source === 'string' && options.source.startsWith('data:')) {
          // Source est un Data URL
          cloudinary.uploader.upload(options.source, uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
        } else if (Buffer.isBuffer(options.source)) {
          // Source est un Buffer
          cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }).end(options.source);
        } else if (typeof options.source === 'string') {
          // Source est un chemin de fichier ou une URL
          cloudinary.uploader.upload(options.source, uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
        } else {
          throw new Error('Format de source non pris en charge');
        }
      });
      
      if (uploadResult && uploadResult.secure_url) {
        return {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height
        };
      }
      
      throw new Error('Échec du téléchargement de l\'image sur Cloudinary');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement sur Cloudinary:', error);
      return null;
    }
  }

  /**
   * Génère une URL de transformation pour une image Cloudinary
   * @param publicId ID public de l'image
   * @param options Options de transformation
   * @returns URL transformée
   */
  static getImageUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'crop' | 'scale' | 'pad';
    gravity?: 'auto' | 'face' | 'center';
    quality?: string | number;
    format?: 'webp' | 'png' | 'jpg';
  }): string {
    try {
      let transformation = 'q_auto,f_webp'; // Qualité auto et format webp par défaut
      
      if (options) {
        const { width, height, crop, gravity, quality, format } = options;
        
        if (width) transformation += `,w_${width}`;
        if (height) transformation += `,h_${height}`;
        if (crop) transformation += `,c_${crop}`;
        if (gravity) transformation += `,g_${gravity}`;
        if (quality) transformation += `,q_${quality}`;
        if (format) transformation += `,f_${format}`;
      }
      
      // Construit l'URL avec les transformations
      return `https://res.cloudinary.com/doh47zakc/image/upload/${transformation}/${publicId}`;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'URL Cloudinary:', error);
      return '';
    }
  }

  /**
   * Supprime une image de Cloudinary
   * @param publicId ID public de l'image à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'image sur Cloudinary:', error);
      return false;
    }
  }
}