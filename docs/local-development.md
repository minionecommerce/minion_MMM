# Running the project on your own computer

Look at a change locally in seconds, before it goes to GitHub and Vercel.

## One-time setup
1. Install **Node.js 22** (https://nodejs.org).
2. Open the project folder in VS Code → Terminal → run `npm install`.
   (This also prepares the database client.)
3. Copy `.env.example` to `.env` and fill it in. `.env` stays on your computer and is
   ignored by git. Use the same values as Vercel → Settings → Environment Variables.

## Every time you want to look at a change
```
git fetch
git switch <branch-name>     # the branch of the pull request you want to look at
npm install                  # only needed if package.json changed
npm run dev
```
Open **http://localhost:3000** and log in. Edits show up immediately; no build.
Stop it with `Ctrl + C`.

## Before you merge
1. Look at it locally (above).
2. Merge the pull request on GitHub. Vercel deploys from the merge.
3. If the change came with a database migration, it must be applied to the live database
   **before** you merge (Claude tells you when this is the case).

## Careful
- With your normal `.env` the app talks to the **live database**. A lead you add while
  testing is a real lead. Use a separate test database for anything that changes data.
- If the page shows "This page couldn't load" locally, the cause is usually a missing or wrong
  value in `.env`, or a database change that has not been applied yet. The first red lines in
  the terminal say which.

## Handy commands
| Command | What it does |
| --- | --- |
| `npm run dev` | Run the project locally with live reload |
| `npm run build` then `npm run start` | Test the real production build, the same kind Vercel makes |
| `npx tsc --noEmit` | Check for type errors |
| `npm run lint` | Check code style |
