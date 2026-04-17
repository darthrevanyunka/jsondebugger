# JSON Debugger

JSON Debugger is a local-first tool to inspect JSON and quickly filter arrays using JavaScript expressions (for example `item.reason !== 0`).

## Run locally for development

```bash
npm install
npm run dev
```

## Build a private static version

This project can be shipped as a static bundle that runs fully in the browser.

```bash
npm install
npm run build
```

That command creates `dist/json-debugger-static.zip`.

## GitHub Pages (project site)

This repo includes a small static site under `docs/` that explains how to use the tool and links to the live app:

- **Live app:** [https://jsondebugger.vercel.app/](https://jsondebugger.vercel.app/)

To publish on GitHub:

1. Push the `docs/` folder to your default branch.
2. In the repository **Settings → Pages**, set **Source** to **Deploy from a branch**, choose that branch, and set the folder to **`/docs`**.
3. After the workflow runs, the site is available at `https://<user>.github.io/<repo>/` (or your configured custom domain).

The Vite app still uses the root `index.html` for `npm run dev` and `npm run build`; the GitHub Pages landing page is only `docs/index.html`.

## Share and use privately

1. Send `json-debugger-static.zip` to the user (email, file share, USB, etc).
2. The user unzips it locally.
3. They open `index.html` in a browser.

No backend or internet connection is required for usage.
