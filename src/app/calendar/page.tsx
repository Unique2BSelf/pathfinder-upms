"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Lock, RefreshCw, ExternalLink, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";
import { PROGRAMS, type Program } from "@/lib/programs";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  event_type: string;
  program_id: string | null;
  program?: { slug: string; name: string; short_name: string } | null;
}

const MONTHS = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Password Gate ──────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(false);
  const [shaking, setShaking]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const correct = process.env.NEXT_PUBLIC_CALENDAR_PASSWORD ?? "pathfinder2024";
    if (password === correct) {
      sessionStorage.setItem("calendar_unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteNav />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40
                            flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">Family Calendar</h1>
            <p className="text-slate-400 text-sm mb-6">
              Enter your family calendar password to view the schedule.
            </p>

            <form onSubmit={handleSubmit} className={`space-y-4 ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Calendar password"
                  className={`input text-center text-lg tracking-widest ${
                    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  autoFocus
                />
                {error && (
                  <p className="text-red-400 text-sm mt-2">Incorrect password. Try again.</p>
                )}
              </div>
              <button type="submit" className="btn-gold w-full py-3 rounded-lg font-bold">
                View Calendar
              </button>
            </form>

            <p className="text-slate-600 text-xs mt-6">
              Don't have the password? Contact your program leader.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ── Event type color map ───────────────────────────────────────────────────
function getProgramColor(slug: string | null | undefined): string {
  const map: Record<string, string> = {
    "cub-scouts":    "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
    "boy-scouts":    "bg-forest-600/20 text-forest-400 border-forest-600/40",
    "rangers":       "bg-blue-400/20 text-blue-300 border-blue-400/40",
    "squadron":      "bg-purple-400/20 text-purple-300 border-purple-400/40",
    "shooting-club": "bg-amber-500/20 text-amber-300 border-amber-500/40",
  };
  return map[slug ?? ""] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40";
}

function getProgramDot(slug: string | null | undefined): string {
  const map: Record<string, string> = {
    "cub-scouts":    "bg-yellow-400",
    "boy-scouts":    "bg-forest-500",
    "rangers":       "bg-blue-400",
    "squadron":      "bg-purple-400",
    "shooting-club": "bg-amber-400",
  };
  return map[slug ?? ""] ?? "bg-slate-500";
}

// ── Main Calendar View ─────────────────────────────────────────────────────
function CalendarView() {
  const supabase = createClient();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [events,       setEvents]       = useState<CalendarEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterSlug,   setFilterSlug]   = useState<string>("all");

  // ── Fetch events for visible month range ──────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const start = new Date(currentYear, currentMonth, 1).toISOString();
    const end   = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from("events")
      .select(`
        id, title, description, location, starts_at, ends_at, all_day, event_type, program_id,
        program:programs(slug, name, short_name)
      `)
      .eq("is_public", true)
      .eq("is_cancelled", false)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .order("starts_at", { ascending: true });

    if (!error && data) setEvents(data as CalendarEvent[]);
    setLoading(false);
  }, [currentMonth, currentYear, supabase]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Build calendar grid ────────────────────────────────────────────────
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cells           = Array.from({ length: firstDayOfMonth + daysInMonth }, (_, i) =>
    i < firstDayOfMonth ? null : i - firstDayOfMonth + 1
  );

  function dateStr(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function eventsOnDay(day: number) {
    const ds = dateStr(day);
    return events.filter((e) => {
      if (filterSlug !== "all" && e.program?.slug !== filterSlug) return false;
      return e.starts_at.startsWith(ds);
    });
  }

  const filteredEvents = filterSlug === "all"
    ? events
    : events.filter((e) => e.program?.slug === filterSlug);

  const selectedEvents = selectedDate
    ? filteredEvents.filter((e) => e.starts_at.startsWith(selectedDate))
    : filteredEvents;

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null);
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteNav />
      <main className="flex-1 section">
        <div className="container-lg">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Family Calendar</h1>
              <p className="text-slate-400 text-sm mt-1">
                All five programs in one place. Subscribe to never miss an event.
              </p>
            </div>
            <button
              onClick={fetchEvents}
              className="btn-ghost p-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* ── iCal Subscribe Strip ─────────────────────────────────────── */}
          <div className="card p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-400 font-medium mr-1">Subscribe:</span>
              {PROGRAMS.map((p) => (
                <a
                  key={p.slug}
                  href={p.icsRoute}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                              font-semibold border transition-opacity hover:opacity-80
                              ${p.badgeClass}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  {p.shortName}
                </a>
              ))}
              <a
                href="/api/calendar/all.ics"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                           font-semibold border border-slate-600 text-slate-300 bg-slate-700/50
                           hover:opacity-80 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" />
                All Programs
              </a>
            </div>
          </div>

          {/* ── Program Filter ───────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            <button
              onClick={() => setFilterSlug("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${filterSlug === "all"
                  ? "bg-white text-slate-900 border-white"
                  : "border-slate-600 text-slate-400 hover:border-slate-400"
                }`}
            >
              All Programs
            </button>
            {PROGRAMS.map((p) => (
              <button
                key={p.slug}
                onClick={() => setFilterSlug(filterSlug === p.slug ? "all" : p.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${filterSlug === p.slug
                    ? p.badgeClass + " opacity-100"
                    : "border-slate-700 text-slate-500 hover:border-slate-500"
                  }`}
              >
                {p.icon} {p.shortName}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Calendar Grid ────────────────────────────────────────── */}
            <div className="lg:col-span-2 card overflow-hidden">
              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                <button onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px]
                             flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <h2 className="font-bold text-white text-lg">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <button onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px]
                             flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 border-b border-slate-700">
                {DAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-semibold
                                          text-slate-500 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="h-16 border-b border-r border-slate-800/50" />;
                  const ds      = dateStr(day);
                  const dayEvts = eventsOnDay(day);
                  const isToday = ds === today.toISOString().slice(0, 10);
                  const isSel   = ds === selectedDate;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isSel ? null : ds)}
                      className={`h-16 p-1.5 border-b border-r border-slate-800/50 text-left
                                  transition-colors relative
                                  ${isSel   ? "bg-forest-600/20 border-forest-600/30" : "hover:bg-slate-800"}
                                  ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
                    >
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? "bg-amber-500 text-slate-900" : isSel ? "text-forest-400" : "text-slate-400"}`}>
                        {day}
                      </span>

                      {/* Event dots */}
                      {dayEvts.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {dayEvts.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                ${getProgramDot(e.program?.slug)}`}
                            />
                          ))}
                          {dayEvts.length > 3 && (
                            <span className="text-[9px] text-slate-500">+{dayEvts.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Event List ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-300 text-sm">
                  {selectedDate
                    ? `Events on ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                    : `All Events — ${MONTHS[currentMonth]}`}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Show all
                  </button>
                )}
              </div>

              {loading ? (
                <div className="card p-6 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-500 mx-auto" />
                  <p className="text-slate-500 text-sm mt-2">Loading events…</p>
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="card p-6 text-center">
                  <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No events this month.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
                  {selectedEvents.map((evt) => {
                    const startDate = new Date(evt.starts_at);
                    return (
                      <div key={evt.id} className="card p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                                           ${getProgramColor(evt.program?.slug)}`}>
                            {evt.program?.short_name ?? "All Programs"}
                          </span>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        <p className="font-semibold text-white text-sm leading-snug mb-1">
                          {evt.title}
                        </p>

                        {!evt.all_day && (
                          <p className="text-xs text-slate-500">
                            {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            {evt.ends_at && ` – ${new Date(evt.ends_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                          </p>
                        )}

                        {evt.location && (
                          <p className="text-xs text-slate-500 mt-0.5">📍 {evt.location}</p>
                        )}

                        {evt.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ── Page Entry Point ───────────────────────────────────────────────────────
export default function CalendarPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Persist unlock in session so refresh doesn't re-prompt
    if (sessionStorage.getItem("calendar_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  return unlocked
    ? <CalendarView />
    : <PasswordGate onUnlock={() => setUnlocked(true)} />;
}
