# PC Turf Board

Next.js job board for the Port Carling Golf and Country Club turf department.

## Routes

- `/` - Protected redirect to the presentation slideshow.
- `/admin/login` - Superintendent login.
- `/admin` - Protected dashboard for managing employees, notes, and daily assignments.
- `/admin/present` - Protected fullscreen slideshow with weather, time, and the assignment reveal control.
- `/admin/present?view=jobs` - Protected fullscreen job assignments for the selected day.

All presentation and management views require an administrator login. The assignment board shows live Port Carling weather, the admin's course/weather note, and any boss notes for the selected date. Assignments are employee-first so staff can scan for their name and job quickly.

## Local Setup

Create `.env` from `.env.example` and set pooled `DATABASE_URL` and direct `DIRECT_URL` PostgreSQL connections, a random `AUTH_SECRET`, and the initial administrator credentials. Then run:

```powershell
npm install
npm run db:setup
npm run dev
```

Open `http://127.0.0.1:3000`.

Generate a suitable authentication secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

The administrator password must be at least 12 characters and contain uppercase, lowercase, and numeric characters.

## Database

The deployed app uses PostgreSQL through Prisma. Daily plans are keyed by `YYYY-MM-DD`, so bosses can schedule future work and review past days without manually creating new day records.

Each employee has one free-text assignment per day. Focusing an assignment field shows that employee's most common jobs, while typing searches previous jobs across the whole crew. `Absent` is available in the same autocomplete list and can be extended with a reason when needed.

## Vercel Deployment

1. In the `pc-turf` Vercel project, open **Storage**, create a Neon Postgres database, and connect it to Production, Preview, and Development.
2. In **Settings > Environment Variables**, map Neon's pooled Prisma URL to `DATABASE_URL` and its unpooled URL to `DIRECT_URL`.
3. Add `AUTH_SECRET`, `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `APP_TIME_ZONE=America/Toronto` to the same environments.
4. Redeploy the project.

The Vercel build runs a configuration preflight, generates Prisma Client, applies committed migrations over the direct connection with bounded advisory-lock retries, creates the initial administrator when needed, and then builds Next.js. Existing administrator passwords are not reset by later deployments.

Secrets belong in Vercel environment variables and local ignored `.env` files. Do not commit them.

## Import Existing Data

The one-time importer transfers the existing ignored `prisma/dev.db` data into PostgreSQL without deleting destination records. After the first successful deployment has created the schema, run locally:

```powershell
$env:TARGET_DATABASE_URL="postgresql://...your Neon connection string..."
npm run db:import:sqlite
Remove-Item Env:TARGET_DATABASE_URL
```

The importer preserves employees, display order, daily notes, assignments, administrator accounts, and password hashes. It is idempotent and can be rerun if interrupted.

Useful scripts:

```powershell
npm run db:setup
npm run db:migrate
npm run db:seed
npm run db:import:sqlite
npm run db:studio
npm run deploy:check
npm run lint
npm run build
```
