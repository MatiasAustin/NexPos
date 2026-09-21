"use client";

import Image from "next/image";

interface AppLogoProps {
  /** base64 or URL of the logo */
  logoUrl?: string;
  /** whether to render a colored background behind the logo */
  showBackground?: boolean;
  /** fallback letter when no logo */
  fallbackLetter?: string;
  /** overall container size in tailwind (w-* h-*) — e.g. "8" → w-8 h-8 */
  size?: number;
  /** extra classes on the root wrapper */
  className?: string;
  /** if true, adds a subtle ring/border to the container */
  withBorder?: boolean;
}

/**
 * Reusable app-logo component.
 * - If `showBackground` is false (default), renders the logo image directly with
 *   no background — great for logos that already have transparency.
 * - If `showBackground` is true, wraps the logo in a rounded accent-colored box.
 * - Falls back to a letter avatar if no logo is set.
 */
export default function AppLogo({
  logoUrl,
  showBackground = false,
  fallbackLetter = "N",
  size = 8,
  className = "",
  withBorder = false,
}: AppLogoProps) {
  const px = size * 4; // tailwind size unit → px (size 8 = 32px)

  const containerBase = `flex items-center justify-center shrink-0 overflow-hidden`;
  const borderClass = withBorder ? "border border-border shadow-sm" : "";
  const roundedClass = "rounded-xl";

  if (logoUrl) {
    if (showBackground) {
      // Logo with accent background (like a colored app icon)
      return (
        <div
          className={`${containerBase} ${roundedClass} ${borderClass} bg-accent ${className}`}
          style={{ width: px, height: px }}
        >
          <img
            src={logoUrl}
            alt="App Logo"
            className="max-w-[80%] max-h-[80%] object-contain"
          />
        </div>
      );
    } else {
      // Logo without any background — transparent / naked
      return (
        <div
          className={`${containerBase} ${className}`}
          style={{ width: px, height: px }}
        >
          <img
            src={logoUrl}
            alt="App Logo"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
  }

  // Fallback: letter avatar
  const textSize = size <= 6 ? "text-xs" : size <= 10 ? "text-sm" : "text-base";
  return (
    <div
      className={`${containerBase} ${roundedClass} ${borderClass} bg-accent ${className}`}
      style={{ width: px, height: px }}
    >
      <span className={`${textSize} font-bold text-accent-fg`}>
        {fallbackLetter.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
