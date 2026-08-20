const errors = [];

const databaseUrl = process.env.DATABASE_URL?.trim();
const directUrl = process.env.DIRECT_URL?.trim();
const authSecret = process.env.AUTH_SECRET?.trim();
const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "";

if (!databaseUrl) {
  errors.push("DATABASE_URL is required.");
} else if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  errors.push("DATABASE_URL must be a PostgreSQL connection string.");
}

if (!directUrl) {
  errors.push("DIRECT_URL is required.");
} else if (!/^postgres(?:ql)?:\/\//i.test(directUrl)) {
  errors.push("DIRECT_URL must be a PostgreSQL connection string.");
}

if (!authSecret || authSecret.length < 32) {
  errors.push("AUTH_SECRET must contain at least 32 characters.");
}

if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  errors.push("SEED_ADMIN_EMAIL must be a valid email address.");
}

if (adminPassword.length < 12) {
  errors.push("SEED_ADMIN_PASSWORD must contain at least 12 characters.");
} else {
  if (!/[a-z]/.test(adminPassword)) errors.push("SEED_ADMIN_PASSWORD must contain a lowercase letter.");
  if (!/[A-Z]/.test(adminPassword)) errors.push("SEED_ADMIN_PASSWORD must contain an uppercase letter.");
  if (!/[0-9]/.test(adminPassword)) errors.push("SEED_ADMIN_PASSWORD must contain a number.");
}

if (errors.length > 0) {
  console.error("Deployment configuration is incomplete:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Deployment environment is configured.");
