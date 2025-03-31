import { Mistral } from '@mistralai/mistralai';
import { BookContent, Chapter, PageContent } from '@shared/schema';
import { getEmptyBook, getEmptyChapter, getEmptyPage } from '../../client/src/lib/book-types';
import { v4 as uuidv4 } from 'uuid';

// Initialisation du client Mistral avec la clé API
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
const MODEL = 'mistral-large-latest';

// Interface pour les personnages personnalisés
export interface AICharacter {
  name?: string;
  autoGenerateName?: boolean;
  description?: string;
  alignment?: string;
  organization?: string;
  role?: string;
}

// Interface pour la demande de création de livre IA
export interface AIBookRequest {
  prompt: string;
  chaptersCount?: number;
  pagesPerChapter?: number;
  authorName?: string;
  genre?: string;
  style?: string;
  narrativeMode?: string;  // first-person, third-person, etc.
  mainCharacter?: string;  // Description du personnage principal
  setting?: string;        // Cadre/époque de l'histoire
  targetAudience?: string; // Public cible (adultes, jeunesse, etc.)
  tone?: string;           // Ton de l'histoire (humoristique, sérieux, etc.)
  paceStyle?: string;      // Rythme (lent, rapide, etc.)
  
  // Nouvelles options
  additionalStyles?: string[]; // Styles d'écriture supplémentaires
  themes?: string[];           // Thèmes supplémentaires
  characters?: AICharacter[];  // Personnages supplémentaires
}

/**
 * Service pour générer des livres avec l'IA Mistral
 */
export class AIService {
  /**
   * Génère un livre complet basé sur un prompt utilisateur
   */
  static async generateBook(request: AIBookRequest): Promise<BookContent> {
    const { 
      prompt, 
      chaptersCount = 3, 
      pagesPerChapter = 1,
      authorName,
      genre,
      style,
      narrativeMode,
      mainCharacter,
      setting,
      targetAudience,
      tone,
      paceStyle,
      additionalStyles = [],
      themes = [],
      characters = []
    } = request;

    try {
      // Génération du titre et structure générale du livre
      const bookStructure = await this.generateBookStructure(prompt, chaptersCount, authorName);
      
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
            j,
            genre,
            style,
            narrativeMode,
            mainCharacter,
            setting,
            targetAudience,
            tone,
            paceStyle,
            additionalStyles,
            themes,
            characters
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
  private static async generateBookStructure(prompt: string, chaptersCount: number, authorName?: string) {
    const authorInstruction = authorName 
      ? `Utilise "${authorName}" comme nom de l'auteur.` 
      : `Génère un nom d'auteur fictif.`;
    
    const structurePrompt = `Tu es un auteur de livre expérimenté. Ton travail est de créer le plan d'un nouveau livre basé sur cette demande: "${prompt}".
    
    Génère un titre accrocheur et créatif, ${authorInstruction} Crée ${chaptersCount} chapitres avec leurs titres et une brève description.
    
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
    pageIndex: number,
    genre?: string,
    style?: string,
    narrativeMode?: string,
    mainCharacter?: string,
    setting?: string,
    targetAudience?: string,
    tone?: string,
    paceStyle?: string,
    additionalStyles?: string[],
    themes?: string[],
    characters?: AICharacter[]
  ): Promise<string> {
    let genreDirective = '';
    if (genre) {
      switch (genre) {
        case 'fantasy':
          genreDirective = 'Utilise des éléments de fantasy: magie, créatures fantastiques, mondes imaginaires.';
          break;
        case 'scifi':
          genreDirective = 'Utilise des éléments de science-fiction: technologies futuristes, voyages spatiaux, concepts scientifiques.';
          break;
        case 'romance':
          genreDirective = 'Utilise des éléments romantiques: émotions fortes, relations interpersonnelles, développement des sentiments.';
          break;
        case 'thriller':
          genreDirective = 'Utilise des éléments de thriller: suspense, tension, rythme soutenu.';
          break;
        case 'mystery':
          genreDirective = 'Utilise des éléments de mystère: indices, énigmes, révélations progressives.';
          break;
        case 'horror':
          genreDirective = 'Utilise des éléments d\'horreur: peur, angoisse, atmosphère inquiétante.';
          break;
        case 'adventure':
          genreDirective = 'Utilise des éléments d\'aventure: découvertes, voyages, défis physiques.';
          break;
        case 'historical':
          genreDirective = 'Utilise des éléments historiques: précision historique, contexte d\'époque, personnages ou événements réels.';
          break;
      }
    }
    
    let styleDirective = '';
    if (style) {
      switch (style) {
        case 'literary':
          styleDirective = 'Adopte un style littéraire recherché avec un vocabulaire riche et des figures de style élaborées.';
          break;
        case 'minimalist':
          styleDirective = 'Adopte un style minimaliste avec des phrases courtes et un vocabulaire précis et concis.';
          break;
        case 'descriptive':
          styleDirective = 'Adopte un style très descriptif avec des détails sensoriels riches pour immerger le lecteur.';
          break;
        case 'poetic':
          styleDirective = 'Adopte un style poétique avec des métaphores, des images fortes et un rythme musical.';
          break;
        case 'humorous':
          styleDirective = 'Adopte un style humoristique avec de l\'ironie, des situations comiques ou des jeux de mots.';
          break;
        case 'technical':
          styleDirective = 'Adopte un style technique avec un vocabulaire spécialisé et une approche précise et factuelle.';
          break;
        case 'conversational':
          styleDirective = 'Adopte un style conversationnel avec un ton familier et des dialogues naturels.';
          break;
      }
    }
    
    // Point de vue narratif
    let narrativeModeDirective = '';
    if (narrativeMode) {
      switch (narrativeMode) {
        case 'first-person':
          narrativeModeDirective = 'Écris à la première personne (je/nous), en racontant l\'histoire directement du point de vue du personnage principal.';
          break;
        case 'second-person':
          narrativeModeDirective = 'Écris à la deuxième personne (tu/vous), en vous adressant directement au lecteur comme s\'il était le personnage principal.';
          break;
        case 'third-person-limited':
          narrativeModeDirective = 'Écris à la troisième personne (il/elle/ils), en suivant la perspective d\'un seul personnage principal et ses pensées.';
          break;
        case 'third-person-omniscient':
          narrativeModeDirective = 'Écris à la troisième personne omnisciente, en connaissant et partageant les pensées de tous les personnages.';
          break;
        case 'multi-perspective':
          narrativeModeDirective = 'Utilise une perspective multiple, en alternant entre différents points de vue de personnages au cours du récit.';
          break;
      }
    }
    
    // Description du personnage principal 
    let characterDirective = mainCharacter ? `Le personnage principal est: ${mainCharacter}. Intègre naturellement ses caractéristiques dans le récit.` : '';
    
    // Cadre/époque
    let settingDirective = setting ? `L'histoire se déroule dans: ${setting}. Utilise cet environnement pour enrichir ton récit.` : '';
    
    // Public cible
    let audienceDirective = '';
    if (targetAudience) {
      switch (targetAudience) {
        case 'children':
          audienceDirective = 'Adapte le contenu pour un jeune public (enfants), avec un vocabulaire simple et des thèmes appropriés.';
          break;
        case 'young-adult':
          audienceDirective = 'Cible un public adolescent et jeunes adultes avec des thèmes qui les concernent.';
          break;
        case 'adult':
          audienceDirective = 'Écris pour un public adulte, avec des thèmes matures et un vocabulaire élaboré.';
          break;
        case 'all-ages':
          audienceDirective = 'Crée un contenu accessible à tous les âges, avec différents niveaux de lecture.';
          break;
      }
    }
    
    // Ton de l'histoire
    let toneDirective = '';
    if (tone) {
      switch (tone) {
        case 'serious':
          toneDirective = 'Maintiens un ton sérieux et dramatique.';
          break;
        case 'humorous':
          toneDirective = 'Utilise un ton léger et humoristique tout au long du texte.';
          break;
        case 'dark':
          toneDirective = 'Emploie un ton sombre et parfois inquiétant.';
          break;
        case 'uplifting':
          toneDirective = 'Crée une atmosphère positive et inspirante.';
          break;
        case 'satirical':
          toneDirective = 'Adopte un ton satirique, critiquant subtilement des aspects de la société.';
          break;
        case 'melancholic':
          toneDirective = 'Donne une tonalité mélancolique et nostalgique au récit.';
          break;
      }
    }
    
    // Rythme
    let paceDirective = '';
    if (paceStyle) {
      switch (paceStyle) {
        case 'fast':
          paceDirective = 'Utilise un rythme rapide avec des phrases courtes et une action soutenue.';
          break;
        case 'moderate':
          paceDirective = 'Maintiens un rythme équilibré entre action et description.';
          break;
        case 'slow':
          paceDirective = 'Privilégie un rythme lent et contemplatif, riche en détails et en descriptions.';
          break;
        case 'varied':
          paceDirective = 'Alterne entre des passages rapides et des moments plus lents pour créer du contraste.';
          break;
      }
    }
    
    const contentPrompt = `Tu es un écrivain talentueux qui travaille sur le livre "${bookTitle}" inspiré de cette demande: "${prompt}".
    
    Tu dois écrire le contenu pour la page ${pageIndex + 1} du chapitre intitulé "${chapterTitle}".
    Ce chapitre concerne: "${chapterDescription}".
    
    ${genreDirective}
    ${styleDirective}
    ${narrativeModeDirective}
    ${characterDirective}
    ${settingDirective}
    ${audienceDirective}
    ${toneDirective}
    ${paceDirective}
    
    ${additionalStyles && additionalStyles.length > 0 ? `Styles supplémentaires: Intègre les styles d'écriture suivants: ${additionalStyles.join(', ')}.` : ''}
    ${themes && themes.length > 0 ? `Thèmes à explorer: Aborde les thèmes suivants: ${themes.join(', ')}.` : ''}
    ${characters && characters.length > 0 ? `Personnages supplémentaires: ${characters.map(c => {
      const nameInfo = c.autoGenerateName 
        ? '(nom à suggérer)' 
        : c.name ? c.name : '';
      const role = c.role ? `rôle: ${c.role}` : '';
      const alignment = c.alignment ? `alignement: ${c.alignment}` : '';
      const organization = c.organization ? `appartient à: ${c.organization}` : '';
      const description = c.description ? c.description : '';
      
      return `${nameInfo} ${role} ${alignment} ${organization} - ${description}`.trim();
    }).join('; ')}` : ''}
    
    Écris un contenu engageant et détaillé, avec de beaux paragraphes, qui correspond à cette partie du livre.
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