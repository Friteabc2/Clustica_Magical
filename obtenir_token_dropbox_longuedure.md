# Guide pour obtenir un token Dropbox longue durée

Voici les étapes à suivre pour obtenir un token d'accès Dropbox qui ne expire pas rapidement:

## Option 1: Créer une App Dropbox avec accès permanent (recommandé)

1. Accédez à la [console développeur Dropbox](https://www.dropbox.com/developers/apps)
2. Cliquez sur "Create app"
3. Sélectionnez "Scoped access" comme type d'API
4. Sélectionnez "App folder" comme type d'accès (votre app aura uniquement accès à un dossier dédié)
5. Donnez un nom à votre application (ex: "ClusterBookApp")
6. Cliquez sur "Create app"

Une fois l'application créée:

1. Dans l'onglet "Permissions", ajoutez les permissions suivantes:
   - `files.metadata.read`
   - `files.metadata.write`
   - `files.content.read`
   - `files.content.write`
   - Cliquez sur "Submit" pour enregistrer

2. Dans l'onglet "Settings":
   - Sous "Access token expiration", sélectionnez "No expiration" (pas d'expiration)
   - Cliquez sur "Generate" à côté de "Generated access token"
   - Copiez le token généré

Ce token ne sera pas soumis à une expiration rapide et peut être utilisé pour une période prolongée.

## Option 2: OAuth 2.0 (plus complexe)

Si vous préférez l'approche OAuth:

1. Dans la console développeur Dropbox, créez une app comme précédemment
2. Dans l'onglet "Settings", ajoutez "http://localhost" comme "Redirect URI"
3. Utilisez le processus OAuth 2.0 avec le paramètre "token_access_type=offline" pour obtenir un refresh token

Cette option nécessite plus de développement et de maintenance, car vous devrez gérer les refresh tokens.

## Configuration de l'application

Une fois que vous avez obtenu votre token d'accès:

1. Ajoutez-le comme variable d'environnement DROPBOX_ACCESS_TOKEN dans votre application
2. Redémarrez l'application pour que le nouveau token soit pris en compte

Votre token d'accès Dropbox longue durée est maintenant configuré!