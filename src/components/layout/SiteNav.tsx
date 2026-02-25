"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Mountain } from "lucide-react";
import { PROGRAMS } from "@/lib/programs";

export default function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    ...PROGRAMS.map((p) => ({ label: p.shortName, href: p.href })),
    { label: "Calendar", href: "/calendar" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <nav className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center
                          group-hover:bg-forest-500 transition-colors">
            <Mountain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm hidden sm:block">
            Pathfinder
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${pathname === link.href
                    ? "text-amber-400 bg-amber-400/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="hidden sm:inline-flex btn-primary text-sm px-4 py-2 rounded-lg"
          >
            Join Us →
          </Link>
          <Link
            href="/login"
            className="hidden sm:inline-flex btn-ghost text-sm px-4 py-2 rounded-lg"
          >
            Sign In
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800
                       transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 animate-fade-in">
          <ul className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium
                    transition-colors min-h-[44px]
                    ${pathname === link.href
                      ? "text-amber-400 bg-amber-400/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 border-t border-slate-800 flex gap-2">
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="flex-1 btn-primary text-sm py-3 rounded-lg text-center">
                Join Us →
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex-1 btn-outline text-sm py-3 rounded-lg text-center">
                Sign In
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
