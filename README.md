# pressero-external-relay

Relais entre le **service de livraison externe** de Pressero et un workflow **n8n**.
Pressero lit mal la réponse de n8n quand elle passe par le CDN Hostinger (réponse compressée) :
le relais, hébergé sur Render (sans CDN), appelle n8n et renvoie la réponse en JSON simple.

## Déployer sur Render
1. Pousser ce dossier dans un dépôt GitHub.
2. Render → **New** → **Web Service** → choisir le dépôt.
3. Runtime **Node**, Build command `npm install`, Start command `npm start`, offre Free.
4. Variables d'environnement :
   - `N8N_URL` = `https://seagreen-starling-927599.hostingersite.com/webhook/pressero-livraison`
   - `LOG_BODIES` = `1` pendant les tests (journal des requêtes / réponses), puis `0`.
5. Après déploiement, ouvrir `https://<service>.onrender.com/` → « pressero-external-relay OK ».

## Pressero
Comptes de transporteurs → External Shipping Service → **Service Endpoint** =
`https://<service>.onrender.com/pressero-external-shipping` (au niveau du site et du compte).

Note : l'offre gratuite de Render met le service en veille après 15 min sans appel ; le premier appel
peut prendre ~30 s (Pressero risque d'abandonner). Pour la production : offre payante, ou un ping régulier.
