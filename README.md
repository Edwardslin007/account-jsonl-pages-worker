# Account JSONL Viewer

This project contains:

- `index.html`: static GitHub Pages frontend.
- `worker/src/index.js`: Cloudflare Worker proxy for mailbox code requests.

Do not commit real account JSONL files, passwords, access tokens, refresh tokens, or mailbox API keys.

## Local Worker

```powershell
npm install
npm run worker:dev
```

## Deploy Worker

```powershell
npm run worker:deploy
```

## GitHub Pages

Publish the repository from the `main` branch root.
