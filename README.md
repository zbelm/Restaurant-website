# Zippies, modern Italian restaurant website

A fast, accessible, fully static restaurant site built with [Astro](https://astro.build). Warm olive/cream/tomato design, animated hero, filterable menu, reservation + contact forms, gallery lightbox, SEO and structured data.

All names, addresses, phone numbers, reviews and team members are **placeholders**. Replace them with your real details before launch.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in ./dist
npm run preview    # serve the production build
```

Requires Node 18.20+ (tested on Node 22).

## Pages

| Route | What it has |
| --- | --- |
| `/` | Animated hero, marquee, story + count-up stats, featured dishes, dine-in/order CTAs, testimonials, live "open now" hours + map |
| `/menu` | Category tabs, dietary filters (V / VG / GF), live count, deep links like `/menu#pasta` |
| `/about` | Story timeline, values, team, scrolling photo strip |
| `/reservations` | Validated form, party-size stepper, time slots, closed-day check, confirmation state + "Add to calendar" (.ics) |
| `/events` | Weekly events, private dining, catering/gift-card enquiry links |
| `/gallery` | Responsive mosaic with keyboard/touch-friendly lightbox |
| `/contact` | Contact form (topic prefill via `?topic=`), hours, directions, embedded map |
| `/404` | Friendly not-found page |

## Editing content (no code needed)

Everything non-developers will change lives in `src/content/`:

| File | Controls |
| --- | --- |
| `site.json` | Name, tagline, address, geo coordinates, phone, email, socials, order link, **opening hours**, stats |
| `menu.json` | Categories, dishes, prices, dietary tags, "featured" flag (shown on the home page) |
| `testimonials.json` | Reviews on the home page |
| `events.json` | Events page cards |
| `gallery.json` | Gallery tiles and captions |

**Hours** feed the footer, contact page, JSON-LD structured data, the live "Open now" badge and the reservation form's closed-day check. Edit them once in `site.json`. Use 24h `"HH:MM"` times; a day can have several ranges, or `"closed": true`.

**Menu items** look like this:

```json
{
  "name": "Margherita",
  "description": "San Marzano, fior di latte, basil.",
  "price": 18,
  "tags": ["V"],
  "featured": true,
  "art": { "kind": "pizza", "tone": "terracotta" }
}
```

Tags: `V` vegetarian, `VG` vegan (also add `V`), `GF` gluten-free.

## Using real photos

The site ships with illustrated placeholders (`src/components/Art.astro`) instead of stock photos. To use your own:

1. Put images in `public/images/` (e.g. `public/images/rigatoni.jpg`).
2. Add `"image": "/images/rigatoni.jpg"` handling by passing `src` to `<Art>`: in `DishCard.astro`, `menu.astro`, `gallery.astro` etc., change `<Art kind=… />` to `<Art src={dish.image} alt={dish.name} kind=… />`. When `src` is set the illustration is skipped and a lazy-loaded `<img>` is rendered.
3. Replace `public/og.png` (1200×630) with your own social-share image.

## Brand tweaks

* Colors, radii and fonts: CSS variables at the top of `src/styles/global.css`.
* Fonts: Fraunces (headings) + Inter (body), self-hosted via `@fontsource-variable`.
* Logo: `src/components/Logo.astro`.

## Before you go live

1. Set your real domain in `astro.config.mjs` (`site`), `src/content/site.json` (`url`) and `public/robots.txt` (sitemap URL).
2. Update address, `geo` coordinates (used by the map + structured data), phone, email and social links.
3. Update `links.order` (online ordering URL). If you use OpenTable/Resy, set `links.reserveExternal` to show a link on the reservations page.
4. Replace the placeholder reviews, team members and legal-ish copy.

## Making forms send real emails

The reservation, contact and newsletter forms validate and show confirmation states, but they do **not** send data anywhere yet (a static site has no server). Search for `TODO` in:

* `src/pages/reservations.astro` (reservation submit)
* `src/pages/contact.astro` (contact submit)
* `src/scripts/main.ts` (newsletter)

Easiest options: [Formspree](https://formspree.io), [Netlify Forms](https://docs.netlify.com/forms/setup/), [Web3Forms](https://web3forms.com), or a serverless function (Vercel/Netlify) that calls Resend/SendGrid. Typically that means a `fetch('https://…', { method: 'POST', body: JSON.stringify(data) })` inside the `onValid` callback, and showing an error message if it fails. Each form already includes a honeypot field (`website`) to deter bots.

## Deploy

It's a static site, so any static host works.

* **Vercel**: import the repo; framework preset "Astro"; no config needed.
* **Netlify**: build command `npm run build`, publish directory `dist`.
* **Cloudflare Pages / GitHub Pages**: same build command and `dist` output (for GitHub Pages under a sub-path also set `base` in `astro.config.mjs`).

## Under the hood

* **Accessibility**: skip link, semantic landmarks, visible focus rings, keyboard-operable menu/tabs/lightbox (native `<dialog>`), ARIA live regions for filters and form errors, WCAG AA color contrast, `prefers-reduced-motion` respected everywhere.
* **SEO**: unique title/description per page, canonical + Open Graph/Twitter tags, `sitemap-index.xml`, `robots.txt`, `Restaurant` JSON-LD (address, geo, cuisine, price range, opening hours, menu URL).
* **Performance**: zero framework runtime, inline-SVG art (no image weight), self-hosted variable fonts, one small script bundle, lazy-loaded map iframes.
* **Animations**: scroll reveals, split-word headlines, parallax, tilt cards, count-up stats, marquee, animated nav/mobile menu, filter transitions, lightbox, form confirmation.

## Project structure

```
src/
  content/      ← editable data (site, menu, reviews, events, gallery)
  components/   ← Nav, Footer, Art, DishCard, PageHeader, Confirmation, Logo
  layouts/      ← Base.astro (head/SEO/JSON-LD, shell)
  pages/        ← one file per route
  scripts/      ← main.ts (global behaviors), forms.ts (validation)
  styles/       ← global.css (tokens + shared styles)
  lib/          ← time/price formatting helpers
public/         ← favicon, og.png, robots.txt
```
