import React, { useState, useEffect, useCallback } from "react";

function Inventory() {

  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    name: "",
    generic_name: "",
    batch_no: "",
    expiry_date: "",
    quantity: "",
    price: "",
    supplier: ""
  });

  const fetchMedicines = useCallback(() => {
    fetch(`http://127.0.0.1:8000/inventory?search=${search}&status=${status}&page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setMedicines(data.data);
        setTotal(data.total);
      });
  }, [search, status, page, limit]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const addMedicine = () => {
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      price: Number(form.price),
      status: "Active"
    };

    fetch("http://127.0.0.1:8000/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setPage(1);
        fetchMedicines();
        setForm({
          name: "",
          generic_name: "",
          batch_no: "",
          expiry_date: "",
          quantity: "",
          price: "",
          supplier: ""
        });
      });
  };

  const getStatusColor = (status) => {
        if (status === "Active") return "green";
        if (status === "Low Stock") return "orange";
        if (status === "Out of Stock") return "red";
        if (status === "Expired") return "gray";
        return "black";
  };

  return (
    <div>

      <h1>Pharmacy Inventory</h1>

      <input
        type="text"
        placeholder="Search medicine..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Low Stock">Low Stock</option>
        <option value="Out of Stock">Out of Stock</option>
        <option value="Expired">Expired</option>
      </select>

      <button onClick={fetchMedicines}>Search</button>

      <h2>Add Medicine</h2>

      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
      <input name="generic_name" placeholder="Generic Name" value={form.generic_name} onChange={handleChange} />
      <input name="batch_no" placeholder="Batch No" value={form.batch_no} onChange={handleChange} />
      <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
      <input name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
      <input name="price" placeholder="Price" value={form.price} onChange={handleChange} />
      <input name="supplier" placeholder="Supplier" value={form.supplier} onChange={handleChange} />

      <button onClick={addMedicine}>Add Medicine</button>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Price</th>
          </tr>
        </thead>

        <tbody>
          {medicines.map((med) => (
            <tr key={med.id}>
              <td>{med.name}</td>
              <td>{med.quantity}</td>
              <td style={{ color: getStatusColor(med.status), fontWeight: "bold" }}>
                    {med.status}
              </td>
              <td>{med.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px" }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>

        <span style={{ margin: "0 10px" }}>
          Page {page}
        </span>

        <button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>

    </div>
  );
}

export default Inventory;