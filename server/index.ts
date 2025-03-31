import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { DropboxService } from "./services/dropbox-service";

// Vérification des variables d'environnement pour Dropbox
// Nous pouvons utiliser un access token ou un refresh token
const hasAccessToken = !!process.env.DROPBOX_ACCESS_TOKEN;
const hasRefreshToken = !!process.env.DROPBOX_REFRESH_TOKEN;

if (!hasAccessToken && !hasRefreshToken) {
  log("⚠️ Variables d'environnement DROPBOX_ACCESS_TOKEN et DROPBOX_REFRESH_TOKEN manquantes. La synchronisation Dropbox ne fonctionnera pas.", "dropbox");
} else {
  if (hasAccessToken) {
    log("✅ Variable d'environnement DROPBOX_ACCESS_TOKEN détectée", "dropbox");
  }
  
  if (hasRefreshToken) {
    log("✅ Variable d'environnement DROPBOX_REFRESH_TOKEN détectée", "dropbox");
  }
  
  // Initialisation du service Dropbox dès le démarrage du serveur
  try {
    DropboxService.initialize();
    log("✅ Service Dropbox initialisé avec succès", "dropbox");
  } catch (error) {
    log(`❌ Erreur lors de l'initialisation du service Dropbox: ${error}`, "dropbox");
  }
}

const app = express();
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les livres volumineux
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
