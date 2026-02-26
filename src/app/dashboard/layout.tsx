import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard, Users, FileText, Settings,
  Mountain, LogOut, Bell, Calendar, DollarSign, Shield
} from "lucide-react";

const NAV = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Action Center" },
  { href: "/dashboard/members",  icon: Users,           label: "Youth Members" },
  { href: "/dashboard/documents",icon: FileText,        label: "Documents"     },
  { href: "/dashboard/profile",  icon: Settings,        label: "Profile"       },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single();

  // Count unread admin alerts (admin/leader only)
  let alertCount = 0;
  if (userData?.role && ["admin", "superadmin", "leader"].includes(userData.role)) {
    const { count } = await supabase
      .from("admin_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread");
    alertCount = count ?? 0;
  }

  const displayName = userData
    ? `${userData.first_name} ${userData.last_name}`.trim() || user.email
    : user.email;

  return (
    <div className="flex min-h-dvh bg-slate-900">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800
                        bg-slate-900 sticky top-0 h-dvh">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center flex-shrink-0">
            <Mountain className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Pathfinder</div>
            <div className="text-[10px] text-slate-500 leading-tight">Family Portal</div>
          </div>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <SidebarLink key={item.href} {...item} />
          ))}

          {/* Admin section */}
          {userData?.role && ["admin", "superadmin", "leader"].includes(userData.role) && (
            <>
              <div className="pt-4 pb-1 px-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Admin
                </span>
              </div>
              <SidebarLink
                href="/dashboard/admin/alerts"
                icon={Bell}
                label="Alerts"
                badge={alertCount > 0 ? alertCount : undefined}
              />
              <SidebarLink
                href="/dashboard/admin/roster"
                icon={Users}
                label="Global Roster"
              />
              <SidebarLink
                href="/dashboard/admin/events"
                icon={Calendar}
                label="Events"
              />
              <SidebarLink
                href="/dashboard/admin/registration"
                icon={FileText}
                label="Registration"
              />
              <SidebarLink
                href="/dashboard/admin/financials"
                icon={DollarSign}
                label="Financials"
              />
              <SidebarLink
                href="/dashboard/admin/crm"
                icon={LayoutDashboard}
                label="CRM"
              />
              <SidebarLink
                href="/dashboard/admin/waivers"
                icon={Shield}
                label="Waivers"
              />
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40
                            flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
              {(userData?.first_name?.[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{displayName}</div>
              <div className="text-xs text-slate-500 capitalize">{userData?.role ?? "parent"}</div>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                         text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800
                           px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest-600 flex items-center justify-center">
              <Mountain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Pathfinder</span>
          </Link>
          <MobileNav role={userData?.role} alertCount={alertCount} />
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Sidebar link (Server Component — no active state highlighting) ──────────
// Active styling is handled via client component below
function SidebarLink({
  href, icon: Icon, label, badge
}: {
  href: string; icon: any; label: string; badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
                 min-h-[44px] group"
    >
      <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-amber-400 transition-colors" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold
                          flex items-center justify-center flex-shrink-0">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

// ── Minimal mobile nav ──────────────────────────────────────────────────────
function MobileNav({ role, alertCount }: { role?: string; alertCount: number }) {
  return (
    <div className="flex items-center gap-2">
      {role && ["admin","superadmin","leader"].includes(role) && alertCount > 0 && (
        <Link href="/dashboard/admin/alerts"
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </Link>
      )}
      <Link href="/dashboard/profile"
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
        <Settings className="w-4 h-4" />
      </Link>
    </div>
  );
}
