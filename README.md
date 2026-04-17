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

That command creates `dist/json-debugger-static.zip` and adds a download button in the app pointing to it.
That command creates `dist/json-debugger-static.zip`.

## Share and use privately

1. Send `json-debugger-static.zip` to the user (email, file share, USB, etc).
2. The user unzips it locally.
3. They open `index.html` in a browser.

No backend or internet connection is required for usage.
