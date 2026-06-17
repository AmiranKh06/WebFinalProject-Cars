# 🚗 CarDealer

A multi-page car discovery and garage management web app built with vanilla HTML, CSS, and JavaScript (ES modules). No frameworks, no build step — just open `index.html` and go.

---

## Pages

| Page | File | Purpose |
|---|---|---|
| Discover | `index.html` | Search cars by make, model, and year |
| My Garage | `garage.html` | View and manage saved cars |
| Profile | `profile.html` | Create a driver profile to unlock the app |
| Detail | `Detail.html` | Full details + Wikipedia summary for a selected car |

---

## Features

- **Live car search** — type a make and results appear automatically (debounced, 600 ms). Powered by the free [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/).
- **Model filter** — client-side filtering by model name on top of API results.
- **Car detail page** — pulls a Wikipedia summary, thumbnail image, and links to pricing search for any car.
- **My Garage** — save cars with a status (Wishlist / Owned / Test Driven), filter by status, and see live stats.
- **Driver Profile** — form-gated onboarding with display name, email, birth year, car type preference, favourite brands (tag picker), driving style (radio group), and a bio. Unlocks the rest of the app on save.
- **Dark / Light theme toggle** — persisted across pages via `localStorage`.
- **Offline detection** — shows a friendly error if the network is unavailable.
- **Request timeout** — API calls abort after 8 seconds with a clear message.

---

## Project Structure

```
/
├── index.html          # Discover page
├── garage.html         # My Garage page
├── profile.html        # Driver Profile page
├── Detail.html         # Car Detail page
├── css/
│   └── style.css       # All styles (tokens, layout, components, responsive)
├── js/
│   ├── main.js         # Page router + all page logic
│   ├── api.js          # NHTSA fetch wrapper
│   ├── storage.js      # localStorage helpers (garage + profile + auth)
│   └── ui.js           # DOM builders (car cards, garage cards, profile preview)
└── assets/
    └── car-image.png   # Hero illustration
```

---

## Running Locally

No server required. Just open `index.html` in your browser:

```
# Option A — double-click index.html in your file manager

# Option B — VS Code Live Server extension (recommended for module support)
Right-click index.html → "Open with Live Server"

# Option C — Python one-liner
python -m http.server 8080
# then visit http://localhost:8080
```

> **Note:** Because the JS uses ES modules (`type="module"`), browsers block direct `file://` loading in some cases. Use Live Server or the Python server if you see module import errors.

---

## Tech Stack

- **HTML5** — semantic elements, `novalidate` forms, `data-page` routing attribute
- **CSS3** — custom properties (design tokens), Flexbox, CSS Grid, `@media` breakpoints at 600 px and 900 px
- **JavaScript (ES2020)** — ES modules, `async/await`, `fetch`, `URLSearchParams`, `AbortController`, `localStorage`
- **NHTSA vPIC API** — free, no API key required
- **Wikipedia REST API** — car summaries and thumbnail images

---

## Data & Privacy

All data (garage, profile, theme preference) is stored exclusively in your browser's `localStorage`. Nothing is sent to any server.

---

## AIs Used

- **Claude** — Coding assistant
- **Gemini** — Ideas helper