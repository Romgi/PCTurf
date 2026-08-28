import "server-only";

import { randomInt } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);

function shuffleSlides(slides: string[]) {
  const shuffled = [...slides];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export async function getPresentationSlides() {
  try {
    const entries = await readdir(path.join(process.cwd(), "public", "slides"), {
      withFileTypes: true,
    });

    const slides = entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLocaleLowerCase()))
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))
      .map((entry) => `/slides/${encodeURIComponent(entry.name)}`);

    return shuffleSlides(slides);
  } catch {
    return [];
  }
}
