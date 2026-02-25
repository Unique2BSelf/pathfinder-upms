// ─────────────────────────────────────────────────────────────────────────────
// programs.ts — Single source of truth for all 5 Pathfinder programs.
// Used by: landing pages, calendar filters, .ics routes, enrollment forms.
// ─────────────────────────────────────────────────────────────────────────────

export type ProgramSlug =
  | "cub-scouts"
  | "boy-scouts"
  | "rangers"
  | "squadron"
  | "shooting-club";

export interface Program {
  slug: ProgramSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  ageRange: string;
  color: string;          // Tailwind text color
  bgColor: string;        // Tailwind bg color (muted)
  borderColor: string;    // Tailwind border color
  badgeClass: string;     // Tailwind classes for pill badge
  icon: string;           // Emoji fallback icon
  href: string;           // Public landing page URL
  icsRoute: string;       // API route for calendar feed
  features: string[];     // 3–4 bullet highlights for landing page
}

export const PROGRAMS: Program[] = [
  {
    slug: "cub-scouts",
    name: "Cub Scouts",
    shortName: "Cubs",
    tagline: "Adventure starts here.",
    description:
      "For grades K–5, Cub Scouts builds character, citizenship, and outdoors skills through age-appropriate adventures, community service, and hands-on learning.",
    ageRange: "Grades K–5 (Ages 5–10)",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400",
    badgeClass: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
    icon: "🐻",
    href: "/cub-scouts",
    icsRoute: "/api/calendar/cub-scouts.ics",
    features: [
      "Weekly den meetings with hands-on projects",
      "Monthly pack outings and campouts",
      "Annual Pinewood Derby & Blue & Gold Banquet",
      "Arrow of Light — bridge to Boy Scouts",
    ],
  },
  {
    slug: "boy-scouts",
    name: "Boy Scouts",
    shortName: "Scouts",
    tagline: "Lead. Serve. Thrive.",
    description:
      "Troop-based program for ages 11–17 focused on outdoor skills, leadership, community service, and the journey to Eagle Scout rank.",
    ageRange: "Ages 11–17",
    color: "text-forest-400",
    bgColor: "bg-forest-600/10",
    borderColor: "border-forest-600",
    badgeClass: "bg-forest-600/20 text-forest-400 border border-forest-600/40",
    icon: "⚜️",
    href: "/boy-scouts",
    icsRoute: "/api/calendar/boy-scouts.ics",
    features: [
      "High-adventure trips: backpacking, kayaking, climbing",
      "Merit badge program with 137+ options",
      "Leadership positions: SPL, PL, and more",
      "Eagle Scout — one of America's most recognized achievements",
    ],
  },
  {
    slug: "rangers",
    name: "Rangers",
    shortName: "Rangers",
    tagline: "Wilderness. Grit. Purpose.",
    description:
      "An elite outdoor skills program for older youth seeking serious wilderness training, survival skills, and expedition-level adventures.",
    ageRange: "Ages 14–21",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400",
    badgeClass: "bg-blue-400/20 text-blue-300 border border-blue-400/40",
    icon: "🏔️",
    href: "/rangers",
    icsRoute: "/api/calendar/rangers.ics",
    features: [
      "Advanced wilderness survival and navigation",
      "Multi-day backcountry expeditions",
      "Certifications: First Aid, Leave No Trace, Orienteering",
      "Staff positions available for older Rangers",
    ],
  },
  {
    slug: "squadron",
    name: "Squadron",
    shortName: "Squadron",
    tagline: "Sky's the limit.",
    description:
      "An aviation and STEM-focused program introducing youth to flight principles, aerospace careers, and hands-on projects in partnership with local aviation resources.",
    ageRange: "Ages 12–18",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400",
    badgeClass: "bg-purple-400/20 text-purple-300 border border-purple-400/40",
    icon: "✈️",
    href: "/squadron",
    icsRoute: "/api/calendar/squadron.ics",
    features: [
      "Flight simulation and ground school basics",
      "STEM projects: rocketry, drones, and more",
      "Airport tours and aviation professional Q&As",
      "Pathway to Civil Air Patrol and pilot certification",
    ],
  },
  {
    slug: "shooting-club",
    name: "Cedar Sports Shooting Club",
    shortName: "Shooting Club",
    tagline: "Safety. Precision. Sportsmanship.",
    description:
      "A structured, safety-first program teaching marksmanship fundamentals with .22 rifle, shotgun, and archery under certified NRA and USA Archery instructors.",
    ageRange: "Ages 10–18",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500",
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    icon: "🎯",
    href: "/shooting-club",
    icsRoute: "/api/calendar/shooting-club.ics",
    features: [
      "NRA certified .22 rifle and shotgun instruction",
      "USA Archery certified coaching",
      "State and regional competition opportunities",
      "Gun safety and responsible ownership curriculum",
    ],
  },
];

// Helper: look up a program by slug
export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

// Helper: all slugs (for generateStaticParams, .ics routes, etc.)
export const PROGRAM_SLUGS = PROGRAMS.map((p) => p.slug);
