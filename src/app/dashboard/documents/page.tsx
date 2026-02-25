import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  FileText, Upload, CheckCircle2, Clock,
  XCircle, AlertTriangle, Filter
} from "lucide-react";

export const metadata = { title: "Documents | Pathfinder" };

function statusIcon(status: string) {
  switch (status) {
    case "signed":   return <CheckCircle2 className="w-4 h-4 text-forest-400" />;
    case "pending":  return <Clock        className="w-4 h-4 text-amber-400"  />;
    case "expired":  return <XCircle      className="w-4 h-4 text-red-400"    />;
    case "rejected": return <XCircle      className="w-4 h-4 text-red-400"    />;
    default:         return <FileText     className="w-4 h-4 text-slate-500"  />;
  }
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    signed:   "badge-green",
    pending:  "badge-gold",
    expired:  "badge-red",
    rejected: "badge-red",
  };
  return map[status] ?? "badge-slate";
}

function typeIcon(type: string) {
  switch (type) {
    case "physical": return "🩺";
    case "waiver":   return "📝";
    case "bsa_app":  return "⚜️";
    default:         return "📄";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "physical": return "Physical Exam";
    case "waiver":   return "Waiver";
    case "bsa_app":  return "BSA Application";
    default:         return "Document";
  }
}

export default async function DocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!userData?.household_id) redirect("/auth/onboarding");

  // Load all youth in household, with their documents
  const { data: youth } = await supabase
    .from("youth_members")
    .select(`
      id, first_name, last_name,
      documents(
        id, type, status, title, expiration_date, signed_at, created_at, notes
      )
    `)
    .eq("household_id", userData.household_id)
    .order("first_name");

  const members = (youth ?? []) as any[];

  // Flatten into a single list with member reference, sorted by status priority then date
  type FlatDoc = {
    id: string; type: string; status: string; title: string | null;
    expiration_date: string | null; signed_at: string | null;
    created_at: string; notes: string | null;
    member: { id: string; first_name: string; last_name: string };
  };

  const statusOrder = { pending: 0, expired: 1, rejected: 2, signed: 3 };

  const allDocs: FlatDoc[] = members
    .flatMap((m) =>
      (m.documents ?? []).map((d: any) => ({
        ...d,
        member: { id: m.id, first_name: m.first_name, last_name: m.last_name },
      }))
    )
    .sort((a, b) => {
      const so = (statusOrder[a.status as keyof typeof statusOrder] ?? 9)
               - (statusOrder[b.status as keyof typeof statusOrder] ?? 9);
      if (so !== 0) return so;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pendingCount = allDocs.filter((d) => d.status === "pending").length;
  const expiredCount = allDocs.filter((d) => d.status === "expired").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 text-sm mt-1">
            Waivers, physicals, and applications across all youth members.
          </p>
        </div>
        <Link href="/dashboard/members" className="btn-outline px-4 py-2.5 rounded-xl text-sm
                                                    flex items-center gap-2">
          <Upload className="w-3.5 h-3.5" /> Upload Physical
        </Link>
      </div>

      {/* Summary strip */}
      {(pendingCount > 0 || expiredCount > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {pendingCount > 0 && (
            <div className="card p-4 border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {pendingCount === 1 ? "Requires" : "Require"} your signature
              </p>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="card p-4 border border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-semibold text-sm">
                  {expiredCount} Expired
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">Need to be renewed</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {allDocs.length === 0 && (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="font-semibold text-white mb-1">No documents yet</p>
          <p className="text-slate-500 text-sm mb-6">
            Upload a physical exam to get started, or wait for an admin to send a waiver.
          </p>
          <Link href="/dashboard/members" className="btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
            Go to Members →
          </Link>
        </div>
      )}

      {/* Document list — grouped by member */}
      {members.map((member: any) => {
        const memberDocs = allDocs.filter((d) => d.member.id === member.id);
        if (memberDocs.length === 0) return null;

        return (
          <div key={member.id} className="space-y-2">
            {/* Member header */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40
                              flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
                {member.first_name[0]}
              </div>
              <span className="text-sm font-semibold text-slate-300">
                {member.first_name} {member.last_name}
              </span>
            </div>

            {/* Document rows */}
            {memberDocs.map((doc) => {
              const isExpiringSoon = doc.expiration_date
                ? Math.ceil((new Date(doc.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 60
                : false;

              return (
                <div key={doc.id} className="card p-4 flex items-center gap-4">
                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center
                                  justify-center text-xl flex-shrink-0">
                    {typeIcon(doc.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm truncate">
                        {doc.title ?? typeLabel(doc.type)}
                      </p>
                      <span className={`${statusClass(doc.status)} text-[10px]`}>
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {typeLabel(doc.type)}
                      {doc.signed_at
                        ? ` · Uploaded ${new Date(doc.signed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : doc.created_at
                        ? ` · Added ${new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : ""}
                    </p>
                    {doc.expiration_date && (
                      <p className={`text-xs mt-0.5 flex items-center gap-1
                        ${isExpiringSoon ? "text-amber-400" : "text-slate-500"}`}>
                        {isExpiringSoon && <AlertTriangle className="w-2.5 h-2.5" />}
                        Expires {new Date(doc.expiration_date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </p>
                    )}
                  </div>

                  {/* Status icon + action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {statusIcon(doc.status)}
                    {doc.status === "pending" && (
                      <Link href={`/dashboard/documents/${doc.id}/sign`}
                        className="btn-gold text-xs px-3 py-1.5 rounded-lg font-semibold">
                        Sign
                      </Link>
                    )}
                    {doc.status === "expired" && doc.type === "physical" && (
                      <Link href={`/dashboard/members/${doc.member.id}/upload-physical`}
                        className="btn-outline text-xs px-3 py-1.5 rounded-lg">
                        Renew
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Members with no docs */}
      {members.some((m: any) => (m.documents ?? []).length === 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs text-slate-600">Members with no documents</span>
          </div>
          {members
            .filter((m: any) => (m.documents ?? []).length === 0)
            .map((member: any) => (
              <div key={member.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center
                                  justify-center text-slate-400 text-sm font-bold">
                    {member.first_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-slate-500">No documents on file</p>
                  </div>
                </div>
                <Link href={`/dashboard/members/${member.id}/upload-physical`}
                  className="btn-outline text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                  <Upload className="w-3 h-3" /> Upload Physical
                </Link>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
