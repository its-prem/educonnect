# EduConnect Web (React UI)

College & course discovery website — **UI first**, Hostinger MySQL backend next.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router

## Run locally

```bash
cd educonnect-web
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for Hostinger

```bash
npm run build
```

Upload the `dist/` folder contents to your Hostinger `public_html` (or subdomain folder).

MySQL + PHP/Laravel API will be wired in a later phase — this folder is the frontend only.

## Current pages

| Route | Status |
|---|---|
| `/` | Index / landing (complete) |
| `/colleges`, `/courses`, `/compare` | Placeholder |
| `/login`, `/college/*`, `/admin/login` | Placeholder |

## Brand

Deep navy + teal accent, Bricolage Grotesque + Manrope, campus full-bleed hero.
