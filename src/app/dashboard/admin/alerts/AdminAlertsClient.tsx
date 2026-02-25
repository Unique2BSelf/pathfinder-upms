"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell, CheckCheck, X, MapPin, Phone,
  ShieldAlert, FileText, Users, RefreshCw, Filter
} from "lucide-react";

type Alert = {
  id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
  read_at: string | null;
  household: { id: string; family_name: string } | null;
  youth: { id: string; first_name: string; last_name: string } | null;
};

type FilterState = "all" | "unread" | "read";

function alertIcon(type: string) {
  switch (type) {
    case "profile_update":   return <MapPin      className="w-4 h-4 text-amber-400" />;
    case "medical_expiring": return <ShieldAlert className="w-4 h-4 text-red-400"   />;
    case "waiver_pending":   return <FileText    className="w-4 h-4 text-blue-400"  />;
    case "new_enrollment":   return <Users       className="w-4 h-4 text-forest-400"/>;
    case "low_balance":      return <Phone       className="w-4 h-4 text-purple-400"/>;
    default:                 return <Bell        className="w-4 h-4 text-slate-400" />;
  }
}

function alertBg(type: string, status: string) {
  if (status !== "unread") return "bg-slate-800/40";
  switch (type) {
    case "profile_update":   return "bg-amber-500/5  border-amber-500/20";
    case "medical_expiring": return "bg-red-500/5    border-red-500/20";
    case "waiver_pending":   return "bg-blue-500/5   border-blue-500/20";
    case "new_enrollment":   return "bg-forest-600/5 border-forest-600/20";
    default:                 return "bg-slate-800/60 border-slate-700";
  }
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    profile_update:   "Profile Change",
    medical_expiring: "Medical Expiring",
    waiver_pending:   "Waiver Pending",
    new_enrollment:   "New Enrollment",
    low_balance:      "Low Balance",
    document_uploaded:"Document Uploaded",
  };
  return map[type] ?? type;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminAlertsClient({
  initialAlerts,
  unreadCount: initialUnread,
}: {
  initialAlerts: Alert[];
  unreadCount: number;
}) {
  const supabase = createClient();

  const [alerts,      setAlerts]      = useState<Alert[]>(initialAlerts);
  const [filter,      setFilter]      = useState<FilterState>("all");
  const [loading,     setLoading]     = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const unreadCount = alerts.filter((a) => a.status === "unread").length;

  const displayed = alerts.filter((a) => {
    if (filter === "unread") return a.status === "unread";
    if (filter === "read")   return a.status === "read";
    return a.status !== "dismissed";
  });

  // ── Mark single alert as read ─────────────────────────────────────────
  async function markRead(id: string) {
    setActioningId(id);
    const { error } = await supabase
      .from("admin_alerts")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "read", read_at: new Date().toISOString() } : a
        )
      );
    }
    setActioningId(null);
  }

  // ── Dismiss alert ─────────────────────────────────────────────────────
  async function dismiss(id: string) {
    setActioningId(id);
    const { error } = await supabase
      .from("admin_alerts")
      .update({ status: "dismissed" })
      .eq("id", id);

    if (!error) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
    setActioningId(null);
  }

  // ── Mark all unread as read ───────────────────────────────────────────
  async function markAllRead() {
    setLoading(true);
    const unreadIds = alerts.filter((a) => a.status === "unread").map((a) => a.id);
    const { error } = await supabase
      .from("admin_alerts")
      .update({ status: "read", read_at: new Date().toISOString() })
      .in("id", unreadIds);

    if (!error) {
      const now = new Date().toISOString();
      setAlerts((prev) =>
        prev.map((a) =>
          a.status === "unread" ? { ...a, status: "read", read_at: now } : a
        )
      );
    }
    setLoading(false);
  }

  // ── Refresh from DB ───────────────────────────────────────────────────
  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("admin_alerts")
      .select(`
        id, type, message, status, created_at, read_at,
        household:households(id, family_name),
        youth:youth_members(id, first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) { const formatted = data.map((a: any) => ({ ...a, household: a.household?.[0], youth: a.youth?.[0] })); setAlerts(formatted as Alert[]); }
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Admin Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Profile changes, medical flags, and system notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={loading}
              className="btn-outline px-4 py-2.5 rounded-xl text-sm flex items-center gap-2
                         disabled:opacity-50">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button onClick={refresh} disabled={loading}
            className="btn-ghost p-2.5 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg bg-slate-800 p-1 gap-1 w-fit">
        {(["all", "unread", "read"] as FilterState[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all
              ${filter === f
                ? "bg-slate-700 text-white shadow"
                : "text-slate-500 hover:text-slate-300"}`}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="font-semibold text-white mb-1">
            {filter === "unread" ? "No unread alerts" : "No alerts"}
          </p>
          <p className="text-slate-500 text-sm">
            {filter === "unread"
              ? "All caught up! New alerts appear here when families update their profiles."
              : "Profile changes, medical flags, and enrollment events will appear here."}
          </p>
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-2">
        {displayed.map((alert) => (
          <div
            key={alert.id}
            className={`card border flex items-start gap-4 p-4 transition-opacity
              ${alertBg(alert.type, alert.status)}
              ${actioningId === alert.id ? "opacity-50" : ""}`}
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center
                            justify-center flex-shrink-0 mt-0.5">
              {alertIcon(alert.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {typeLabel(alert.type)}
                </span>
                {alert.status === "unread" && (
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
              </div>

              <p className="text-white text-sm leading-relaxed">{alert.message}</p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {alert.household && (
                  <span className="text-xs text-slate-500">
                    🏠 {alert.household.family_name}
                  </span>
                )}
                {alert.youth && (
                  <span className="text-xs text-slate-500">
                    👤 {alert.youth.first_name} {alert.youth.last_name}
                  </span>
                )}
                <span className="text-xs text-slate-600">{timeAgo(alert.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {alert.status === "unread" && (
                <button
                  onClick={() => markRead(alert.id)}
                  disabled={actioningId === alert.id}
                  className="p-2 rounded-lg text-slate-500 hover:text-forest-400
                             hover:bg-forest-600/10 transition-colors"
                  title="Mark as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => dismiss(alert.id)}
                disabled={actioningId === alert.id}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400
                           hover:bg-red-500/10 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      {displayed.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <Filter className="w-3 h-3 text-slate-700" />
          <p className="text-xs text-slate-700">
            Address and phone changes are flagged automatically via database triggers.
            Dismissed alerts are hidden but not deleted.
          </p>
        </div>
      )}
    </div>
  );
}
