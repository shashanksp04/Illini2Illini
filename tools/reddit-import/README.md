# Reddit listing import (daily JSON)

Imports an array of Reddit-derived listing objects into Postgres (`reddit_listings`). **Only new `external_id` values are inserted** (Reddit submission id). If an id **already exists** in the database, that row is **left unchanged**—there is no update, so later JSON exports will not refresh title, images, or `exclude` for existing rows.

Duplicate `external_id` values **within the same JSON file** are ignored after the **first** occurrence.

## Prerequisites

- **Node.js 24.x** (see repo `package.json` engines)
- Dependencies installed: `npm install`
- **`DATABASE_URL`** set (e.g. `.env` / `.env.local`)
- Prisma client generated: `npx prisma generate` (runs on `npm install` via `postinstall`)

## JSON format

Same shape as [`docs/reddit-related/reddit_listings.json`](../../docs/reddit-related/reddit_listings.json): an **array** of objects with at least `external_id`, `source`, `title`, `description`, `external_url`, `created_at`, `exclude`, and optional `images`, etc.

For **newly inserted** rows, **`exclude: true`** is stored as on any other field; the app hides excluded listings from the Community tab. Existing rows are not updated, so changing `exclude` in JSON for an id already in the DB will **not** apply until you remove that row manually or use a different workflow.

## Run (recommended)

From the **repository root**:

```bash
npm run reddit-import -- --file path/to/your-export.json
```

Default input if you omit `--file`:

- `tools/reddit-import/json/latest.json`

Copy your daily export to that path, or pass an absolute path:

```bash
npm run reddit-import -- --file "C:\data\reddit-export.json"
```

### Log file

By default, the script mirrors output to:

- `tools/reddit-import/logs/import-<ISO-timestamp>.log`

To disable file logging:

```bash
npm run reddit-import -- --file ./export.json --no-log-file
```

Custom log directory:

```bash
npm run reddit-import -- --file ./export.json --log-dir "C:\logs\reddit-import"
```

### Output

For each row you get a line such as:

- `inserted external_id=abc123`
- `inserted external_id=def456 exclude=true`
- `skipped_already_in_database external_id=xyz already in database (not updated)`
- `skipped_duplicate_in_file external_id=abc123 later duplicate in same file (first occurrence kept)`
- `error external_id=...` with message

A final summary includes counts and duration.

## Legacy script

`npm run import-reddit-listings` still works; it defaults to `docs/reddit-related/reddit_listings.json` and uses the same import logic.

## Scheduling (Windows Task Scheduler)

1. Action: Start a program  
2. Program: `cmd.exe`  
3. Arguments (example):

   ```text
   /c cd /d C:\path\to\Illini2Illini && npm run reddit-import -- --file tools\reddit-import\json\latest.json
   ```

4. Start in: `C:\path\to\Illini2Illini`

Ensure the JSON file exists before the task runs (e.g. copy step in a batch file before `npm run`).

## Logs maintenance

Delete old files under `tools/reddit-import/logs/` whenever you like; they are gitignored.
