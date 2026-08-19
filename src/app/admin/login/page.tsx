import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Superintendent Login",
};

export default async function LoginPage() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#333e3d] px-5 py-8 text-[#f4f1eb]">
      <section className="w-full max-w-md rounded-md border border-white/12 bg-[#293231] p-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/pc-logo.png" alt="Port Carling Golf Club" width={104} height={121} priority className="h-24 w-auto" />
          <p className="mt-5 text-xs uppercase tracking-[0.28em] text-[#9a9d9d]">Turf operations</p>
          <h1 className="mt-2 text-2xl font-semibold">Superintendent login</h1>
          <p className="mt-2 text-sm leading-6 text-[#9a9d9d]">Sign in to manage employees, daily assignments, board notes, and future work days.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
