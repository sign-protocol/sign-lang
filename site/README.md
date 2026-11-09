# SIGN website

The source for https://sign-protocol.github.io/sign-lang/, the onboarding site for SIGN.

Merging a change under `site/` to `main` publishes it through `.github/workflows/pages.yml` in about a minute.
Nothing outside this folder is published, and the workflow does not touch the spec, examples or validator.

## Pages

| Path | Page |
|---|---|
| `index.html` | Home: what SIGN is, and the two paths in |
| `engineers/` | Six-step guide from first file to an agent that uses SIGN |
| `teams/` | What SIGN changes, an adoption plan, a note for security teams, and common questions |
| `assets/css/five-deep.css` | Five Deep design tokens, copied unchanged from the Five Deep brand kit |
| `assets/css/site.css` | Site styles, built only from those tokens |

Plain HTML and CSS, with a small script for the menu, copy buttons and step checkboxes. No build step.

## Design rules

The site follows the Five Deep marketing design canon and voice. In short:

- Use token variables only. Do not add colors, sizes or spacing that are not in `five-deep.css`.
- Buttons are midnight or white. The blue accent button appears once per page at most. Green is never a button.
- Links in text are always underlined.
- One path gradient per screen, never behind text.
- To update tokens, copy the new `five-deep.css` from the brand kit. Do not edit it here.

## Changing the site

1. Branch from `main` and edit files under `site/`.
2. Preview locally from this folder: `python -m http.server 8080`, then open http://localhost:8080.
3. Open a pull request.

Every command shown on the engineer page should be rerun against the current spec and validator when either changes.

## Licenses

Site content: Apache 2.0, like the rest of this repository. Fonts: SIL Open Font License, see `assets/fonts/`.
