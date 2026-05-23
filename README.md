# PC Turf Board

Next.js job board for the Port Carling Golf and Country Club turf department.

## Routes

- `/` - Public TV job board for the current day.
- `/admin/login` - Superintendent login.
- `/admin` - Protected dashboard for managing employees, categories, saved jobs, notes, and daily assignments.
- `/admin/present` - Fullscreen-focused board for the selected day.

The board shows live Port Carling weather, the admin's course/weather note, and any boss notes for the selected date. Present mode is employee-first so staff can scan for their name and job quickly.

## Local Setup

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://127.0.0.1:3000`.

Seeded admin login:

```txt
Email: boss@pcturf.local
Password: ChangeMe123!
```

Change the seeded credentials and `AUTH_SECRET` in `.env` before using this anywhere beyond local development.

## Database

The app uses SQLite through Prisma. Daily plans are keyed by `YYYY-MM-DD`, so bosses can schedule future work and review past days without manually creating new day records. The local database file is `prisma/dev.db` and is ignored by Git.

Absences are stored by employee and date. When an employee is marked absent for the selected day, the dashboard shows an absence notice and disables that employee in assignment dropdowns.

Useful scripts:

```bash
npm run db:setup
npm run db:seed
npm run db:studio
npm run lint
npm run build
```
