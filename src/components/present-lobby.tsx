"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { BoardClock } from "@/components/board-clock";
import { BrandLockup } from "@/components/brand-lockup";
import { FullscreenButton } from "@/components/fullscreen-button";
import { WeatherIcon } from "@/components/weather-icon";
import { formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/ui";

type LobbyWeather = {
  highLow?: string;
  label: string;
  precipitation?: string;
  summary: string;
  temperature?: string;
  wind?: string;
};

type PresentLobbyProps = {
  date: string;
  slides: string[];
  weather: LobbyWeather;
};

export function PresentLobby({ date, slides, weather }: PresentLobbyProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((index) => (index + 1) % slides.length);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#333e3d] text-[#f4f1eb]">
      <div aria-hidden="true" className="absolute inset-0">
        {slides.map((slide, index) => (
          <Image
            alt=""
            className={cn(
              "object-cover transition-opacity duration-[1800ms] ease-in-out",
              index === currentSlide ? "opacity-100" : "opacity-0",
            )}
            fill
            key={slide}
            priority={index === 0}
            sizes="100vw"
            src={slide}
          />
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5 lg:p-7">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
          <section className="flex items-center rounded-md border border-white/15 bg-[#202827]/90 px-5 py-4">
            <div>
              <BrandLockup href="/admin" />
              <p className="mt-3 text-sm font-semibold text-[#d8dad7]">{formatDisplayDate(date)}</p>
            </div>
          </section>

          <section className="flex min-w-0 items-center gap-4 rounded-md border border-white/15 bg-[#202827]/90 px-5 py-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-white/15 bg-[#333e3d]">
              <WeatherIcon className="h-9 w-9" summary={weather.summary} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">{weather.label}</p>
              <div className="mt-1 flex min-w-0 items-baseline gap-4">
                <p className="shrink-0 truncate text-2xl font-semibold leading-none">{weather.summary}</p>
                {weather.temperature ? <p className="truncate text-xl font-semibold leading-none">{weather.temperature}</p> : null}
                {weather.precipitation ? <p className="truncate text-xl font-semibold leading-none">{weather.precipitation}</p> : null}
              </div>
              <p className="mt-2 truncate text-xs font-medium text-[#9a9d9d]">
                {[weather.highLow, weather.wind].filter(Boolean).join(" / ")}
              </p>
            </div>
          </section>

          <section className="flex min-w-44 flex-col justify-center rounded-md border border-white/15 bg-[#202827]/90 px-5 py-4 text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">Current time</p>
            <p className="mt-1 whitespace-nowrap text-4xl font-semibold"><BoardClock /></p>
          </section>
        </header>

        <div className="flex justify-center gap-3 pb-3">
          <FullscreenButton className="h-12 border-white/25 bg-[#202827]/90 px-5" />
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f4f1eb] px-6 text-sm font-semibold text-[#202827] transition hover:bg-white"
            href={`/admin/present?date=${date}&view=jobs`}
          >
            <ClipboardList className="h-4 w-4" />
            Reveal Job Assignments
          </Link>
        </div>
      </div>
    </main>
  );
}
