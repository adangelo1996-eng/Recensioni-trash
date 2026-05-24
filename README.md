# Recensioni Trash

App statica per raccogliere e visualizzare recensioni trash, pubblicata su GitHub Pages.

## Setup

### 1. GitHub Pages (GitHub Actions)

Nel repository **Recensioni-trash**:

1. Vai su **Settings → Pages**
2. **Build and deployment → Source**: seleziona **GitHub Actions** (non più “Deploy from a branch”)
3. Salva

Il sito viene pubblicato dal workflow **Deploy GitHub Pages** (`.github/workflows/deploy-pages.yml`) a ogni push su `main`.

L'app sarà disponibile su: **https://adangelo1996-eng.github.io/Recensioni-trash/**

### 2. Secret `SUBMIT_TOKEN` (obbligatorio per il deploy)

Il token **non** va committato. In produzione viene iniettato in `js/config.js` durante il deploy.

1. Vai su **Settings → Secrets and variables → Actions → New repository secret**
2. Nome: **`SUBMIT_TOKEN`**
3. Valore: un **fine-grained PAT** con i permessi elencati al passo 4 (solo sul repo **Recensioni-trash**)

Vedi il passo 4 per creare il PAT.

> **Errore "Resource not accessible by personal access token":** il PAT nel secret ha permessi sbagliati (spesso solo **Actions**). Per `repository_dispatch` servono **Contents** + **Metadata**, non Actions. Rigenera il PAT come al passo 4 e aggiorna `SUBMIT_TOKEN`.

> **Token esposto in passato:** se un token è mai stato committato in git, **revocalo/ruotalo subito** su GitHub (**Settings → Developer settings → Personal access tokens**) e usa solo il nuovo token in `SUBMIT_TOKEN`.

### 3. Permessi GitHub Actions

1. Vai su **Settings → Actions → General**
2. In **Workflow permissions**, seleziona **Read and write permissions**
3. Salva

Questo permette al workflow **Submit Review** di committare le nuove recensioni su `data/reviews.json`.

### 4. Fine-grained Personal Access Token (PAT)

L'invio recensioni usa l'API [`POST /repos/{owner}/{repo}/dispatches`](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) (`repository_dispatch`). Con un fine-grained PAT servono permessi sul **codice del repository**, non su Actions.

Crea un token con accesso limitato al solo repository **Recensioni-trash**:

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **Generate new token**
3. Repository access: **Only select repositories** → seleziona **Recensioni-trash**
4. **Repository permissions** (valori esatti nella UI GitHub):
   | Permesso | Livello richiesto |
   |----------|-------------------|
   | **Contents** | **Read and write** |
   | **Metadata** | **Read** (si seleziona spesso in automatico con Contents) |
5. **Non** basta **Actions: Read and write** da solo: provoca l'errore *Resource not accessible by personal access token*.
6. Genera e copia il token → incollalo nel secret **`SUBMIT_TOKEN`** (passo 2)
7. Rilancia il deploy: **Actions → Deploy GitHub Pages → Run workflow** (o push su `main`)

**Alternativa (classic PAT):** token con scope **`repo`** (o **`public_repo`** se il repository è pubblico). Incolla il valore in `SUBMIT_TOKEN` come sopra.

### 5. Configurazione locale

```bash
cp js/config.example.js js/config.js
```

Apri `js/config.js` e sostituisci `YOUR_TOKEN_HERE` con il token creato al passo 4.

> **Nota:** `js/config.js` è in `.gitignore` e **non** va committato. In Pages il file viene generato dal workflow di deploy.

## Sicurezza del token

Il token viene usato dal frontend per inviare recensioni tramite l'API `repository_dispatch` di GitHub. Essendo incluso in un file JavaScript servito da GitHub Pages, **chiunque visiti il sito può potenzialmente estrarlo** (DevTools → Sources/Network).

Per un progetto personale/amici va bene; per uso pubblico valuta alternative server-side. Il PAT espone **Contents** sul repo (necessario per `repository_dispatch`); non concedere permessi su altri repository.

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
