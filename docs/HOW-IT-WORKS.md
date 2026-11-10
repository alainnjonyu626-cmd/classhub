# How the ClassHub website works

This document explains how ClassHub runs, from the moment a student opens a
link to the moment the page shows their class's information. It covers the
architecture, every moving part of the code, the data pipeline, offline
behaviour, security, and deployment. For how to *operate* the project
(onboarding clients, sheet templates, delegate instructions), see
`README.md`; for what a delegate does day-to-day, see `docs/delegate-guide.md`.

---

## 1. The big picture

ClassHub is a **static website with no back end**. There is no server of our
own, no database we run, and no login system. The entire site is plain HTML,
CSS and JavaScript built by Vite and hosted on Netlify
(https://classhub-cm.netlify.app). All class content lives in Google Sheets;
all files live in Google Drive.

```
 Delegate / school office                      Students & parents
         │                                             ▲
         │ edits on their phone                        │ open a link
         ▼                                             │
 ┌──────────────────┐   CSV over the internet   ┌──────────────────┐
 │  Google Sheet    │ ────────────────────────▶ │ ClassHub website │
 │ (one per client) │                           │  (one for all)   │
 └──────────────────┘                           └──────────────────┘
         │                                             │
         │ pastes links to                             │ reads ?hub=... in the link,
         ▼                                             │ finds the client in hubs.ts,
 ┌──────────────────┐                                  │ fetches THEIR sheet
 │ Google Drive     │ ◀── students tap "Open" ─────────┘
 │ (PDFs, files)    │
 └──────────────────┘
```

**The mall analogy:** ClassHub is a shopping mall. The website is the
building (one design, one code base). Each class or school is a shop inside
it. Each shop's Google Sheet is its stock book, and the delegate holds the
key. Students walk in through a link and see only that shop's stock.

Three kinds of client share one code base:

| Client type | Who pays | Who updates | Who reads |
|---|---|---|---|
| University class | The class, via the delegate | Class delegate | Students |
| Secondary school | Principal / proprietor | School office or class teachers | Students **and parents** |
| Private institute (HND) | Administration | Admin office | Students |

A `mode` setting (`university` or `secondary`) changes the words
(Courses/Subjects, Lecturer/Teacher) and hides or shows sections
(Parents' corner).

---

## 2. What happens when a student opens a link

Say a student opens:

```
https://classhub-cm.netlify.app/app/home.html?hub=cs200-uni
```

**Step 1 — the shell.** `app/home.html` is a tiny HTML file: `<div id="app">`
plus one `<script type="module" src="/src/pages/home.ts">`. It renders
nothing by itself.

**Step 2 — `mountPage()` (`src/app.ts`).** This function is the shared
starting point of every hub page. It:

1. Reads `?hub=` from the address bar (`param("hub")` in `src/lib/links.ts`).
   If missing, it uses the **last hub this phone opened** (saved in
   `localStorage`), so the installed app icon keeps working.
2. Looks the id up in `HUBS` (`src/config/hubs.ts`). Unknown or malformed id
   → redirect to `404.html`.
3. Checks `active`. `false` → redirect to `app/paused.html`.
4. Sets mode (`university`/`secondary`), which selects the words and sections
   the page will use.
5. Calls `applyBranding()` (`src/components/branding.ts`): applies the
   client's colour (only if it passes a 4.5:1 contrast check with white text;
   otherwise the default blue is kept) and logo, and builds the tab title
   ("Timetable · CS200 Hub").
6. Draws the page **shell**: sticky top bar, empty `<main>`, fixed bottom
   nav, plus a skeleton placeholder while data loads.
7. Calls `loadHub()` and hands it the page's `render()` function.

**Step 3 — `loadHub()` (`src/lib/data.ts`).** The data engine shared by all
pages. Detailed in section 4 below.

**Step 4 — `render()`.** The page file's own function receives
`{ hubId, hub, data, status }` and builds the page with `el()` and Tailwind
classes. Page files describe **what** to show; everything about **how**
(loading, offline, errors, navigation) is written once and shared.

### Page shells and the build

Every file in `app/` is automatically a page in the build. `vite.config.ts`
scans `app/*.html` at build time and registers each one, so **adding a page =
creating `app/name.html` + `src/pages/name.ts`.** Root shells:

- `index.html` → landing page (selling page, `src/pages/landing.ts`)
- `school.html` → school directory (`src/pages/school.ts`)
- `404.html` → not-found page (`src/pages/not-found.ts`)

---

## 3. The client register: `src/config/hubs.ts`

The entire list of clients lives in one file. Adding a client means adding
one entry to `HUBS`:

```ts
"cs200-uni": {
  name: "CS200 Hub",          // header text
  subtitle: "Computer Science · Level 200",
  school: "Faculty of Science",
  schoolId: null,             // or "nhs" to group under a school directory
  mode: "university",         // "university" | "secondary"
  sheetId: "1AbC...xyz",      // from the sheet's URL, between /d/ and /edit
  color: "#2B59D9",           // optional brand colour
  logo: null,                 // optional, under 30 KB
  contact: "2376XXXXXXXX",    // WhatsApp for "Report a mistake"
  active: true,               // false → visitors see the Paused page
  unused: ["past_questions"], // parts the client doesn't use: not downloaded
  plan: "semester",
}
```

`SCHOOLS` groups hubs under a school directory page (`school.html?school=nhs`)
and can provide fallback colour/logo and a `parentsHub` (a hub reserved for
parents' information).

Hub ids are validated by `HUB_ID_PATTERN` (`/^[a-z0-9-]{2,40}$/`) — lowercase
letters, numbers and dashes only.

**Demo hubs:** any hub with `sheetId: "demo"` never touches the network.
`src/lib/demo.ts` generates a full sample class with dates computed from
*today*, so countdowns tick and "Today" always has classes. This powers the
landing page's live examples and lets you demo before a real sheet exists.

`OWNER` (name, WhatsApp, city) powers the landing page's contact buttons.

---

## 4. The data pipeline

### 4.1 Where the data comes from

Each content type is one **tab** of the client's Google Sheet:

`info`, `announcements`, `timetable`, `deadlines`, `courses`, `handouts`,
`past_questions`, `leaders`, `places`, `parents`.

The site fetches each tab as CSV from:

```
https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet={tab}
```

This works when the sheet is shared as **"Anyone with the link: Viewer"**.
Column formats the sheet must follow (dates `YYYY-MM-DD`, times `HH:MM`,
yes/no columns, row 1 = lowercase headers) are specified in README section 8.

### 4.2 Fetching: `src/lib/sheets.ts`

`fetchTab(sheetId, tab)`:

- **Demo shortcut:** `sheetId: "demo"` loads the built-in sample data instead
  of fetching (lazy-imported, so real hubs never download it).
- Adds a **12-second `AbortController` timeout** — a slow network falls back
  to cache instead of spinning forever.
- A private/mis-shared sheet returns an **HTML page instead of CSV**; the
  loader detects a leading `<` and reports `"private"`.
- A **missing tab name makes Google return the *first* tab** instead of an
  error — so the loader verifies the expected columns exist before trusting
  a tab (checked in `data.ts`).

### 4.3 Parsing and cleaning: `csv.ts`, `sheets.ts`, `clean.ts`

1. `csv.ts` parses CSV text — including commas inside quotes, `""` escaped
   quotes, and line breaks inside quoted cells — into a table.
2. `sheets.ts` drops columns whose header is empty (Google appends empty
   columns), lowercases and trims headers, drops fully-empty rows, and turns
   each row into `{ column: value }` objects.
3. `clean.ts` converts types per column: dates → `Date` (local time, no
   timezone shift), times → minutes since midnight, numbers → `Number`,
   `yes/no` → `true/false`, course codes → uppercase without spaces.
4. It validates required columns; invalid rows are **dropped and counted**
   in `data.skipped[tab]`, which surfaces on the More page as "rows skipped"
   so the delegate can spot typos.
5. It sorts (announcements newest first, deadlines soonest first, timetable
   by day then start, handouts by date added, past questions by year) and
   applies rules (expired announcements lose their pin, past deadlines count
   as done).

The result is one typed `HubData` object per page load.

### 4.4 `loadHub()` step by step

```
loadHub(hubId, hub, wantedTabs, onUpdate)
  1. Drop tabs the client marked unused (never downloaded)
  2. Read the saved copy from localStorage
     → if it covers every tab this page needs, render it immediately ("cached")
  3. Fetch the wanted tabs in parallel (Promise.all)
  4. Verify each tab's columns; collect broken tabs (private / missing / renamed)
  5. If NOTHING reached Google (network down):
       - cached copy available → render it with an offline banner ("offline")
       - nothing saved yet     → "connect once" full-page message ("offline-empty")
  6. Otherwise merge fresh tabs over the cache, save, render ("fresh")
```

Key detail: a page declares which tabs it needs
(`mountPage({ tabs: [...] })`), so **students only download what the page
displays**. The saved copy only counts as usable offline if it covers every
tab the page needs — a tab that was broken last time counts as "loaded,
empty" rather than blocking offline use.

### 4.5 The offline cache: `src/lib/cache.ts`

```js
localStorage["classhub:cs200-uni"] = JSON.stringify({
  savedAt: "2026-10-19T09:14:00Z",
  tabs: { info: [...], announcements: [...] },   // raw rows, re-cleaned on load
  broken: []                                     // tabs that failed last time
});
```

- **Per hub** — two classes on one phone never mix.
- Stores **raw rows** and re-cleans them on load, so `Date` values survive
  JSON round-trips.
- Fresh tabs are **merged** into the cache, so tabs this page didn't load
  are kept; broken tabs stay broken unless this load fixed them.
- Every read/write is wrapped in `try/catch`: a full or blocked storage
  never crashes the page — it just means no offline copy.
- `prefs` stores small per-viewer settings: last hub, dismissed hints, and
  the "last seen news" timestamp that drives the red dot.

Also saved in `localStorage`: `lastHub` (continues the installed-app flow)
and `schoolHub:<schoolId>` (remembers which class a student chose on a
school page).

### 4.6 Live countdowns: `src/components/live.ts`

Any element carrying `data-countdown="<ISO date>"` (the home countdown card,
deadline due badges) is refreshed **every 60 seconds** by one shared timer.
It pauses when the tab is hidden and catches up on return, saving battery.
Digits use tabular numerals (`.tnum`) so they don't jitter as they tick.

---

## 5. Routing and links

| Link | Opens | Params |
|---|---|---|
| `/` | Landing page | — |
| `/school.html?school=nhs` | School directory | `school` |
| `/app/home.html?hub=cs200-uni` | Hub home | `hub` |
| `/app/announcements.html?hub=…` | All announcements | `hub` |
| `/app/announcement.html?hub=…&id=12` | One announcement | `hub`, `id` |
| `/app/timetable.html?hub=…&day=Tue` | Timetable | `hub` (`day` optional) |
| `/app/deadlines.html?hub=…&filter=tests` | Deadlines | `hub` (`filter` optional) |
| `/app/courses.html?hub=…` | Courses / Subjects | `hub` |
| `/app/course.html?hub=…&code=CSC203` | One course | `hub`, `code` |
| `/app/handouts.html?hub=…&code=CSC203` | Handouts | `hub` (`code` optional) |
| `/app/past-questions.html?hub=…&code=CSC201` | Past questions | `hub` (`code` optional) |
| `/app/parents.html?hub=…` | Parents' corner (secondary only) | `hub` |
| `/app/class-info.html?hub=…` | Class info | `hub` |
The remaining routes — `/app/more.html`, `/app/help.html`, `/app/paused.html` and the catch-all 404 fallback — follow the same pattern (see README section 6).

Because GitHub Pages serves the site from a sub-path, `BASE =
import.meta.env.BASE_URL` (`/` locally, `/classhub/` on Pages) prefixes
every URL. All internal links are built with `hubLink(page, extra)`, which
**keeps `?hub=` automatically** — students never lose their class while
moving around. `siteLink()` does the same for site-level pages.

Filter state travels in the URL (`?filter=urgent`, `?day=Tue`, `?code=…`),
so a filtered view can be shared. Chips write the filter with
`history.replaceState` — no reload, shareable, and the browser back button
still works.

---

## 6. The rendering layer

### 6.1 Safe DOM building: `src/lib/dom.ts`

Everything on a page is built with `el(tag, attrs, children)`, which sets
text through `textContent`. **Sheet data never touches `innerHTML`**, so a
cell containing `<script>alert(1)</script>` displays as harmless text. This
is the backbone of the project's XSS posture: it works because every page
uses it, every time.

### 6.2 Components (`src/components/`)

| File | Provides |
|---|---|
| `nav.ts` | Sticky top bar (back arrow, logo, Fraunces-serif title), fixed bottom nav (Home, News, Timetable, Deadlines, More) with `aria-current`, hover/active states and a red dot on News when announcements are newer than the student's last visit |
| `ui.ts` | `sectionTitle`, `row()` (becomes a link when given an href), `iconBox`, category/deadline tags, `dueBadge`, `avatar`, `chips()` (filter chips with `aria-pressed` and URL persistence), `courseMap`, `initials` |
| `states.ts` | Skeleton placeholders (`aria-busy`), banners (offline / stale / error / info, `role="status"`), `emptyState`, `fullMessage`, offline message with the saved-copy timestamp |
| `icons.ts` | Inline SVG icons (24px grid, 1.8 stroke, currentColor); `pin` included; text-only "PDF"/"DOC" boxes are drawn by `iconBox` |
| `branding.ts` | Client colour applied only if white-on-colour contrast ≥ 4.5:1, logo resolution (hub colour/logo wins over school's), theme-color meta, tab title |
| `live.ts` | The shared 60-second countdown ticker (section 4.6) |

### 6.3 Styling: Tailwind 4 with design tokens

All tokens live in the `@theme` block of `src/styles/main.css`:

| Token | Value | Use |
|---|---|—|
| `--color-bg` | `#f6f5f1` | Page background (paper) |
| `--color-surface` | `#ffffff` | Cards, lists |
| `--color-ink` | `#15171c` | Text, dark buttons |
| `--color-muted` | `#5d6270` | Secondary text |
| `--color-line` | `#e6e3dc` | Borders, dividers |
| `--color-accent-ink` / `--color-accent-soft` | `#1e43ae` / `#e9eefc` | Links; soft highlights & icon boxes |
| `--color-accent` | `#2b59d9` | Brand, countdown card, active nav — **overridable per client at runtime** |
| `--color-urgent/exam/ok/wa` | `#b4410f / #6b3fb8 / #157043 / #1c9e4d` | Status colours (urgent/exam/ok/WhatsApp) |

Fonts: **Fraunces** (serif display, headings only) + **Poppins** (UI/body),
from Google Fonts with `display=swap`. Elevation tokens (`--shadow-card`,
`--shadow-lift`, `--shadow-nav`), radii (`--radius-card` 14px,
`--radius-box` 12px) and the `.tnum` tabular-numeral utility round out the
token set. Shared building blocks (`.card`, `.row`, `.tag`, `.btn`, `.chip`,
`.list`, `.sec-title`, `.group-label`) are defined once with `@apply` so
every page looks identical. Row links get hover/active tints; buttons press
down (`active:scale-[0.98]`); focus-visible shows a 2px accent outline.

Rule: **always write full Tailwind class names** (`"text-urgent"`) in TS —
never build them from pieces (`"text-" + colour`) or Tailwind's scanner won't
see them.

---

## 7. Modes and wording: `src/config/labels.ts`

Pages never hard-code "Courses" or "Lecturer" — they call `L("courses")`,
which is typed, so a misspelled key is a compile error. Mode differences:

| Thing | University | Secondary |
|---|---|---|
| Courses menu | Courses | Subjects |
| Teacher | Lecturer | Teacher |
| Leader | Class delegate | Class teacher |
| Tests | CA test | Sequence test |
| Past papers | Past questions | Past papers |
| Credits | Shown | Hidden |
| Parents' corner | Hidden | Shown (More menu + Home quick link) |
| Home quick link 4 | Class info | Parents' corner |

A secondary hub visiting `app/parents.html` works; a **university** hub is
redirected home. Adding French later = adding a label set + a `lang` field.

---

## 8. Every page, what it does

Each hub page is `app/<name>.html` (shell) + `src/pages/<name>.ts`
(content). All are wrapped by `mountPage` and share the states in section 9.

- **`home`** — "What do I need to know today?" Header (subtitle, hub name,
  today's date), pinned announcement card, welcome note, next-deadline card
  with live countdown, today's classes with a "Now" tag, four quick links
  with live counts, latest handouts.
- **`announcements`** — filter chips (All/Urgent/Tests & exams/General/Social
  [+ Parents]), pinned/this-week/earlier groups; opening the page records
  "last seen" and clears the red dot.
- **`announcement`** — full message with author, details box (course/when/
  where), attachment row (opens Drive in a new tab), Share on WhatsApp.
- **`timetable`** — day tabs (today preselected; `?day=` shareable, arrow-key
  navigable), slots with "Now" ring, automatic dashed free periods, odd/even
  week support via ISO week parity.
- **`deadlines`** — chips (Upcoming/Tests/Assignments/Exams/Done),
  groups This week / Later / Done, due badges that turn orange under 3 days,
  rows link to the related announcement or expand details inline.
- **`courses` / `course`** — summary card (count, credits, hours/week), one
  course page gathering that course's deadlines, weekly classes, latest
  announcement, handouts and past papers.
- **`handouts`** — search box (case- and accent-insensitive), course chips,
  grouped by course, "New" tag within 3 days, opens Drive links in new tabs.
- **`past-questions`** — course chips, year groups, kind boxes (EXAM/CA/
  RESIT/SEQ/MOCK), "Solved" badge + Answers button, smart hint card when a
  test is within 7 days.
- **`parents`** — secondary only: key dates with countdowns, fees in FCFA
  with MoMo/Orange Money instructions as the school writes them, PTA
  meetings, requirements, parents-category announcements, WhatsApp to the
  school office. Never shows per-student info.
- **`class-info`** — class card, leaders with WhatsApp buttons, group/channel
  links, important places, contribution with countdown.
- **`more`** — menu (handouts/papers/courses/parents/class info with counts),
  install card, Share the hub link (`navigator.share` → WhatsApp fallback),
  Report a mistake (prefilled WhatsApp), Refresh data now (clears cache),
  **sheet health** note (updated-at + rows skipped + broken tabs), credit.
- **`help`** — platform-detected install steps (Android Chrome / iPhone
  Safari), native install prompt when `beforeinstallprompt` fires, short FAQ.
- **`paused`** — shown when `active: false`. No data, no nav.
- **`not-found`** — `404.html` for any broken link, with "Go to the hub home"
  when a last-hub memory exists.

---

## 9. Page states: what every visitor can see

Built once in `src/app.ts`, `src/lib/data.ts`, `src/components/states.ts`.
Every page handles all of these:

| State | When | What shows |
|---|---|---|
| Loading, first visit | No cache, fetching | Skeleton blocks (`aria-busy`) |
| Loading, return visit | Cache covers the page | Cached content instantly, fresh data replaces it silently |
| Loaded | Fresh data | Normal page, "Last updated" where relevant |
| Offline | Fetch failed, cache exists | Dark banner: "You're offline. Showing info from Mon 9:14am." |
| Offline, no cache | Fetch failed, nothing saved | Full page: "Connect to the internet once…" + Retry |
| Stale (>7 days) | Old cache, offline | Orange banner: "This info may be out of date." |
| Empty section | Tab has no valid rows | Per-section empty state ("No deadlines yet") |
| Item not found | Bad `?id=`/`?code=` | In-page not-found state + back to the list |
| Hub not found | Bad/missing `?hub=` | Redirect `404.html` |
| Paused | `active: false` | Redirect `app/paused.html` |
| Sheet problem | Tab renamed/private | Section shows empty; More page banner: "Sheet problem: tab 'deadlines' not found" |

---

## 10. Offline & PWA behaviour

Two layers of offline:

1. **Data layer (`localStorage`)** — the per-hub raw-row cache (section 4.5).
   Works even without a service worker; powers offline banners with the
   saved-copy timestamp.
2. **App-shell layer (service worker `public/sw.js`)** — registered only in
   production builds (`src/lib/pwa.ts` skips it during dev so stale files
   don't get served). At build time, `vite.config.ts` walks `dist/`,
   injects the complete file list and a new `VERSION` into `sw.js`, so every
   deploy is picked up by phones.

- App shell (HTML/CSS/JS/icons): **cache-first**.
- Google Sheets requests: **network only** — data caching is `data.ts`'s job,
  avoiding double-caching and staleness confusion.
- Sheet CSV requests aren't cached by the SW so editors always get the
  freshest data when online.

`manifest.json` (name, icons, `display: standalone`, theme colours) makes the
hub installable; `start_url` can't carry a student's `?hub=`, so `home.html`
without a hub resumes from the `lastHub` preference.

**Data cost discipline:** only the tabs a page displays are fetched; PDFs
download only when tapped; fonts use `display=swap`; no analytics, no
frameworks, no ads.

---

## 11. Security and privacy model

**Anyone with a hub link sees everything.** Treat every hub as public:

- Never on a hub: results, report cards, per-student fees, student phone
  numbers, addresses, photos (especially minors).
- Leaders'/staff WhatsApp numbers only with each person's permission.
- All sheet text is inserted via `textContent` (`el()`) — sheet data can
  never execute as HTML/JS.
- Only `https://` links are rendered (`isSafeUrl` rejects `javascript:` and
  malformed URLs); external links carry `rel="noopener"`.
- Body links in announcements are not auto-linked (an additional guard
  against phishing links slipped into body text).
- Editing access: only the delegate/office (and the owner) are Editors on
  the sheet; everyone else is a Viewer. On handover, transfer editor access
  and remove the old editor.
- The site reads the sheet anonymously through the gviz CSV endpoint; it has
  no credentials, so a leaked site cannot leak a sheet's edit rights.

---

## 12. Deployment

- **Build:** `npm run build` = `tsc --noEmit && vite build`. Strict
  TypeScript errors fail the build, so a bug can't ship to students.
- **Host:** Netlify (https://classhub-cm.netlify.app). The README's GitHub Pages workflow also works via `.github/workflows/deploy.yml`, which sets `BASE_PATH=/classhub/` and publishes `dist/`.
  README's GitHub Pages workflow also works via `.github/workflows/deploy.yml`,
  which sets `BASE_PATH=/classhub/` and publishes `dist/`).
- Vite scans `app/*.html` and registers every page automatically.
- Post-build, `vite.config.ts` stamps `sw.js` with the full precache list and
  a fresh `VERSION`.
- A red ❌ in CI = a TypeScript error; the previous version stays online
  until fixed.

## 13. Local development

```bash
npm install        # once
npm run dev        # http://localhost:5173 — instant reload on save
npm run typecheck  # strict TS check without building
npm run build      # type-checks, then builds dist/
npm run preview    # serves dist/ to test the real build
```

Open `http://localhost:5173/app/home.html?hub=demo` for the built-in sample
class, `/school.html?school=demo-college` for the school directory, and `/`
for the landing page. No Node? The `design/mockups/` folder contains static
HTML mockups of every page with fake data for visual reference.

Useful demo URLs (all dates in demo data are computed from today):

```
/app/home.html?hub=demo                          university demo hub
/app/home.html?hub=demo-school                   secondary demo hub
/school.html?school=demo-college                 school directory
/app/timetable.html?hub=demo&day=Tue             shared filtered view
/app/announcement.html?hub=demo&id=6             one announcement
```
