# Sette opp delt High Score system

## Steg 1: Opprett konto på JSONBin.io
1. Gå til https://jsonbin.io
2. Klikk på "Create Account" eller "Login" (hvis du allerede har konto)
3. Du kan logge inn med Google, GitHub, Facebook, Twitter eller e-post

## Steg 2: Opprett en ny Bin
1. Etter innlogging, du skal være på dashboard: https://jsonbin.io/app/bins#!
2. Klikk på "Create New" eller "New Bin" knappen
3. Lim inn dette i bin-editor (JSONBin krever at bin-en ikke er helt tom):
```json
[
  {
    "name": "Eksempel",
    "score": 1000,
    "date": "2024-01-01T00:00:00.000Z"
  }
]
```

**Viktig:** Denne eksempel-scoren vil automatisk bli filtrert bort når du legger inn ekte scores. Du kan også slette den senere i JSONBin.io dashboard.

4. Gi bin-en et navn (f.eks. "tetris-scores") i navnefeltet
5. Klikk "Save" eller "Create"

## Steg 3: Hent Bin ID
1. Etter at bin-en er opprettet, se på URL-en i nettleseren
2. Den ser ut som: `https://jsonbin.io/app/bins/675abc123def456789012345`
3. **Bin ID** er den siste delen etter `/bins/`: `675abc123def456789012345`
4. Du kan også se Bin ID i bin-listen i dashboardet
5. Kopier denne ID-en

## Steg 4: Hent Master Key
1. Klikk på brukerikonet øverst til høyre i JSONBin.io
2. Gå til "Account" eller "Settings" 
3. Finn "Master Key" eller "Access Keys" seksjonen
4. Klikk "Show" eller "Reveal" for å se din Master Key
5. Kopier din **Master Key** (den starter med `$2a$10$...`)

**Alternativt:** Hvis du ikke finner Master Key:
- Gå til https://jsonbin.io/app/account
- Se etter "API Keys" eller "Access Keys"
- Master Key kan også være under "Security" eller "Developer Settings"

## Steg 5: Oppdater koden
1. Åpne `script.js` i prosjektmappen
2. Finn linjene rundt linje 889-890:
   ```javascript
   const SCORES_BIN_ID = 'tetris-high-scores'; // Endre denne
   const JSONBIN_API_KEY = ''; // Legg inn din Master Key her
   ```
3. Erstatt `'tetris-high-scores'` med din Bin ID (fra steg 3) - **med anførselstegn**:
   ```javascript
   const SCORES_BIN_ID = '675abc123def456789012345';
   ```
4. Erstatt `''` med din Master Key (fra steg 4) - **med anførselstegn**:
   ```javascript
   const JSONBIN_API_KEY = '$2a$10$din-master-key-her';
   ```

## Test
1. Start Tetris-spillet
2. Få en score
3. Legg inn navnet ditt
4. Refresh siden - scoren din skal være der
5. Bekreft at vennens score også vises hvis de legger inn en score

## Tips
- Husk å ikke dele din Master Key offentlig eller committe den til GitHub
- Du kan se alle scores i JSONBin.io dashboard ved å åpne bin-en din
- Hvis noe ikke fungerer, sjekk nettleserkonsollen (F12) for feilmeldinger
- JSONBin.io gratis tier gir deg 10,000 API requests per måned - mer enn nok for dette prosjektet!

## Feilsøking
**Hvis du får CORS-feil:**
- JSONBin.io skal fungere uten CORS-problemer, men hvis du får feil, sjekk at du har riktig Master Key

**Hvis scores ikke synkroniseres:**
- Verifiser at både Bin ID og Master Key er riktig
- Sjekk nettleserkonsollen (F12) for feilmeldinger
- Prøv å laste bin-en direkte i JSONBin.io dashboard for å se om scores lagres

**Hvis bin-en ikke kan være tom:**
- Bruk eksempel-scoren som vist over
- Den vil automatisk bli filtrert bort når ekte scores legges inn

