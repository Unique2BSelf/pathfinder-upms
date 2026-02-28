import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdvancementGridClient from "./AdvancementGridClient";

export default async function AdvancementPage({
  searchParams,
}: {
  searchParams: { patrol?: string; rank?: string; program?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Check role - only admin/leader can access
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["admin", "superadmin", "leader"];
  if (!userData?.role || !allowedRoles.includes(userData.role)) {
    // Parents get redirected to dashboard
    redirect("/dashboard");
  }

  return (
    <AdvancementGridClient
      initialPatrol={searchParams.patrol}
      initialRank={searchParams.rank}
      initialProgram={searchParams.program}
    />
  );
}
