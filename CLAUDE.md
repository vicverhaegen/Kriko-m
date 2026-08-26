# Scouts Kriko-M Web App — AI Coding Guidelines & Context

This file provides system context, tech stack specifications, styling guidelines, and command references for AI assistants working on this repository.

---

## Product Vision & Direction

Kriko-M is the website for Belgian scouts group **Scouts Kriko-M vzw** (Scouts & Gidsen Vlaanderen, Sint-Niklaas — KBO BE0409.040.288). It consists of a **public marketing/info site** and a **leiding-only management portal**.

**Guiding principle — keep it minimal.** The site exists to provide structured self-service for parents and public visitors without re-inventing things that already work elsewhere. Email (sent from the S&G Groepsadmin site) and WhatsApp remain the group's communication channels.

**What the site is for (the actual jobs):**
1. **Public Info & Takken:** Presenting practical info, group history, takken, leiding contacts, and an interactive calendar with iCal feeds.
2. **Kriko Echo:** Displaying and letting parents download monthly editions of the Kriko Echo (PDF).
3. **Inschrijven Info:** Guiding new and existing members through registration (embedded S&G Groepsadmin form + lidgeld payment instructions via bank transfer).
4. **Accountless Webshop:** Letting parents order scoutskledij (t-shirts, trui, das, kentekens) with email confirmation (Resend), payment via Belgian structured bank transfer, and pickup arranged with the uniformverantwoordelijke.
5. **Verhuur Info:** Informing potential renters about local rental space (directing requests to Kampas.be).
6. **Leiding Management Portal:** Giving leiding a private portal to manage calendar events, Kriko Echo uploads, internal documents, webshop products & orders, and site settings.

**What the site does NOT do (DO NOT RE-INTRODUCE):**
- **NO camp or weekend RSVP / registrations.** Kamp and weekend signups do **not** take place on this website. Kamp communication and signups are handled via S&G Groepsadmin and leiding emails.
- **NO parent accounts or parent login.** Login is strictly leiding-only (`/portaal`). Webshop checkout is accountless.
- **NO medical fiches or S&G personal data stored.** Medical info stays 100% in S&G Groepsadmin where leiding consult it directly.
- **NO online payment gateways (Mollie/Stripe/credit cards).** All payments (webshop & lidgeld) use Belgian structured bank transfers (`BE59 7360 6413 2626`).
- **NO local rental booking engine.** Rental bookings redirect to Kampas.be.

---

## Commands Reference

Always run commands inside the `./website/` directory unless working on Supabase configurations.

* **Start Dev Server:** `cmd /c "npm run dev"`
* **Build App:** `cmd /c "npm run build"`
* **Supabase Local Dev:** `npx supabase start` (requires Docker)
* **Supabase Migrations:** Paste `supabase/*.sql` files into **Supabase → SQL Editor → New query** and run them manually. `npx supabase db push` does NOT apply these files.

---

## Tech Stack & Architecture

* **Framework:** Next.js (App Router, React 19)
* **Language:** TypeScript (`strict: true`)
* **Database & Auth:** Supabase (PostgreSQL, Supabase Auth)
  * Server client: `@/lib/supabase` (for SSR and Server Actions)
  * Browser client: `@/lib/supabase-browser` (for Client Components)
* **Styling:** Vanilla CSS (`globals.css`)
* **Icons:** FontAwesome (imported globally)

---

## Design System & Styling Tokens

Always use these colors and fonts to keep the UI consistent and professional.

### Color Palette
* **Brand Bordeaux (Primary):** `#650B19` (`--color-primary`)
* **Bordeaux Dark (Headers/Footer):** `#3a0710` (`--color-primary-dark`)
* **Scouts Gold (Accent):** `#C9963A` (`--color-accent`, `--color-secondary`)
* **Gold Hover:** `#B8862F` (`--color-accent-hover`)
* **Gold Light:** `#E2C58D` (`--color-accent-light`)
* **Crème/Linen (Page Background):** `#F0ECE4` (`--color-bg-linen`)
* **White (Cards/Modals):** `#FFFFFF` (`--color-bg-white`)
* **Success Green (Portal Theme):** `#1A3D2A` (primary green), `#EEF5F1` (green background)

### Typography
* **Primary Body & Interface Font:** `Outfit` (sans-serif)
* **Main Titles & Hero Headings:** `Londrina Solid` (display woodblock style)
* **Sub-Headings:** `Nunito` (rounded sans-serif)

---

## Development Constraints & Rules

1. **Beige Flashing Prevention:** 
   * On `/portaal` routes, the body default top-padding and beige background are disabled.
   * Do not put padding-top on the global `body` selector.
   * The root `layout.tsx` contains an inline script tag at the top of `<body>` to synchronously inject the portal classes and styles based on the pathname before page load.
2. **Sticky Header (public site):**
   * The public header (`.site-header`, which wraps the optional alert banner + `.mainnav`) is `position: sticky; top: 0` and lives in normal flow — do **not** make it `fixed`. This way an active alert banner pushes the page down instead of being hidden behind the nav (which used to leave a beige strip between nav and page).
   * Because the header is in flow, `.public-layout-content` needs **no** `padding-top` offset — the page begins directly under the nav automatically.
   * `body` uses `overflow-x: clip` (not `hidden`) so it doesn't become a scroll container that would break `position: sticky`.
   * The mobile menu (`.nav-links` in the `max-width: 992px` query) is `position: absolute; top: 70px` anchored to the relatively-positioned `.mainnav`, so it stays flush under the nav regardless of the alert banner.
3. **Hero Banner Preloading:**
   * Never use CSS `backgroundImage` for main hero banners.
   * Always use Next.js `<Image>` component with `priority`, `fill`, and `style={{ objectFit: 'cover' }}` to leverage WebP optimization and eliminate layout shifts.
   * Set matching background colors on hero sections (`.tak-hero`, `.verhuur-hero`) so they don't flash white while the image is loading.
4. **Contact Details & Copying:**
   * Use the `<CopyButton>` component for email addresses rather than `mailto` links to make copying easy.
   * Always wrap physical addresses in Google Maps search links (`https://www.google.com/maps/search/?api=1&query=...`).
5. **CSS Pictograms:**
   * Always use hex-escaped Unicode characters in CSS `content` (e.g., `content: '\269C'`) for banner title pictograms. Avoid printing literal emojis/special characters directly in `.css` files to prevent Mojibake encoding corruption during compiles.
6. **Horizontal Scrolling Nav (Portaal):**
   * The navigation links in `PortaalNav` scroll horizontally on mobile screens using `flex-nowrap` and `overflow-x-auto`. Keep it this way; do not wrap them or hide them behind hamburgers.
7. **Responsive Layouts:**
   * Use `.portal-grid-layout` (which drops from 2-column `1fr 3fr` to 1-column layout on media query max-width 768px) instead of inline styles for main portal layouts like `LeidingPanel.tsx`.
8. **Calendar system — 3 agendas & audience tags:**
   * One `calendar` table; visibility is derived from the `audience TEXT[]` column.
   * Three distinct agendas:
     1. **Publiek / Ouders:** events tagged with `'groep'`. Visible on website and `/api/kalender/ics`.
     2. **Leiding:** all events except `'grl'`. Visible in portal for leiding and private feed `/api/leiding/ics/[token]`.
     3. **Groepsleiding:** all events including `'grl'`. Visible in portal for groepsleiding and private feed `/api/groepsleiding/ics/[token]`.
   * Valid audience tags: `leiding | kapoenen | welpen | jonggivers | givers | groep | grl` — enforced by DB CHECK constraint and `AudienceTag` TypeScript type.
   * Tagging `'groep'` or `'grl'` or editing those events requires `requireGroepsleiding()` — guarded in both the API (`/api/admin/calendar`) and the `LeidingCalendar` UI. Regular leiding cannot see or select `'grl'`.
   * The private leiding ICS feed (`/api/leiding/ics/[token]`) is token-gated via `settings.leiding_ics_token`.
   * The private groepsleiding ICS feed (`/api/groepsleiding/ics/[token]`) is token-gated via `settings.groepsleiding_ics_token`.
   * Shared ICS helpers live in `website/src/lib/ics.ts`.

---

## Git Workflow

* **Automated Commit:** After completing and verifying a major change, bug fix, or feature update, the AI assistant should automatically stage and commit the changes locally. Use semantic commit messages (e.g. `feat:`, `fix:`, `docs:`, `style:`).
* **No auto-push:** Never push to GitHub unless the user explicitly asks. Always wait for an explicit push request.
