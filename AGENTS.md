# Agent Instructions

## Language
- The user is Italian. **Always respond in Italian.**

## Workflow
- After every user message, **before writing any code**, verify that you have understood the user's intent.
- If everything is clear, proceed directly to writing the code.
- If you have any doubts, **ask the user questions** before proceeding.

## Decision Making
- The user is **not a programmer**.
- You should take **technical decisions** (architecture, libraries, implementation details, etc.).
- Leave **product and behavior decisions** to the user.

---

## Project Overview

This is a **static frontend website** project containing two distinct single-page sites:

1. **Vinilkraft Records** (`index.html`) — A retro-styled online vinyl record store.
2. **Vision Fest** (`festival-visione.html`) — A dark, immersive electronic music festival landing page with interactive visual installations.

There is **no build system**, **no backend**, and **no JavaScript framework** (React/Vue/Angular). Everything is vanilla HTML, CSS, and JavaScript.

---

## File Structure

```
├── index.html              # Vinilkraft Records (vinyl shop)
├── festival-visione.html   # Vision Fest 2026 (festival page)
├── styles.css              # Stylesheet for index.html only
├── script.js               # Cart, search, notifications for index.html
├── title.js                # anime.js scrambleText animation for the logo
├── layout.js               # anime.js grid layout animation for the nav
└── AGENTS.md               # This file
```

> **Note:** `festival-visione.html` contains all its CSS and JavaScript inline (monolithic file).

---

## Technology Stack

| Technology | Source | Used In |
|------------|--------|---------|
| Vanilla HTML5 | Native | Both pages |
| Vanilla CSS3 | Native | Both pages |
| Vanilla JavaScript (ES6+) | Native | Both pages |
| Google Fonts | CDN (`fonts.googleapis.com`) | Both pages |
| anime.js | ESM CDN (`https://esm.sh/animejs`) | `title.js`, `layout.js` |
| Three.js | CDN (`cdnjs.cloudflare.com`) | `festival-visione.html` (3D flower) |
| ml5.js | CDN (`unpkg.com`) | `festival-visione.html` (PoseNet + Handpose) |

---

## Site 1: Vinilkraft Records (`index.html`)

### Purpose
A vintage/retro-themed vinyl record e-commerce storefront. It displays products in categorized shelves, has a shopping cart, a search bar, and a concert tickets section.

### Key Features
- **Product Shelves:** Products are hardcoded in HTML inside sections (`#rock`, `#jazz`, `#pop`, `#classica`, `#collezionismo`, `#offerte`). Each product is a `.shelf-item` with an image, title, artist, price, and year.
- **Shopping Cart:** Global `cart` array in `script.js`. Items can be added, removed, and checked out. Cart is a sidebar (`#cartSidebar`) toggled via `toggleCart()`.
- **Search:** `searchProducts()` filters `.shelf-item` visibility by product name and auto-scrolls to the first matching section.
- **Notifications:** `showNotification()` creates a temporary toast at the bottom-right.
- **Animations:**
  - `title.js`: Uses `animejs` `scrambleText` effect on `.retro-title` in a loop.
  - `layout.js`: Uses `animejs` `createLayout` to cycle the nav grid between 1–4 columns infinitely.

### Scripts Loading Order in `index.html`
```html
<script src="script.js"></script>           <!-- Must be first: defines global cart functions -->
<script type="module" src="title.js"></script>   <!-- ESM module: animejs scrambleText -->
<script type="module" src="layout.js"></script>  <!-- ESM module: animejs grid layout -->
```

### Important Global Functions in `script.js`
- `addToCart(name, price)` — Adds item or increments quantity.
- `removeFromCart(name)` — Removes item completely.
- `buyTicket(eventName, price)` — Wraps `addToCart` for tickets.
- `updateCartDisplay()` — Renders cart count, items list, and total price.
- `toggleCart()` — Toggles sidebar visibility.
- `checkout()` — Empties cart with a thank-you alert.
- `searchProducts()` — Filters shelves by search input.
- `scrollToSection(sectionId)` — Smooth-scrolls to a section.
- `showNotification(message)` — Shows a temporary toast notification.

### Design System (Retro/Vintage)
- **Color Palette:**
  - Primary dark brown: `#2f2213`
  - Primary orange/amber: `#ff8a3d`, `#ff6f2c`, `#ffcf4d`
  - Background cream: `#fcf9f1`
  - Accent red: `#ff5252`
  - Price/buy color: `#b33a00`
- **Fonts:** `Inter` (body), `Righteous` (headings), `Monoton` (subtitle), `Arial` (logo scramble).
- **Aesthetic:** Grid background pattern, heavy borders, retro shadows (`box-shadow: 8px 8px 0`), dashed borders on tickets.

---

## Site 2: Vision Fest (`festival-visione.html`)

### Purpose
A dark, futuristic single-page site for an electronic music festival. Features interactive generative art, user authentication, ticket purchasing, and real-time body/hand tracking via webcam.

### Key Features
- **Hero Section:** Large gradient text with CSS animations.
- **Lineup:** Artist list grouped by day with hover effects.
- **Interactive Visual Installations:**
  - **Reactive Walls:** Static gradient cards.
  - **Generative Dreams (3D Flower):** Three.js scene with a generative flower made of spheres that reacts to audio frequencies (bass/mid). Users can upload an audio file.
  - **Neural Frequencies:** Uses webcam + ml5.js (PoseNet + Handpose) to draw a real-time skeletal and hand tracking visualization overlaid on an inverted video feed. Also reacts to audio.
- **Authentication:** LocalStorage-based login/register system (`doLogin`, `doRegister`, `doLogout`). No backend.
- **Dashboard:** `#dashboard` section shows user avatar (initial), name, email, and purchased tickets.
- **Ticket Purchasing:** `buyTicket(type, price)` generates a ticket code (`VF-XXXXXX`) and stores it in `localStorage`.

### LocalStorage Keys Used
- `visionfest_user` — Current logged-in user object `{ name, email }`.
- `visionfest_users` — Array of all registered users `{ name, email, pass }`.
- `visionfest_tickets` — Array of purchased tickets `{ type, price, code, date, status }`.

### External Dependencies (CDN)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://unpkg.com/ml5@0.12.2/dist/ml5.min.js"></script>
```

### Important Global Variables & Functions
- `currentUser`, `userTickets` — Auth state.
- `openModal(type)`, `closeModal()`, `switchModal(type)` — Login/register modal.
- `doRegister()`, `doLogin()`, `doLogout()` — Auth actions.
- `showDashboard()` — Renders user header and triggers `renderTickets()`.
- `buyTicket(type, price)` — Creates and stores a ticket, shows toast.
- `renderTickets()` — Renders ticket list in dashboard.
- `showToast(msg)` — Bottom-right toast notification.
- `initFlower()`, `animateFlower()` — Three.js 3D flower lifecycle.
- `startNeural()`, `loadPoseModels()`, `startHandPose()` — Webcam + ml5 initialization.
- `drawPose(results)`, `drawHands(results)`, `drawNeuralBase()` — Canvas drawing for neural effect.
- `initAudio()`, `loadAudioFile3D()`, `toggleAudio3D()` — Web Audio API for the flower.
- `initNeuralAudio()`, `loadNeuralAudio()`, `toggleNeuralAudio()` — Web Audio API for the neural section.

---

## Coding Conventions & Rules

### General
- **Language:** All code comments, user-facing text, and agent responses must be in **Italian**.
- **No build step:** Do not introduce npm, webpack, vite, or similar unless explicitly requested. The user does not run build commands.
- **No backend:** Do not add Node.js/Express, Python, or database code. Data persists only via `localStorage` where already used.
- **ESM modules:** `title.js` and `layout.js` use `type="module"`. Keep imports from `https://esm.sh/animejs` exactly as they are.
- **Global functions:** Many core functions in `script.js` and inline in `festival-visione.html` are global (`window.*`) because they are called via `onclick` attributes. Preserve this pattern or refactor carefully.
- **Images:** Product images are hotlinked from `is1-ssl.mzstatic.com` (iTunes/Apple Music artwork). These are external URLs.

### HTML
- Both pages use `<html lang="it">`.
- Product cards use `onclick="addToCart('Name', price)"`.
- Festival page uses inline `style` tag for all CSS (~900 lines).

### CSS
- `index.html` uses `styles.css` exclusively.
- Color tokens are hardcoded; there is no CSS preprocessor or variables file. Follow the existing hex codes exactly when modifying.
- The retro aesthetic relies heavily on solid borders, `box-shadow` offsets, and warm earth tones.

### JavaScript
- `script.js` relies on a global `cart = []` array. Keep this global.
- Festival page uses inline `<script>` tags at the bottom of the body. Maintain this placement to ensure DOM is ready.
- When adding new products, replicate the exact `.shelf-item` structure including the `onclick`.
- `festival-visione.html` uses `localStorage` for all data. Do not introduce `fetch` calls to APIs unless the user explicitly asks.

---

## Common Tasks & How to Approach Them

### Adding a New Product to Vinilkraft
1. Open `index.html`.
2. Find the correct `<section id="genre">`.
3. Copy an existing `.shelf-item` block.
4. Update the `onclick` call, image `src`, `alt`, title, artist, price, and year.
5. Ensure the price in `onclick` matches the displayed price.

### Modifying the Cart Behavior
- Logic lives in `script.js`. The `cart` array is the single source of truth.
- DOM elements for the cart are in `index.html` (sidebar + overlay).
- Styles for the cart are in `styles.css`.

### Changing the Festival Line-up
- Open `festival-visione.html`.
- Find the `#lineup` section.
- Add/remove `.artist` blocks. Keep the structure: `.artist-name`, `.artist-genre`, `.artist-time`.

### Updating Festival Ticket Prices
- Prices are hardcoded in the HTML (`#biglietti` section) and in the `onclick="buyTicket('...', price)"` calls.
- Ensure the price value passed to `buyTicket()` matches the displayed price.

---

## Known Limitations & Warnings

- **No Persistent Backend:** Cart contents on Vinilkraft are lost on page refresh (unless you implement `localStorage` for it — currently not implemented).
- **CORS / External Images:** Product images are loaded from Apple’s CDN. If links break, covers will show as broken images.
- **Webcam Permissions:** The Neural Frequencies feature in the festival page requires user permission for webcam access. It will fail gracefully with a status message if denied.
- **ml5.js / Three.js CDN Dependency:** If those CDNs are unreachable, the interactive installations will not load.
- **Mobile Navigation:** The festival page hides the nav `ul` on small screens (`display: none` below 768px) but does not provide a hamburger menu.
- **Password Storage:** The festival page stores plaintext passwords in `localStorage`. This is **not secure** and should not be used for real users. It is acceptable only as a frontend demo.

---

## Environment
- **Platform:** Static files served from the local filesystem or any static web server.
- **Browser Compatibility:** Modern browsers (Chrome, Firefox, Edge, Safari). Web Audio API, WebGL (Three.js), and webcam APIs are required for the festival page features.
- **No server required:** You can open `index.html` directly in a browser, though some browsers may block webcam/ESM CDN imports when using `file://` protocol. A simple local server (e.g., VS Code Live Server) is recommended for full functionality.

