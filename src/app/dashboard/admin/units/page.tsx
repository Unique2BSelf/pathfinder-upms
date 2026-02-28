import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UnitsClient from "./UnitsClient";

export default async function UnitsPage() {
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
    redirect("/dashboard");
  }

  return <UnitsClient />;
}
