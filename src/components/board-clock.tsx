"use client";

import { useEffect, useState } from "react";

const TIME_ZONE = "America/Toronto";

export function BoardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time className="tabular-nums text-[#f4f1eb]">
      {new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        hour: "numeric",
        minute: "2-digit",
      }).format(now)}
    </time>
  );
}
