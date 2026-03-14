import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { StatusBadge, Spinner, Modal, Field } from "../components";

const STATUSES = ["Active", "Low Stock", "Out of Stock", "Expired"];

// status field intentionally removed — backend always calculates it
const EMPTY = {
  name: "", generic_name: "", batch_no: "",
  expiry_date: "", quantity: "", price: "", supplier: "",
};

// days_to_expiry warning badge shown in table
function ExpiryWarning({ days }) {
  if (days === undefined || days === null) return null;
  if (days <= 0)   return <span className="expiry-tag expiry-expired">Expired</span>;
  if (days <= 30)  return <span className="expiry-tag expiry-critical">Expires in {days}d</span>;
  if (days <= 180) return <span className="expiry-tag expiry-warn">Expires in {days}d</span>;
  return null;
}

// filter dropdown panel
function FilterPanel({ status, onStatus, onClose }) {
  return (
    <div className="filter-panel">
      <div className="filter-panel-title">Filter by Status</div>
      <button
        className={`filter-option ${status === "" ? "filter-option-active" : ""}`}
        onClick={() => { onStatus(""); onClose(); }}
      >All</button>
      {STATUSES.map(s => (
        <button
          key={s}
          className={`filter-option ${status === s ? "filter-option-active" : ""}`}
          onClick={() => { onStatus(s); onClose(); }}
        >
          <StatusBadge status={s} />
        </button>
      ))}
    </div>
  );
}

function MedicineModal({ medicine, onClose, onSaved }) {
  const [form, setForm]     = useState(
    medicine
      ? { ...medicine, expiry_date: medicine.expiry_date?.slice(0, 10) }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const required = ["name", "generic_name", "batch_no", "expiry_date", "quantity", "price", "supplier"];
    const missing  = required.find(k => !String(form[k]).trim());
    if (missing) { setErr(`"${missing.replace(/_/g, " ")}" is required`); return; }
    if (Number(form.quantity) < 0)  { setErr("Quantity cannot be negative"); return; }
    if (Number(form.price) <= 0)    { setErr("Price must be greater than zero"); return; }

    setSaving(true); setErr("");
    try {
      const payload = {
        name:         form.name.trim(),
        generic_name: form.generic_name.trim(),
        batch_no:     form.batch_no.trim(),
        expiry_date:  form.expiry_date,
        quantity:     Number(form.quantity),
        price:        Number(form.price),
        supplier:     form.supplier.trim(),
        // no status — backend calculates it
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
      <Field label="Medicine Name" full>
        <input className="input" value={form.name}
          onChange={e => set("name", e.target.value)} placeholder="e.g. Dolo 650" />
      </Field>
      <Field label="Generic Name">
        <input className="input" value={form.generic_name}
          onChange={e => set("generic_name", e.target.value)} placeholder="e.g. Paracetamol" />
      </Field>
      <Field label="Batch No">
        <input className="input" value={form.batch_no}
          onChange={e => set("batch_no", e.target.value)} placeholder="e.g. DL-2024-001" />
      </Field>
      <Field label="Expiry Date">
        <input className="input" type="date" value={form.expiry_date}
          onChange={e => set("expiry_date", e.target.value)} />
      </Field>
      <Field label="Quantity">
        <input className="input" type="number" min="0" value={form.quantity}
          onChange={e => set("quantity", e.target.value)} />
      </Field>
      <Field label="Price (₹)">
        <input className="input" type="number" min="0" step="0.01" value={form.price}
          onChange={e => set("price", e.target.value)} />
      </Field>
      <Field label="Supplier" full>
        <input className="input" value={form.supplier}
          onChange={e => set("supplier", e.target.value)} placeholder="e.g. Sun Pharmaceutical" />
      </Field>
      <div className="modal-note">
        ℹ Status is automatically set based on quantity and expiry date.
      </div>
    </Modal>
  );
}

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [totalPages,setTotalPages]= useState(1);
  const [overview,  setOverview]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [page,        setPage]        = useState(1);
  const [showFilter,  setShowFilter]  = useState(false);
  const [modal,       setModal]       = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [inv, ov] = await Promise.all([
        api.inventory.list({ search, status, page, limit }),
        api.inventory.overview().catch(() => ({})),
      ]);
      setMedicines(inv.data || []);
      setTotal(inv.total || 0);
      setTotalPages(inv.total_pages || 1);
      setOverview(ov);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = v => { setSearch(v); setPage(1); };
  const handleStatus = v => { setStatus(v); setPage(1); };

  const fmt     = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const fmtDate = d => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy CRM</h1>
          <p className="page-sub">Manage inventory, sales, and purchase orders</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setModal("add")}>
            + Add Medicine
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="overview-grid">
        {[
          { label: "Total Items",   value: overview.total_items   ?? "—", icon: "📦", color: "var(--blue)"   },
          { label: "Active Stock",  value: overview.active_stock  ?? "—", icon: "✓",  color: "var(--green)"  },
          { label: "Low Stock",     value: overview.low_stock     ?? "—", icon: "⚠",  color: "var(--orange)" },
          { label: "Total Value",   value: fmt(overview.total_value ?? 0), icon: "₹", color: "var(--purple)" },
        ].map(c => (
          <div key={c.label} className="overview-card">
            <div className="overview-card-top">
              <span className="overview-label">{c.label}</span>
              <span style={{ color: c.color, fontSize: 18 }}>{c.icon}</span>
            </div>
            <div className="overview-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Complete Inventory</span>
        </div>

        {/* Filter + Search bar */}
        <div className="filter-bar">
          <div className="search-box">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="input search-input"
              placeholder="Search name, batch, supplier..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {/* Filter button with dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className={`btn btn-outline btn-sm ${status ? "filter-active" : ""}`}
              onClick={() => setShowFilter(v => !v)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {status ? status : "Filter"}
              {status && (
                <span
                  onClick={e => { e.stopPropagation(); handleStatus(""); }}
                  style={{ marginLeft: 4, opacity: 0.6 }}
                >✕</span>
              )}
            </button>
            {showFilter && (
              <FilterPanel
                status={status}
                onStatus={handleStatus}
                onClose={() => setShowFilter(false)}
              />
            )}
          </div>

          {search && (
            <button className="btn btn-ghost btn-sm"
              onClick={() => { handleSearch(""); }}>
              Clear search ✕
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
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length === 0 ? (
                    <tr><td colSpan={9} className="empty-cell">No medicines found</td></tr>
                  ) : medicines.map(m => (
                    <tr key={m.id} className="table-row">
                      <td className="td-primary">{m.name}</td>
                      <td>{m.generic_name}</td>
                      <td className="td-mono">{m.batch_no}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span className="td-mono">{fmtDate(m.expiry_date)}</span>
                          <ExpiryWarning days={m.days_to_expiry} />
                        </div>
                      </td>
                      <td className="td-mono">{m.quantity}</td>
                      <td className="td-mono">{fmt(m.price)}</td>
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
                  <button className="btn btn-outline btn-sm"
                    disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                    <button key={n}
                      className={`btn btn-sm ${page === n ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setPage(n)}>{n}</button>
                  ))}
                  <button className="btn btn-outline btn-sm"
                    disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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