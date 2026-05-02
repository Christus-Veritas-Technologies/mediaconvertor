"use client";
import Link from "next/link";

export default function Header() {
  const links = [{ to: "/", label: "Convert" }] as const;

  return (
    <header className="border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          MediaConvertor
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} href={to} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
