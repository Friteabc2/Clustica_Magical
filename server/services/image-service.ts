import { BookContent, PageContent } from '@shared/schema';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ImageGenerationOptions {
  prompt: string;
  style?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'panoramic';
  negativePrompt?: string;
}

/**
 * Service pour générer des images avec NetMind.ai
 */
export class ImageService {
  private static readonly API_KEY = process.env.NETMIND_API_KEY;
  private static readonly API_URL = 'https://api.netmind.ai/inference-api/openai/v1/images/generations';
  private static readonly MODEL = 'black-forest-labs/FLUX.1-schnell';
  private static readonly IMAGE_FOLDER = path.join(process.cwd(), 'public', 'generated-images');
  
  /**
   * Initialise le service d'images
   */
  static initialize() {
    // Crée le dossier de stockage des images si nécessaire
    if (!fs.existsSync(this.IMAGE_FOLDER)) {
      fs.mkdirSync(this.IMAGE_FOLDER, { recursive: true });
    }
    
    console.log(`✅ Service d'images initialisé - dossier: ${this.IMAGE_FOLDER}`);
  }
  
  /**
   * Génère une image basée sur un prompt
   */
  static async generateImage(options: ImageGenerationOptions): Promise<string | null> {
    try {
      if (!this.API_KEY) {
        console.error('❌ Clé API NetMind manquante');
        return this.generatePlaceholderImage(options.aspectRatio || 'landscape');
      }
      
      // Ajoute des informations sur le ratio d'aspect au prompt
      let enhancedPrompt = options.prompt;
      let width = 768;
      let height = 512;
      
      // Ajuste les dimensions en fonction du ratio d'aspect
      switch (options.aspectRatio) {
        case 'square':
          enhancedPrompt = `${enhancedPrompt}, square format image`;
          width = 512;
          height = 512;
          break;
        case 'portrait':
          enhancedPrompt = `${enhancedPrompt}, portrait format image`;
          width = 512;
          height = 768;
          break;
        case 'landscape':
          enhancedPrompt = `${enhancedPrompt}, landscape format image`;
          width = 768;
          height = 512;
          break;
        case 'panoramic':
          enhancedPrompt = `${enhancedPrompt}, panoramic format image`;
          width = 1024;
          height = 384;
          break;
      }
      
      // Ajoute le style au prompt si spécifié
      if (options.style) {
        enhancedPrompt = `${enhancedPrompt}, ${options.style} style`;
      }
      
      console.log(`🖼️ Génération d'image: "${enhancedPrompt.substring(0, 50)}..."`);
      
      const response = await axios.post(
        this.API_URL,
        {
          model: this.MODEL,
          prompt: enhancedPrompt,
          response_format: 'b64_json',
          n: 1,
          ...(options.negativePrompt && { negative_prompt: options.negativePrompt })
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          }
        }
      );
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const b64Image = response.data.data[0].b64_json;
        const imageData = Buffer.from(b64Image, 'base64');
        
        // Crée un nom de fichier unique basé sur un hash du prompt
        const hash = crypto.createHash('md5').update(options.prompt).digest('hex').substring(0, 10);
        const filename = `image_${hash}_${Date.now()}.png`;
        const filePath = path.join(this.IMAGE_FOLDER, filename);
        
        // Écrit l'image sur le disque
        fs.writeFileSync(filePath, imageData);
        
        // Retourne l'URL relative de l'image
        return `/generated-images/${filename}`;
      }
      
      console.error('❌ Aucune image générée dans la réponse');
      return this.generatePlaceholderImage(options.aspectRatio || 'landscape');
    } catch (error) {
      console.error('❌ Erreur lors de la génération d\'image:', error);
      return this.generatePlaceholderImage(options.aspectRatio || 'landscape');
    }
  }
  
  /**
   * Génère une image placeholder au cas où la génération d'image échoue
   */
  private static generatePlaceholderImage(aspectRatio: 'square' | 'portrait' | 'landscape' | 'panoramic'): string {
    // On utilise des images placeholder préexistantes en fonction du ratio
    const placeholderFilename = `placeholder_${aspectRatio}.png`;
    const placeholderPath = path.join(this.IMAGE_FOLDER, placeholderFilename);
    
    // Vérifie si le placeholder existe déjà, sinon le crée
    if (!fs.existsSync(placeholderPath)) {
      // Crée une image placeholder simple avec du texte
      const width = aspectRatio === 'square' ? 512 : 
                   aspectRatio === 'portrait' ? 512 :
                   aspectRatio === 'panoramic' ? 1024 : 768;
      const height = aspectRatio === 'square' ? 512 : 
                    aspectRatio === 'portrait' ? 768 :
                    aspectRatio === 'panoramic' ? 384 : 512;
      
      // Créer un SVG basique pour le placeholder
      const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle" dominant-baseline="middle">
          Image ${aspectRatio}
        </text>
      </svg>`;
      
      // Sauvegarder le SVG comme fichier PNG placeholder
      fs.writeFileSync(placeholderPath, Buffer.from(svgContent));
    }
    
    return `/generated-images/${placeholderFilename}`;
  }
  
  /**
   * Génère une image de couverture pour un livre
   */
  static async generateCoverImage(book: BookContent): Promise<string | null> {
    if (!book.title) return null;
    
    const prompt = `Book cover for "${book.title}" by ${book.author}. Professional, elegant book cover design`;
    
    return this.generateImage({
      prompt,
      aspectRatio: 'portrait',
      style: 'professional, elegant, book cover design'
    });
  }
  
  /**
   * Génère une image pour illustrer une page spécifique
   */
  static async generateImageForPage(pageContent: string, chapterTitle: string, bookTitle: string): Promise<string | null> {
    // Extrait le premier paragraphe pour créer un prompt pertinent
    const firstParagraph = pageContent.split('\n')[0].substring(0, 200);
    
    const prompt = `Illustration for chapter "${chapterTitle}" from book "${bookTitle}": ${firstParagraph}`;
    
    return this.generateImage({
      prompt,
      aspectRatio: 'landscape'
    });
  }
  
  /**
   * Enrichit un livre avec des images générées
   * @param book Le livre à enrichir avec des images
   * @param options Options pour la génération d'images (style, etc.)
   */
  static async enrichBookWithImages(book: BookContent, options?: { style?: string, aspectRatio?: 'square' | 'portrait' | 'landscape' | 'panoramic' }): Promise<BookContent> {
    try {
      console.log(`🎨 Enrichissement du livre "${book.title}" avec des images...`);
      
      // Options par défaut
      const imageStyle = options?.style || 'realistic';
      const coverAspectRatio: 'portrait' = 'portrait';  // Toujours portrait pour les couvertures
      const pageAspectRatio = options?.aspectRatio || 'landscape';
      
      console.log(`Style d'image: ${imageStyle}, Format de couverture: ${coverAspectRatio}, Format de page: ${pageAspectRatio}`);
      
      // Clone du livre pour éviter de modifier l'original
      const enrichedBook: BookContent = JSON.parse(JSON.stringify(book));
      
      // Génère l'image de couverture
      if (enrichedBook.coverPage) {
        console.log('Génération de l\'image de couverture...');
        const coverPrompt = `Book cover for "${book.title}" by ${book.author}. Professional, elegant book cover design`;
        
        const coverImageUrl = await this.generateImage({
          prompt: coverPrompt,
          aspectRatio: coverAspectRatio,
          style: imageStyle,
          negativePrompt: 'watermark, overlaid text, title, author name, bad quality, deformed'
        });
        
        if (coverImageUrl) {
          enrichedBook.coverPage.image = {
            url: coverImageUrl,
            aspectRatio: coverAspectRatio,
            prompt: coverPrompt,
            alt: `Couverture du livre "${book.title}" par ${book.author}`,
            caption: `Couverture illustrée pour "${book.title}"`
          };
        }
      }
      
      // Pour chaque chapitre, génère des images pour certaines pages
      for (let i = 0; i < enrichedBook.chapters.length; i++) {
        const chapter = enrichedBook.chapters[i];
        console.log(`Génération d'images pour le chapitre "${chapter.title}"...`);
        
        // Ne génère pas d'image pour chaque page, mais une par chapitre
        if (chapter.pages.length > 0) {
          // Choisit une page pour l'illustration (la première par défaut)
          const pageIndex = 0;
          const page = chapter.pages[pageIndex];
          
          // Attente pour éviter de surcharger l'API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Extrait le premier paragraphe pour créer un prompt pertinent
          const firstParagraph = page.content.replace(/<[^>]*>/g, '').substring(0, 200); 
          const prompt = `Illustration for chapter "${chapter.title}" from book "${enrichedBook.title}": ${firstParagraph}`;
          
          // Génère l'image pour cette page avec le format spécifié
          const pageFormat = pageAspectRatio as 'square' | 'portrait' | 'landscape' | 'panoramic';
          
          const imageUrl = await this.generateImage({
            prompt,
            aspectRatio: pageFormat,
            style: imageStyle,
            negativePrompt: 'watermark, overlaid text, signature, bad quality, deformed'
          });
          
          if (imageUrl) {
            page.image = {
              url: imageUrl,
              aspectRatio: pageFormat,
              prompt: prompt,
              alt: `Illustration pour le chapitre "${chapter.title}"`,
              caption: `Illustration pour "${chapter.title}"` 
            };
          }
        }
      }
      
      return enrichedBook;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enrichissement du livre avec des images:', error);
      return book; // Retourne le livre original en cas d'erreur
    }
  }
}