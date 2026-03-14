import React, { useEffect, useState } from "react";
import { api } from "../api";
import { StatCard, StatusBadge, Spinner } from "../components";

export default function Dashboard() {
  const [summary,     setSummary]   = useState(null);
  const [recentSales, setRecent]    = useState([]);
  const [poData,      setPoData]    = useState({});
  const [loading,     setLoading]   = useState(true);
  const [error,       setError]     = useState("");

  useEffect(() => {
    Promise.all([
      api.dashboard.summary(),
      api.dashboard.recentSales().catch(() => ({ sales: [] })),
      api.dashboard.purchaseOrders().catch(() => ({})),
    ])
      .then(([sum, sales, po]) => {
        setSummary(sum);
        setRecent(sales.sales || []);
        setPoData(po);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = n =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const fmtDate = d =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    }) : "—";

  if (loading) return <Spinner />;
  if (error)   return <div className="page-error">⚠ {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy CRM</h1>
          <p className="page-sub">Manage inventory, sales, and purchase orders</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          iconClass="icon-green"
          value={fmt(summary?.today_sales)}
          label="Today's Sales"
          tag={`${summary?.items_sold_today || 0} sold today`}
          tagClass="tag-green"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>}
          iconClass="icon-blue"
          value={summary?.total_items_sold || 0}
          label="Total Items Sold"
          tag="All time"
          tagClass="tag-blue"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          iconClass="icon-orange"
          value={summary?.low_stock || 0}
          label="Low Stock Items"
          tag="Action Needed"
          tagClass="tag-orange"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>}
          iconClass="icon-purple"
          value={fmt(poData?.estimated_reorder_cost)}
          label="Est. Reorder Cost"
          tag={`${poData?.items_needing_reorder || 0} items`}
          tagClass="tag-purple"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Sales</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
            Total revenue: {fmt(summary?.total_sales)}
          </span>
        </div>

        {recentSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p>No sales recorded yet</p>
          </div>
        ) : (
          <div className="sales-list">
            {recentSales.map(sale => (
              <div key={sale.id} className="sale-row">
                <div className="sale-icon-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div className="sale-info">
                  <span className="sale-invoice">{sale.invoice_no}</span>
                  <span className="sale-meta">
                    {sale.patient_name} · {sale.item_count} items · {sale.payment_mode}
                  </span>
                </div>
                <div className="sale-right">
                  <span className="sale-amount">{fmt(sale.total_amount)}</span>
                  <div className="sale-footer">
                    <span className="sale-date">{fmtDate(sale.sale_date)}</span>
                    <StatusBadge status={sale.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}