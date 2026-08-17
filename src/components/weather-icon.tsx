import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/ui";

export function WeatherIcon({ className, summary }: { className?: string; summary: string }) {
  const condition = summary.toLocaleLowerCase();
  const Icon = condition.includes("thunder")
    ? CloudLightning
    : condition.includes("snow")
      ? CloudSnow
      : condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower")
        ? CloudRain
        : condition.includes("fog")
          ? CloudFog
          : condition.includes("partly") || condition.includes("mainly")
            ? CloudSun
            : condition.includes("overcast") || condition.includes("cloud")
              ? Cloud
              : condition.includes("clear")
                ? Sun
                : CloudSun;

  return <Icon aria-hidden="true" className={cn("text-[#f4f1eb]", className)} strokeWidth={1.6} />;
}
