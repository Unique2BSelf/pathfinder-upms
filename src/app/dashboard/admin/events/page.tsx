"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, X, AlertTriangle, List, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import CalendarView from "@/components/CalendarView";

const EVENT_TYPES = ["meeting", "campout", "service", "fundraiser", "competition", "ceremony", "trip", "other"];

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("events").select("*, program:programs(id, name, slug)").order("starts_at"),
      supabase.from("programs").select("*")
    ]).then(([e, p]) => {
      setEvents(e.data || []);
      setPrograms(p.data || []);
    });
  }, [supabase]);

  const filtered = filter === "all" ? events : events.filter(e => e.program?.slug === filter);

  const startEdit = (event: any) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      program_id: event.program_id || "",
      location: event.location || "",
      starts_at: event.starts_at?.slice(0, 16),
      ends_at: event.ends_at?.slice(0, 16),
      is_public: event.is_public,
      rsvp_enabled: event.rsvp_enabled,
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    await supabase.from("events").update({
      title: editForm.title,
      description: editForm.description,
      event_type: editForm.event_type,
      program_id: editForm.program_id || null,
      location: editForm.location,
      starts_at: editForm.starts_at,
      ends_at: editForm.ends_at,
      is_public: editForm.is_public,
      rsvp_enabled: editForm.rsvp_enabled,
    }).eq("id", editingId);

    const { data } = await supabase.from("events").select("*, program:programs(id, name, slug)").order("starts_at");
    setEvents(data || []);
    setEditingId(null);
    setSaving(false);
  };

  const deleteEvent = async () => {
    if (!deleteConfirm) return;
    await supabase.from("events").delete().eq("id", deleteConfirm.id);
    setEvents(events.filter(e => e.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleEventClick = (event: any) => {
    startEdit(event);
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Event?</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
              <button onClick={deleteEvent} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <Link href="/dashboard/admin/events/new" className="px-4 py-2 bg-forest-600 text-white rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
            <option value="all">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.slug}>{p.name}</option>)}
          </select>
        </div>
        
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
              view === "list" ? "bg-forest-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
              view === "calendar" ? "bg-forest-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Program</th>
                <th className="px-4 py-3 text-left">Date/Time</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-750">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{e.title}</div>
                    <div className="text-xs text-slate-500">{e.event_type}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{e.program?.name || "All"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    <div>{new Date(e.starts_at).toLocaleDateString()}</div>
                    <div className="text-xs">{new Date(e.starts_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{e.location || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(e)} className="p-2 hover:bg-slate-600 rounded text-blue-400">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm({id: e.id, title: e.title})} className="p-2 hover:bg-slate-600 rounded text-red-400 ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <CalendarView events={filtered} onEventClick={handleEventClick} />
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Event</h2>
              <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Title *</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Type</label>
                  <select value={editForm.event_type} onChange={e => setEditForm({...editForm, event_type: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Program</label>
                  <select value={editForm.program_id} onChange={e => setEditForm({...editForm, program_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                    <option value="">All Programs</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Location</label>
                <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Start *</label>
                  <input type="datetime-local" value={editForm.starts_at} onChange={e => setEditForm({...editForm, starts_at: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">End *</label>
                  <input type="datetime-local" value={editForm.ends_at} onChange={e => setEditForm({...editForm, ends_at: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" required />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={editForm.is_public} onChange={e => setEditForm({...editForm, is_public: e.target.checked})} />
                  Public
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={editForm.rsvp_enabled} onChange={e => setEditForm({...editForm, rsvp_enabled: e.target.checked})} />
                  RSVP Enabled
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingId(null)} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-500 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
