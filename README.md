# PC Turf Board

PC Turf Board is the authenticated daily operations board for the Port Carling Golf and Country Club turf department. Superintendents use it to schedule work, manage employees, record course setup information, and present the day's assignments on a meeting-room TV.

The application is built with Next.js, React, Tailwind CSS, Prisma, and PostgreSQL. It is designed for Vercel deployment and uses live Port Carling weather data from Open-Meteo.

## Application Features

### Superintendent dashboard

- Opens on the current Port Carling date by default.
- Moves between previous, current, and future work days without manually creating daily records.
- Preserves every visited work day and its assignments in PostgreSQL for later review.
- Shows detailed current or forecast weather for Port Carling, Ontario.
- Displays assignment progress, unassigned employees, the day's start time, and course notes.
- Lists up to 12 saved work dates in descending date order for quick navigation.

### Daily job assignments

- Lists every active employee with one free-text assignment field.
- Shows an employee's most common previous jobs when their field is focused.
- Searches previous jobs from the whole crew as the superintendent types.
- Accepts any custom job without requiring a saved-job or category record.
- Includes `Off` as a standard assignment. `Off` is muted on the presented board.
- Converts legacy exact `Absent` assignments to `Off` when displayed or edited.
- Saves every employee's assignment in one operation with **Save all**.
- Clears only the selected day's assignments with **Clear all** after confirmation.

### Employee management

- Creates new employees at the bottom of the roster.
- Renames employees.
- Reorders the roster with drag and drop. The same order is used on the job board.
- Deactivates employees without deleting their assignment history. Inactive employees are excluded from assignment entry and presentation views.
- Reactivates employees later with their record and history intact.
- Permanently deletes an employee and all assignments associated with that employee after confirmation.

### Board notes and start time

- Stores separate course/weather and superintendent notes for each date.
- Shows both notes together on the presented job board.
- Stores a start time for each work day.
- Uses the most recent earlier work day's start time when the selected day does not have its own value.
- Displays the start time beneath the live clock on the slideshow and job board.

### Height of cut

The dashboard stores height values in inches for:

| Area | Measurements |
| --- | --- |
| Greens | Walk, triplex, cleanup |
| TCA | Tees, collars/approaches/fairways |
| Rough | Rough, secondary cut |

Values are stored as text after numeric validation so the entered decimal precision and trailing zeros are preserved. Heights can be saved for one day or set as defaults. Default values automatically fill other work days unless that day has a specific override.

### Direction of cut

The superintendent can select a direction for greens, approaches, tees, and fairways. Available values are `8-2`, `10-4`, `12-6`, `9-3`, and `Quickest`.

Each direction is represented by a striped circular diagram with a red double-sided arrow. `Quickest` uses a red rabbit icon. The four saved diagrams and labels appear in a vertical rail on the TV job board.

### Presentation flow

1. The superintendent selects **Present** from the dashboard.
2. The presentation lobby opens with a full-screen rotating course slideshow.
3. Live weather, the current time, the selected date, and the start time remain visible over the photos.
4. Slides fade every 30 seconds.
5. **Reveal Job Assignments** opens the employee-first job board.
6. The board adapts its employee columns to keep the full active roster on one TV screen at desktop sizes.

The job board also shows weather, notes, time, start time, cutting directions, a fullscreen control, and a link back to the dashboard. Mobile layouts remain scrollable and move the direction diagrams below the roster.

## Routes and Access

| Route | Purpose |
| --- | --- |
| `/` | Requires login, then redirects to the presentation lobby |
| `/admin/login` | Superintendent login |
| `/admin` | Superintendent dashboard for the current date |
| `/admin?date=YYYY-MM-DD` | Dashboard for a specific past or future date |
| `/admin/present?date=YYYY-MM-DD` | Presentation slideshow for a date |
| `/admin/present?date=YYYY-MM-DD&view=jobs` | Presented job assignments for a date |

There is no public board. Every management and presentation route requires an administrator session.

## Technology

- Node.js 24
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- PostgreSQL, with Neon recommended for Vercel
- `jose` for signed sessions
- `bcryptjs` for password hashing
- Zod for server-side input validation
- dnd-kit for employee ordering
- Lucide React for interface icons
- Open-Meteo for weather data

## Requirements

- Node.js 24.x
- npm
- A PostgreSQL database
- A pooled PostgreSQL connection for application traffic
- A direct PostgreSQL connection for migrations

SQLite is supported only as a source for the legacy one-time importer. The running application requires PostgreSQL.

## Local Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create the ignored local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill in every required value in `.env`. Use an empty PostgreSQL database for a new installation.

4. Generate a strong authentication secret:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

5. Validate the environment, apply committed migrations, and create the initial administrator:

   ```powershell
   npm run deploy:check
   npm run db:setup
   ```

6. Start the development server:

   ```powershell
   npm run dev
   ```

7. Open `http://localhost:3000` and sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled PostgreSQL URL used by the running application |
| `DIRECT_URL` | Yes | Direct, unpooled PostgreSQL URL used by migration commands |
| `AUTH_SECRET` | Yes | Secret used to sign session JWTs; must contain at least 32 characters |
| `APP_TIME_ZONE` | Recommended | Application date zone; defaults to `America/Toronto` |
| `SEED_ADMIN_NAME` | Recommended | Display name for the initial administrator; defaults to `Turf Admin` |
| `SEED_ADMIN_EMAIL` | Yes | Valid email address for the initial administrator |
| `SEED_ADMIN_PASSWORD` | Yes | Initial password with at least 12 characters, uppercase, lowercase, and a number |
| `TARGET_DATABASE_URL` | Import only | PostgreSQL destination used by the legacy SQLite importer |

`SEED_ADMIN_PASSWORD` is required by deployment validation, but seeding does not replace the password of an administrator that already exists. It creates the account once and updates only its display name on later runs.

Never commit `.env`, `.env.local`, database exports, connection strings, passwords, or authentication secrets. The repository's `.gitignore` excludes environment files except `.env.example`.

## Database Behavior

Prisma manages five PostgreSQL models:

| Model | Purpose |
| --- | --- |
| `AdminUser` | Administrator names, unique login emails, and bcrypt password hashes |
| `Employee` | Employee name, active state, and board order |
| `DailyPlan` | Date-specific notes, start time, heights, and cut directions |
| `HeightOfCutDefault` | Default cutting heights shared by work days without overrides |
| `Assignment` | One job title per employee and daily plan |

Daily plans use unique `YYYY-MM-DD` strings interpreted through `APP_TIME_ZONE`. Opening a valid date automatically creates its plan if needed. Invalid or missing dates resolve to the current application date.

Assignments are unique per employee and day. Deleting a daily plan or employee cascades to the related assignments. Deactivation does not delete anything.

Runtime Prisma connections disable PostgreSQL prepared-statement caching to avoid stale Neon plans after deployment-time column changes. Migration commands use `DIRECT_URL` when available and retry bounded advisory-lock timeouts.

## Weather Data

Weather is requested server-side from Open-Meteo for Port Carling at latitude `45.1168`, longitude `-79.5750`.

- Today's page uses current conditions plus the daily forecast.
- Future selected dates use the daily forecast.
- Responses are revalidated every 15 minutes.
- Temperature uses Celsius, wind uses km/h, and precipitation uses millimetres.
- The dashboard can show temperature, feels-like temperature, humidity, dew point, wind, gusts, cloud cover, pressure, precipitation, UV index, ET0, sunrise, and sunset when available.
- No weather API key is required.
- If Open-Meteo is unavailable or cannot provide the selected date, the app remains usable and displays **Weather unavailable**.

Administrator-entered course and weather notes are stored separately from the external forecast.

## Slideshow Images

Presentation images are loaded from `public/slides` at server render time. Supported extensions are `.avif`, `.jpeg`, `.jpg`, `.png`, and `.webp`.

Files are discovered using numeric-aware filename ordering and shuffled once whenever the presentation lobby opens. That randomized sequence remains stable while the slideshow loops, and multiple images advance every 30 seconds. Add, remove, or replace files in `public/slides`, commit the changes, and redeploy.

## Administrator Accounts

Any signed-in administrator can add another administrator from **System administration**. New passwords must contain 12-128 characters, uppercase, lowercase, and a number. Administrators can remove other accounts, but the account currently in use cannot delete itself.

There is no self-service password reset. A signed-in administrator can remove and recreate another account. If no administrator can sign in, remove the affected seed account directly from the database and run `npm run db:seed` to recreate it from the current `SEED_ADMIN_*` values.

## Data Cleanup

Destructive controls require both the displayed typed phrase and a browser confirmation.

| Action | Deleted | Preserved |
| --- | --- | --- |
| Clear all assignments | Assignments for the selected day | Employees, other days, notes, settings, admins |
| Clear recent work days | All daily plans, assignments, and dated notes/settings | Employees, height defaults, admins |
| Clear all employees | Every employee and all assignment history | Daily plans, dated notes/settings, height defaults, admins |
| Clear all data | Employees, assignments, daily plans, height defaults, and other admins | The currently signed-in administrator |

These operations cannot be undone. Take a provider backup or database snapshot before performing broad cleanup in production.

## npm Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma Client and create a production Next.js build |
| `npm run start` | Start a previously built production server |
| `npm run lint` | Run ESLint |
| `npm run deploy:check` | Validate production database, authentication, and seed variables |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:setup` | Apply committed migrations and seed the initial administrator |
| `npm run db:migrate` | Apply committed migrations using the direct connection with retries |
| `npm run db:migrate:dev` | Create and apply a development migration after schema changes |
| `npm run db:seed` | Create the seed administrator if it does not exist |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:import:sqlite` | Import an older local SQLite database into PostgreSQL |
| `npm run vercel-build` | Run the complete Vercel deployment pipeline |

Before pushing a release, run:

```powershell
npm run lint
npm run build
```

## Vercel Deployment

1. Import the repository into Vercel.
2. Provision a Neon PostgreSQL database through the Vercel Marketplace, or use another reachable PostgreSQL provider.
3. Set `DATABASE_URL` to the pooled connection and `DIRECT_URL` to the direct connection.
4. Add `AUTH_SECRET`, `APP_TIME_ZONE`, and every `SEED_ADMIN_*` value to the Production environment.
5. Add equivalent variables to Preview if preview deployments need a working isolated database. Do not point untrusted previews at production data.
6. Deploy without overriding the repository's build command.

Vercel automatically uses `npm run vercel-build`, which validates the environment, generates Prisma Client, applies migrations, seeds the initial administrator, and builds Next.js. Migration advisory-lock timeouts are retried after 5, 15, and 30 seconds.

The project requests Node.js 24 through `package.json`. Dependency lifecycle scripts required by Prisma and esbuild are explicitly allowed in `package.json`.

## Importing a Legacy SQLite Database

The importer reads the ignored `prisma/dev.db` file by default and upserts its records into PostgreSQL without deleting destination records. It transfers administrators and password hashes, employees and display order, daily notes, and assignments.

Run the PostgreSQL migrations first, then execute:

```powershell
$env:TARGET_DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
npm run db:import:sqlite
Remove-Item Env:TARGET_DATABASE_URL
```

To use a different source file:

```powershell
node scripts/import-sqlite.mjs "C:\path\to\dev.db"
```

The importer is idempotent for matching administrator emails, employee IDs, dates, and employee/day assignments. It does not delete newer PostgreSQL records that are absent from the source.

## Security

- All operational routes and data-changing server actions require administrator authentication.
- Passwords are hashed with bcrypt using cost factor 12.
- Sessions are signed HS256 JWTs stored in HTTP-only cookies.
- Sessions expire after 12 hours.
- Production cookies use `Secure` and `SameSite=Lax`.
- Rotating `AUTH_SECRET` invalidates existing sessions.
- The application sends `no-referrer`, `nosniff`, frame-denial, and restrictive permissions-policy headers.
- Search engines are instructed not to index or follow the application.
- The current administrator is protected from account deletion and full-data cleanup lockout.

Application authentication does not replace database security. Restrict database credentials to Vercel and trusted local environments, use separate databases for production and previews, and enable provider backups.

## Project Structure

```text
src/app/                 Next.js routes, metadata, global styles, and error UI
src/components/          Dashboard, assignment, employee, slideshow, and board UI
src/lib/actions.ts       Authenticated server actions and input validation
src/lib/auth.ts          Login, session cookies, and route protection
src/lib/data.ts          Daily board and dashboard database queries
src/lib/dates.ts         Toronto date handling and display formatting
src/lib/weather.ts       Open-Meteo integration and weather formatting
src/lib/slides.ts        Slideshow image discovery
prisma/schema.prisma     PostgreSQL data model
prisma/migrations/       Committed production migrations
prisma/seed.ts           Initial administrator bootstrap
scripts/                 Deployment checks, migration retries, and legacy import
public/slides/           Presentation photographs
public/pc-logo.png       Main Port Carling logo
public/pc-icon.png       Favicon and app icon
```

## Troubleshooting

### Deployment configuration is incomplete

Run `npm run deploy:check` locally. Confirm that both database URLs begin with `postgres://` or `postgresql://`, `AUTH_SECRET` has at least 32 characters, the seed email is valid, and the seed password meets every complexity rule.

### Sign-in is temporarily unavailable

This indicates a database connection or authentication-secret configuration failure rather than an incorrect password. Check Vercel function logs, database status, `DATABASE_URL`, and `AUTH_SECRET`.

### The email or password is incorrect

The seed command does not reset existing passwords. Sign in with another administrator and recreate the account, or follow the database recovery procedure in **Administrator Accounts**.

### Migration lock is busy

The deployment migration script retries expected Prisma advisory-lock timeouts automatically. If every retry fails, verify that another deployment or manual migration is not still running, then redeploy.

### Weather unavailable

The board still functions without weather. Verify outbound access to `api.open-meteo.com` and confirm the selected date is available from the forecast API.

### Slideshow has no photographs

Confirm supported image files exist directly inside `public/slides`, then rebuild or redeploy the application.

### TV edges are clipped

Use the application's fullscreen control, keep browser zoom at 100%, and set the TV picture mode to **Fit to Screen**, **Just Scan**, or the equivalent option that disables overscan. The board includes a viewport-scaled safe area, but TV overscan settings can still remove browser pixels before they are displayed.

### Creating a schema change

Update `prisma/schema.prisma`, run `npm run db:migrate:dev` against a development database, review the generated SQL, and commit the new migration. Production and Vercel deployments must use `npm run db:migrate`; do not run development migrations against production.
