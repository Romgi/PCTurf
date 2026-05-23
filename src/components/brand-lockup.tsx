import Image from "next/image";
import Link from "next/link";

export function BrandLockup({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-4">
      <Image
        src="/pc-logo.png"
        alt="Port Carling Golf Club"
        width={74}
        height={86}
        priority
        className="h-16 w-auto object-contain"
      />
      <div className="hidden sm:block">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a9d9d]">Port Carling</p>
        <p className="mt-1 text-lg font-semibold text-[#f4f1eb]">Turf Operations</p>
      </div>
    </Link>
  );
}
