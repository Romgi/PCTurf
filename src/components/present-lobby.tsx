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
    <main className="fixed inset-0 overflow-x-hidden overflow-y-auto bg-[#333e3d] text-[#f4f1eb] lg:overflow-hidden">
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

      <div className="relative z-10 flex min-h-full flex-col justify-between p-3 sm:p-5 lg:h-full lg:p-7">
        <header className="grid grid-cols-2 gap-2 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-3">
          <section className="order-1 flex min-w-0 items-center rounded-md border border-white/15 bg-[#202827]/90 px-3 py-3 sm:px-5 sm:py-4">
            <div>
              <BrandLockup href="/admin" />
              <p className="mt-2 break-words text-xs font-semibold text-[#d8dad7] sm:mt-3 sm:text-sm">{formatDisplayDate(date)}</p>
            </div>
          </section>

          <section className="order-3 col-span-2 flex min-w-0 items-center gap-3 rounded-md border border-white/15 bg-[#202827]/90 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:order-2 lg:col-span-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/15 bg-[#333e3d] sm:h-14 sm:w-14">
              <WeatherIcon className="h-8 w-8 sm:h-9 sm:w-9" summary={weather.summary} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">{weather.label}</p>
              <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 sm:gap-x-4">
                <p className="break-words text-lg font-semibold leading-tight sm:text-2xl lg:shrink-0 lg:truncate lg:leading-none">{weather.summary}</p>
                {weather.temperature ? <p className="text-lg font-semibold leading-none sm:text-xl">{weather.temperature}</p> : null}
                {weather.precipitation ? <p className="text-lg font-semibold leading-none sm:text-xl">{weather.precipitation}</p> : null}
              </div>
              <p className="mt-2 break-words text-xs font-medium text-[#9a9d9d] lg:truncate">
                {[weather.highLow, weather.wind].filter(Boolean).join(" / ")}
              </p>
            </div>
          </section>

          <section className="order-2 flex min-w-0 flex-col justify-center rounded-md border border-white/15 bg-[#202827]/90 px-3 py-3 text-right sm:px-5 sm:py-4 lg:order-3 lg:min-w-44">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">Current time</p>
            <p className="mt-1 whitespace-nowrap text-2xl font-semibold sm:text-4xl"><BoardClock /></p>
          </section>
        </header>

        <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center sm:gap-3 sm:pb-3">
          <FullscreenButton className="h-12 border-white/25 bg-[#202827]/90 px-5" />
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#f4f1eb] px-6 py-3 text-center text-sm font-semibold text-[#202827] transition hover:bg-white"
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
