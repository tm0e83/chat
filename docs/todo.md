# Setup-Todos

Alle Schritte müssen einmalig durchgeführt werden, bevor das System produktiv genutzt werden kann.

---

## 1. Firebase-Projekt anlegen

- [ ] Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Neues Projekt erstellen
- [ ] Bei der Standortauswahl **europe-west3 (Frankfurt)** wählen
- [ ] Folgende Dienste aktivieren:
  - **Authentication** → Sign-in methods: E-Mail/Passwort + Google aktivieren
  - **Firestore Database** → Im Produktionsmodus erstellen
  - **Functions** → Blaze-Plan erforderlich (pay-as-you-go)
  - **Hosting** → aktivieren

---

## 2. Firebase CLI einrichten

- [ ] Firebase CLI installieren: `npm install -g firebase-tools`
- [ ] Einloggen: `firebase login`
- [ ] Projekt verknüpfen: `firebase use --add`

---

## 3. Konfiguration eintragen

- [ ] In der Firebase Console unter **Projekteinstellungen → Allgemein → Deine Apps** eine Web-App hinzufügen
- [ ] Die Werte in `shared/src/firebase-config.js` eintragen (Datei nach diesem Muster erstellen):

```js
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}

export const app = initializeApp(firebaseConfig)
```

> **Wichtig:** Diese Datei steht in `.gitignore` — niemals committen.

---

## 4. Super-Admin einrichten (einmalig)

- [ ] Functions deployen: `npm run deploy:functions`
- [ ] In der Firebase Console → Authentication einen Admin-Nutzer anlegen
- [ ] Die UID des Nutzers kopieren
- [ ] `setAdminClaim` Cloud Function mit der UID aufrufen (über Firebase Console → Functions oder im Emulator)

---

## 5. Alles deployen

- [ ] Abhängigkeiten installieren: `npm install`
- [ ] Projekt bauen: `npm run build`
- [ ] Deployen: `npm run deploy`
