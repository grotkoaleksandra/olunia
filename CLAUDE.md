# CLAUDE.md - Olunia

This file provides context for Claude (AI assistant) when working on this codebase.

> **IMPORTANT: You have direct database access!**
> Always run SQL migrations directly using `psql` - never ask the user to run SQL manually.

> **IMPORTANT: Push changes immediately!**
> This is a GitHub Pages site - changes only go live after pushing.
> Always `git push` as soon as changes are ready.

> **IMPORTANT: First-time setup!**
> Run `/setup-alpacapps-infra` to set up the full infrastructure interactively.
> If the Supabase CLI is not installed or linked, run:
> `npm install -g supabase && supabase login && supabase link --project-ref rezhazgfllcyaeuemppw`

## Project Overview

Olunia is a personal portfolio for Ola — designer, UI/UX developer, and artist. It showcases projects, artwork, and creative work.

**Core Entities:** projects, contact messages

**Tech Stack:**
- Frontend: Next.js 16 (React 19, TypeScript, Tailwind CSS v4)
- Backend: Supabase (PostgreSQL + Storage + Auth)
- Hosting: GitHub Pages (static export)
- i18n: Dictionary-based multi-language support (en, es, fr)

**Live URLs:**
- Public site: https://grotkoaleksandra.github.io/olunia/
- Intranet: https://grotkoaleksandra.github.io/olunia/en/intranet/

## Deployment

Push to main and it's live. No build step, no PR process.
**For Claude:** Always push changes immediately.

## Database Schema

### `projects`
Portfolio pieces — title, slug, description, category, client_name, cover_image_url, gallery_urls[], tags[], featured, sort_order, is_archived, published_at

### `contact_messages`
Contact form submissions — name, email, subject, message, is_read

### `page_display_config`
Intranet tab visibility — section, tab_key, tab_label, is_visible, sort_order

## Shared Files

- `shared/supabase.js` — Supabase client init (URL + anon key as globals)
- `shared/auth.js` — Auth module: profile button, login modal, page guard
- `shared/admin.css` — Admin styles: layout, tables, modals, badges (themeable via `--aap-*` CSS vars)

### Auth System (`shared/auth.js`)

Provides login/profile functionality on all pages:

- **Profile button**: Auto-inserts into nav bar. Shows person icon when logged out, initials avatar when logged in.
- **Login modal**: Email/password via `supabase.auth.signInWithPassword()`. Opens on profile icon click.
- **Dropdown menu**: When logged in, clicking avatar shows dropdown with "Admin" link and "Sign Out".
- **Page guard**: Admin pages call `requireAuth(callback)` — redirects to `../index.html` if not authenticated.
- **Supabase client**: Exposed as `window.adminSupabase` for admin page data access.

**Script loading order on every page:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="shared/supabase.js"></script>
<script src="shared/auth.js"></script>
```

### Admin Pages (`admin/`)

- All admin pages are in `admin/` directory with `<meta name="robots" content="noindex, nofollow">`
- Each page loads `shared/admin.css` and calls `requireAuth()`:
```javascript
requireAuth(function(user, supabase) {
    // Page is authenticated — load data using supabase client
});
```
- Admin topbar nav links between admin sub-pages
- CRUD pattern: `admin-table` for listing, `admin-modal` for add/edit forms
- CSS classes are themeable via `--aap-*` custom properties

## Supabase Details

- Project ID: `rezhazgfllcyaeuemppw`
- URL: `https://rezhazgfllcyaeuemppw.supabase.co`
- Region: Central EU (Frankfurt)
- Anon key is in `src/lib/supabase.ts` and `shared/supabase.js`

### Direct Database Access (for Claude)

```bash
/opt/homebrew/opt/libpq/bin/psql "postgres://postgres.rezhazgfllcyaeuemppw:jfjKwHf6GVXXMAmzEvGHXEAw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SQL HERE"
```

### Supabase CLI Access (for Claude)

```bash
supabase functions deploy <function-name>
supabase functions logs <function-name>
supabase secrets set KEY=value
```

Run these directly. If CLI not installed, install and link first.

## Key Files

- `src/lib/supabase.ts` — Supabase client (Next.js app)
- `shared/supabase.js` — Supabase client (vanilla JS pages)
- `next.config.ts` — basePath must match GitHub repo name
- `src/i18n/config.ts` — supported locales
- `src/i18n/dictionaries/*.json` — translation files
- `src/contexts/auth-context.tsx` — authentication

## External Services

### Email (Resend)
- API key stored as Supabase secret: `RESEND_API_KEY`

## Conventions

1. Use toast notifications, not alert()
2. Filter archived items client-side
3. Don't expose personal info in public views
4. Client-side image compression for files > 500KB
