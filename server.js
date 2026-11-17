// Relais Pressero External Shipping -> n8n (sans CDN, sans compression)
// Pressero appelle  POST https://<service>.onrender.com/pressero-external-shipping
// Le relais transmet le JSON à n8n (N8N_URL) et renvoie la réponse de n8n telle quelle, en JSON simple.
import express from 'express';

const app = express();
const N8N_URL = process.env.N8N_URL;                 // ex. https://xxx.hostingersite.com/webhook/pressero-livraison
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);
const LOG_BODIES = process.env.LOG_BODIES === '1';   // 1 = journaliser requêtes et réponses (debug)

// Pressero envoie du JSON ; on accepte aussi un content-type incorrect
app.use(express.json({ limit: '5mb', type: () => true }));

// Réponse « aucune livraison » au format Pressero (évite une erreur côté checkout)
const reponseVide = (msg) => ({ Carrier: 'External', ServiceCode: 'External', TotalCost: 0, Messages: [msg], Packages: [] });

app.get('/', (req, res) => res.type('text').send('pressero-external-relay OK'));

app.post(['/pressero-external-shipping', '/'], async (req, res) => {
  const debut = Date.now();
  const methode = req.body && req.body.description;
  if (LOG_BODIES) console.log('>>> Pressero :', JSON.stringify(req.body));
  if (!N8N_URL) { console.error('N8N_URL manquant'); return res.status(200).json(reponseVide('Relais non configuré')); }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'identity' },
      body: JSON.stringify(req.body || {}),
      signal: ctrl.signal
    });
    const texte = await r.text();          // fetch décompresse si besoin
    let data;
    try { data = JSON.parse(texte); } catch (e) { throw new Error('Réponse n8n non JSON (' + r.status + ') : ' + texte.slice(0, 200)); }
    if (LOG_BODIES) console.log('<<< Réponse :', JSON.stringify(data));
    console.log(`OK ${methode || ''} ${r.status} ${Date.now() - debut} ms`);
    // Express renvoie un JSON simple, non compressé, avec Content-Length
    return res.status(200).json(data);
  } catch (err) {
    console.error('Erreur relais :', err.message);
    return res.status(200).json(reponseVide('Erreur du service de livraison externe'));
  } finally {
    clearTimeout(timer);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Relais Pressero External en écoute sur le port', PORT));
