"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-[#333e3d] px-5 text-[#f4f1eb]">
        <main className="w-full max-w-lg rounded-md border border-white/12 bg-[#293231] p-6 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">PC Turf Board</p>
          <h1 className="mt-3 text-2xl font-semibold">The application could not load</h1>
          <p className="mt-3 text-sm leading-6 text-[#c7c9c6]">
            Try the request again. If the problem continues, check the deployment and database status.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button className="nav-button" onClick={reset} type="button">
              Try again
            </button>
            <a className="nav-button" href="/admin/login">
              Return to login
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
