# ClassHub

**One link for a whole class. Nothing gets buried.**

ClassHub is a mobile-first website that gives a class (or a whole school) one place for announcements, the timetable, deadlines, handouts, past questions, course info and class contacts. The class delegate or school office updates it from a Google Sheet on their phone. Students and parents just open a link.

It runs with **no back end**: plain HTML, CSS and JavaScript, hosted for free on GitHub Pages, reading data from Google Sheets.

> **Analogy for the whole project:** ClassHub is a shopping mall. The website is the building (one design, one code base). Each class or school is a shop inside it. Each shop's Google Sheet is its stock book, and the delegate holds the key. Students walk in through a link and see that shop's stock.

---

## Table of contents

1. [Who it is for](#1-who-it-is-for)
2. [How it works](#2-how-it-works)
3. [Ground rules](#3-ground-rules)
4. [Tech stack](#4-tech-stack)
5. [Folder structure](#5-folder-structure)
6. [Links and routing](#6-links-and-routing)
7. [Client register: `hubs.ts`](#7-client-register-srcconfighubsts)
8. [The Google Sheet template](#8-the-google-sheet-template)
9. [Google Drive setup for files](#9-google-drive-setup-for-files)
10. [How data loading works: `data.ts`](#10-how-data-loading-works-srclibdatats)
11. [Modes and labels: `labels.ts`](#11-modes-and-labels-srcconfiglabelsts)
12. [Helpers: `src/lib/`](#12-helpers-srclib)
13. [Design system](#13-design-system)
14. [Shared components](#14-shared-components)
15. [Page states (loading, empty, error, offline)](#15-page-states)
16. [Every page, in detail](#16-every-page-in-detail)
17. [Install like an app (PWA)](#17-install-like-an-app-pwa)
18. [Accessibility checklist](#18-accessibility-checklist)
19. [Performance and data costs](#19-performance-and-data-costs)
20. [Privacy and safety rules](#20-privacy-and-safety-rules)
21. [Adding a new client](#21-adding-a-new-client)
22. [The delegate guide](#22-the-delegate-guide)
23. [Hosting and deploying](#23-hosting-and-deploying)
24. [Testing checklist](#24-testing-checklist)
25. [Build plan, phase by phase](#25-build-plan-phase-by-phase)
26. [Future upgrades (need a back end)](#26-future-upgrades-need-a-back-end)
27. [Glossary](#27-glossary)

---

## 1. Who it is for

| Client type | Who pays | Who updates | Who reads |
|---|---|---|---|
| **University class** (public or private) | Class, via the delegate | Class delegate | Students |
| **Secondary school** (mostly private) | Principal / proprietor | School office or class teachers | Students **and parents** |
| **Private institute** (HND schools, training centres) | Administration | Admin office or programme lead | Students |

The same code serves all three. A **mode** setting (`university` or `secondary`) changes the words and shows or hides a few sections. See [section 11](#11-modes-and-labels-srcconfiglabelsts).

---

## 2. How it works

```
 Delegate / school office                      Students & parents
         │                                             ▲
         │ edits on phone                              │ open a link
         ▼                                             │
 ┌──────────────────┐   CSV over the internet   ┌──────────────────┐
 │  Google Sheet    │ ────────────────────────▶ │ ClassHub website │
 │  (one per client)│                           │ (one for all)    │
 └──────────────────┘                           └──────────────────┘
         │                                             │
         │ pastes links to                             │ reads ?hub=... in the link,
         ▼                                             │ finds the client in hubs.ts,
 ┌──────────────────┐                                  │ fetches THEIR sheet
 │ Google Drive     │ ◀──── students tap "Open" ───────┘
 │ (PDFs, files)    │
 └──────────────────┘
```

1. A student opens `.../app/home.html?hub=cs200-uni`.
2. `mountPage()` (`src/app.ts`) reads `cs200-uni` from the address bar and looks it up in `src/config/hubs.ts`.
3. `loadHub()` (`src/lib/data.ts`) fetches each tab of that client's Google Sheet as CSV.
4. It turns the rows into JavaScript objects and saves a copy in the phone (`localStorage`) for offline use.
5. The page file (for example `src/pages/home.ts`) builds the page from that data.

---

## 3. Ground rules

These apply to every file. When in doubt, come back here.

1. **No back end.** No server, no database we run. Only static files plus Google Sheets and Google Drive.
2. **Mobile first.** Design for a 360–390px wide phone first. Bigger screens get more space, not a different site.
3. **Works on weak data.** Small pages, no heavy images, no big libraries. Last loaded data is kept for offline viewing.
4. **Safe text only.** Anything that comes from a sheet is put on the page with `textContent` (or our `el()` helper), never with raw `innerHTML`. If someone types `<script>` into a cell, it shows as plain text.
5. **Never crash on bad data.** A broken row is skipped. A missing tab shows an empty state. The page always renders something.
6. **Private things stay out.** No results, no report cards, no student phone numbers, no minors' photos. See [section 20](#20-privacy-and-safety-rules).
7. **Accessible by default.** Real buttons and links, labels on inputs, readable contrast, tap targets at least 44px.
8. **One source of truth.** Words live in `src/config/labels.ts`, colours in the `@theme` of `src/styles/main.css`, clients in `src/config/hubs.ts`, content in the sheet. Nothing important is hard-coded inside page HTML.

---

## 4. Tech stack

| Part | Choice | Why |
|---|---|---|
| Structure | Semantic HTML5 (one small `.html` shell per page) | Simple, accessible |
| Style | **Tailwind CSS 4** with our design tokens in `@theme` | Fast to build with, consistent design, tiny CSS output |
| Logic | **TypeScript 7** (strict), no framework | Catches mistakes before students see them, small and fast |
| Build | **Vite 8** (multi-page) | Instant reload while coding; builds plain static files |
| Data | Google Sheets → CSV via `fetch` | Free, editable from any phone |
| Files | Google Drive share links | Free storage for PDFs |
| Fonts | Poppins from Google Fonts, system font fallback | Clean look, fast fallback |
| Hosting | GitHub Pages, deployed by GitHub Actions | Free, HTTPS, automatic on every push |
| Offline | `localStorage` for data, service worker for pages (Phase 4) | Works with no bundle |

Still **no back end**: `npm run build` turns the TypeScript and Tailwind into plain HTML, CSS and JavaScript files in `dist/`, and that folder is the whole website.

> **Analogy:** the `src/` folder is the kitchen where you cook (TypeScript, Tailwind classes). `npm run build` is plating the food. `dist/` is the plate that goes to the customer: plain files any phone can eat 🍽️

### Getting started

You need **Node.js 20 or newer** (check with `node -v` in the VS Code terminal: `` Ctrl+` ``).

```bash
npm install        # once: downloads Vite, Tailwind, TypeScript into node_modules/
npm run dev        # starts the site at http://localhost:5173 and reloads on every save
npm run typecheck  # checks the TypeScript for mistakes without building
npm run build      # type-checks, then builds the final site into dist/
npm run preview    # serves dist/ locally to test the real build
```

While `npm run dev` runs, open `http://localhost:5173/app/home.html?hub=demo`.

**Recommended VS Code extensions:** *Tailwind CSS IntelliSense* (class autocomplete and colour previews). TypeScript support is built in. Live Server isn't needed any more: `npm run dev` does the same job, better.

---

## 5. Folder structure

```
classhub/
├── README.md                  ← this file
├── package.json               ← project name, scripts, tool versions
├── package-lock.json          ← exact installed versions (commit it)
├── tsconfig.json              ← TypeScript rules (strict mode)
├── vite.config.ts             ← build setup: every app/*.html becomes a page
├── .gitignore                 ← keeps node_modules/ and dist/ out of git
├── .github/workflows/
│   └── deploy.yml             ← builds + publishes to GitHub Pages on push
│
├── index.html                 ← Landing page shell → src/pages/landing.ts
├── school.html                ← School directory shell → src/pages/school.ts
├── 404.html                   ← Not found shell → src/pages/not-found.ts
│
├── app/                       ← hub page shells (tiny HTML, one per page)
│   ├── home.html              → src/pages/home.ts
│   ├── announcements.html     → src/pages/announcements.ts
│   ├── announcement.html      → src/pages/announcement.ts     (?id=)
│   ├── timetable.html         → src/pages/timetable.ts
│   ├── deadlines.html         → src/pages/deadlines.ts
│   ├── courses.html           → src/pages/courses.ts          ("Subjects" in secondary)
│   ├── course.html            → src/pages/course.ts           (?code=)
│   ├── handouts.html          → src/pages/handouts.ts
│   ├── past-questions.html    → src/pages/past-questions.ts
│   ├── parents.html           → src/pages/parents.ts          (secondary only)
│   ├── class-info.html        → src/pages/class-info.ts
│   ├── more.html              → src/pages/more.ts
│   ├── help.html              → src/pages/help.ts
│   └── paused.html            → src/pages/paused.ts
│
├── src/
│   ├── app.ts                 ← mountPage(): shared start of every hub page
│   ├── styles/
│   │   └── main.css           ← Tailwind import, @theme tokens, shared component classes
│   ├── types/
│   │   ├── hub.ts             ← HubConfig, SchoolConfig, Mode
│   │   └── sheet.ts           ← one interface per sheet tab + HubData
│   ├── config/
│   │   ├── hubs.ts            ← OWNER, HUBS, SCHOOLS: the client register
│   │   └── labels.ts          ← words per mode + L("courses")
│   ├── lib/                   ← logic, no HTML
│   │   ├── csv.ts             ← CSV parser
│   │   ├── sheets.ts          ← downloads one tab from Google
│   │   ├── clean.ts           ← raw rows → typed data, skips bad rows
│   │   ├── data.ts            ← loadHub(): cache first, then fresh
│   │   ├── cache.ts           ← offline copy + small preferences
│   │   ├── dates.ts           ← parse/format dates, countdowns
│   │   ├── links.ts           ← ?params, hubLink(), WhatsApp links, isSafeUrl
│   │   └── dom.ts             ← el(): safe element builder
│   ├── components/            ← reusable UI pieces
│   │   ├── icons.ts           ← inline SVG icons
│   │   ├── nav.ts             ← top bar + bottom menu
│   │   ├── states.ts          ← skeleton, banners, empty and full-page messages
│   │   └── branding.ts        ← client colour (with contrast check) + page title
│   └── pages/                 ← one file per page: describes its content only
│       ├── landing.ts  school.ts  not-found.ts  paused.ts
│       └── home.ts  announcements.ts  announcement.ts  timetable.ts  deadlines.ts
│           courses.ts  course.ts  handouts.ts  past-questions.ts  parents.ts
│           class-info.ts  more.ts  help.ts
│
├── public/                    ← copied as-is into the build (manifest, icons, logos) (Phase 4)
│
├── design/
│   └── mockups/               ← static HTML mockups of every page (visual reference)
│
├── tools/
│   ├── classhub-master-template.xlsx  ← upload to Drive to create the master sheet
│   └── sheet-tester.html              ← checks a client's sheet tab by tab
│
└── docs/                      ← delegate guide, sheet template notes (Phase 4)
```

**How one page fits together** (Timetable as the example):

1. `app/timetable.html` is an empty shell: `<div id="app">` and one `<script type="module" src="/src/pages/timetable.ts">`.
2. `src/pages/timetable.ts` calls `mountPage({ page, title, tabs, render })`.
3. `mountPage` (in `src/app.ts`) finds the hub, checks it's active, draws the top bar and bottom menu, shows the skeleton, and calls `loadHub()`.
4. `loadHub` (in `src/lib/data.ts`) shows the saved copy, downloads the tabs, cleans them with `src/lib/clean.ts`, saves a new copy, and calls `render()` with typed data.
5. `render()` builds the page with `el()` and Tailwind classes.

So each page file only describes **what** to show. The **how** (loading, offline, errors, menu) is written once.

**Adding a new page:** create `app/<name>.html` (copy any shell, change the script path) and `src/pages/<name>.ts`. Vite picks it up automatically.

### Tailwind in this project

- **Tokens** (colours, font, radius) live in `src/styles/main.css` under `@theme`, which creates classes like `bg-accent`, `text-muted`, `border-line`, `rounded-card`.
- **Repeated building blocks** (`.card`, `.row`, `.tag`, `.btn`, `.chip`, `.list`...) are defined once in `main.css` with `@apply`, so pages stay short and every page looks the same. Use them first; add one-off Tailwind classes only for layout and spacing.
- **Client colours:** `branding.ts` overrides `--color-accent` at runtime, so every `bg-accent` / `text-accent` on the page changes colour automatically.
- Tailwind finds class names by scanning the `.ts` files, so **always write full class names** (`"text-urgent"`), never build them from pieces (`"text-" + colour`), or Tailwind won't see them and the style will be missing.

---

## 6. Links and routing

| Link | Opens | Required params |
|---|---|---|
| `/` | Landing page | none |
| `/school.html?school=nhs` | School directory | `school` |
| `/app/home.html?hub=cs200-uni` | Hub home | `hub` |
| `/app/announcements.html?hub=...` | All announcements | `hub` |
| `/app/announcement.html?hub=...&id=12` | One announcement | `hub`, `id` |
| `/app/timetable.html?hub=...&day=Tue` | Timetable (day optional) | `hub` |
| `/app/deadlines.html?hub=...&filter=tests` | Deadlines (filter optional) | `hub` |
| `/app/courses.html?hub=...` | Courses / subjects | `hub` |
| `/app/course.html?hub=...&code=CSC203` | One course | `hub`, `code` |
| `/app/handouts.html?hub=...&code=CSC203` | Handouts (course optional) | `hub` |
| `/app/past-questions.html?hub=...&code=CSC201` | Past questions (course optional) | `hub` |
| `/app/parents.html?hub=...` | Parents' corner (secondary) | `hub` |
| `/app/class-info.html?hub=...` | Class info | `hub` |
| `/app/more.html?hub=...` | More menu | `hub` |
| `/app/help.html?hub=...` | Install guide | `hub` (optional) |
| `/app/paused.html?hub=...` | Paused notice | `hub` |
| anything else | `404.html` | — |

**Routing rules (in `src/app.ts` and `src/lib/links.ts`):**

- Read params with `param("hub")` (`src/lib/links.ts`).
- If `hub` is missing, the last hub opened on this phone is used (so the installed app icon works). If there's still none, or it's not in `HUBS` → go to `404.html`.
- If the hub has `active: false` → go to `paused.html?hub=...`.
- If a page needs `id` or `code` and it doesn't exist in the data → show that page's "not found" state (not the global 404), with a button back to the list.
- Every internal link is built with `hubLink("timetable")`, which adds `?hub=...` automatically, so students never lose their class while moving around.
- Hub ids use only lowercase letters, numbers and dashes: `cs200-uni`, `form5-nhs`. Anything else is rejected.

---

## 7. Client register: `src/config/hubs.ts`

The list of every client. Adding a client = adding one entry.

```js
const HUBS = {
  "cs200-uni": {
    name: "CS200 Hub",                 // shown in the header
    subtitle: "Computer Science · Level 200",
    school: "Faculty of Science",
    schoolId: null,                    // or "nhs" to group under a school directory
    mode: "university",                // "university" | "secondary"
    sheetId: "1AbC...xyz",             // from the Google Sheet link
    color: "#2B59D9",                  // optional brand colour
    logo: null,                        // optional, e.g. "../assets/logos/fs.png"
    contact: "2376XXXXXXXX",           // WhatsApp of the hub owner (with their consent)
    active: true,                      // false = show the paused page
    startDate: "2026-10-01",           // for your own records
    plan: "semester"                   // for your own records
  }
};

const SCHOOLS = {
  "nhs": {
    name: "[SCHOOL NAME]",
    logo: "../assets/logos/nhs.png",
    color: "#7A1F2B",
    parentsHub: "parents-nhs"          // optional: a hub used only for parents' info
  }
};
```

**Field rules**

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Max ~20 characters so it fits the header |
| `subtitle` | yes | Level / programme / form |
| `school` | yes | Shown on Class info |
| `schoolId` | no | Must match a key in `SCHOOLS` |
| `mode` | yes | Unknown mode falls back to `university` |
| `sheetId` | yes | The long id between `/d/` and `/edit` in the sheet link |
| `color` | no | Overrides `--accent`. Must pass contrast with white text (see 13) |
| `logo` | no | Small file, under 30 KB |
| `contact` | no | Used for "Report a mistake" |
| `active` | yes | Your on/off switch |

The selling page link (your own WhatsApp) lives in `src/config/hubs.ts` too:

```js
const OWNER = { name: "[YOUR NAME]", whatsapp: "2376XXXXXXXX", city: "Douala" };
```

---

## 8. The Google Sheet template

One Google Sheet per client, copied from your master template. Each **tab** is one type of content.

**Universal rules for every tab**

- **Row 1 = column names, exactly as written below, lowercase.** Row 1 is protected (Data › Protect sheets and ranges) so only you can edit it.
- Dates: `YYYY-MM-DD` (for example `2026-10-22`). Use Format › Number › Plain text on date columns so Google doesn't change them.
- Times: 24-hour `HH:MM` (for example `08:00`, `14:30`).
- Yes/no columns: `yes` or `no`.
- Empty rows are ignored. A row missing a **required** column is skipped and counted in the "rows skipped" note on the More page.
- Data validation dropdowns (Data › Data validation) are set on every column that has fixed choices, so the delegate picks instead of typing.

### Tab `info` (key / value)

| key | value | Required | Example |
|---|---|---|---|
| `class_name` | text | yes | Computer Science · Level 200 |
| `year` | text | yes | 2026/2027 |
| `students` | number | no | 84 |
| `whatsapp_group` | link | no | https://chat.whatsapp.com/... |
| `channel` | link | no | WhatsApp channel link |
| `contribution` | text | no | 2,000 FCFA per student |
| `contribution_due` | date | no | 2026-10-31 |
| `welcome` | text | no | Short note shown on Home |
| `updated_by` | text | no | Brenda T. |

### Tab `announcements`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | number | yes | Unique, never reused. Increase by 1 each time |
| `date` | date | yes | Posting date |
| `time` | time | no | Posting time |
| `title` | text | yes | Max ~90 characters |
| `body` | text | yes | Line breaks allowed (Alt+Enter in a cell) |
| `category` | choice | yes | `urgent`, `exam`, `general`, `social`, `parents` |
| `pinned` | yes/no | no | Max 1 pinned shown on Home; newest pinned wins |
| `author` | text | no | "Delegate", a name, or "School office" |
| `code` | text | no | Course code it relates to |
| `when` | text | no | For the details box, e.g. "Thu 22 Oct, 10:00" |
| `where` | text | no | For the details box, e.g. "Amphi 250" |
| `attachment` | link | no | Drive link |
| `attachment_name` | text | no | Shown on the file row |
| `expires` | date | no | After this date it moves to "Earlier" and loses its pin |

### Tab `timetable`

| Column | Type | Required | Notes |
|---|---|---|---|
| `day` | choice | yes | `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat` |
| `start` | time | yes | |
| `end` | time | yes | Must be after `start` |
| `code` | text | yes | Must match a course in `courses` (or shown without a link) |
| `title` | text | no | Falls back to the course title |
| `venue` | text | no | |
| `teacher` | text | no | Falls back to the course teacher |
| `type` | choice | no | `lecture`, `lab`, `tutorial`, `free` |
| `week` | choice | no | `all`, `odd`, `even` for alternating weeks (default `all`) |

### Tab `deadlines`

| Column | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | |
| `code` | text | no | Course code |
| `type` | choice | yes | `test`, `assignment`, `exam`, `admin`, `sequence`, `mock` |
| `date` | date | yes | |
| `time` | time | no | Default end of day `23:59` |
| `venue` | text | no | |
| `details` | text | no | |
| `done` | yes/no | no | Delegate marks finished items, or they auto-move after the date |
| `announcement_id` | number | no | Links the deadline to an announcement |

### Tab `courses`

| Column | Type | Required | Notes |
|---|---|---|---|
| `code` | text | yes | Unique. Written without spaces in the sheet (`CSC203`), shown as `CSC 203` |
| `title` | text | yes | |
| `credits` | number | no | University mode |
| `teacher` | text | no | |
| `office` | text | no | |
| `office_hours` | text | no | |
| `description` | text | no | One or two lines |

### Tab `handouts`

| Column | Type | Required | Notes |
|---|---|---|---|
| `code` | text | yes | Course code |
| `title` | text | yes | |
| `link` | link | yes | Drive "Anyone with the link can view" link |
| `type` | choice | no | `pdf`, `doc`, `ppt`, `zip`, `image`, `link` |
| `size` | text | no | "2.1 MB" |
| `date_added` | date | no | Items in the last 3 days get a "New" tag |
| `chapter` | text | no | For sorting |

### Tab `past_questions`

| Column | Type | Required | Notes |
|---|---|---|---|
| `code` | text | yes | |
| `title` | text | yes | |
| `year` | text | yes | "2024/2025" |
| `kind` | choice | yes | `exam`, `ca`, `resit`, `sequence`, `mock`, `gce_practice` |
| `link` | link | yes | |
| `answers_link` | link | no | If present, show the "Solved" badge and an "Answers" button |
| `pages` | number | no | |

Only papers the class or school has the right to share go here (see 20).

### Tab `leaders`

| Column | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | |
| `role` | text | yes | Delegate, Assistant, Treasurer, Class teacher, Principal's office |
| `whatsapp` | text | no | Only with that person's permission. Digits only, e.g. `2376XXXXXXXX` |
| `order` | number | no | Display order |

### Tab `places`

| Column | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | |
| `directions` | text | no | |
| `map_link` | link | no | Google Maps link |

### Tab `parents` (secondary mode only)

| Column | Type | Required | Notes |
|---|---|---|---|
| `section` | choice | yes | `dates`, `fees`, `meetings`, `requirements`, `contacts` |
| `title` | text | yes | |
| `detail` | text | no | |
| `date` | date | no | Countdown shown if in the future |
| `link` | link | no | |

### Master template

Keep one **master sheet** with all tabs, headers, protections, dropdowns and 2–3 example rows per tab. For each new client: File › Make a copy, delete the examples, share it with the delegate as **Editor**, and set General access to **Anyone with the link: Viewer**.

---

## 9. Google Drive setup for files

- One folder per client: `ClassHub – CS200 – 2026/2027`, with subfolders `Handouts` and `Past questions`.
- Share the folder with the delegate as **Editor**.
- Each file's share setting: **Anyone with the link: Viewer**.
- The delegate uploads a file, taps Share › Copy link, and pastes it in the `link` column.
- On the site, links open in a new tab. Drive shows its own preview, so we don't need a PDF viewer.
- Keep files small: scan at 150 dpi, compress big PDFs before uploading. Students pay for data.

---

## 10. How data loading works: `src/lib/data.ts`

### 10.1 The CSV address

For each tab, the site fetches:

```
https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet={tabName}
```

This works when the sheet is shared as "Anyone with the link: Viewer". **Test this with the master template before anything else** (Phase 1, task 1.1) using `tools/sheet-tester.html`. If it ever stops working, the fallback is File › Share › Publish to web › CSV per tab, saving each tab's published link in `src/config/hubs.ts`.

**Things we learned testing this endpoint (all handled in `src/lib/sheets.ts` and `src/lib/data.ts`):**

- **`headers=1`** forces Google to treat row 1 as the header row. Without it, Google sometimes guesses wrong.
- **Extra empty columns:** Google adds empty columns at the end of every row. Keep only columns whose header isn't empty.
- **Wrong tab name = silent wrong data:** if a tab doesn't exist, Google returns the *first* tab instead of an error. Always check that the expected columns are present; if none of a tab's required columns are there, treat it as "tab not found".
- **Private sheet = HTML page:** if sharing is wrong, the response is a web page (starts with `<`) or the request fails. Treat both as "sheet not shared".
- **Type guessing:** Google guesses a type per column, and in a column of mixed numbers and text it can drop the minority values. That's why every data cell in the template is formatted as **Plain text**, so everything comes back exactly as typed.

Google may take a few minutes to show the newest edits. The site always shows "Last updated" so nobody panics.

### 10.2 Steps

```
loadHub()
  1. read ?hub= → find HUBS[hub] → check active
  2. apply branding (colour, logo, name) right away
  3. show cached data immediately if we have it (fast first paint)
  4. fetch the tabs this page needs, in parallel (Promise.all)
  5. parse CSV → rows → clean objects (see 10.3)
  6. save to localStorage under "classhub:{hub}" with a timestamp
  7. re-render the page with fresh data
  8. on failure: keep cached data + show the offline/error banner
```

**Only fetch the tabs a page needs.** Each page file declares them:

```js
// src/pages/home.ts
mountPage({
  page: "home",
  tabs: ["info", "announcements", "deadlines", "timetable", "handouts"],
  render: ({ data, hub }) => [ /* elements built with el() */ ],
});
```

### 10.3 Cleaning rows

`csv.ts` parses CSV text (handles commas inside quotes, `""` escaped quotes, and line breaks inside quoted cells) into arrays. `sheets.ts` drops empty-header columns, then `clean.ts`:

- Uses row 1 as keys, lowercased and trimmed.
- Trims every value. Empty strings become `null`.
- Converts types per column: dates → `Date` (local time), times → minutes since midnight, numbers → `Number`, `yes/no` → `true/false`, codes → uppercase without spaces.
- Validates required columns. Invalid rows are dropped and counted in `data._skipped[tab]`.
- Sorts: announcements newest first; deadlines soonest first; timetable by day then start; handouts by `date_added` newest first; past questions by `year` newest first.
- Applies rules: expired announcements unpinned; deadlines in the past marked done.

### 10.4 Cache

```js
localStorage["classhub:cs200-uni"] = JSON.stringify({
  savedAt: "2026-10-19T09:14:00",
  tabs: { info: [...], announcements: [...], ... }
});
```

- Wrap every `localStorage` read and write in `try/catch` (it can be full, blocked, or missing in private mode).
- Cache is per hub, so two classes on one phone don't mix.
- Max age: if the cache is older than 7 days and we're offline, the banner says so clearly.

### 10.5 Timeouts

Each fetch gets a 12-second timeout (`AbortController`). Slow networks fall back to cache instead of spinning forever.

---

## 11. Modes and labels: `src/config/labels.ts`

Every word that changes between modes comes from here. Pages never write "Courses" or "Lecturer" directly; they call `L("courses")` from `src/config/labels.ts`, which is typed, so a misspelled key is a compile error.

```js
const LABELS = {
  university: {
    courses: "Courses",       course: "Course",
    teacher: "Lecturer",      leader: "Class delegate",
    test: "CA test",          exam: "Exam",
    pastQuestions: "Past questions",
    parents: null,            credits: "credits",
    classInfo: "Class info"
  },
  secondary: {
    courses: "Subjects",      course: "Subject",
    teacher: "Teacher",       leader: "Class teacher",
    test: "Sequence test",    exam: "Exam",
    pastQuestions: "Past papers",
    parents: "Parents' corner", credits: null,
    classInfo: "Class info"
  }
};
```

**What changes by mode**

| Thing | University | Secondary |
|---|---|---|
| Courses menu label | Courses | Subjects |
| Credits shown | Yes | No |
| Leader title | Class delegate | Class teacher / School office |
| Deadline types offered | test, assignment, exam, admin | sequence, assignment, mock, exam, admin |
| Parents' corner page | Hidden | Shown, in the More menu and on Home |
| "Report a mistake" goes to | Delegate | School office |
| Home quick link 4 | Class info | Parents' corner |

Adding a language later (French) = adding `LABELS.secondary_fr` etc. and a `lang` field in `src/config/hubs.ts`.

---

## 12. Helpers: `src/lib/`

| Helper | What it does | Example |
|---|---|---|
| `el(tag, attrs, children)` | Creates elements safely (text via `textContent`) | `el("p", {class:"meta"}, "Amphi 250")` |
| `hubLink(page, extra)` | Builds an internal link keeping `?hub=` | `hubLink("course.html", {code:"CSC203"})` |
| `param(name)` | Reads a URL param | `param("id")` |
| `parseDate("2026-10-22")` | Local date, no timezone shift | |
| `parseTime("08:30")` | → 510 (minutes) | |
| `today()` | Local date at midnight | |
| `dayName(date)` | → `"Mon"` | |
| `formatDate(date)` | → `"Thu 22 Oct"` | |
| `relativeTime(date)` | → `"2 hours ago"`, `"Yesterday"`, `"9 Oct"` | |
| `countdown(target)` | → `{days, hours, mins, past}` | |
| `countdownLabel(target)` | → `"2d 5h"`, `"Today"`, `"Tomorrow"`, `"3 hours"` | |
| `isNow(slot)` | Is this timetable slot happening now? | |
| `prettyCode("CSC203")` | → `"CSC 203"` | |
| `waShare(text, url)` | WhatsApp share link | `https://wa.me/?text=...` |
| `waChat(number, text)` | WhatsApp chat link | `https://wa.me/2376...?text=...` |
| `isSafeUrl(url)` | Only allows `https:` links | Blocks `javascript:` |
| `fileIcon(type)` | → `"PDF"`, `"DOC"`, `"ZIP"` | |

**Dates use the phone's local time.** Countdowns update every 60 seconds with `setInterval`, and stop when the tab is hidden (`document.visibilityState`) to save battery.

---

## 13. Design system

All values live in the `@theme` block of `src/styles/main.css`, which turns them into Tailwind classes (`--color-accent` → `bg-accent`, `text-accent`...). The mockups in `design/mockups/` use these exact values.

### Colours

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F6F5F1` | Page background |
| `--surface` | `#FFFFFF` | Cards, lists |
| `--ink` | `#15171C` | Main text, dark buttons |
| `--muted` | `#5D6270` | Secondary text |
| `--line` | `#E6E3DC` | Borders, dividers |
| `--accent` | `#2B59D9` | Brand, countdown card, active nav (overridable per client) |
| `--accent-ink` | `#1E43AE` | Links and text on light accent backgrounds |
| `--accent-soft` | `#E9EEFC` | Icon boxes, soft highlights |
| `--urgent` / `--urgent-soft` | `#B4410F` / `#FBEDE4` | Urgent tags, close deadlines |
| `--exam` / `--exam-soft` | `#6B3FB8` / `#F0EAFB` | Exam tags |
| `--ok` / `--ok-soft` | `#157043` / `#E2F2E9` | "Now", "New", "Solved", done |
| `--wa` | `#1C9E4D` | WhatsApp buttons only |

**Client colours:** `branding.ts` sets `--color-accent` from `hubs.ts` (it checks contrast automatically and refuses colours that are too light). Before accepting a client colour, check white text on it reaches 4.5:1 contrast (use any online contrast checker). If not, darken it.

### Type

- Font: `"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif`
- Sizes: 12 (tiny), 13 (small/meta), 15 (body), 16–18 (section and card titles), 22–26 (page titles), 34 (landing hero)
- Weights: 400 body, 500 list titles, 600 headings, 700 big titles

### Spacing and shape

- Side padding: 16px. Max content width: 560px (centred on big screens).
- Section gap: 26px. Inside cards: 16px padding, 8–12px gaps.
- Radius: 14px cards, 12px icon boxes, 999px pills and buttons.
- Minimum tap target: 44px tall (buttons are 46px, chips 40px with spacing).

### Icons

Inline SVG, 24px grid, 1.8 stroke, `stroke="currentColor"`, `aria-hidden="true"` when decorative. No icon fonts, no emoji as icons.

---

## 14. Shared components

Each is a CSS class plus (when needed) a small builder function in the page scripts.

| Component | Class | Used on | Notes |
|---|---|---|---|
| Top bar | `.topbar` | All app pages except Home | Back arrow (when there's a parent page) + title. Sticky |
| Home header | `.home-head` | Home | Subtitle, hub name, today's date |
| Bottom nav | `.nav` | All app pages | 5 items: Home, News, Timetable, Deadlines, More. Active item uses `aria-current="page"`. Red dot on News if there's an announcement newer than the student's last visit (stored in `localStorage`) |
| Card | `.card` | Everywhere | Variants: `.card-accent` (blue), `.card-urgent` (orange) |
| List + row | `.list`, `.row` | Lists | Row = icon box + text (`.title`, `.meta`) + optional tag/button/chevron |
| Icon box | `.icon-box` | Rows | Variants: `.pdf`, `.exam`, `.ok` |
| Tag | `.tag` | Labels | Variants: `-urgent`, `-exam`, `-ok`, `-plain` |
| Chips | `.chips`, `.chip` | Filters | Horizontal scroll on small screens. Active chip `.active` + `aria-pressed="true"` |
| Day tabs | `.days`, `.day` | Timetable | `role="tablist"`, today pre-selected |
| Slot | `.slot` | Timetable, Course | Time column + card. `.now`, `.lab`, `.free` |
| Countdown block | `.count` | Home | Days / hours / mins boxes |
| Due badge | `.due` | Deadline rows | Big number + "left". `.urgent` when under 3 days |
| Quick links grid | `.quick` | Home | 2 columns |
| Search | `.search` | Handouts | Label + input, filters as you type |
| Avatar | `.avatar` | People | Initials only, never photos of students |
| Buttons | `.btn` | Everywhere | `.btn-light`, `.btn-wa`, `.btn-accent`, `.btn-sm`, `.btn-block` |
| Banner | `.banner` | Top of content | Offline, error, stale data, "rows skipped" (delegate-facing hint) |
| Skeleton | `.skeleton` | While loading | Grey blocks shaped like the content |
| Empty state | `.empty-state` | Lists with no items | Short sentence + optional action |
| Section title | `.sec-title` | Sections | Heading + optional "See all" link |

---

## 15. Page states

Every app page must handle all of these. They're built once in `src/app.ts`, `src/lib/data.ts` and `src/components/states.ts`.

| State | When | What the user sees |
|---|---|---|
| **Loading (first visit)** | No cache, fetch in progress | Skeleton blocks, no spinner-only screens |
| **Loading (return visit)** | Cache exists | Cached content immediately, quiet "Updating..." in the top bar |
| **Loaded** | Fresh data | Normal page, "Last updated" where relevant |
| **Offline** | Fetch failed, cache exists | Banner: "You're offline. Showing info from Mon 9:14am." |
| **Offline, no cache** | Fetch failed, no cache | Full message: "Connect to the internet once to load your class hub." + Retry button |
| **Stale** | Cache older than 7 days and offline | Orange banner: "This info may be out of date." |
| **Empty section** | Tab has no valid rows | Empty state inside that section only, e.g. "No deadlines yet 🎉" |
| **Item not found** | `?id=` or `?code=` not in data | "We couldn't find that announcement." + back button |
| **Hub not found** | Bad or missing `?hub=` | Redirect to `404.html` |
| **Paused** | `active: false` | Redirect to `paused.html` |
| **Sheet broken** | Tab missing or headers changed | Section empty state for students + banner on More page: "Sheet problem: tab 'deadlines' not found" (helps the delegate) |

---

## 16. Every page, in detail

Each page section lists: **purpose, link, data tabs, layout (top to bottom), interactions, states, and edge cases.**

---

### 16.1 Landing page: `index.html` + `src/pages/landing.ts`

**Purpose:** Your selling page. Sent to delegates, school owners and administrators.
**Link:** `/`
**Data:** `OWNER` from `src/config/hubs.ts` only. No sheet.
**No bottom nav.**

**Layout**
1. **Top bar:** ClassHub logo mark + name, "Chat with us" WhatsApp button (`waChat(OWNER.whatsapp, "Hello, I'd like a ClassHub for my class")`).
2. **Hero:** tag "For class delegates & schools", headline "Your class. One link. Nothing gets buried.", one-sentence explanation, button "See a live example" (links to a demo hub `?hub=demo`).
3. **"Sound familiar?":** fake WhatsApp chat bubbles showing the problem (questions asked again and again, delegate tired). Clearly illustrative, not real people.
4. **What your class gets:** 5 checked rows (pinned announcements, timetable, countdowns, handouts & past questions, easy updates).
5. **For schools:** short block on parents, resumption dates, fees reminders, school branding.
6. **How it works:** 3 numbered steps (send info → get link in 48h → update from your phone).
7. **Price box:** "[YOUR PRICE] FCFA per semester" for classes and "From [PRICE] per term" for schools, plus "Get your class hub" WhatsApp button.
8. **FAQ (details/summary):** "Do students need to download anything?", "Who can edit?", "What if we have no data?", "Is it private?" (honest answer: anyone with the link can view, so we don't put private info on it).
9. **Footer:** "ClassHub by [YOUR NAME] · Douala".

**Interactions:** FAQ items open/close with native `<details>`. All CTAs open WhatsApp.
**Edge cases:** Works with JavaScript off (everything except prefilled WhatsApp text is plain HTML).

---

### 16.2 School directory: `school.html` + `src/pages/school.ts`

**Purpose:** One link a school shares with all students and parents.
**Link:** `/school.html?school=nhs`
**Data:** `SCHOOLS[school]` + all `HUBS` with that `schoolId`. Optionally the parents hub's `info` and `parents` tabs.

**Layout**
1. School logo + name (branded colour).
2. "Find your class": search box (filters as you type) + list of classes grouped by level (Form 1 … Upper Sixth, or Level 100 … 400). Each row → that hub's Home.
3. "For parents" card → Parents' corner of the parents hub (if set).
4. "Remember your class": after a visitor opens a class, store it in `localStorage`; next time show "Continue to Form 5 Hub" at the top.
5. Footer: "Powered by ClassHub".

**States:** unknown school → 404. School with no active classes → empty state "Classes coming soon".
**Edge cases:** Sort classes in natural order (Form 2 before Form 10; Lower Sixth before Upper Sixth) using an `order` field or a fixed list in `src/config/labels.ts`.

---

### 16.3 Home: `app/home.html` + `src/pages/home.ts`

**Purpose:** The daily screen. Answers "What do I need to know today?" in 5 seconds.
**Data tabs:** `info`, `announcements`, `deadlines`, `timetable`, `handouts` (+ `parents` in secondary mode).

**Layout**
1. **Header:** subtitle, hub name, today's date ("Monday, 19 October").
2. **Pinned announcement** (if any, not expired): orange card, tag "Pinned · Urgent" or "Pinned", title, author + relative time. Tap → Announcement page.
3. **Welcome note** (if `info.welcome`): small muted card.
4. **Next deadline:** blue card with title, details line, date/time, live countdown (days, hours, mins). Tap → Deadlines. If none upcoming: soft card "No upcoming deadlines".
5. **Today:** today's timetable slots as rows (time box, title, code · venue), "Now" tag on the current one. Link "Full timetable". Weekend/no classes: "No classes today. Rest well 😴" with a link to tomorrow (Monday on weekends).
6. **Quick links:** 4 tiles with live counts: Handouts (n files), Past questions (n papers), Courses/Subjects (n), Class info — or Parents' corner in secondary mode.
7. **New handouts:** latest 2–3 with "See all".
8. **Install hint** (once): small dismissible card "Add CS200 Hub to your home screen" → Help. Dismissal stored in `localStorage`.

**Interactions:** countdown ticks every minute; "Now" re-checks every minute.
**Edge cases:** two pinned → newest wins; a deadline due today at 23:59 shows "Today" not "0 days"; classes that end while the page is open lose "Now".

---

### 16.4 Announcements: `app/announcements.html` + `src/pages/announcements.ts`

**Purpose:** Every announcement, filterable.
**Data tabs:** `announcements`.

**Layout**
1. Top bar "Announcements".
2. Filter chips: All, Urgent, Tests & exams, General, Social (+ Parents in secondary). Selected filter kept in the URL (`?filter=urgent`) so it can be shared.
3. **Pinned** group (if any).
4. **This week** group (last 7 days).
5. **Earlier** group.
6. Each item: tag, title (2 lines max), first line of body (1 line, ellipsis), relative date. Tap → Announcement.

**Interactions:** chips filter instantly without reload. Opening this page saves "last seen" time, which clears the red dot on the News tab.
**States:** empty filter → "No urgent announcements. All calm 😌".
**Edge cases:** very long titles wrap to 2 lines; body with line breaks shows only the first line here.

---

### 16.5 One announcement: `app/announcement.html` + `src/pages/announcement.ts`

**Purpose:** The full message, easy to share.
**Link:** `?hub=...&id=12`
**Data tabs:** `announcements`, `courses` (to show the course name), `deadlines` (related).

**Layout**
1. Top bar "Announcement" with back → Announcements.
2. Tag + title (large).
3. Author row: initials avatar, author, full date and time.
4. **Details box** (only if `code`, `when` or `where` exist): Course, When, Where.
5. Body, with line breaks kept (`white-space: pre-line`). Links in the body are not auto-clickable (safety); a separate attachment row handles files.
6. **Attachment row** (if any): file icon, name, "Open" button → Drive link in a new tab.
7. Buttons: "Share on WhatsApp" (message = title + link to this announcement), "See all deadlines" (or "See related deadline" if `announcement_id` matches).

**States:** unknown id → not-found state. Expired → small note "This announcement has expired".
**Edge cases:** `attachment` that isn't `https://` is ignored (`isSafeUrl`).

---

### 16.6 Timetable: `app/timetable.html` + `src/pages/timetable.ts`

**Purpose:** The week's classes, today first.
**Data tabs:** `timetable`, `courses`.

**Layout**
1. Top bar "Timetable".
2. Day tabs Mon–Fri (+ Sat if any Saturday rows exist), each showing the day and the date of this week. Today selected; on weekends, Monday selected. `?day=Tue` opens that day.
3. Slot list for the selected day, sorted by start: time column (start bold, end below) + card (code, type label for labs, title, venue · teacher). "Now" tag + ring on the current slot. Gaps of 60+ minutes between classes appear as a dashed "Free period" card automatically. Tap → Course.
4. "Last updated by the delegate · [date]" from `info.updated_by` and the cache time.

**Interactions:** tapping a day tab updates the list and the URL (`history.replaceState`), arrow keys move between tabs (accessibility).
**States:** no classes that day → "No classes on Saturday".
**Edge cases:** overlapping slots show both stacked with a small "Clash" tag; `week: odd/even` uses ISO week number; a slot with unknown course code shows without a link.

---

### 16.7 Deadlines: `app/deadlines.html` + `src/pages/deadlines.ts`

**Purpose:** Never miss a test or assignment.
**Data tabs:** `deadlines`, `courses`.

**Layout**
1. Top bar "Deadlines & tests".
2. Chips: Upcoming, Tests, Assignments, Exams, Done.
3. Groups: **This week** (next 7 days), **Later**, **Done** (past or `done: yes`, collapsed after 5 items with "Show more").
4. Each row: icon by type, title, type · date/time · venue, due badge on the right ("2d / 5h left"; orange under 3 days; "Today", "Tomorrow", "In 3 hours").
5. Tap → related announcement if linked, otherwise expands the row to show `details` inline.

**Interactions:** due badges refresh every minute.
**States:** nothing upcoming → "No upcoming deadlines. Enjoy it while it lasts 😄".
**Edge cases:** no time given → treated as 23:59; overdue but not marked done → moves to Done with "Passed" label.

---

### 16.8 Courses / Subjects: `app/courses.html` + `src/pages/courses.ts`

**Purpose:** All courses this semester (or subjects this year).
**Data tabs:** `courses`, `timetable` (for hours per week).

**Layout**
1. Top bar "Courses" or "Subjects" (from labels), back → More.
2. Summary card: number of courses, total credits (university only), hours per week (calculated from the timetable).
3. List of cards: code · credits, title, teacher, chevron. Tap → Course.

**States:** no courses → "Courses haven't been added yet".
**Edge cases:** hours per week only counts slots whose code matches.

---

### 16.9 One course / subject: `app/course.html` + `src/pages/course.ts`

**Purpose:** Everything about one course in one place.
**Link:** `?hub=...&code=CSC203`
**Data tabs:** `courses`, `timetable`, `deadlines`, `handouts`, `past_questions`, `announcements`.

**Layout**
1. Top bar with the course code, back → Courses.
2. Code · credits · semester, then the title (large), then the description if any.
3. Teacher card: initials, name, office, office hours.
4. Next deadline for this course (card with due badge), or nothing.
5. Weekly classes: rows per timetable slot (day box, type · time, venue).
6. Latest announcement for this course (if any).
7. Handouts: latest 3 + "See all n" → Handouts filtered by this code.
8. Past questions card: "n papers for this course" → Past questions filtered.

**States:** unknown code → not-found state.

---

### 16.10 Handouts: `app/handouts.html` + `src/pages/handouts.ts`

**Purpose:** Find any note quickly.
**Data tabs:** `handouts`, `courses`.

**Layout**
1. Top bar "Handouts & notes", back → More.
2. Search box (label "Search handouts", placeholder "Search notes, chapters..."). Searches title, chapter and course title; ignores case and accents.
3. Course chips: All + one per course that has handouts. `?code=` preselects.
4. Groups by course (course title, file count), rows: file type box, title, size · date, "New" tag if added in the last 3 days. Tap → opens the Drive link in a new tab.
5. Footer note: "Files open from Google Drive."

**States:** no results → "Nothing matches 'xyz'. Try another word." No handouts at all → "No handouts yet."
**Edge cases:** broken or non-https links are hidden and counted as skipped rows.

---

### 16.11 Past questions: `app/past-questions.html` + `src/pages/past-questions.ts`

**Purpose:** Practice papers by course and year.
**Data tabs:** `past_questions`, `deadlines`, `courses`.

**Layout**
1. Top bar "Past questions" or "Past papers", back → More.
2. Course chips (`?code=` preselects).
3. **Smart hint card:** if the selected course has a test in the next 7 days, show "CSC 201 CA is on Thursday. Practise with these n papers."
4. Groups by year (newest first), rows: kind box (EXAM / CA / RESIT / SEQ / MOCK), title, pages, "Solved" tag if `answers_link`. Tap → paper. A small "Answers" button opens `answers_link`.
5. Card: "Have a past question we don't? Send a clear photo to the delegate." → WhatsApp to the leader (if a number is set) or Class info.

**States:** none for the course → "No past papers for this course yet."

---

### 16.12 Parents' corner: `app/parents.html` + `src/pages/parents.ts` *(secondary mode only)*

**Purpose:** What parents need, without calling the school office.
**Data tabs:** `parents`, `announcements` (category `parents`), `info`.
**Hidden in university mode** (nav and links don't show; visiting directly redirects to Home).

**Layout**
1. Top bar "Parents' corner".
2. **Key dates:** resumption, holidays, open days, with countdowns for future dates.
3. **Fees:** instalments and deadlines (amounts as the school writes them), payment instructions.
4. **Meetings:** PTA and other meetings with date, time, venue.
5. **Requirements:** list (uniform, books, items), each with optional detail.
6. **Announcements for parents:** latest from the `parents` category.
7. **Contact the school office:** WhatsApp button (school's official number only).

**Edge cases:** No individual student info, fees owed per child, or results here. Ever.

---

### 16.13 Class info: `app/class-info.html` + `src/pages/class-info.ts`

**Purpose:** Who's who and where things are.
**Data tabs:** `info`, `leaders`, `places`.

**Layout**
1. Top bar "Class info", back → More.
2. Class card: subtitle, school, year · number of students.
3. **Leaders:** rows with initials, name, role, WhatsApp button (only if a number is in the sheet).
4. **Groups:** "Join the class WhatsApp group", "Join the announcements channel" (only if links exist).
5. **Important places:** rows with name and directions, map link if present.
6. **Class contribution:** amount text + due date (with countdown if in the future).

**States:** each section hides itself if it has no data.

---

### 16.14 More: `app/more.html` + `src/pages/more.ts`

**Purpose:** Menu for everything not in the bottom nav, plus tools.
**Data tabs:** counts only (`handouts`, `past_questions`, `courses`) + `info`.

**Layout**
1. Top bar "More".
2. Menu list: Handouts (n files), Past questions (n), Courses/Subjects (n), Parents' corner (secondary), Class info.
3. **Install card:** "Add [hub name] to your home screen" + "Show me how" → Help. Hidden if already installed (`display-mode: standalone`).
4. Tools list: "Share the hub link" (uses `navigator.share` when available, else WhatsApp share), "Report a mistake" (WhatsApp to the hub contact with prefilled text including the page name), "Refresh data now" (clears this hub's cache and reloads).
5. **Sheet health** (small, muted): "Last updated Mon 9:14am · 2 rows skipped" — helps the delegate spot errors. Tapping explains which tab.
6. Credit line: "Built by [YOUR NAME] · Want a hub for your class? Get one" → Landing.

---

### 16.15 Help: `app/help.html` + `src/pages/help.ts`

**Purpose:** Show students how to install the hub like an app.

**Layout**
1. Top bar "Add to home screen", back → More.
2. Detects the phone (`navigator.userAgent`) and opens the right tab first:
   - **Android (Chrome):** tap ⋮ menu → "Add to Home screen" / "Install app" → Add.
   - **iPhone (Safari):** tap Share → "Add to Home Screen" → Add.
3. If the browser supports the install prompt (`beforeinstallprompt`), show a big "Install" button that triggers it.
4. Short FAQ: "Does it use data?", "Will it update by itself?"

Plain illustrated steps (simple SVG drawings, not screenshots of other companies' apps).

---

### 16.16 Paused: `app/paused.html`

**Purpose:** Shown when a client is set `active: false`.
**Layout:** Hub name, message "This class hub is paused. Please contact your delegate or school office.", and a small "Powered by ClassHub" link to the Landing page. No data loaded, no bottom nav.

---

### 16.17 Not found: `404.html`

**Purpose:** Any broken link.
**Layout:** big "404", "This page went missing", friendly line ("Like a CA date buried in the class WhatsApp group 😅"), buttons "Go to the hub home" (if a hub can be guessed from `localStorage` last hub) and "What is ClassHub?" → Landing.
GitHub Pages serves `404.html` automatically for unknown paths. Vite builds every page with absolute asset paths that include the base path (`/classhub/assets/...`), so the 404 page works at any URL depth.

---

## 17. Install like an app (PWA)

Phase 4. Lets students open the hub from an icon and loads pages even offline.

**`manifest.json`**
```json
{
  "name": "ClassHub",
  "short_name": "ClassHub",
  "start_url": "./app/home.html",
  "display": "standalone",
  "background_color": "#F6F5F1",
  "theme_color": "#2B59D9",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Note: `start_url` can't carry each student's `?hub=` from the manifest, so `home.html` without a hub reads the last hub from `localStorage` and continues there.

**`sw.js` (service worker)**
- On install: cache the app shell (all HTML in `app/`, the built CSS and JS in `assets/`, icons). Generate the file list at build time.
- On fetch: app shell = cache first; Google Sheets requests = network only (data caching is handled by `src/lib/data.ts`); everything else = network with cache fallback.
- Bump a `VERSION` constant on every deploy so phones get the new files.

---

## 18. Accessibility checklist

- [ ] `lang="en"` on every page; meaningful `<title>` per page ("Timetable · CS200 Hub").
- [ ] Landmarks: `<header>`, `<main>`, `<nav aria-label="Main">`, `<footer>`.
- [ ] One `<h1>` per page; headings in order.
- [ ] All tappable things are `<a href>` or `<button>`; no clickable `<div>`s.
- [ ] Chips use `aria-pressed`; day tabs use `role="tablist"`, `role="tab"`, `aria-selected`.
- [ ] Inputs have a `<label>` (visible or visually hidden).
- [ ] Icon-only buttons have `aria-label`; decorative SVGs have `aria-hidden="true"`.
- [ ] Text contrast 4.5:1 (3:1 for large text). Tags pass on their soft backgrounds.
- [ ] Meaning never by colour alone ("Urgent" is a word, not just orange).
- [ ] Visible focus outline on everything focusable.
- [ ] Countdowns have an `aria-label` with the full sentence ("2 days 5 hours left").
- [ ] Works at 200% text size without breaking layout.
- [ ] Respects `prefers-reduced-motion` (no animations if set).

---

## 19. Performance and data costs

Targets for a first visit on a slow 3G connection:

| Item | Budget |
|---|---|
| HTML per page | under 10 KB |
| CSS total | under 20 KB |
| JS total (all files) | under 40 KB |
| Font | Poppins 4 weights, `display=swap` (system font shows first) |
| Sheet data | Only the tabs the page needs |
| Images | Logos only, under 30 KB each |

- No frameworks, no analytics scripts, no ads scripts.
- Return visits show cached data instantly.
- Files (PDFs) are only downloaded when a student taps "Open".

---

## 20. Privacy and safety rules

**Anyone with a hub link can see everything on it.** Treat every hub as public.

**Never on a hub:**
- Results, grades, report cards, rankings
- Individual fees owed or payment status per student
- Students' phone numbers, home addresses, or photos (especially under-18s)
- Anything a lecturer or school hasn't agreed to share publicly

**Allowed with permission:**
- Leaders' and staff WhatsApp numbers (ask each person first)
- Teacher names and office hours

**Files:**
- Only share handouts and past papers the class or school has the right to share. If a lecturer or publisher says no, it comes off.
- Drive links are "view" only.

**Code safety:**
- All sheet text goes in with `textContent` (our `el()` helper).
- Only `https://` links are rendered (`isSafeUrl`).
- External links use `rel="noopener"`.

**Editing access:**
- Only the delegate/school office (and you) are Editors on the sheet. Everyone else is a Viewer.
- When a delegate changes, transfer editor access and remove the old one.

---

## 21. Adding a new client

About 15–20 minutes once you're used to it.

1. **Collect:** class/school name, level, mode, year, delegate or office contact, brand colour/logo (schools), timetable, course list.
2. **Sheet:** open the master template → File › Make a copy → name it `ClassHub – [hub id]`. Delete example rows. Fill `info` and `courses` yourself the first time.
3. **Share:** sheet General access = "Anyone with the link: Viewer"; add the delegate as Editor.
4. **Drive:** create the folder with `Handouts` and `Past questions`, share with the delegate as Editor.
5. **Register:** add the entry in `src/config/hubs.ts` (copy an existing one, change the fields). For schools, add or update `SCHOOLS`.
6. **Push** to GitHub.
7. **Test** the link on your phone: every tab loads, nothing skipped on the More page.
8. **Hand over:** send the hub link, the delegate guide, and do a 10-minute walkthrough (add one announcement together).
9. **Record:** start date and plan in `src/config/hubs.ts` (or your own notebook).

**Ending a client:** set `active: false` and push. Their sheet stays theirs.

---

## 22. The delegate guide

A 1-page guide in `docs/delegate-guide.md` (also sent as a PDF or image on WhatsApp). Contents:

1. **Your two links:** the hub link (share with the class) and the sheet link (keep it private).
2. **Golden rules:** don't change row 1; dates like `2026-10-22`; times like `14:30`; use the dropdowns.
3. **Add an announcement:** go to tab `announcements`, new row at the bottom, next `id` number, fill date, title, body, category. To pin it, write `yes` in `pinned`.
4. **Change the timetable:** edit the row; to remove a class, delete the row.
5. **Add a deadline:** tab `deadlines`, new row.
6. **Add a handout:** upload to the Drive `Handouts` folder → Share → Copy link → paste in tab `handouts`.
7. **When will it show?** Usually within a few minutes. Students can tap "Refresh data now" on the More page.
8. **Something looks wrong?** Check the "rows skipped" note on the More page, then message [YOUR NAME].

---

## 23. Hosting and deploying

1. Create a GitHub repository named `classhub`.
2. Push the project (`node_modules/` and `dist/` are ignored on purpose; GitHub builds them itself).
3. Settings › Pages › Build and deployment › Source: **GitHub Actions**.
4. Every push to `main` runs `.github/workflows/deploy.yml`: it installs, type-checks, builds with `BASE_PATH=/classhub/`, and publishes `dist/`. Watch it in the **Actions** tab. A red ❌ means a TypeScript error: the old version stays online until you fix it.
5. The site appears at `https://[username].github.io/classhub/`.
6. **Paths:** in HTML shells use root paths (`/src/pages/home.ts`); in TypeScript build links with `hubLink()` / `siteLink()`. Vite adds the base path (`/classhub/`) for you.
7. **Custom domain (later):** buy a domain, add it under Settings › Pages, add a `CNAME` file.
8. **Every deploy:** bump `VERSION` in `public/sw.js` (once the service worker exists), then test one hub on a real phone.

---

## 24. Testing checklist

Run through this before showing any client.

**Data**
- [ ] Master sheet CSV loads for every tab (Phase 1, task 1).
- [ ] Commas, quotes and line breaks inside cells display correctly.
- [ ] A row with a missing required column is skipped and counted.
- [ ] Renaming a tab shows the empty state + sheet health warning, not a crash.
- [ ] `<script>alert(1)</script>` typed in a cell shows as text.

**Dates & time**
- [ ] Countdown correct across midnight and month ends.
- [ ] "Today" timetable correct on Monday morning, Friday evening, and weekends.
- [ ] "Now" tag appears and disappears at the right minute.
- [ ] Deadline with no time counts down to 23:59.

**Routing**
- [ ] Missing `?hub=` → 404. Unknown hub → 404. `active: false` → paused.
- [ ] Every internal link keeps `?hub=`.
- [ ] Unknown `?id=` / `?code=` → not-found state.

**Modes**
- [ ] Secondary hub shows Subjects, Teacher, Parents' corner; no credits.
- [ ] University hub hides Parents' corner, and `/app/parents.html` redirects.

**Offline**
- [ ] Load once, turn data off, reload: cached content + offline banner.
- [ ] First visit with data off: friendly "connect once" message + Retry.

**Devices**
- [ ] Android Chrome (small phone ~360px) and iPhone Safari.
- [ ] Desktop Chrome at 1280px (content centred, readable).
- [ ] No horizontal scrolling on any page.
- [ ] 200% text size still usable.

**Accessibility:** run through section 18.

---

## 25. Build plan, phase by phase

### Phase 1: the core (first demo to a real class)

- [ ] **1.1** Upload `tools/classhub-master-template.xlsx` to Google Drive, save it as a Google Sheet, share as "Anyone with the link: Viewer", and run `tools/sheet-tester.html` until every tab is OK. Put the sheet id in `src/config/hubs.ts` (`demo` hub).
- [x] **1.2** Project setup: Vite + TypeScript + Tailwind, `package.json`, `tsconfig.json`, `vite.config.ts`, deploy workflow.
- [x] **1.3** `src/styles/main.css`: `@theme` tokens + shared component classes (from the mockups).
- [x] **1.4** `src/types/`: hub and sheet types.
- [x] **1.5** `src/config/hubs.ts` (demo hub) and `src/config/labels.ts` (both modes).
- [x] **1.6** `src/lib/`: `csv.ts`, `sheets.ts`, `clean.ts` (all tabs), `cache.ts`, `data.ts`, `dates.ts`, `links.ts`, `dom.ts`. Tested with tricky CSV, offline and broken tabs.
- [x] **1.7** `src/components/`: icons, top bar, bottom menu, skeleton, banners, messages, branding.
- [x] **1.8** `src/app.ts`: `mountPage()` with hub check, 404/paused redirects, last-hub memory, offline handling.
- [x] **1.9** Page shells for every page (each shows "Not built yet" until done), 404 and Paused pages.
- [x] **1.10** Build pages: Home, Announcements, Announcement, Timetable, Deadlines (+ built-in demo data: `sheetId: "demo"` in `hubs.ts` uses `src/lib/demo.ts`, dates always relative to today).
- [ ] **1.11** Push to GitHub, turn on Pages (Settings › Pages › Source: GitHub Actions), test on your phone.

### Phase 2: study materials

- [x] **2.1** Cleaning rules for `courses`, `handouts`, `past_questions`, `leaders`, `places` (done in `src/lib/clean.ts`).
- [x] **2.2** Pages: Courses, Course, Handouts (with search + course filter), Past questions (with "test coming up" hint), Class info, More.
- [x] **2.3** Sheet health note on More ("Updated ... · All good" / rows skipped / tabs not found).
- [x] **2.4** Red dot on News (newest announcement vs this phone's last visit to News).
- [ ] **2.5** First real class onboarded using section 21.

### Phase 3: schools

- [x] **3.1** Secondary mode in `src/config/labels.ts` (already has both modes); mode-aware deadline types and nav.
- [x] **3.2** `parents` tab cleaning + Parents' corner page.
- [x] **3.3** `SCHOOLS` register + School directory page with search and "remember my class".
- [ ] **3.4** Client branding: colour override with contrast check, logos.
- [ ] **3.5** Paused page + `active` switch.

### Phase 4: polish and launch

- [ ] **4.1** `manifest.json`, icons, Help page, install card.
- [ ] **4.2** `sw.js` offline app shell with versioning.
- [ ] **4.3** Landing page with FAQ and demo hub.
- [ ] **4.4** Delegate guide (`docs/delegate-guide.md` + shareable image).
- [ ] **4.5** Full testing checklist (section 24) on two real phones.

---

## 26. Future upgrades (need a back end)

Not possible with Google Sheets alone. Plan them for later, once ClassHub has paying clients:

- **Logins** (student accounts, private hubs)
- **Results and report cards** (needs strong privacy)
- **Push notifications** when a new urgent announcement is posted
- **Polls and votes** inside the hub (could connect to the VoteCam idea)
- **Student uploads** (past questions sent directly, reviewed by the delegate)
- **Payments** (class contributions via MoMo / Orange Money)
- **Admin dashboard** instead of Google Sheets

Possible tools then: Firebase or Supabase (hosted databases with logins), so you still don't run your own server.

---

## 27. Glossary

| Word | Meaning |
|---|---|
| **Hub** | One class's (or school's) space inside ClassHub, with its own link and sheet |
| **Client** | Whoever pays for a hub: a class, a school, an institute |
| **Mode** | `university` or `secondary`, changes words and sections |
| **Tab** | A sheet inside the Google Sheet (announcements, timetable...) |
| **CSV** | "Comma-separated values": a table as plain text, which the site downloads |
| **Fetch** | JavaScript's way of downloading something from the internet |
| **Cache** | A saved copy on the phone, used when there's no data |
| **`localStorage`** | The phone browser's small notebook where we save the cache |
| **Route / param** | The `?hub=...&id=...` part of a link that tells the page what to show |
| **PWA** | Progressive Web App: a website that can be installed like an app |
| **Service worker** | A small script that lets pages load offline |
| **Skeleton** | Grey placeholder shapes shown while content loads |
| **Empty state** | The friendly message shown when a list has nothing in it |

---

*ClassHub by [YOUR NAME] · Douala*
