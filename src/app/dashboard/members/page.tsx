import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Plus, ChevronRight, ShieldAlert, CheckCircle2,
  AlertTriangle, Users, FileText
} from "lucide-react";

export const metadata = { title: "Youth Members | Pathfinder" };

export default async function MembersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!userData?.household_id) redirect("/auth/onboarding");

  const { data: youth } = await supabase
    .from("youth_members")
    .select(`
      id, first_name, last_name, dob, grade, shirt_size,
      known_allergies, medications, medical_alert_flag, physical_expiration,
      enrollments(
        id, status,
        program:programs(id, slug, name, short_name)
      ),
      documents(id, type, status)
    `)
    .eq("household_id", userData.household_id)
    .order("first_name");

  const members = (youth ?? []) as any[];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Youth Members</h1>
          <p className="text-slate-400 text-sm mt-1">
            {members.length === 0
              ? "No youth members yet."
              : `${members.length} member${members.length !== 1 ? "s" : ""} in your household`}
          </p>
        </div>
        <Link href="/dashboard/members/add" className="btn-gold px-5 py-3 rounded-xl
                                                        font-semibold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </Link>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="font-semibold text-white mb-1">No youth members yet</p>
          <p className="text-slate-500 text-sm mb-6">
            Add your first youth member to get started with enrollment and documents.
          </p>
          <Link href="/dashboard/members/add" className="btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Member
          </Link>
        </div>
      )}

      {/* Member cards */}
      <div className="space-y-3">
        {members.map((member: any) => {
          const age = member.dob
            ? Math.floor((Date.now() - new Date(member.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null;
          const activeEnrollments = (member.enrollments ?? []).filter(
            (e: any) => e.status === "active" || e.status === "pending"
          );
          const docs           = (member.documents ?? []);
          const hasPhysical    = docs.some((d: any) => d.type === "physical");
          const pendingWaivers = docs.filter((d: any) => d.type === "waiver" && d.status === "pending").length;

          // Physical expiry warning
          let physicalWarning: string | null = null;
          if (member.physical_expiration) {
            const daysLeft = Math.ceil(
              (new Date(member.physical_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            if (daysLeft <= 0)  physicalWarning = "Physical expired";
            else if (daysLeft <= 60) physicalWarning = `Physical expires in ${daysLeft}d`;
          }

          return (
            <Link
              key={member.id}
              href={`/dashboard/members/${member.id}`}
              className="card-hover flex items-start gap-4 p-5 group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40
                              flex items-center justify-center text-amber-400 font-bold text-lg
                              flex-shrink-0">
                {member.first_name[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white">
                    {member.first_name} {member.last_name}
                  </p>
                  {member.medical_alert_flag && (
                    <span className="badge-red text-[10px] flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5" /> Medical Alert
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-xs mt-0.5">
                  {age !== null ? `Age ${age}` : ""}
                  {age !== null && member.grade !== null ? " · " : ""}
                  {member.grade !== null
                    ? member.grade === 0 ? "Kindergarten" : `Grade ${member.grade}`
                    : ""}
                </p>

                {/* Programs */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeEnrollments.length === 0 ? (
                    <span className="badge-slate text-[10px]">Not enrolled</span>
                  ) : (
                    activeEnrollments.map((e: any) => (
                      <span key={e.id} className="badge-green text-[10px]">
                        {e.program?.short_name}
                      </span>
                    ))
                  )}
                </div>

                {/* Status row */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                  {hasPhysical && !physicalWarning ? (
                    <span className="flex items-center gap-1 text-forest-400">
                      <CheckCircle2 className="w-3 h-3" /> Physical on file
                    </span>
                  ) : physicalWarning ? (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3" /> {physicalWarning}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-3 h-3" /> No physical
                    </span>
                  )}

                  {pendingWaivers > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <FileText className="w-3 h-3" />
                      {pendingWaivers} unsigned waiver{pendingWaivers !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300
                                       group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
