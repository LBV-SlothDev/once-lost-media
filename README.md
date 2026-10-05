# Once Lost Media website

A React site that opens with a running-film intro and includes:

- **Films**: upload a movie from the Studio and it plays on its own watch page.
- **Journal**: write blog entries with a cover image, pictures, YouTube/Vimeo embeds and a live preview.
- **Studio**: a sign-in area for your team only.
- **Backlot**: the shared screenplay editor, storyboards and call sheets, built into the Studio.

Without the setup below, the site runs in **demo mode**: everything works, but content is saved only in your own browser.

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) (version 20 or newer).

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## 2. Create the Supabase project (database, logins, video storage)

1. Make a free account at [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor > New query**, paste everything in `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings > API**. Copy `.env.example` to a new file called `.env.local` and paste in the **Project URL** and the **anon public** key.
4. Restart `npm run dev`. The "Demo mode" tag disappears.

### Keep it team-only

- **Authentication > Sign In / Providers > Email**: turn **off** "Allow new users to sign up".
- **Authentication > Users > Invite user**: invite yourself and each teammate by email. They sign in from the **Team sign in** link at the bottom of the site, and the site emails them a one-time link.
- **Authentication > URL Configuration**: set **Site URL** to your live address (for example `https://oncelostmedia.com`) and add `http://localhost:5173/**` under Redirect URLs.

### Movie size limits

On the free plan, Supabase limits each file to 50 MB. Full-length films need the **Pro plan**. Then go to **Storage > Settings** and raise the upload limit (for example to 10 GB). Uploads are sent in pieces and can pick up where they left off if the connection drops. For best results, export films as **MP4 (H.264 video, AAC audio)**.

## 3. Put it online with Render

1. Push this folder to a GitHub repository. `render.yaml` is already included.
2. In [Render](https://dashboard.render.com), click **New > Blueprint** and pick the repository. Render reads `render.yaml`, which sets up a static site that builds with `npm run build` and publishes the `dist` folder.
3. When Render asks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, paste in the values from `.env.local`. Click **Apply**. The site is live at an address ending in `.onrender.com`.
4. **Your domain:** open the site in Render, go to **Settings > Custom Domains**, and add your domain. Add both `oncelostmedia.com` and `www.oncelostmedia.com`. Render shows the DNS records to create.
5. At the company where you bought the domain, open its DNS settings and add those records:
   - for `www`: a **CNAME** pointing to your `.onrender.com` address
   - for the root domain: the **A record** (or ALIAS/ANAME) value Render shows
6. Back in Render, click **Verify**. It turns on HTTPS by itself once DNS updates, which can take anywhere from a few minutes to a few hours.
7. In Supabase, go to **Authentication > URL Configuration** and set **Site URL** to `https://oncelostmedia.com`. Sign-in links won't work on the live site until you do this.

If you change the Supabase values later, click **Manual Deploy > Clear build cache & deploy** in Render. The values are baked in when the site builds.

---

## Where things are

| What | File |
| --- | --- |
| Opening film intro | `src/components/FilmIntro.jsx` + the "opening reel" section of `src/styles.css` |
| Home page tagline and sections | `src/pages/public.jsx` (`Home`) |
| Journal and film editors, Studio dashboard | `src/pages/studio.jsx` |
| Backlot (screenplay, storyboard, call sheets) | `src/backlot/` |
| Saving, uploads, logins | `src/lib/backend.js` |
| Logo files (background removed) | `public/logo.png`, `public/emblem.png`, `public/favicon.png` |
| Database setup | `supabase/schema.sql` |

Visitors see the intro once per browser session. "Replay the opening reel" in the footer plays it again.
