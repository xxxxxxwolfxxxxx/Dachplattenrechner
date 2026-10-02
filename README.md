# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Ratgeber-Wiki

Anleitungen liegen als Markdown unter `src/content/ratgeber/<gewerk>/<schritt>.md` und werden unter `/ratgeber/<gewerk>/<schritt>/` ausgeliefert (inkl. Suche, abhakbarer Material-Liste und Strukturdaten `HowTo` und `BreadcrumbList`).

### Neuen Schritt anlegen

1. Datei `src/content/ratgeber/<gewerk>/<schritt>.md` mit dem Frontmatter aus `src/utils/ratgeber-schema.ts` erstellen.
2. Bilder als SVG nach `public/ratgeber/svg/` legen und im Schritt über `bild` einbinden.
3. `npx vitest run` ausführen. Die Tests prüfen Schema, Bilder und Links.

### Inhaltsregeln

- Quellen: Zahlen und Maße nur mit Quelle oder Herstellerhinweis, keine erfundenen Werte. Wo Herstellerangaben gelten, steht das im Text.
- Humor: sparsam, nie bei Sicherheitshinweisen, und nie auf Kosten der Genauigkeit.
- SVG-Pflicht: Jeder Schritt mit räumlichem Inhalt bekommt eine eigene SVG-Zeichnung mit aussagekräftigem `alt`-Text.
- Linkregeln: Interne Links immer mit abschließendem Slash (`/ratgeber/blechdach/first/`). Statische Seiten aus `public/` verlinkt man mit `.html` (z. B. `/tools/anrissplan.html`), ohne Slash.
- `beschreibung` im Frontmatter: 120 bis 160 Zeichen (Meta-Description).
- Sicherheitshinweis (`sicherheit`) ist Pflicht und steht vor den Schritten.

### Neues Gewerk anlegen

1. Gewerk in `GEWERKE` in `src/utils/ratgeber-schema.ts` ergänzen.
2. Anzeigetitel in `GEWERK_TITEL` in `src/utils/ratgeber.ts` eintragen.
3. Ordner `src/content/ratgeber/<gewerk>/` mit den Schritt-Dateien anlegen.
