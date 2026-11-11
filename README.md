# RCA Doctor

An interactive teaching and assessment tool for Root Cause Analysis, built for T-Level Digital students at Exeter College. See `DESIGN.md` for the full design.

## Running it

```bash
npm install
npm run dev      # local development server
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Deployment

Upload the contents of `dist/` to shared hosting. The app is client-side only: no backend, no database, no API calls. `public/.htaccess` is copied into `dist/` automatically and handles client-side routing fallback for a hard refresh on any `/scenario/...` URL.

If the app is deployed to a subfolder rather than the domain root, set `base` in `vite.config.js` before building.

## Data and progress

All scenario content, including correct answers, ships in the JavaScript bundle - there is no backend to hide it behind. This is a known, accepted limitation for a formative classroom tool (see `DESIGN.md` section 3.5).

Student progress is stored in the browser's `localStorage` under the key `rcaTrainer.v1`. Nothing is sent anywhere. A "Reset my progress" control on the home page clears it after confirmation.

## Licence

Released under CC BY-NC-SA 4.0 International. See `LICENSE.md`.
