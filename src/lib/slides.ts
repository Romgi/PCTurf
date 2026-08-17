import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);

export async function getPresentationSlides() {
  try {
    const entries = await readdir(path.join(process.cwd(), "public", "slides"), {
      withFileTypes: true,
    });

    return entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLocaleLowerCase()))
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))
      .map((entry) => `/slides/${encodeURIComponent(entry.name)}`);
  } catch {
    return [];
  }
}
