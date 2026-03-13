const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  dashboard: {
    summary:   () => request("/dashboard/summary"),
    lowStock:  () => request("/dashboard/low-stock"),
    recentSales: () => request("/dashboard/recent-sales"),
  },
  inventory: {
    list: ({ search = "", status = "", page = 1, limit = 10 } = {}) =>
      request(`/inventory?search=${search}&status=${status}&page=${page}&limit=${limit}`),
    create: (data) =>
      request("/inventory", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    updateStatus: (id, status) =>
      request(`/inventory/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
};