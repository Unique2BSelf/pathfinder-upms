import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  FileText, ShieldAlert, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Upload, PenLine, Sparkles
} from "lucide-react";
import type { ActionItem, YouthMember, Document } from "@/types";

// ── Action item derivation ─────────────────────────────────────────────────
function deriveActionItems(
  youth: (YouthMember & { documents: Document[] })[],
): ActionItem[] {
  const items: ActionItem[] = [];
  const today = new Date();

  for (const member of youth) {
    const youthRef = {
      id:         member.id,
      first_name: member.first_name,
      last_name:  member.last_name,
    };

    // 1. Unsigned waivers pushed to this member
    const unsignedWaivers = member.documents.filter(
      (d) => d.type === "waiver" && d.status === "pending"
    );
    for (const doc of unsignedWaivers) {
      items.push({
        id:          `waiver-${doc.id}`,
        kind:        "unsigned_waiver",
        title:       `Sign Waiver: ${doc.title ?? "Required Waiver"}`,
        description: `${member.first_name} has an unsigned waiver that needs your signature before the next event.`,
        youth:       youthRef,
        href:        `/dashboard/documents/${doc.id}/sign`,
        urgency:     "high",
        document:    doc,
      });
    }

    // 2. Missing physical entirely
    const hasPhysical = member.documents.some((d) => d.type === "physical");
    if (!hasPhysical) {
      items.push({
        id:      `physical-missing-${member.id}`,
        kind:    "missing_physical",
        title:   `Upload Physical — ${member.first_name}`,
        description: `A current physical exam is required for all activities. Upload ${member.first_name}'s physical to complete their profile.`,
        youth:   youthRef,
        href:    `/dashboard/members/${member.id}/upload-physical`,
        urgency: "high",
      });
    }

    // 3. Expiring physical (within 60 days)
    if (member.physical_expiration) {
      const expiry = new Date(member.physical_expiration);
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
        items.push({
          id:          `physical-expiring-${member.id}`,
          kind:        "expiring_physical",
          title:       `Physical Expiring Soon — ${member.first_name}`,
          description: `${member.first_name}'s physical expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}. Upload a new one to stay current.`,
          youth:       youthRef,
          href:        `/dashboard/members/${member.id}/upload-physical`,
          urgency:     daysUntilExpiry <= 14 ? "high" : "medium",
        });
      }
    }
  }

  // Sort: high urgency first
  return items.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  });
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { welcome?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch user + household
  const { data: userData } = await supabase
    .from("users")
    .select("id, first_name, last_name, household_id")
    .eq("id", user.id)
    .single();

  if (!userData?.household_id) redirect("/auth/onboarding");

  // Fetch all youth in household with their documents
  const { data: youth } = await supabase
    .from("youth_members")
    .select(`
      id, first_name, last_name, dob, physical_expiration, medical_alert_flag,
      documents(id, type, status, title, expiration_date, created_at),
      enrollments(id, status, program:programs(id, slug, name, short_name))
    `)
    .eq("household_id", userData.household_id)
    .order("first_name");

  const typedYouth = (youth ?? []) as any[];
  const actionItems = deriveActionItems(typedYouth);
  const highItems   = actionItems.filter((i) => i.urgency === "high");
  const medItems    = actionItems.filter((i) => i.urgency === "medium");
  const isWelcome   = searchParams.welcome === "1";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Welcome Banner ──────────────────────────────────────────── */}
      {isWelcome && (
        <div className="rounded-2xl bg-gradient-to-r from-forest-600/30 to-amber-500/20
                        border border-forest-600/40 p-5 flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white text-sm mb-0.5">
              Welcome to Pathfinder, {userData.first_name}! 🎉
            </p>
            <p className="text-slate-400 text-sm">
              Your family account is set up. Complete the items below to get your youth fully enrolled.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Action Center</h1>
        <p className="text-slate-400 text-sm mt-1">
          {actionItems.length === 0
            ? "You're all caught up — nothing needs your attention right now."
            : `${actionItems.length} item${actionItems.length !== 1 ? "s" : ""} need${actionItems.length === 1 ? "s" : ""} your attention.`}
        </p>
      </div>

      {/* ── Needs Attention ─────────────────────────────────────────── */}
      {actionItems.length > 0 ? (
        <div className="space-y-6">
          {/* High urgency */}
          {highItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                  Needs Attention
                </h2>
              </div>
              <div className="space-y-3">
                {highItems.map((item) => (
                  <ActionCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Medium urgency */}
          {medItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  Coming Up
                </h2>
              </div>
              <div className="space-y-3">
                {medItems.map((item) => (
                  <ActionCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-forest-500 mx-auto mb-3" />
          <p className="font-semibold text-white mb-1">All clear!</p>
          <p className="text-slate-400 text-sm">No pending waivers, missing physicals, or expiring documents.</p>
        </div>
      )}

      {/* ── Youth Member Cards ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Youth Members</h2>
          <Link href="/dashboard/members/add"
            className="btn-outline text-sm px-4 py-2 rounded-lg">
            + Add Member
          </Link>
        </div>

        {typedYouth.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-slate-500 text-sm">No youth members yet.</p>
            <Link href="/dashboard/members/add"
              className="btn-primary text-sm px-5 py-2 rounded-lg mt-3 inline-flex">
              Add Your First Youth Member
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typedYouth.map((member: any) => (
              <YouthCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Action Item Card ──────────────────────────────────────────────────────
function ActionCard({ item }: { item: ActionItem }) {
  const config = {
    unsigned_waiver:   { icon: PenLine,     color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/30"    },
    missing_physical:  { icon: ShieldAlert, color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/30"    },
    expiring_physical: { icon: Clock,       color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-500/30"  },
    low_balance:       { icon: FileText,    color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/30"   },
  }[item.kind];

  const Icon = config.icon;

  return (
    <Link href={item.href}
      className={`card-hover flex items-start gap-4 p-4 border ${config.border} group`}>
      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm leading-snug mb-0.5">{item.title}</p>
        <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
        <p className="text-xs text-slate-600 mt-1.5">
          👤 {item.youth.first_name} {item.youth.last_name}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300
                              group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
    </Link>
  );
}

// ── Youth Member Summary Card ─────────────────────────────────────────────
function YouthCard({ member }: { member: any }) {
  const enrollments = (member.enrollments ?? []).filter((e: any) => e.status === "active" || e.status === "pending");
  const docs        = (member.documents  ?? []) as Document[];
  const hasPhysical = docs.some((d) => d.type === "physical");
  const pendingDocs = docs.filter((d) => d.status === "pending").length;

  return (
    <Link href={`/dashboard/members/${member.id}`} className="card-hover p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-white">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {member.dob
              ? `Age ${Math.floor((Date.now() - new Date(member.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}`
              : ""}
          </p>
        </div>
        {member.medical_alert_flag && (
          <span className="badge-red text-[10px]">⚠ Medical</span>
        )}
      </div>

      {/* Programs */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {enrollments.length === 0 ? (
          <span className="badge-slate text-[10px]">No programs</span>
        ) : (
          enrollments.map((e: any) => (
            <span key={e.id} className="badge-green text-[10px]">
              {e.program?.short_name}
            </span>
          ))
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-3 text-xs border-t border-slate-700 pt-3">
        <span className={`flex items-center gap-1 ${hasPhysical ? "text-forest-400" : "text-red-400"}`}>
          {hasPhysical
            ? <><CheckCircle2 className="w-3 h-3" /> Physical on file</>
            : <><AlertTriangle className="w-3 h-3" /> No physical</>}
        </span>
        {pendingDocs > 0 && (
          <span className="flex items-center gap-1 text-amber-400 ml-auto">
            <Upload className="w-3 h-3" /> {pendingDocs} pending
          </span>
        )}
      </div>
    </Link>
  );
}
