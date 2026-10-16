# Haivoly — Application web (React + Vite)

Tableau de bord web de la plateforme agricole **Haivoly** : suivi des
parcelles, cultures, interventions, observations, récoltes, actions et
recommandations, en lien avec l'API NestJS.

---

## Démarrage

```bash
npm install
cp .env.example .env      # renseigner VITE_API_URL (proxy /api en dev)
npm run dev               # http://localhost:5173
```

Build et qualité :

```bash
npm run build             # build de production (dist/)
npm run preview           # sert le build localement
npm run lint              # ESLint
```

> L'URL de l'API vient de `VITE_API_URL` (`src/config`). En développement, Vite
> proxifie `/api` vers `http://localhost:3000` (voir `vite.config.ts`).

---

## Architecture

```
src/
├── main.tsx                point d'entrée (initialise i18n puis monte React)
├── App.tsx                 providers globaux + routeur
├── routes/
│   └── index.tsx           définition des routes (react-router-dom)
├── pages/                  un écran par route
│   ├── Login.tsx · Register.tsx
│   ├── Dashboard.tsx · Actions.tsx · Recommendations.tsx
│   ├── Utilisateurs.tsx · Profil.tsx
│   └── Parcelles.tsx · Cultures.tsx · Interventions.tsx
│       Observations.tsx · Recoltes.tsx
├── components/
│   ├── Layout/             AppShell, Header, Sidebar, TopBar, Footer,
│   │                       MenuUtilisateur, ClocheNotifications
│   │                       + NotificationsProvider, UserProvider
│   └── ui/                 composants réutilisables (ConfirmDialog, Modale,
│                           TableauDonnees, FiltreSegmente, PanneauDetail,
│                           UserSearchSelect, SelecteurLangue, ErrorState…)
├── services/
│   └── api.ts              client axios unique (token en localStorage, 401)
├── config/
│   └── index.ts            configuration (apiUrl, appName, palette de couleurs)
├── i18n/
│   ├── index.ts            initialisation i18next
│   └── locales/            traductions fr / en / mg
├── utils/                  helpers (destinataire, emetteur, initiales)
├── types/
│   └── index.ts            types partagés
├── styles/
│   └── globals.css         styles globaux
└── assets/                 logo, ressources statiques
```

**Couches clés**

- `routes/index.tsx` déclare toutes les routes ; les écrans protégés passent par
  un garde `Protected` (jeton en `localStorage`) et un `Layout` commun.
- `pages/` contient l'UI d'une route ; les composants réutilisables vivent dans
  `components/ui/`.
- `services/api.ts` est le **client axios unique** : injection du jeton, gestion
  du 401, et toutes les fonctions d'appel à l'API.
- `components/Layout/` fournit la coquille de l'application (navigation,
  utilisateur connecté, notifications).
