# francepetroni.github.io

Sito personale di France Petroni, migrato da Serverplan/WordPress a GitHub Pages.

---

## Migrazione a GitHub Pages

### Step 1 — Rinnova il dominio (urgente)

Il dominio scade a breve — rinnova dal pannello Serverplan prima di fare qualsiasi altra operazione.

---

### Step 2 — Configura GitHub Pages

1. Vai nelle impostazioni del repository su GitHub: **Settings → Pages**
2. In **Source** seleziona il branch `main` e la cartella `/ (root)`
3. In **Custom domain** inserisci il dominio e clicca **Save**
4. GitHub creerà automaticamente un file `CNAME` nel repository
5. Spunta **Enforce HTTPS** dopo che il certificato è emesso

---

### Step 3 — Configura i record DNS su Cloudflare

Il DNS è gestito da Cloudflare. Accedi al pannello e aggiungi:

| Tipo | Nome | Valore | Proxy |
|------|------|--------|-------|
| `A` | `@` | `185.199.108.153` | DNS only |
| `A` | `@` | `185.199.109.153` | DNS only |
| `A` | `@` | `185.199.110.153` | DNS only |
| `A` | `@` | `185.199.111.153` | DNS only |
| `CNAME` | `www` | `francepetroni.github.io` | DNS only |

> Il proxy Cloudflare (icona arancione) deve essere **disattivato** su tutti questi record, altrimenti GitHub Pages non riesce a emettere il certificato SSL.

La propagazione DNS può richiedere fino a 48 ore.

---

### Step 4 — Verifica

Puoi controllare la propagazione su [dnschecker.org](https://dnschecker.org).

---

### Step 5 — Disdici il piano hosting (facoltativo)

Una volta verificato che il sito funzioni, il piano hosting WordPress su Serverplan non è più necessario. Il dominio va comunque rinnovato ogni anno indipendentemente dal piano hosting.

---

## Struttura del repository

```
francepetroni.github.io/
├── index.html        # Pagina principale
├── CNAME             # Creato automaticamente da GitHub Pages
└── README.md         # Questo file
```

## Note tecniche

- GitHub Pages serve automaticamente `index.html` dalla root del branch configurato
- Il certificato SSL è gestito gratuitamente da GitHub tramite Let's Encrypt
- Per aggiornare il sito basta fare un commit e push sul branch `main`
