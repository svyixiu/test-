# The Executor Environment

A reference and teaching site for the Luau executor environment as defined by
**sUNC** (senS' Unified Naming Convention) and implemented by **Potassium**.

202 functions across 24 libraries. Every entry says what the function does, why
it exists, how to use it, what breaks it, and whether it works in both
standards or only one.

## Running it

Open `index.html`. That is the whole process — no server, no build step, no
network access required. Everything is vanilla HTML, CSS and JavaScript.

If you host it (GitHub Pages, Netlify, anything static), upload the folder as
it is.

## Structure

```
index.html         markup and layout
css/main.css       all styling
js/highlight.js    Luau syntax highlighter (knows executor globals)
js/search.js       fuzzy search scoring
js/app.js          routing, rendering, filters
data/api.json      the dataset — edit this
data/api.js        the same data as a plain script, which is what the page loads
```

### Why there are two data files

`fetch()` is blocked on `file://` URLs, so a site that loads `api.json` will
not work when you double-click `index.html`. `api.js` is the same data wrapped
in a `window.API_DATA =` assignment, which loads fine as a plain script.

`api.json` is the editable source of truth. After changing it, regenerate
`api.js`:

```bash
node -e "const d=require('./data/api.json');require('fs').writeFileSync('data/api.js','window.API_DATA='+JSON.stringify(d)+';\n')"
```

## Editing content

All content lives in `data/api.json`. Nothing is hardcoded in the markup, so
adding a function or fixing an explanation never means touching HTML.

Each function entry:

| field | meaning |
| --- | --- |
| `name`, `library` | identity and grouping |
| `availability` | `both`, `sunc-only` or `potassium-only` |
| `signature` | typed signature, or `null` if none is published |
| `summary` | one line, from the official docs |
| `purpose` | why the function exists — written for this site |
| `example` | runnable, commented Luau |
| `gotchas` | array of things that silently break |
| `related`, `concepts` | cross-links |
| `sources` | which documentation the entry was verified against |

The renderer tolerates missing fields: an entry with only a name and a summary
still displays correctly.

## Where the data came from

- **Signatures and summaries for the 82 sUNC functions**: the
  [sUNC metadata API](https://docs.sunc.su/api/), which is generated from the
  documentation itself.
- **Function list, grouping and summaries for Potassium**: the
  [Potassium API reference](https://docs.potassium.pro/api-reference/introduction)
  index.
- **Availability tags**: computed by cross-referencing those two lists, not
  assigned by hand. `crypt.base64encode` and `base64encode` are recognised as
  the same function under two names.
- **Purposes, examples, gotchas and the ten concept pages**: written for this
  site, drawing on the documentation and on how these functions are used in
  practice.

The split as computed: **82** functions in both, **2** sUNC only
(`checkcaller`, `clonefunction`), **118** Potassium only.

Where Potassium documents a function only in prose, the entry shows a note
rather than a fabricated signature.

## Keyboard

| key | action |
| --- | --- |
| `/` | focus search |
| `↑` `↓` | move through results |
| `Enter` | open the highlighted result |
| `Esc` | dismiss search |

## Scope

This documents what the environment exposes and why it exists. It is not a
script repository and does not walk through defeating any particular
anti-cheat.
