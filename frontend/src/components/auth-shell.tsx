import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            UrbanFix
          </span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back home
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="surface-card p-8 shadow-elevated">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {children}
          </div>
          {footer ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
