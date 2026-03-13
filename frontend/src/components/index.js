import React from "react";
 
// ── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    "Active":       "badge-active",
    "Low Stock":    "badge-low",
    "Expired":      "badge-expired",
    "Out of Stock": "badge-oos",
    "Completed":    "badge-active",
    "Pending":      "badge-low",
  };
  return (
    <span className={`badge ${map[status] || "badge-active"}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
 
// ── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({ icon, iconClass, value, label, tag, tagClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${iconClass}`}>{icon}</div>
        {tag && <span className={`stat-tag ${tagClass}`}>{tag}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
 
// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  );
}
 
// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
 
// ── Form Field ───────────────────────────────────────────────────────────────
export function Field({ label, children, full }) {
  return (
    <div className={`field ${full ? "field-full" : ""}`}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
 