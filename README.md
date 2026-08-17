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

Each employee has one free-text assignment per day. Focusing an assignment field shows that employee's most common jobs, while typing searches previous jobs across the whole crew. `Absent` is available in the same autocomplete list and can be extended with a reason when needed.

Useful scripts:

```bash
npm run db:setup
npm run db:seed
npm run db:studio
npm run lint
npm run build
```
