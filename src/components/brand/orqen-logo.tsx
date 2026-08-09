import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "mark";

interface OrqenLogoProps {
  variant?: LogoVariant;
  /** Height in px — width auto-calculated from aspect ratio */
  height?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
}

// Aspect ratios of the provided assets
const MARK_ASPECT = 1; // O-logo.png is square (1324×1324)
const FULL_ASPECT = 3.5; // orqen-logo.png ~1324×378 (approx 3.5:1)

/**
 * Canonical Orqen brand component.
 *
 * variant="mark"  → O-logo.png (compact Q symbol)
 * variant="full"  → orqen-logo.png (symbol + wordmark)
 *
 * Never shows both side-by-side.
 * Never distorts or recolors the assets.
 */
export function OrqenLogo({
  variant = "full",
  height = 32,
  href = "/dashboard",
  className,
  priority = false,
}: OrqenLogoProps) {
  const isMark = variant === "mark";
  const width = isMark ? height * MARK_ASPECT : height * FULL_ASPECT;

  const img = (
    <Image
      src={isMark ? "/branding/o-logo.png" : "/branding/orqen-logo.png"}
      alt="Orqen"
      width={Math.round(width)}
      height={height}
      priority={priority}
      style={{ objectFit: "contain", display: "block" }}
      className={cn(!href && className)}
    />
  );

  if (!href) return img;

  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="Orqen — go to dashboard"
    >
      {img}
    </Link>
  );
}
