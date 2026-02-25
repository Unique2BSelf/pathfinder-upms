import Link from "next/link";
import { Mountain } from "lucide-react";
import { PROGRAMS } from "@/lib/programs";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
                <Mountain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Pathfinder</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Outdoor Education Center. Five programs for youth aged 5–21.
              Building character, skills, and memories that last a lifetime.
            </p>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Programs
            </h3>
            <ul className="space-y-2">
              {PROGRAMS.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={p.href}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Family Calendar",  href: "/calendar" },
                { label: "Register",         href: "/register" },
                { label: "Family Portal",    href: "/login" },
                { label: "Contact Us",       href: "/contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row
                        items-center justify-between gap-3">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Pathfinder Outdoor Education Center.
          </p>
          <p className="text-slate-700 text-xs">
            Proudly powered by Pathfinder UPMS
          </p>
        </div>
      </div>
    </footer>
  );
}
