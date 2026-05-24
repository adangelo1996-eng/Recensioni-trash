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
3. Valore: un PAT con i permessi del passo 4

> **Il deploy fallisce in modo esplicito** se `SUBMIT_TOKEN` non può chiamare `repository_dispatch`. Controlla i log del job **Validate SUBMIT_TOKEN** in **Actions → Deploy GitHub Pages**.

> **Errore "Resource not accessible by personal access token":** il PAT ha permessi sbagliati (spesso solo **Actions**). Per `repository_dispatch` servono **Contents** + **Metadata** (fine-grained) oppure scope **`public_repo`** (classic). Rigenera il PAT come al passo 4 e aggiorna `SUBMIT_TOKEN`.

> **Token esposto in passato:** se un token è mai stato committato in git, **revocalo/ruotalo subito** su GitHub (**Settings → Developer settings → Personal access tokens**) e usa solo il nuovo token in `SUBMIT_TOKEN`.

### 3. Permessi GitHub Actions

1. Vai su **Settings → Actions → General**
2. In **Workflow permissions**, seleziona **Read and write permissions**
3. Salva

Questo permette al workflow **Submit Review** di committare le nuove recensioni su `data/reviews.json`.

### 4. Personal Access Token (PAT) — permessi corretti

L'invio recensioni usa l'API [`POST /repos/{owner}/{repo}/dispatches`](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) (`repository_dispatch`).

#### Consigliato: Classic PAT (più semplice e affidabile)

Per un repository **pubblico** come Recensioni-trash:

1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token (classic)**
3. Note: es. `Recensioni-trash submit`
4. Scadenza: a tua scelta
5. Seleziona lo scope **`public_repo`** (sufficiente per repo pubblici)
6. **Generate token** → copia il valore (inizia spesso con `ghp_` o `gho_`)
7. Incollalo nel secret **`SUBMIT_TOKEN`** (passo 2)
8. Rilancia il deploy: **Actions → Deploy GitHub Pages → Run workflow**

Se il repository fosse privato, usa lo scope **`repo`** invece di `public_repo`.

#### Alternativa: Fine-grained PAT

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **Generate new token**
3. Repository access: **Only select repositories** → **Recensioni-trash**
4. **Repository permissions**:

   | Permesso   | Livello richiesto   |
   |------------|---------------------|
   | **Contents** | **Read and write** |
   | **Metadata** | **Read**           |

5. **Non** basta **Actions: Read and write** da solo: provoca l'errore *Resource not accessible by personal access token*.
6. Genera e copia il token → incollalo in **`SUBMIT_TOKEN`**
7. Rilancia **Deploy GitHub Pages**

#### Aggiornare il secret e ridistribuire

1. **Settings → Secrets and variables → Actions**
2. Clicca **`SUBMIT_TOKEN`** → **Update** → incolla il nuovo token → **Save**
3. **Actions → Deploy GitHub Pages → Run workflow → Run workflow**
4. Attendi che il job **Validate SUBMIT_TOKEN** sia verde (204)
5. Prova l'invio recensione sul sito live

### 5. Configurazione locale

```bash
cp js/config.example.js js/config.js
```

Apri `js/config.js` e sostituisci `YOUR_TOKEN_HERE` con il token creato al passo 4.

Test rapido del token (sostituisci `YOUR_TOKEN`):

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{"event_type":"token-validation","client_payload":{"source":"local test"}}' \
  https://api.github.com/repos/adangelo1996-eng/Recensioni-trash/dispatches
```

Risposta attesa: **`204`**. Se ottieni **`403`**, il PAT non ha i permessi corretti.

> **Nota:** `js/config.js` è in `.gitignore` e **non** va committato. In Pages il file viene generato dal workflow di deploy.

## Sicurezza del token

Il token viene usato dal frontend per inviare recensioni tramite l'API `repository_dispatch` di GitHub. Essendo incluso in un file JavaScript servito da GitHub Pages, **chiunque visiti il sito può potenzialmente estrarlo** (DevTools → Sources/Network).

Per un progetto personale/amici va bene; per uso pubblico valuta alternative server-side. Il PAT espone **Contents** sul repo (necessario per `repository_dispatch`); non concedere permessi su altri repository.

## Flusso di invio recensione

1. L'utente compila il form nel browser
2. Il client legge `window.CONFIG` da `js/config.js`
3. Invia una richiesta `POST` a `https://api.github.com/repos/{owner}/{repo}/dispatches` con:
   - Header: `Authorization: Bearer {token}`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`
   - `event_type`: `new-review`
   - `client_payload`: `{ trashName, food, guide, hospitality, comment? }`
4. GitHub avvia il workflow **Submit Review** (`.github/workflows/submit-review.yml`)
5. Lo script `.github/scripts/append-review.js`:
   - valida i dati
   - aggiunge `id` e `createdAt`
   - appende la recensione a `data/reviews.json`
6. Il workflow committa e pusha la modifica
7. GitHub Pages serve la versione aggiornata del sito con la nuova recensione

## Validazione token in CI

Durante ogni deploy, `.github/scripts/validate-submit-token.js` invia un probe `repository_dispatch` con `event_type: token-validation` (non attiva il workflow Submit Review). Se GitHub risponde **403**, il deploy **non** procede e i log indicano esattamente quali permessi servono.
