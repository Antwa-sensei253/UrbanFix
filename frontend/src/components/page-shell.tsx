import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "full";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        size === "default" && "max-w-[1200px]",
        size === "wide" && "max-w-[1440px]",
        size === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
