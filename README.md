# Recensioni Trash

App statica per raccogliere e visualizzare recensioni trash, pubblicata su GitHub Pages.

## Setup

### 1. GitHub Pages

Nel repository **Recensioni-trash**:

1. Vai su **Settings → Pages**
2. Source: branch **main**, cartella **/ (root)**
3. Salva

L'app sarà disponibile su: **https://adangelo1996-eng.github.io/Recensioni-trash/**

### 2. Permessi GitHub Actions

1. Vai su **Settings → Actions → General**
2. In **Workflow permissions**, seleziona **Read and write permissions**
3. Salva

Questo permette al workflow di committare le nuove recensioni su `data/reviews.json`.

### 3. Fine-grained Personal Access Token (PAT)

Crea un token con accesso limitato al solo repository **Recensioni-trash**:

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **Generate new token**
3. Repository access: **Only select repositories** → seleziona **Recensioni-trash**
4. Permissions → **Actions**: **Read and write**
5. Genera e copia il token

### 4. Configurazione locale

```bash
cp js/config.example.js js/config.js
```

Apri `js/config.js` e sostituisci `YOUR_FINE_GRAINED_PAT_HERE` con il token creato al passo 3.

> **Nota:** `js/config.js` è in `.gitignore` e non va committato.

## Sicurezza del token

Il token viene usato dal frontend per inviare recensioni tramite l'API `repository_dispatch` di GitHub. Essendo incluso in un file JavaScript servito da GitHub Pages, **chiunque visiti il sito può potenzialmente estrarlo** (DevTools → Sources/Network).

Per un progetto personale/amici va bene; per uso pubblico valuta alternative server-side o limita i permessi del token al minimo (solo Actions read/write su questo repo).

## Flusso di invio recensione

1. L'utente compila il form nel browser
2. Il client legge `window.CONFIG` da `js/config.js`
3. Invia una richiesta `POST` a `https://api.github.com/repos/{owner}/{repo}/dispatches` con:
   - `event_type`: `new-review`
   - `client_payload`: `{ trashName, food, guide, hospitality, comment? }`
4. GitHub avvia il workflow **Submit Review** (`.github/workflows/submit-review.yml`)
5. Lo script `.github/scripts/append-review.js`:
   - valida i dati
   - aggiunge `id` e `createdAt`
   - appende la recensione a `data/reviews.json`
6. Il workflow committa e pusha la modifica
7. GitHub Pages serve la versione aggiornata del sito con la nuova recensione
