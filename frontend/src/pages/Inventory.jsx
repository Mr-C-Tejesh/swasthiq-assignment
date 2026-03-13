import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { StatusBadge, Spinner, Modal, Field } from "../components";

const STATUSES = ["Active", "Low Stock", "Out of Stock", "Expired"];

const EMPTY = {
  name: "", generic_name: "", category: "", batch_no: "",
  expiry_date: "", quantity: "", cost_price: "", mrp: "", supplier: "", status: "Active",
};

function MedicineModal({ medicine, onClose, onSaved }) {
  const [form, setForm]   = useState(medicine ? { ...medicine } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const required = ["name", "generic_name", "batch_no", "expiry_date", "quantity", "mrp", "supplier"];
    const missing  = required.find(k => !String(form[k]).trim());
    if (missing) { setErr(`"${missing.replace(/_/g," ")}" is required`); return; }

    setSaving(true); setErr("");
    try {
      const payload = {
        ...form,
        quantity:   Number(form.quantity),
        cost_price: Number(form.cost_price) || 0,
        mrp:        Number(form.mrp),
      };
      if (medicine?.id) await api.inventory.update(medicine.id, payload);
      else              await api.inventory.create(payload);
      onSaved();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const footer = (
    <>
      {err && <span className="modal-err">⚠ {err}</span>}
      <button className="btn btn-outline" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : medicine ? "Save Changes" : "Add Medicine"}
      </button>
    </>
  );

  return (
    <Modal title={medicine ? "Edit Medicine" : "Add New Medicine"} onClose={onClose} footer={footer}>
      <Field label="Medicine Name" full><input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg"/></Field>
      <Field label="Generic Name"><input className="input" value={form.generic_name} onChange={e => set("generic_name", e.target.value)} placeholder="e.g. Acetaminophen"/></Field>
      <Field label="Category"><input className="input" value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Analgesic"/></Field>
      <Field label="Batch No"><input className="input" value={form.batch_no} onChange={e => set("batch_no", e.target.value)} placeholder="e.g. PCM-2024-001"/></Field>
      <Field label="Expiry Date"><input className="input" type="date" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)}/></Field>
      <Field label="Quantity"><input className="input" type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)}/></Field>
      <Field label="Cost Price (₹)"><input className="input" type="number" min="0" step="0.01" value={form.cost_price} onChange={e => set("cost_price", e.target.value)}/></Field>
      <Field label="MRP (₹)"><input className="input" type="number" min="0" step="0.01" value={form.mrp} onChange={e => set("mrp", e.target.value)}/></Field>
      <Field label="Supplier"><input className="input" value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="e.g. MedSupply Co."/></Field>
      <Field label="Status">
        <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [overview,  setOverview]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [page,      setPage]      = useState(1);
  const limit = 10;

  const [modal, setModal] = useState(null); // null | "add" | medicine obj

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [inv, ov] = await Promise.all([
        api.inventory.list({ search, status, page, limit }),
        fetch("http://127.0.0.1:8000/inventory/overview")
          .then(r => r.json()).catch(() => ({})),
      ]);
      setMedicines(inv.data || inv.medicines || []);
      setTotal(inv.total || 0);
      setOverview(ov);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  const handleSearch  = v => { setSearch(v);  setPage(1); };
  const handleStatus  = v => { setStatus(v);  setPage(1); };

  const fmt    = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy CRM</h1>
          <p className="page-sub">Manage inventory, sales, and purchase orders</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setModal("add")}>
            <span>+</span> Add Medicine
          </button>
        </div>
      </div>

      {/* Overview mini-cards */}
      <div className="overview-grid">
        {[
          { label: "Total Items",   value: overview.total_items   ?? total,          icon: "📦", color: "var(--blue)" },
          { label: "Active Stock",  value: overview.active_stock  ?? "—",            icon: "✓",  color: "var(--green)" },
          { label: "Low Stock",     value: overview.low_stock     ?? "—",            icon: "⚠",  color: "var(--orange)" },
          { label: "Total Value",   value: fmt(overview.total_value ?? 0),           icon: "₹",  color: "var(--purple)" },
        ].map(c => (
          <div key={c.label} className="overview-card">
            <div className="overview-card-top">
              <span className="overview-label">{c.label}</span>
              <span style={{ color: c.color, fontSize: 16 }}>{c.icon}</span>
            </div>
            <div className="overview-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Complete Inventory</span>
          <div className="card-header-right">
            <button className="btn btn-outline btn-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter
            </button>
            <button className="btn btn-outline btn-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-box">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="input search-input"
              placeholder="Search medicines..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <select className="input select" value={status} onChange={e => handleStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {(search || status) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { handleSearch(""); handleStatus(""); }}>
              Clear ✕
            </button>
          )}
          <span className="filter-count">{total} medicines</span>
        </div>

        {/* Table */}
        {loading ? <Spinner /> : error ? <div className="page-error">⚠ {error}</div> : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Generic Name</th>
                    <th>Category</th>
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                    <th>Qty</th>
                    <th>Cost Price</th>
                    <th>MRP</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length === 0 ? (
                    <tr><td colSpan={11} className="empty-cell">No medicines found</td></tr>
                  ) : medicines.map(m => (
                    <tr key={m.id} className="table-row">
                      <td className="td-primary">{m.name}</td>
                      <td>{m.generic_name}</td>
                      <td>{m.category || "—"}</td>
                      <td className="td-mono">{m.batch_no}</td>
                      <td className="td-mono">{fmtDate(m.expiry_date)}</td>
                      <td className="td-mono">{m.quantity}</td>
                      <td className="td-mono">{fmt(m.cost_price)}</td>
                      <td className="td-mono">{fmt(m.mrp ?? m.price)}</td>
                      <td>{m.supplier}</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td>
                        <button className="btn-edit" onClick={() => setModal(m)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="pagination">
                <span className="page-info">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </span>
                <div className="page-btns">
                  <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                    <button key={n} className={`btn btn-sm ${page === n ? "btn-primary" : "btn-outline"}`} onClick={() => setPage(n)}>
                      {n}
                    </button>
                  ))}
                  <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <MedicineModal
          medicine={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}