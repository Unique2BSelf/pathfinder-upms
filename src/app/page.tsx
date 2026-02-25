import Link from "next/link";
import { Calendar, ChevronRight, Mountain, Shield, Star } from "lucide-react";
import type { Metadata } from "next";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";
import { PROGRAMS } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Pathfinder Outdoor Education Center",
  description:
    "Five youth programs. One family portal. Adventure, leadership, and skills for ages 5–21.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteNav />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-slate-900 pt-16 pb-24 px-4">
          {/* Background texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-forest-600/20 pointer-events-none" />
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #94A3B8 1px, transparent 0)", backgroundSize: "32px 32px" }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-forest-600/20 border border-forest-600/40 mb-6">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-forest-400">
                Five Programs. One Family Portal.
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white
                           leading-tight mb-6">
              Where Youth Find Their{" "}
              <span className="bg-gradient-to-r from-forest-400 to-amber-400
                               bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Pathfinder Outdoor Education Center offers five distinct youth programs —
              from Cub Scouts to competitive marksmanship — all managed in one place
              for your family.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-gold text-base px-8 py-4 rounded-xl font-bold">
                Register Your Family
              </Link>
              <Link href="/calendar" className="btn-outline text-base px-8 py-4 rounded-xl flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                View Schedule
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { value: "5",    label: "Programs"   },
                { value: "K–21", label: "Age Range"  },
                { value: "1",    label: "Family Portal" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-extrabold text-amber-400">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Programs Grid ──────────────────────────────────────────────── */}
        <section className="section bg-slate-900">
          <div className="container-lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">Our Programs</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                One family, multiple adventures. Youth can participate in multiple
                programs simultaneously.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PROGRAMS.map((program) => (
                <Link
                  key={program.slug}
                  href={program.href}
                  className="card-hover group p-6 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${program.bgColor} border ${program.borderColor}
                                     flex items-center justify-center text-2xl`}>
                      {program.icon}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400
                                             group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div>
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-semibold
                                     mb-2 ${program.badgeClass}`}>
                      {program.ageRange}
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">{program.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                      {program.tagline}
                    </p>
                  </div>

                  <div className={`mt-auto pt-3 border-t border-slate-700 text-sm font-semibold
                                   ${program.color} flex items-center gap-1`}>
                    Learn more <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Pathfinder ─────────────────────────────────────────────── */}
        <section className="section bg-slate-800/50">
          <div className="container-lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">The Pathfinder Difference</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Mountain className="w-6 h-6 text-forest-400" />,
                  title: "Real Outdoor Experience",
                  desc: "Not a screen. Not a classroom. Real trails, real campfires, real skills that stick for life.",
                },
                {
                  icon: <Shield className="w-6 h-6 text-amber-400" />,
                  title: "Safety First, Always",
                  desc: "Certified leaders, current physicals on file, and clear emergency protocols for every activity.",
                },
                {
                  icon: <Star className="w-6 h-6 text-purple-400" />,
                  title: "One Portal for Everything",
                  desc: "Waivers, dues, schedules, and medical records — all in one place so nothing falls through the cracks.",
                },
              ].map((item) => (
                <div key={item.title} className="card p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center
                                  justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────────────── */}
        <section className="section">
          <div className="container-md">
            <div className="rounded-2xl bg-gradient-to-r from-forest-600/30 to-amber-500/20
                            border border-forest-600/40 p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Register your family today and get your kids into the program that fits them best.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn-gold px-8 py-4 rounded-xl font-bold text-base">
                  Register Now — It's Free
                </Link>
                <Link href="/calendar" className="btn-outline px-8 py-4 rounded-xl text-base">
                  Check the Schedule First
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
