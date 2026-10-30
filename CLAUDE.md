# Dhairya Dhaka — PM portfolio (dhairyadhaka.in)

Static website served by GitHub Pages from the `main` branch of this repo. There is no build step: every file is served as-is.

## Who I am / how to work with me
- I'm a Product Manager with no coding background. Explain changes in plain English first, keep steps small, and tell me what to check after each change.
- Ask before deleting or renaming pages.
- Commit with a short, clear message after each change, then push to `main`. The site updates 1–2 minutes after a push.

## File map
| File | What it is |
|---|---|
| `index.html` | Homepage, light theme |
| `dark.html` | Homepage, dark theme |
| `<case-study>.html` / `<case-study>-dark.html` | One page per project, light and dark: `claim-status-agent`, `insurance-discovery-agent`, `voice-ai-agent`, `agent-simulation-lab`, `project-desk`, `foodlit` |
| `assets/` | Photo, screenshots, and the React library files used by the homepage |
| `assets/tools/` | Brand-colour tool logos for the homepage "Toolkit" section (Devicon, Simple Icons, AWS's official icon pack for Amazon Quick Suite, and the makers' own files for Lovable and Copilot; Miro's tile rebuilt from its brand colours). GitHub, Cursor and ChatGPT are black-and-white brands, so they follow the theme's ink colour. The tile list lives in `TEMPLATE` in both homepages, `id="tools"`. |
| `assets/ui.css`, `assets/ui.js` | Shared interactions used by every page (each page sets its colour tokens, `--ui-*`, in its `<style>`) — see "Interactions" below. Pages load them as `ui.css?v=N` / `ui.js?v=N`: **after changing either file, bump N on all 14 pages** so visitors don't get a stale cached copy. |
| `intro/` | Homepage intro animation: `intro.js` (player), `build.js` (the "Discover, Build, Ship" film and its music score), `sound.js` (music synth) |
| `CNAME` | Custom domain (`dhairyadhaka.in`). Never delete it. |
| `DhairyaDhaka1_Resume.pdf` | Resume linked from the site |

## How the pages work
- **Case-study pages** are plain HTML with inline styles. Edit the text directly.
- **Homepage (`index.html`, `dark.html`)** is rendered by a small script at the bottom of the file:
  - `function TEMPLATE(S)` holds the page layout as `h('tag', {props}, children)` calls. Edit text there.
  - `class Component extends DCLogic` holds the data and behaviour:
    - the project list (`const data = [...]`, with fields `num`, `title`, `role`, `status`, `problem`, `bet`, `outcome`, `href`)
    - the note form
    - the auto theme
- **Auto theme:** the homepage switches to `dark.html` between 7 pm and 7 am on the visitor's clock. A manual choice made with the sun/moon button is remembered for the visit (sessionStorage key `dd-theme-choice`).
- **Intro:** both homepages load `intro/intro.js` in the `<head>` (`data-design="build"`). The ~11 s "Discover, Build, Ship" film plays over the homepage, then the letters of the name become windows onto the site and zoom in until the site fills the screen.
  - Plays automatically once per visit (sessionStorage key `dd-intro-seen`); skipped for visitors who prefer reduced motion. "Skip intro" or Esc jumps to the zoom.
  - Browsers block sound until a click, so most visitors see it silently with a "Sound on" button; music plays straight away only where the browser allows it.
  - To replay it while previewing, open `index.html?intro`.
- **Interactions** (`assets/ui.css` + `assets/ui.js`):
  - *Rolling numbers:* numbers count up digit by digit when they scroll into view. Homepage project outcomes roll automatically. In case studies, add `data-ui-roll` to an element to roll its big numbers (₹, M/K, commas or 10+; years stay still), or `data-ui-roll="all"` to roll every number (used on the big stat rows).
  - *Screenshot accordion:* add `data-ui-gal` to a group of `<figure>`s; on wide screens the hovered or tapped one opens. Tune with `--gal-h` (height), `--gal-open` (how wide the open one is), `--gal-cap` (caption height), `--gal-fit: contain` (show the whole open screenshot). Phones keep the normal stacked layout. Used on FoodLit (3 groups) and Project Desk.
  - *Bar chart:* FoodLit's meals-per-week chart is live HTML (`.ui-chart`), built from the same numbers as `assets/fl-10.png` (4, 5, 5, 6, 9, 8, 7, 11, 6).
  - *Toolkit magnify:* logos near the mouse grow, like a dock (mouse only, not touch).
  - *Dot portrait:* the hero photo is redrawn as cream dots on a `<canvas class="m-dots">` laid over `assets/dhairya.jpg` (bigger dots = brighter areas). Dots scatter from the pointer and spring back; a press sends a shockwave. The real photo stays underneath, so it shows if the script doesn't run; reduced-motion visitors get still dots. Dot spacing, size and colour are at the top of `dotPortrait()` in `ui.js`.
  - *Approach player* (homepage, in `Component`): "Play the loop" walks through the four steps; clicking a step highlights just that one.
- **Note form:** posts to Formspree (`https://formspree.io/f/xppqdjok`). It asks for a note and a LinkedIn profile link.

## Rules (important)
1. **Every change goes to both versions:** light and dark homepage, and both versions of a case study.
2. **Do not mention "Agent Platform" anywhere.** It was removed on purpose.
3. **No confidential employer details:**
   - no client names, internal system names or exact internal numbers
   - no vendor names on the homepage
   - keep numbers rounded, e.g. "2.1M+", "~140,000 hours"
4. **Never invent results.** Missing numbers stay as visible placeholders like `[X]` until I give real ones.
5. **Keep the look:** minimal; white/grey/black plus one soft yellow highlight (`#FFF1B8` light, `rgba(255,214,90,0.22)` dark); Geist font; subtle motion only. "Read the full case study" links stay highlighted yellow.
6. **Check phone width** (about 390px) still works after layout changes.

## Preview locally
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Open to-dos
- Fill the `[X]` placeholders on the Insurance Discovery Agent page.
- Give the Notes Agent its own case study once it has results.
