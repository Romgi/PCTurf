import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

const COOKIE_NAME = "pcturf_session";
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function signInAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!admin) {
    return false;
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isValid) {
    return false;
  }

  const token = await new SignJWT({ email: admin.email, name: admin.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });

  return true;
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const secret = getSecret();
  let payload;

  try {
    ({ payload } = await jwtVerify(token, secret));
  } catch {
    return null;
  }

  const id = payload.sub;

  if (!id) {
    return null;
  }

  return prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function signOutAdmin() {
  (await cookies()).delete(COOKIE_NAME);
}
