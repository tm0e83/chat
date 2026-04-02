# Anforderungen — Firebase Support Chat System

Vollständige Übersicht aller besprochenen Anforderungen.

---

## Grundidee

- Support-Chat in JavaScript, einbettbar in beliebige Web-Projekte per `<script>`-Tag
- Besucher sollen nach Authentifizierung Nachrichten senden können
- Admin (Eigentümer) antwortet über ein separates Dashboard
- Das System ist als **Multi-Tenant-SaaS** konzipiert

---

## Hosting & Infrastruktur

- Vollständig auf **Firebase** gehostet (Hosting, Datenbank, Auth, Functions)
- Datenbank: **Firestore** (nicht Realtime Database)
- Region: **europe-west3 (Frankfurt)** — DSGVO-konform, Daten bleiben in der EU
- Firebase Cloud Functions für serverseitige Operationen (User-Management, Einladungen, Löschungen)

---

## Authentifizierung (Chat-Nutzer)

- **Email + Passwort** über Firebase Auth
- **Google Login** über Firebase Auth (OAuth)

---

## Widget

### Einbindung
- Einbindung per einzelnem `<script>`-Tag mit `data-tenant-id`-Attribut
- Programmatische Initialisierung über `SupportChat.init({...})` möglich

### Modi
| Modus | Beschreibung |
|---|---|
| `floating` (Standard) | Chat-Icon in einer Ecke des Browsers — per Klick öffnen |
| `inline` | Chat direkt auf der Seite eingebettet, kein Icon (z.B. Startseite) |
| Fullscreen-Toggle | Icon (⤢) im Chat-Header — Nutzer wechselt selbst in Vollbild; Schließen per ✕ oder Escape |

### Technisches
- Läuft im **Shadow DOM** — keine Stil-Konflikte mit der Host-Seite
- Bundle als einzelne IIFE-JS-Datei (kein Modul-System auf der Host-Seite nötig)
- Tenant-Branding (Farbe, Begrüßungstext) wird aus Firestore geladen

### Domain-Whitelist
- Widget initialisiert sich **nur auf freigegebenen Domains**
- Zweischichtiger Schutz:
  1. Client-seitig: Widget prüft `window.location.hostname` gegen Tenant-Domains
  2. Server-seitig: Firestore Security Rule prüft `domain`-Feld beim Erstellen einer Konversation

### DSGVO-Consent
- Vor dem ersten Login erscheint ein **Mini-Banner** im Widget
- Inhalt: Hinweis auf Firebase/Google + Link zur Datenschutzerklärung
- Nutzer muss aktiv zustimmen (`[Zustimmen & fortfahren]`)
- Zustimmung wird in `localStorage` gespeichert (kein erneuter Banner bei Rückkehr)
- Link zur Datenschutzerklärung per `privacyUrl` im Tenant-Branding konfigurierbar

---

## Design

- **Minimalistisch und elegant** — keine unnötigen Rahmen, keine Zierelemente
- Clean, modern, funktional — nur was nötig ist
- Funktioniert auf **hellen und dunklen Hintergründen**:
  - Automatisch via `prefers-color-scheme` Media Query
  - Farben per CSS Custom Properties überschreibbar
- Subtile Schatten nur wo funktional nötig
- Großzügige Whitespace, klare Typografie, abgerundete Ecken

---

## Admin-Dashboard

Eine separate Web-App (z.B. `admin.domain.de`), zugänglich nur für authentifizierte Admins.

### Konversationen
- Liste aller Chats mit **Echtzeit-Updates** (Firestore `onSnapshot`)
- **Unread-Badges** (wie viele neue Nachrichten vom Nutzer)
- Auf Konversation antworten
- Konversation als **Resolved** markieren
- Konversation **permanent löschen** (inkl. aller Nachrichten)

### Suche
- Nach **Nutzer-E-Mail** suchen (Prefix-Suche via Firestore Query)
- Nach **Nachrichteninhalt** suchen (Keyword, via Cloud Function)

### Nutzer-Verwaltung
- Übersicht aller registrierten Nutzer des Tenants
- Nutzer **deaktivieren** (Zugang sperren, kann sich nicht mehr einloggen)
- Nutzer **wieder aktivieren**
- Nutzer **permanent löschen** (Firebase Auth + alle Firestore-Daten)

### Domain-Verwaltung
- Erlaubte Domains **anzeigen, hinzufügen und entfernen**
- Änderungen wirken sofort (Widget prüft bei jedem Start)

### Statistiken
- Statistiken-Seite ist vorhanden
- **Konkrete Metriken werden später definiert**

---

## Multi-Tenancy

### Rollen-Hierarchie
```
Super-Admin (Systemeigentümer)
└── Tenant (Organisation/Person)
    ├── Tenant-Admin 1
    ├── Tenant-Admin 2
    └── Chat-Nutzer (Besucher der Tenant-Websites)
```

### Super-Admin
- Verwaltet alle Tenants
- Lädt neue Tenants per E-Mail ein
- Sieht systemweite Statistiken
- Kann Tenants suspendieren oder löschen

### Tenant
- Eine Person oder Organisation, die den Chat auf ihrer/seinen Website(s) einsetzt
- Hat eigene Domains, Konversationen, Nutzer und Branding
- Sieht **nie** Daten anderer Tenants (strikte Isolation)

### Tenant-Admin
- Verwaltet Konversationen, Nutzer und Domains des eigenen Tenants
- Kann weitere Admins für den eigenen Tenant einladen
- Hat keinen Zugriff auf andere Tenants

### Onboarding
- **Nur per Einladung** — kein Self-Service
- Super-Admin lädt per E-Mail ein
- Eingeladene Person klickt Link, registriert sich, erhält automatisch die Tenant-Admin-Rolle

### Branding pro Tenant
- Primärfarbe (Widget-Farbe)
- Begrüßungstext im Widget
- Link zur Datenschutzerklärung

---

## DSGVO / Datenschutz

### Technische Maßnahmen
- Firebase-Infrastruktur in Region **europe-west3 (Frankfurt)** — Daten bleiben in der EU
- **Datensparsamkeit**: nur UID, E-Mail und Nachrichtentext werden gespeichert
- **Recht auf Löschung** implementiert: `deleteUser` löscht Auth-Eintrag + alle Firestore-Daten
- Messages sind immutabel (kein Client-seitiges Update oder Löschen)

### Consent
- Consent-Banner im Widget vor der ersten Nutzung
- Zustimmung in `localStorage` gespeichert

### Dokumentation
- DSGVO-konforme Datenschutzerklärung als Vorlage unter `docs/datenschutzerklaerung.md`
- Muss vom Betreiber mit persönlichen Angaben (Name, Adresse, Kontakt) ergänzt werden
- Hinweis: Kein Ersatz für rechtliche Beratung

---

## Offene Punkte (für später)

- Welche konkreten Statistiken sollen im Dashboard angezeigt werden?
- Pläne/Preisstufen für Tenants (Kontingente, Limits pro Plan)?
- E-Mail-Benachrichtigungen wenn ein Nutzer eine neue Nachricht sendet?
- Push-Notifications?
