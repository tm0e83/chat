# Firebase Support Chat System

Ein wiederverwendbares Support-Chat-Widget als Multi-Tenant-SaaS auf Firebase-Basis.

## Projektstruktur

```
chat/
├── shared/       # Gemeinsame Firebase-Konfiguration und Konstanten
├── widget/       # Einbettbares JS-Widget (Vanilla JS + Vite, IIFE-Bundle)
├── admin/        # Admin-Dashboard (React + Vite)
├── functions/    # Firebase Cloud Functions (Node.js)
└── docs/         # Dokumentation, Datenschutzerklärung
```

## Tech Stack

| Bereich | Technologie |
|---|---|
| Datenbank | Firebase Firestore (europe-west3 / Frankfurt) |
| Auth | Firebase Auth — Email/Passwort + Google Login |
| Hosting | Firebase Hosting (Multi-Site: widget + admin) |
| Serverlogik | Firebase Cloud Functions (Node.js) |
| Widget | Vanilla JS + Vite (IIFE-Bundle, Shadow DOM) |
| Admin | React + Vite |

## Rollen & Custom Claims

| Rolle | Custom Claim | Beschreibung |
|---|---|---|
| Super-Admin | `{ role: 'superadmin' }` | Systemeigentümer, verwaltet alle Tenants |
| Tenant-Admin | `{ role: 'admin', tenantId: 'xyz' }` | Verwaltet eigene Konversationen, Nutzer, Domains |
| Chat-Nutzer | — | Authentifizierter Besucher einer Tenant-Website |

## Setup (Ersteinrichtung)

### Voraussetzungen
- Node.js >= 18
- Firebase CLI: `npm install -g firebase-tools`
- Firebase-Projekt in der Konsole angelegt (Region: **europe-west3**)

### Installation

```bash
# Abhängigkeiten aller Workspaces installieren
npm install

# Firebase einloggen
firebase login

# Firebase-Konfiguration in shared/src/firebase-config.js eintragen
# (Werte aus Firebase Console > Projekteinstellungen)
```

### Super-Admin einrichten (einmalig)

```bash
# Functions deployen
npm run deploy:functions

# Super-Admin-Claim setzen (UID aus Firebase Console > Authentication)
# In der Firebase Console > Functions > setAdminClaim aufrufen
# oder temporär direkt über Firebase Admin SDK Script
```

### Entwicklung starten

```bash
# Widget (Dev-Server)
npm run dev -w widget

# Admin (Dev-Server)
npm run dev -w admin

# Functions (Emulator)
npm run serve -w functions
```

### Build & Deploy

```bash
# Alles bauen
npm run build

# Alles deployen
npm run deploy

# Nur Functions deployen
npm run deploy:functions
```

## Firebase-Konfiguration

Alle Firebase-Credentials gehören in `shared/src/firebase-config.js`.
**Niemals in die Versionskontrolle committen** — `.gitignore` prüfen!

## Konventionen

- Deterministischer Konversations-ID: `{tenantId}_{userId}`
- Alle Cloud Functions prüfen Admin-Rolle vor Ausführung
- Messages sind immutabel (kein Update/Delete durch den Client)
- Domain-Whitelist: zweischichtig (Client + Firestore Security Rule)
- CSS Custom Properties für alle Farben — kein hardcoded Styling

## Wichtige Dateien

| Datei | Beschreibung |
|---|---|
| `firestore.rules` | Firestore Security Rules — kritisch, sorgfältig testen |
| `firestore.indexes.json` | Composite Indexes |
| `firebase.json` | Multi-Site Hosting Konfiguration |
| `shared/src/firebase-config.js` | Firebase Credentials |
| `widget/src/init.js` | Domain-Check + Consent-Banner |
| `functions/src/auth/deleteUser.js` | Löscht Auth + alle Firestore-Daten |

## Dokumentation

- `docs/anforderungen.md` — vollständige Anforderungsübersicht
- `docs/datenschutzerklaerung.md` — DSGVO-Vorlage für Tenants
