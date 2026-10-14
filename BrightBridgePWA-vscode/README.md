# BrightBridge

BrightBridge is a front-end-only wellbeing demo built with React, Vite, and localStorage. It is ready to deploy as a Vercel static site; it has no database, API keys, server functions, or external authentication provider.

## Run locally

```sh
npm install
npm run dev
```

The demo account system, check-ins, saved calendar markers, and resource recommendations are stored only in the current browser's localStorage. Use **Settings → Clear my demo data** to reset it.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Vercel detects Vite automatically. Confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**.

`vercel.json` includes a single-page-app rewrite, so direct links such as `/daily-checkin`, `/resources/grounding-tools`, and `/settings` resolve correctly after deployment.

## Quality checks

```sh
npm run lint
npm run build
```

## Important demo limitation

Accounts and check-ins live in localStorage. They are specific to one browser/device, are not secure authentication, and are not shared with other users. A production version should replace the small functions in `src/features/auth/authClient.js` and `src/features/journal/journalApi.js` with a proper backend.
