# Figure.09

A personal ideas tracker: save every idea you want to build, mark each one **Not started** or **Working on it**, and delete ideas you no longer want (with Undo). It works on phone and desktop, installs as an app on both, and changes show up on your other devices within seconds.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, magic-link auth, Realtime) · installable PWA · Vercel

---

## 1. Create the Supabase project

1. Sign in at <https://supabase.com> → **New project**. Pick a name (e.g. `figure09`), a strong database password and the region closest to you. Wait ~1 minute for it to provision.
2. **Run the migration:** open **SQL Editor → New query**, paste the whole of [`supabase/migrations/0001_ideas.sql`](supabase/migrations/0001_ideas.sql) and click **Run**. It creates:
   - the `ideas` table (title required, max 120 chars; status `not_started` | `working_on_it`)
   - an `updated_at` trigger
   - Row Level Security with four policies (select, insert, update, delete), all limited to `auth.uid() = user_id`, so each user only ever sees their own ideas
   - Realtime publication for the table
3. **Auth settings**, under **Authentication**:
   - **URL Configuration**:
     - Set **Site URL** to `http://localhost:3000` for now; after deploying, change it to your Vercel URL.
     - Add these **Redirect URLs**: `http://localhost:3000/auth/callback` and `https://YOUR-APP.vercel.app/auth/callback`
   - **Email Templates → Magic Link**: add the one-time code to the template so it can be typed into the installed app. Paste this in the body alongside the existing link:
     ```html
     <p>Or enter this code in Figure.09: <strong>{{ .Token }}</strong></p>
     ```
     > Why: on iPhone, a home-screen app doesn't share cookies with Safari. Tapping the email link signs you in inside **Safari**, not in the installed app. Typing the code signs in the app itself. The code also works if you open the email on a different device.
   - Optional: Supabase's built-in email sender has a low hourly limit. For real use, add your own SMTP under **Authentication → SMTP Settings**.
4. **Get your keys** from **Project Settings → API**: the **Project URL** and the **anon public** key.

## 2. Run locally

Requires Node 20+.

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Then install and start the dev server:

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be sent to the login screen. Enter your email, then click the link or type the code.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests for filtering, sorting, counts and validation |
| `npm run lint` | ESLint |
| `npm run build && npm start` | Production build. The service worker only registers in production. |

## 3. Deploy to Vercel

1. Push this repo to GitHub (already set up as `faceless121212/Builder`).
2. Go to <https://vercel.com/new> → **Import** the repo. The framework is detected as Next.js automatically.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `FAL_KEY` is not needed.
4. Click **Deploy**. When it finishes, copy the URL, e.g. `https://figure09.vercel.app`.
5. Back in Supabase **Authentication → URL Configuration**, set **Site URL** to that URL and make sure `https://…vercel.app/auth/callback` is in **Redirect URLs**.

## 4. Install the app

A PWA must be served over HTTPS to be installed, so use your Vercel URL.

**iPhone / iPad (Safari)**
1. Open the site in **Safari**, not Chrome, and sign in.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open Figure.09 from the home screen. The first time, sign in with the **code** from the email (see the note above).
4. The long-press "New idea" shortcut is not supported on iOS; use the orange **+** button.

**Android (Chrome)**
1. Open the site in Chrome and sign in.
2. Tap **⋮ → Install app** (or accept the install banner).
3. **Long-press** the Figure.09 icon → **New idea** opens the add form directly.

**Desktop (Chrome / Edge)**
1. Open the site and click the **install icon** in the address bar (or **⋮ → Cast, save and share → Install page as app**).
2. **Right-click** the app icon in the Dock or taskbar → **New idea**.
3. On macOS Safari 17+: **File → Add to Dock**.

## How it works

| Feature | Where |
| --- | --- |
| Auth redirect for logged-out users (Next 16 `proxy.ts`, formerly middleware) | `src/proxy.ts` |
| Magic link + one-time code login | `src/app/login/*`, `src/app/auth/callback/route.ts` |
| State: optimistic updates, rollback, Undo delete, realtime | `src/hooks/useIdeas.ts` |
| Desktop quick add (Enter; `N` focuses it) | `src/components/AddIdeaInline.tsx` |
| Mobile **+** button and bottom sheet (also opened by `/?new=1`) | `src/components/AddIdeaSheet.tsx`, `Sheet.tsx` |
| Cards, swipe-left to delete, status toggle | `src/components/IdeaCard.tsx`, `StatusBadge.tsx` |
| Offline banner and drafts that survive reloads | `src/components/OfflineBanner.tsx`, `src/hooks/useDraft.ts` |
| Manifest, including the "New idea" shortcut | `src/app/manifest.ts` |
| Service worker (static assets only; never caches your data) | `public/sw.js` |

- **Status toggle:** the UI updates instantly. If the save fails, it rolls back and shows an error toast.
- **Delete:** the card disappears and an **Undo** toast shows for 5 seconds. The database row is only deleted after the 5 seconds are up, so Undo simply cancels. If you close the tab during those 5 seconds, the delete is sent right away.
- **Sync:** the app subscribes to Supabase Realtime `postgres_changes` for your own rows. It also refetches when the app comes back to the foreground or reconnects, to catch anything it missed.

## Checking the acceptance criteria

1. **Adding:**
   - Desktop: type in "Add idea" and press **Enter**; **N** focuses the field.
   - Phone: tap **+**, type, then **Save idea**.
   - Empty or whitespace-only titles show an inline message.
2. **Status:** tap the status badge; it changes instantly. Refresh and it's still changed.
3. **Undo:** delete a card with the trash icon or a swipe left. Tap **Undo** in the toast and the card comes back.
4. **Sync:** sign in on phone and desktop. An idea added on one shows on the other within a couple of seconds.
5. **Filters:** the counts on All / Working on it / Not started match the lists.
6. **Installability:** Lighthouse 12+ removed the PWA category. In Chrome DevTools → **Application → Manifest**, the page shows no installability errors, and **Service workers** shows `sw.js` activated.
7. **Isolation:** sign in as a second email in a private window; that account sees none of your ideas, because RLS enforces it in the database. To double-check, run `select * from ideas;` in the SQL editor while "impersonating" the other user.

## Artwork

The app icon and the empty-state illustration were generated with fal.ai (Recraft V3, vector style).

To regenerate them:
1. Put `FAL_KEY` in `.env.local`, then fetch new artwork:
   ```bash
   node --env-file=.env.local scripts/generate-assets.mjs
   ```
2. Rebuild the PWA icon sizes:
   ```bash
   node scripts/build-icons.mjs
   ```
