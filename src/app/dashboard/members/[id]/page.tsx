import { redirect, notFound } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle,
  ShieldAlert, Calendar, Edit, Clock, XCircle
} from "lucide-react";

export const metadata = { title: "Member Profile | Pathfinder" };

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active:   "badge-green",
    pending:  "badge-gold",
    inactive: "badge-slate",
    waitlist: "badge-slate",
    signed:   "badge-green",
    expired:  "badge-red",
    rejected: "badge-red",
  };
  return map[status] ?? "badge-slate";
}

function docIcon(type: string) {
  switch (type) {
    case "physical": return "🩺";
    case "waiver":   return "📝";
    case "bsa_app":  return "⚜️";
    default:         return "📄";
  }
}

export default async function MemberDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify this youth belongs to the authenticated user's household
  const { data: userData } = await supabase
    .from("users")
    .select("household_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.household_id) redirect("/auth/onboarding");

  const { data: member } = await supabase
    .from("youth_members")
    .select(`
      id, first_name, last_name, preferred_name, dob, gender, grade,
      school_name, shirt_size, known_allergies, medications,
      medical_alert_flag, physical_expiration, household_id,
      enrollments(
        id, status, join_date,
        program:programs(id, slug, name, short_name)
      ),
      documents(
        id, type, status, title, expiration_date, signed_at, created_at, notes
      )
    `)
    .eq("id", params.id)
    .single();

  if (!member) notFound();

  // Security: parent can only view their own household's youth
  const isAdmin = ["admin", "superadmin", "leader"].includes(userData.role ?? "");
  if (member.household_id !== userData.household_id && !isAdmin) {
    redirect("/dashboard/members");
  }

  const age = member.dob
    ? Math.floor((Date.now() - new Date(member.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const enrollments = (member.enrollments ?? []) as any[];
  const documents   = ((member.documents  ?? []) as any[])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const hasPhysical    = documents.some((d) => d.type === "physical" && d.status === "signed");
  const pendingWaivers = documents.filter((d) => d.type === "waiver" && d.status === "pending");

  // Physical expiry
  let physicalDaysLeft: number | null = null;
  if (member.physical_expiration) {
    physicalDaysLeft = Math.ceil(
      (new Date(member.physical_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Back */}
      <Link href="/dashboard/members"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300
                   text-sm transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All Members
      </Link>

      {/* ── Hero card ───────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-700
                          flex items-center justify-center text-amber-400 font-bold text-2xl flex-shrink-0">
            {member.first_name[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {member.first_name}{" "}
                  {member.preferred_name ? `"${member.preferred_name}" ` : ""}
                  {member.last_name}
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {age !== null ? `Age ${age}` : ""}
                  {age !== null && member.grade !== null ? " · " : ""}
                  {member.grade !== null
                    ? member.grade === 0 ? "Kindergarten" : `Grade ${member.grade}`
                    : ""}
                  {member.school_name ? ` · ${member.school_name}` : ""}
                </p>
              </div>

              <Link href={`/dashboard/members/${member.id}/edit`}
                className="btn-outline px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 flex-shrink-0">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
            </div>

            {/* Medical alert */}
            {member.medical_alert_flag && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg
                              bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Medical Alert:</strong>{" "}
                  {[member.known_allergies, member.medications].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Needs Attention ─────────────────────────────────────────── */}
      {(pendingWaivers.length > 0 || !hasPhysical) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
          </p>
          {!hasPhysical && (
            <Link href={`/dashboard/members/${member.id}/upload-physical`}
              className="card flex items-center gap-3 p-4 border border-red-500/30
                         hover:border-red-500/60 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Upload Physical Exam</p>
                <p className="text-slate-500 text-xs">Required for all program activities</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-600 rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {pendingWaivers.map((doc: any) => (
            <Link key={doc.id} href={`/dashboard/documents/${doc.id}/sign`}
              className="card flex items-center gap-3 p-4 border border-red-500/30
                         hover:border-red-500/60 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">
                  Sign Waiver: {doc.title ?? "Required Waiver"}
                </p>
                <p className="text-slate-500 text-xs">Signature required before next event</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-600 rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      )}

      {/* ── Two-column grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Program Enrollments */}
        <div className="card p-5">
          <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-forest-400" /> Programs
          </h2>
          {enrollments.length === 0 ? (
            <p className="text-slate-500 text-sm">Not enrolled in any programs.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{e.program?.name}</span>
                  <span className={`${statusBadge(e.status)} text-[10px]`}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Physical Status */}
        <div className="card p-5">
          <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Physical Status
          </h2>
          {hasPhysical ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-forest-400 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Physical on file
              </div>
              {member.physical_expiration && (
                <div className={`flex items-center gap-2 text-sm
                  ${physicalDaysLeft !== null && physicalDaysLeft <= 14 ? "text-red-400"
                  : physicalDaysLeft !== null && physicalDaysLeft <= 60 ? "text-amber-400"
                  : "text-slate-400"}`}>
                  <Clock className="w-4 h-4" />
                  Expires {new Date(member.physical_expiration).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric"
                  })}
                  {physicalDaysLeft !== null && physicalDaysLeft <= 60 && (
                    <span className="text-xs">({physicalDaysLeft}d)</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle className="w-4 h-4" /> No physical on file
              </div>
              <Link href={`/dashboard/members/${member.id}/upload-physical`}
                className="btn-primary text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5">
                <Upload className="w-3 h-3" /> Upload Now
              </Link>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="card p-5">
          <h2 className="font-semibold text-white text-sm mb-4">Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Date of Birth", value: member.dob
                ? new Date(member.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "—" },
              { label: "Gender",     value: member.gender     ?? "—" },
              { label: "Shirt Size", value: member.shirt_size ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-300 capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Medical */}
        <div className="card p-5">
          <h2 className="font-semibold text-white text-sm mb-4">Medical Info</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500 mb-0.5">Allergies</dt>
              <dd className="text-slate-300">
                {member.known_allergies || <span className="text-slate-600 italic">None on file</span>}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-0.5">Medications</dt>
              <dd className="text-slate-300">
                {member.medications || <span className="text-slate-600 italic">None on file</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── Documents ────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white text-sm">Documents</h2>
          <Link href={`/dashboard/members/${member.id}/upload-physical`}
            className="btn-ghost text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Upload className="w-3 h-3" /> Upload
          </Link>
        </div>

        {documents.length === 0 ? (
          <p className="text-slate-500 text-sm">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.id}
                className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{docIcon(doc.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {doc.title ?? doc.type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.signed_at
                        ? `Uploaded ${new Date(doc.signed_at).toLocaleDateString()}`
                        : `Added ${new Date(doc.created_at).toLocaleDateString()}`}
                      {doc.expiration_date
                        ? ` · Expires ${new Date(doc.expiration_date).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>
                <span className={`${statusBadge(doc.status)} text-[10px]`}>{doc.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
