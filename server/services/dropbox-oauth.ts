import { Dropbox } from 'dropbox';
import express, { Request, Response, NextFunction } from 'express';
import { DropboxService } from './dropbox-service';

const APP_KEY = process.env.DROPBOX_APP_KEY || '';
const APP_SECRET = process.env.DROPBOX_APP_SECRET || '';
// L'URL de redirection doit correspondre exactement à celle configurée dans la console développeur Dropbox
// URL spécifique pour l'environnement Replit actuel
const REDIRECT_URI = 'https://f22605e9-0a60-4594-980f-a1ddcf1cf697-00-11mdo9zko9do0.kirk.replit.dev/api/dropbox/oauth-callback';

/**
 * Service de gestion OAuth pour Dropbox
 */
export class DropboxOAuth {
  private static config = {
    clientId: APP_KEY,
    clientSecret: APP_SECRET,
    redirectUri: REDIRECT_URI
  };

  private static authState: string | null = null;
  private static pendingCallback: ((token: string, refreshToken: string) => void) | null = null;

  /**
   * Initialise les routes OAuth dans l'application Express
   */
  static initializeRoutes(app: express.Express): void {
    // Endpoint pour démarrer le processus d'authentification OAuth
    app.get('/api/dropbox/oauth', this.startOAuthFlow.bind(this));
    
    // Callback OAuth après authentification sur Dropbox
    app.get('/api/dropbox/oauth-callback', this.handleOAuthCallback.bind(this));
  }

  /**
   * Démarre le flux OAuth en redirigeant l'utilisateur vers la page d'autorisation Dropbox
   */
  private static startOAuthFlow(req: Request, res: Response): void {
    // Générer un état aléatoire pour empêcher les attaques CSRF
    this.authState = Math.random().toString(36).substring(2, 15);
    
    // Générer l'URL d'autorisation manuellement
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: this.authState,
      token_access_type: 'offline' // Pour obtenir un refresh token
    });
    
    const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
    
    console.log('[dropbox-oauth] URL d\'authentification générée:', authUrl);
    
    // Rediriger l'utilisateur vers la page d'autorisation Dropbox
    res.redirect(authUrl);
  }

  /**
   * Traite le callback OAuth après redirection depuis Dropbox
   */
  private static async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error } = req.query;
      
      // Vérifier si une erreur est retournée par Dropbox
      if (error) {
        console.error('[dropbox-oauth] Erreur d\'autorisation Dropbox:', error);
        res.status(400).send(`
          <html>
            <body>
              <h1>Erreur d'autorisation Dropbox</h1>
              <p>${error}</p>
              <a href="/">Retour à l'application</a>
            </body>
          </html>
        `);
        return;
      }
      
      // Vérifier que l'état correspond pour empêcher les attaques CSRF
      if (state !== this.authState) {
        console.error('[dropbox-oauth] État invalide, possible attaque CSRF');
        res.status(400).send(`
          <html>
            <body>
              <h1>Erreur d'autorisation</h1>
              <p>État invalid, possible tentative d'attaque.</p>
              <a href="/">Retour à l'application</a>
            </body>
          </html>
        `);
        return;
      }
      
      // Échanger le code d'autorisation contre un token d'accès
      if (!code || typeof code !== 'string') {
        throw new Error('Code d\'autorisation manquant');
      }
      
      // Nous utilisons fetch pour faire des requêtes directes plutôt que le SDK
      // car la version actuelle du SDK Dropbox dans le projet ne supporte pas
      // certaines méthodes d'authentification
      
      // Échanger le code contre un token en effectuant une requête manuelle à l'API
      const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
      const bodyParams = new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri
      });
      
      // Faire une requête POST à l'API Dropbox pour obtenir les tokens
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de l'échange du code: ${response.status} ${errorText}`);
      }
      
      // Extraire les tokens de la réponse
      const result = await response.json();
      const accessToken = result.access_token;
      const refreshToken = result.refresh_token;
      const expiresIn = result.expires_in;
      
      console.log('[dropbox-oauth] Token obtenu, expire dans', expiresIn, 'secondes');
      console.log('[dropbox-oauth] Refresh token obtenu');
      
      // Stocker les tokens dans les variables d'environnement (temporairement)
      process.env.DROPBOX_ACCESS_TOKEN = accessToken;
      process.env.DROPBOX_REFRESH_TOKEN = refreshToken;
      
      // Réinitialiser le service Dropbox avec le nouveau token
      DropboxService.resetTokenState();
      DropboxService.initialize();
      
      // Afficher les instructions pour configurer les variables d'environnement
      res.send(`
        <html>
          <body>
            <h1>Autorisation Dropbox réussie!</h1>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Configure tes variables d'environnement</h3>
              <p>Voici ton refresh token pour Dropbox. <strong>Conserve-le précieusement et ajoute-le à tes variables d'environnement:</strong></p>
              <textarea onclick="this.select()" style="width: 100%; height: 50px; padding: 10px; margin: 10px 0; font-family: monospace;">${refreshToken}</textarea>
              <p>Ajoute cette valeur à tes variables d'environnement Replit sous le nom <code>DROPBOX_REFRESH_TOKEN</code>.</p>
            </div>
            
            <a href="/" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Retour à l'application</a>
          </body>
        </html>
      `);
      
      // Reset l'état pour de futures demandes
      this.authState = null;
    } catch (error) {
      console.error('[dropbox-oauth] Erreur lors du traitement du callback OAuth:', error);
      res.status(500).send(`
        <html>
          <body>
            <h1>Erreur de traitement OAuth</h1>
            <p>Une erreur s'est produite lors de l'obtention du token: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
            <a href="/">Retour à l'application</a>
          </body>
        </html>
      `);
    }
  }

  /**
   * Rafraîchit le token d'accès en utilisant le refresh token
   */
  static async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
      
      if (!refreshToken) {
        console.error('[dropbox-oauth] Aucun refresh token disponible. Impossible de rafraîchir le token d\'accès.');
        return null;
      }
      
      console.log('[dropbox-oauth] Tentative de rafraîchissement du token d\'accès...');
      
      // Rafraîchir le token en effectuant une requête directe à l'API Dropbox
      const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
      const bodyParams = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });
      
      // Envoyer la requête POST
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors du rafraîchissement du token: ${response.status} ${errorText}`);
      }
      
      // Extraire le nouveau token de la réponse
      const result = await response.json();
      
      if (!result.access_token) {
        throw new Error('Aucun token d\'accès retourné lors du rafraîchissement');
      }
      
      // Mettre à jour le token d'accès
      const accessToken = result.access_token;
      console.log('[dropbox-oauth] Token d\'accès rafraîchi avec succès');
      
      // Mettre à jour le token dans les variables d'environnement
      process.env.DROPBOX_ACCESS_TOKEN = accessToken;
      
      // Réinitialiser le service Dropbox et recréer l'instance avec le nouveau token
      DropboxService.resetTokenState();
      DropboxService.initialize();
      
      return accessToken;
    } catch (error) {
      console.error('[dropbox-oauth] Erreur lors du rafraîchissement du token d\'accès:', error);
      return null;
    }
  }
  
  /**
   * Middleware Express pour vérifier et rafraîchir le token Dropbox si nécessaire
   * Amélioration : vérifie toutes les routes pouvant utiliser Dropbox, pas uniquement /api/dropbox
   */
  static checkAndRefreshToken(req: Request, res: Response, next: NextFunction): void {
    // Protection contre les routes OAuth (pour éviter les boucles)
    if (req.path.includes('/oauth')) {
      return next();
    }
    
    // Détecter les routes qui peuvent utiliser Dropbox
    // Inclut les routes Dropbox explicites et les routes de livres (qui peuvent utiliser Dropbox en arrière-plan)
    const needsDropboxCheck = 
      req.path.startsWith('/api/dropbox') || 
      req.path.startsWith('/api/books') ||
      req.path.includes('/profile');
    
    if (needsDropboxCheck && DropboxService.isExpired()) {
      console.log('[dropbox-oauth] Token expiré détecté pour', req.path, '- tentative de rafraîchissement...');
      
      DropboxOAuth.refreshAccessToken()
        .then(newToken => {
          if (newToken) {
            console.log('[dropbox-oauth] Token rafraîchi avec succès, poursuite de la requête');
            next();
          } else {
            // Si le refresh a échoué, on continue quand même mais on informe le client
            console.warn('[dropbox-oauth] Échec du rafraîchissement du token, continuation avec erreur');
            
            if (req.path.startsWith('/api/dropbox')) {
              // Uniquement pour les routes Dropbox explicites, on renvoie une erreur
              res.status(401).json({ 
                status: 'error',
                message: 'Token Dropbox expiré et impossible à rafraîchir automatiquement',
                needsReauth: true 
              });
            } else {
              // Pour les autres routes, on continue mais on ajoute un header d'avertissement
              res.setHeader('X-Dropbox-Auth-Status', 'expired');
              next();
            }
          }
        })
        .catch(error => {
          console.error('[dropbox-oauth] Erreur lors du rafraîchissement:', error);
          
          if (req.path.startsWith('/api/dropbox')) {
            // Uniquement pour les routes Dropbox explicites, on renvoie une erreur
            res.status(401).json({ 
              status: 'error',
              message: 'Erreur lors du rafraîchissement du token Dropbox',
              needsReauth: true 
            });
          } else {
            // Pour les autres routes, on continue mais on ajoute un header d'avertissement
            res.setHeader('X-Dropbox-Auth-Status', 'error');
            next();
          }
        });
    } else {
      // Pas besoin de rafraîchir, continuer
      next();
    }
  }
}