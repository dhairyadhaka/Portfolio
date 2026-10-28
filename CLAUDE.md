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
- Add my real LinkedIn URL. The contact "LinkedIn" link is currently `href="#"`.
- Fill the `[X]` placeholders on the Insurance Discovery Agent page.
- Give the Notes Agent its own case study once it has results.
