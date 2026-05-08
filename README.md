# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

It is preconfigured to work with Power Apps Code Apps.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
1. Contesto e Obiettivo 

Chi lavora in trasferta accumula scontrini, ricevute e fatture da rimborsare. Oggi la procedura tipica è raccogliere tutto in una busta, compilare un foglio Excel e mandarlo al proprio responsabile. Il processo è dispersivo, poco tracciabile e scomodo sia per il dipendente che per chi deve approvare. 

Questa soluzione risponde al problema senza imporre strumenti nuovi ai dipendenti: il canale di interazione è Microsoft Teams, che l'azienda già usa ogni giorno. Il dipendente fotografa la ricevuta, la manda al bot, controlla i dati estratti dall'AI e conferma — tutto in chat, in pochi secondi. 

La soluzione è progettata per essere economica da scalare: i dipendenti non necessitano di licenze aggiuntive oltre a quelle Microsoft 365 già in loro possesso. Solo chi approva le note spese accede a una Power App dedicata. 

2. Attori 

Attore 

Strumento 

Ruolo 

Dipendente 

Teams (Copilot Studio) 

Invia le ricevute, corregge i dati estratti, conferma l'invio 

Sistema di triage 

Copilot Studio (mailbox) 

Riceve i dati dalla chat, li struttura e li scrive su Dataverse 

Approvatore 

Power Apps Canvas 

Rivede le note spese ricevute, approva o rifiuta 

3. Funzionalità della Soluzione 

La soluzione è composta da tre segmenti distinti che si passano il lavoro in sequenza. Ciascun segmento è indipendente e sostituibile nel tempo. 

Segmento 1 — Il Bot su Teams (interfaccia del dipendente) 

Il dipendente apre Microsoft Teams e avvia una conversazione con il bot aziendale dedicato alle note spese. Il bot è sempre disponibile, non richiede login aggiuntivi e funziona esattamente come una chat. 

Invio della ricevuta 

Il dipendente allega direttamente in chat la foto o il file PDF della ricevuta. Il bot riceve il file, lo invia al motore AI di estrazione e, nel giro di pochi secondi, risponde nella stessa chat con una Adaptive Card che mostra i dati riconosciuti.6 

L'Adaptive Card di revisione 

La card presentata dal bot in Teams mostra in forma strutturata tutti i dati che l'AI ha estratto dalla ricevuta. Questi campi sono direttamente modificabili all'interno della card, senza uscire da Teams: 

Nome dell'esercente 

Data della spesa 

Importo e valuta 

 

La card presenta anche i campi che il dipendente deve compilare manualmente: 

Categoria di spesa (Vitto, Alloggio, Trasporto, Carburante, Rappresentanza, Altro) 

Codice progetto o commessa di riferimento 

Note aggiuntive facoltative 

 

In fondo alla card sono presenti due pulsanti: Conferma e Annulla. 

Conferma e invio 

Quando il dipendente preme Conferma, i dati validati — insieme al file originale della ricevuta — vengono inviati automaticamente alla mailbox condivisa designata come punto di raccolta. Il dipendente riceve un breve messaggio di conferma nella chat. Se l'AI non riesce a estrarre i dati, la card viene mostrata con i campi vuoti e il dipendente può compilarli manualmente. 

Segmento 2 — Il Triage dalla Mailbox (elaborazione automatica) 

La mailbox condivisa riceve i messaggi inviati dal bot. Un secondo agente Copilot — configurato per monitorare questa mailbox — intercetta ogni nuovo messaggio e si occupa di strutturare i dati e archiviarli. 

Cosa fa il triage 

Legge il contenuto del messaggio ricevuto, identifica la spesa descritta e determina a quale nota spese associarla. Se il dipendente ha già una nota spese aperta per il periodo e il progetto corrispondente, la voce viene aggiunta a quella esistente. Se non esiste una nota spese adatta, ne viene creata una nuova automaticamente. Una volta effettuata questa valutazione, l'agente scrive i dati su Dataverse e allega il file originale della ricevuta al record corrispondente. 

Perché una mailbox come punto di passaggio 

La mailbox condivisa è un buffer deliberato tra il mondo della chat e il mondo dei dati strutturati. Garantisce un registro permanente di tutto ciò che è stato inviato, indipendentemente da eventuali errori del triage. Se il triage fallisce su un messaggio, la ricevuta non si perde — è ancora nella mailbox e può essere rilavorata. È anche un punto di audit naturale. 

Segmento 3 — La Power App per l'Approvatore 

L'approvatore accede a una Canvas App che mostra le note spese ricevute dai propri dipendenti. 

Lista delle note spese 

La schermata principale mostra le note spese in ordine cronologico, filtrabili per dipendente, periodo e stato. Ogni riga indica il nome del dipendente, il periodo di riferimento, il totale e lo stato attuale. 

Dettaglio della nota spese 

Aprendo una nota spese, l'approvatore vede la lista di tutte le voci di spesa con: data, esercente, categoria, importo e l'anteprima o il link alla ricevuta originale allegata su Dataverse. 

Azioni disponibili 

Approva: la nota spese viene confermata. 

Rifiuta: l'approvatore inserisce una motivazione. La nota torna visibile come rifiutata. 

4. Workflow e Stati 

Stato nota spese 

Significato 

In composizione 

Il triage sta raccogliendo le voci (note spese non ancora chiusa) 

In attesa di approvazione 

Tutte le voci sono state ricevute, in attesa del responsabile 

Approvata 

Confermata dal responsabile 

Rifiutata 

Rifiutata con motivazione dal responsabile 

 

Stato ricevuta singola 

Significato 

In Elaborazione 

L'AI sta leggendo il file della ricevuta 

Estratto 

L'AI ha completato l'estrazione con successo 

Errore 

L'estrazione AI è fallita (inserimento manuale disponibile) 

5. Vincoli Architetturali 

I seguenti vincoli non sono negoziabili. 

 

Vincolo 

Descrizione 

Tre segmenti separati 

Bot Teams, agente triage mailbox e Power App sono indipendenti. Il contratto è: bot scrive nella mailbox, mailbox alimenta Dataverse, Power App legge da Dataverse. 

Soluzione Power Platform unica 

Tutto — flow, app, tabelle Dataverse, agenti Copilot Studio — risiede in una singola soluzione con publisher prefix agic. 

Dataverse unico layer dati strutturati 

Nessun dato di business viene persistito fuori da Dataverse. La mailbox è un buffer di transito, non un archivio. 

Mailbox come punto di disaccoppiamento 

Il bot non scrive direttamente su Dataverse. Il triage non conosce il funzionamento interno del bot. Questo consente di cambiare canale di interazione senza toccare il triage. 

Adaptive Card unica interfaccia dipendente 

Il dipendente non deve accedere a nessuna Power App o portale web. Tutta l'interazione avviene dentro Teams tramite la card. 

Campi AI sempre modificabili 

Nessun campo estratto dall'AI deve essere bloccato nella card prima della conferma. 

Inserimento manuale sempre possibile 

Se l'estrazione AI fallisce, la card viene mostrata con i campi vuoti. Il sistema non si blocca su un errore AI. 

Power App solo per approvatori 

La Canvas App non contiene funzionalità di inserimento spese. Non è destinata ai dipendenti. 

6. Cosa Non Rientra in Questa Casistica 

I seguenti scenari sono deliberatamente esclusi e rappresentano le opportunità di upsell con il cliente reale. 

Integrazione con sistemi HR o paghe per il pagamento effettivo del rimborso 

Gestione di policy aziendali sulle spese (limiti per categoria, soglie di approvazione automatica) 

Notifiche push o email all'approvatore quando arriva una nuova nota spese 

Gestione valute multiple e conversione cambi 

Storico e reportistica delle spese per dipendente 

Gestione multi-azienda o multi-tenant 