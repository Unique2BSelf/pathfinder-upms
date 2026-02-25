import Link from "next/link";
import { Calendar, ChevronRight, CheckCircle2, ExternalLink } from "lucide-react";
import type { Program } from "@/lib/programs";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";

interface ProgramPageProps {
  program: Program;
}

export default function ProgramPage({ program }: ProgramPageProps) {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteNav />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-slate-900 pt-14 pb-20 px-4">
          <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 pointer-events-none`} />

          {/* Subtle colored glow behind content */}
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none
                           ${program.bgColor}`} />

          <div className="relative max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-5">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                               ${program.badgeClass}`}>
                {program.icon} {program.ageRange}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
              {program.name}
            </h1>

            <p className={`text-xl font-semibold mb-3 ${program.color}`}>
              {program.tagline}
            </p>

            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-10">
              {program.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/register?program=${program.slug}`}
                className="btn-gold px-8 py-4 rounded-xl font-bold text-base"
              >
                Join {program.shortName} →
              </Link>
              <Link
                href="/calendar"
                className="btn-outline px-8 py-4 rounded-xl flex items-center gap-2 text-base"
              >
                <Calendar className="w-4 h-4" />
                View Schedule
              </Link>
            </div>
          </div>
        </section>

        {/* ── What You'll Do ─────────────────────────────────────────────── */}
        <section className="section">
          <div className="container-md">
            <h2 className="text-2xl font-bold text-white mb-8">
              What {program.shortName} is all about
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {program.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 card p-4"
                >
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${program.color}`} />
                  <p className="text-slate-300 text-sm leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Calendar Preview CTA ───────────────────────────────────────── */}
        <section className="section bg-slate-800/50">
          <div className="container-md">
            <div className={`card p-6 md:p-8 border ${program.borderColor}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center
                              justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {program.shortName} Schedule
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Check upcoming meetings, campouts, and events. Subscribe to the
                    calendar to get automatic updates on your phone.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto flex-shrink-0">
                  <Link
                    href="/calendar"
                    className="btn-primary px-6 py-3 rounded-lg text-sm whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4" />
                    Open Calendar
                  </Link>
                  <a
                    href={program.icsRoute}
                    className="btn-outline px-6 py-3 rounded-lg text-sm flex items-center
                               gap-2 justify-center whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Subscribe (iCal)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="section">
          <div className="container-md text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to join {program.name}?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Registration takes about 5 minutes. We'll have you set up and
              ready for your first meeting.
            </p>
            <Link
              href={`/register?program=${program.slug}`}
              className="btn-gold px-10 py-4 rounded-xl font-bold text-base inline-flex items-center gap-2"
            >
              Register for {program.shortName}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
