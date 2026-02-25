# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler


# My Inventory App

This repository contains a full-stack inventory application: a Node/Express backend and a React + Vite frontend.

Contents
- `backend/` — Express server, database config, migrations, and file uploads.
- `frontend/` — Vite + React app with components and pages for inventory, auth, and marketplace.

Quick start (development)

1. Install dependencies for backend and frontend:

```powershell
cd backend
npm install
cd ../frontend
npm install
```

2. Run backend (from `backend/`):

```powershell
npm start
# or
node server.js
```

3. Run frontend (from `frontend/`):

```powershell
npm run dev
```

Notes
- `node_modules/` is ignored by `.gitignore` and is not tracked in the repo.
- `backend/` contains example uploads under `backend/uploads/`.

License
- Add a license file if you intend to open-source this project.

Contact
- For questions, open an issue or contact the maintainer.

