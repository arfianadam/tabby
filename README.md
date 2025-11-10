# Tabby — Toby-style collections for Chrome

This project is a Manifest V3 Chrome extension built with Vite + React. It recreates the core experience of [gettoby.com](https://www.gettoby.com/): organise browsing into collections → folders → bookmarks while syncing everything to Firebase (Firestore + Email/Password auth).

The popup handles authentication, invitation-only sign up, and a real-time UI for listing the current window's tabs or adding manual bookmarks. All data is stored under `users/{uid}/collections/*` in Firestore so that every signed-in browser sees the same state.

## Features

- Invitation-only registration enforced before creating a Firebase Auth user.
- Email/password login with persistent Firebase sessions.
- Realtime Firestore sync for collections, folders, and bookmarks (stored as nested arrays per collection).
- Current-window tab list for quickly capturing a page into any folder (requires the built extension so the Tabs API is available).
- Manual folder + bookmark management with inline forms and destructive action confirmations.
- Responsive popup layout tailored for the Chrome extension window.
- Overrides the Chrome new tab page so the Tabby dashboard always appears in every new tab.
- Caches the last signed-in workspace locally so reopening a tab instantly renders your collections while Firebase reconnects.

## Firebase setup

1. Create a Firebase project (free tier is fine).
2. Enable **Authentication → Email/Password**.
3. Create a **Cloud Firestore** database in production mode.
4. Recommended security rule (locks data to the authenticated user):

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/collections/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. Copy `.env.example` to `.env` and fill in the Firebase config from **Project settings → General → Your apps → Web app**.

   ```bash
   cp .env.example .env
   ```

6. Update `VITE_INVITE_CODE` in `.env` with the invitation code you plan to share. Registration stays disabled until a code is provided.

## Development

The popup can be previewed in the browser with Vite. Chrome-specific APIs (tab listing) are automatically disabled in this mode.

```bash
npm install
npm run dev
```

Vite will print a localhost URL where you can keep iterating on the UI.

## Build & load the extension

```bash
npm run build
```

This produces `dist/`, which Chrome can load:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist` folder.
4. Pin “Tabby Collections” and open its popup to log in (optional—the popup and new tab share the same UI).
5. Every new tab will now open the Tabby dashboard automatically. To reach the stock new tab page temporarily, disable the extension or open `chrome://new-tab-page` manually.

## Project layout

- `public/manifest.json` – Manifest V3 definition referencing the compiled popup and icons (`public/icons`).
- `src/firebase/*` – Firebase initialisation (Auth + Firestore clients).
- `src/services/collections.ts` – Firestore read/write helpers that keep collections/folders/bookmarks synced.
- `src/components/*` – React UI for the auth gate and dashboard.
- `tailwind.config.js`, `postcss.config.js`, and `src/index.css` – Tailwind CSS configuration + base layer used across both the popup and overridden new tab page.
- `.env.example` – Required environment variables, including the invitation code gate.

## Notes

- The suggested Firestore rule above ensures users can only read/write their own workspace. Without it, any authenticated user would be able to reach other documents.
- Collections store folders and bookmarks as nested arrays to keep reads/writes small—perfect for the Firebase free tier. If you outgrow this, refactor to subcollections without touching the UI layer.
- Chrome Tabs API functionality (the tab list inside the bookmark modal) is only available when the built extension runs; during `npm run dev` it will stay hidden.
