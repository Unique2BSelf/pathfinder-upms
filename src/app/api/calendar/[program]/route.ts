import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROGRAMS, getProgramBySlug } from "@/lib/programs";

// ── Route: /api/calendar/[program].ics
// Accepts: any program slug (e.g. "cub-scouts") OR "all" for every program.
//
// This is a real iCal feed — subscribe in Google Calendar, Apple Calendar,
// or Outlook for automatic real-time updates.
// ────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { program: string } }
) {
  // Strip the trailing .ics extension if present
  const rawSlug  = params.program.replace(/\.ics$/, "");
  const isAll    = rawSlug === "all";
  const program  = isAll ? null : getProgramBySlug(rawSlug);

  // 404 for unknown program slugs
  if (!isAll && !program) {
    return new NextResponse("Program not found", { status: 404 });
  }

  const supabase = createClient();

  // ── Query events ──────────────────────────────────────────────────────
  let query = supabase
    .from("events")
    .select(`
      id, title, description, location, location_notes,
      starts_at, ends_at, all_day, event_type, recurring_rule,
      program_id,
      program:programs(slug, name)
    `)
    .eq("is_public", true)
    .eq("is_cancelled", false)
    .order("starts_at", { ascending: true });

  if (!isAll && program) {
    // Get the program's UUID first
    const { data: programRow } = await supabase
      .from("programs")
      .select("id")
      .eq("slug", program.slug)
      .single();

    if (programRow) {
      // Events for this program OR all-programs events (program_id IS NULL)
      query = query.or(`program_id.eq.${programRow.id},program_id.is.null`);
    }
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("[.ics] Supabase error:", error);
    return new NextResponse("Error fetching events", { status: 500 });
  }

  // ── Build iCal feed ───────────────────────────────────────────────────
  const calName = isAll
    ? "Pathfinder — All Programs"
    : `Pathfinder — ${program!.name}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pathfinder.example.com";
  const now     = formatIcsDate(new Date());

  const vevents = (events ?? [])
    .map((evt) => {
      const uid         = `${evt.id}@pathfinder-upms`;
      const dtStamp     = now;
      const summary     = escapeIcs(evt.title);
      const description = evt.description
        ? escapeIcs(evt.description + (evt.location_notes ? `\n\nNote: ${evt.location_notes}` : ""))
        : "";
      const location    = evt.location ? escapeIcs(evt.location) : "";
      const progName    = (evt as any).program?.name ?? "All Programs";

      let dtStart: string;
      let dtEnd: string;

      if (evt.all_day) {
        dtStart = `DTSTART;VALUE=DATE:${evt.starts_at.slice(0, 10).replace(/-/g, "")}`;
        dtEnd   = `DTEND;VALUE=DATE:${evt.ends_at.slice(0, 10).replace(/-/g, "")}`;
      } else {
        dtStart = `DTSTART:${formatIcsDate(new Date(evt.starts_at))}`;
        dtEnd   = `DTEND:${formatIcsDate(new Date(evt.ends_at))}`;
      }

      const lines = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        dtStart,
        dtEnd,
        `SUMMARY:${summary}`,
        description  ? `DESCRIPTION:${description}` : null,
        location     ? `LOCATION:${location}` : null,
        `CATEGORIES:${progName}`,
        evt.recurring_rule ? `RRULE:${evt.recurring_rule}` : null,
        `URL:${siteUrl}/calendar`,
        "END:VEVENT",
      ].filter(Boolean);

      return foldIcsLines(lines as string[]);
    })
    .join("\r\n");

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pathfinder UPMS//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calName}`,
    `X-WR-CALDESC:${calName} — powered by Pathfinder UPMS`,
    "X-WR-TIMEZONE:America/Chicago",
    vevents,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(calendar, {
    status: 200,
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${rawSlug}.ics"`,
      // 5 minute cache — fresh enough for most calendar apps
      "Cache-Control":       "public, max-age=300, s-maxage=300",
    },
  });
}

// ── iCal Helpers ──────────────────────────────────────────────────────────

/** Format a Date to iCal UTC timestamp: 20241015T140000Z */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape iCal special characters in text fields */
function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g,  "\\;")
    .replace(/,/g,  "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * iCal line folding (RFC 5545 §3.1):
 * Lines longer than 75 octets MUST be folded by inserting CRLF + single space.
 */
function foldIcsLines(lines: string[]): string {
  return lines
    .map((line) => {
      if (line.length <= 75) return line;
      const chunks: string[] = [];
      chunks.push(line.slice(0, 75));
      let i = 75;
      while (i < line.length) {
        chunks.push(" " + line.slice(i, i + 74));
        i += 74;
      }
      return chunks.join("\r\n");
    })
    .join("\r\n");
}
