import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminAlertsClient from "./AdminAlertsClient";

export const metadata = { title: "Admin Alerts | Pathfinder" };

export default async function AdminAlertsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Role gate — only admins and leaders
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["admin", "superadmin", "leader"];
  if (!userData || !allowedRoles.includes(userData.role)) {
    redirect("/dashboard");
  }

  // Fetch alerts with household info
  const { data: alerts } = await supabase
    .from("admin_alerts")
    .select(`
      id, type, message, status, created_at, read_at,
      household:households(id, family_name),
      youth:youth_members(id, first_name, last_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const unreadCount = (alerts ?? []).filter((a) => a.status === "unread").length;

  return (
    <AdminAlertsClient
      initialAlerts={alerts ?? []}
      unreadCount={unreadCount}
    />
  );
}
