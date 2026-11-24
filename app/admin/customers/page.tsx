"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaUsers, FaPen, FaTrash, FaSearch, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFileInvoiceDollar, FaCheckCircle, FaTimes } from "react-icons/fa";
import { toast } from "sonner";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  user_id: string | null;
  source: string | null;
  created_at: string;
  quotation_count: number;
};

export default function AdminCustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;

  const load = async () => {
    const token = await authToken();
    const res = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(j.error || "Failed to load customers"); return; }
    setCustomers(j.customers || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") { router.push("/"); return; }
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: edit.id, name: edit.name, email: edit.email, phone: edit.phone, address: edit.address }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Save failed");
      setCustomers((cs) => cs.map((c) => (c.id === edit.id ? { ...c, name: edit.name, email: edit.email, phone: edit.phone, address: edit.address } : c)));
      setEdit(null);
      if (j.warning) toast.warning(j.warning); else toast.success("Customer updated");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const remove = async (c: Customer) => {
    const label = c.name || c.email || "this customer";
    const msg = c.user_id
      ? `Delete ${label}? This removes the directory record; their website login is kept so past quotations stay accessible.`
      : `Delete ${label}? This removes the directory record.`;
    if (!confirm(msg)) return;
    try {
      const token = await authToken();
      const res = await fetch(`/api/admin/customers?id=${c.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Delete failed");
      setCustomers((cs) => cs.filter((x) => x.id !== c.id));
      toast.success("Customer deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = !q ? customers : customers.filter((c) =>
    [c.name, c.email, c.phone, c.address].some((v) => (v || "").toLowerCase().includes(q)));

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Loading…</div>;

  const inp = "bg-black border border-white/15 rounded px-3 py-2 text-sm text-white focus:border-sky-400 outline-none";

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-24">
      <Navbar />
      <div className="pt-28 px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center text-2xl text-black"><FaUsers /></div>
          <div>
            <h1 className="font-orbitron text-3xl font-bold">CUSTOMERS</h1>
            <p className="text-gray-400 text-sm">{customers.length} total · view, edit or remove contact details &amp; linked accounts</p>
          </div>
          <div className="ml-auto relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone…" className={`${inp} pl-9 w-72`} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/15 rounded-xl text-gray-500">
            {customers.length === 0 ? "No customers yet. Finalizing a quotation with an email adds one here." : "No customers match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1A1A1A] text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="text-left px-4 py-3 font-bold">Customer</th>
                  <th className="text-left px-4 py-3 font-bold">Contact</th>
                  <th className="text-left px-4 py-3 font-bold">Address</th>
                  <th className="text-center px-4 py-3 font-bold">Quotes</th>
                  <th className="text-center px-4 py-3 font-bold">Login</th>
                  <th className="text-right px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{c.name || <span className="text-gray-500">—</span>}</div>
                      <div className="text-[10px] text-gray-500">Added {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {c.email ? <div className="flex items-center gap-1.5"><FaEnvelope size={10} className="text-gray-500" />{c.email}</div> : null}
                      {c.phone ? <div className="flex items-center gap-1.5 mt-0.5"><FaPhone size={10} className="text-gray-500" />{c.phone}</div> : null}
                      {!c.email && !c.phone ? <span className="text-gray-600">—</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[220px]"><span className="line-clamp-2">{c.address || "—"}</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-300"><FaFileInvoiceDollar size={10} className="text-gray-500" />{c.quotation_count}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.user_id ? <FaCheckCircle className="text-emerald-400 inline" title="Has a website login" /> : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEdit(c)} className="p-2 rounded-lg text-gray-400 hover:text-sky-400 hover:bg-white/5" title="Edit"><FaPen size={12} /></button>
                        <button onClick={() => remove(c)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5" title="Delete"><FaTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {edit && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEdit(null)}>
          <div className="relative w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl p-7" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEdit(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><FaTimes size={16} /></button>
            <h3 className="font-orbitron font-bold text-xl mb-5">Edit customer</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Name</label>
                <input className={`${inp} w-full mt-1`} value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-2"><FaEnvelope size={10} /> Email {edit.user_id ? <span className="text-sky-400 normal-case">· also updates their login</span> : null}</label>
                <input type="email" className={`${inp} w-full mt-1`} value={edit.email || ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-2"><FaPhone size={10} /> Phone</label>
                  <input className={`${inp} w-full mt-1`} value={edit.phone || ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-2"><FaMapMarkerAlt size={10} /> Address</label>
                  <textarea rows={2} className={`${inp} w-full mt-1 resize-none`} value={edit.address || ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-7">
              <button onClick={() => setEdit(null)} className="px-4 py-2.5 border border-white/15 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-5 py-2.5 bg-sky-500 text-black rounded-lg text-sm font-bold hover:bg-sky-400 disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
