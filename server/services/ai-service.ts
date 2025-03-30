import { Mistral } from '@mistralai/mistralai';
import { BookContent, Chapter, PageContent } from '@shared/schema';
import { getEmptyBook, getEmptyChapter, getEmptyPage } from '../../client/src/lib/book-types';
import { v4 as uuidv4 } from 'uuid';

// Initialisation du client Mistral avec la clé API
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
const MODEL = 'mistral-large-latest';

// Interface pour la demande de création de livre IA
export interface AIBookRequest {
  prompt: string;
  chaptersCount?: number;
  pagesPerChapter?: number;
}

/**
 * Service pour générer des livres avec l'IA Mistral
 */
export class AIService {
  /**
   * Génère un livre complet basé sur un prompt utilisateur
   */
  static async generateBook(request: AIBookRequest): Promise<BookContent> {
    const { prompt, chaptersCount = 3, pagesPerChapter = 1 } = request;

    try {
      // Génération du titre et structure générale du livre
      const bookStructure = await this.generateBookStructure(prompt, chaptersCount);
      
      // Création du livre avec les informations générées
      const bookContent = getEmptyBook(bookStructure.title, bookStructure.author);
      
      // Génération du contenu de chaque chapitre
      for (let i = 0; i < bookStructure.chapters.length; i++) {
        const chapterInfo = bookStructure.chapters[i];
        const chapter = getEmptyChapter(chapterInfo.title);
        
        // Si c'est le premier chapitre, on remplace la page existante, sinon on vide les pages
        chapter.pages = [];
        
        // Génération des pages pour ce chapitre
        for (let j = 0; j < pagesPerChapter; j++) {
          const pageContent = await this.generatePageContent(
            prompt, 
            bookStructure.title, 
            chapterInfo.title, 
            chapterInfo.description,
            j
          );
          
          const page = getEmptyPage(j + 1);
          page.content = this.formatPageContent(pageContent);
          chapter.pages.push(page);
        }
        
        bookContent.chapters.push(chapter);
      }
      
      // Mise à jour de la page de couverture avec une description plus détaillée
      if (bookContent.coverPage) {
        const coverDescription = await this.generateCoverDescription(prompt, bookStructure);
        bookContent.coverPage.content = this.formatCoverPage(bookContent.title, bookContent.author, coverDescription);
      }
      
      return bookContent;
    } catch (error) {
      console.error('Erreur lors de la génération du livre:', error);
      throw new Error('Échec de la génération du livre avec l\'IA');
    }
  }

  /**
   * Génère la structure de base du livre (titre, auteur, chapitres)
   */
  private static async generateBookStructure(prompt: string, chaptersCount: number) {
    const structurePrompt = `Tu es un auteur de livre expérimenté. Ton travail est de créer le plan d'un nouveau livre basé sur cette demande: "${prompt}".
    
    Génère un titre accrocheur et créatif, un nom d'auteur fictif, et ${chaptersCount} chapitres avec leurs titres et une brève description.
    
    Réponds UNIQUEMENT au format JSON comme ceci:
    {
      "title": "Titre du livre",
      "author": "Nom de l'auteur",
      "chapters": [
        {
          "title": "Titre du chapitre 1",
          "description": "Brève description du contenu du chapitre"
        },
        ...
      ]
    }`;

    const response = await client.chat.complete({
      model: MODEL,
      messages: [{ role: 'user', content: structurePrompt }]
    });

    try {
      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Réponse de l\'API Mistral invalide');
      }
      
      const content = response.choices[0].message.content;
      if (typeof content !== 'string') {
        throw new Error('Format de contenu non pris en charge');
      }
      
      // Extraction de la partie JSON de la réponse
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format de réponse invalide');
      }
      
      const jsonContent = jsonMatch[0];
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Erreur lors du parsing de la structure du livre:', error);
      // Structure par défaut en cas d'erreur
      return {
        title: `Livre sur ${prompt}`,
        author: 'Auteur Anonyme',
        chapters: Array(chaptersCount).fill(0).map((_, i) => ({
          title: `Chapitre ${i + 1}`,
          description: `Contenu du chapitre sur ${prompt}`
        }))
      };
    }
  }

  /**
   * Génère le contenu d'une page spécifique d'un chapitre
   */
  private static async generatePageContent(
    prompt: string, 
    bookTitle: string, 
    chapterTitle: string, 
    chapterDescription: string,
    pageIndex: number
  ): Promise<string> {
    const contentPrompt = `Tu es un écrivain talentueux qui travaille sur le livre "${bookTitle}" inspiré de cette demande: "${prompt}".
    
    Tu dois écrire le contenu pour la page ${pageIndex + 1} du chapitre intitulé "${chapterTitle}".
    Ce chapitre concerne: "${chapterDescription}".
    
    Écris un contenu engageant et détaillé, avec de beaux paragraphes, qui correspond à cette partie du livre.
    Utilise un style littéraire adapté au sujet.
    Ne mentionne pas le numéro de page ni le titre du chapitre dans le contenu.
    Écris directement le contenu sous forme de texte riche (pas de balises HTML).`;

    try {
      const response = await client.chat.complete({
        model: MODEL,
        messages: [{ role: 'user', content: contentPrompt }]
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Réponse de l\'API Mistral invalide');
      }
      
      const content = response.choices[0].message.content;
      if (typeof content !== 'string') {
        throw new Error('Format de contenu non pris en charge');
      }
      
      return content;
    } catch (error) {
      console.error('Erreur lors de la génération du contenu de page:', error);
      return 'Le contenu n\'a pas pu être généré. Veuillez réessayer ou éditer cette page manuellement.';
    }
  }

  /**
   * Génère une description pour la page de couverture
   */
  private static async generateCoverDescription(prompt: string, bookStructure: any): Promise<string> {
    const coverPrompt = `Tu es l'auteur du livre "${bookStructure.title}" inspiré de cette demande: "${prompt}".
    
    Écris une courte description accrocheuse pour la quatrième de couverture de ton livre.
    Cette description devrait donner envie aux lecteurs de découvrir ton œuvre.
    Garde un ton professionnel et sois concis (100-150 mots).`;

    try {
      const response = await client.chat.complete({
        model: MODEL,
        messages: [{ role: 'user', content: coverPrompt }]
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Réponse de l\'API Mistral invalide');
      }
      
      const content = response.choices[0].message.content;
      if (typeof content !== 'string') {
        throw new Error('Format de contenu non pris en charge');
      }
      
      return content;
    } catch (error) {
      console.error('Erreur lors de la génération de la description de couverture:', error);
      return `Découvrez "${bookStructure.title}", un livre fascinant qui vous transportera dans un monde imaginaire inspiré par "${prompt}".`;
    }
  }

  /**
   * Formate le contenu d'une page en HTML
   */
  private static formatPageContent(content: string): string {
    // Conversion du texte brut en HTML basique
    // Séparation par paragraphes
    const paragraphs = content.split('\n\n');
    const htmlParagraphs = paragraphs
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
    
    return htmlParagraphs || '<p>Écrivez votre contenu ici...</p>';
  }

  /**
   * Formate la page de couverture en HTML
   */
  private static formatCoverPage(title: string, author: string, description: string): string {
    return `<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">${title}</h1>
  <h2 style="font-size: 20px; font-style: italic; margin-bottom: 20px;">par ${author}</h2>
  <p style="color: #666; font-size: 14px;">Créé sur Clustica - Magical avec l'aide de l'IA</p>
</div>
<div style="margin-top: 40px; background-color: #f8f9fa; border-left: 4px solid #6366F1; padding: 15px;">
  <p style="font-style: italic; line-height: 1.6;">${description}</p>
</div>`;
  }
}