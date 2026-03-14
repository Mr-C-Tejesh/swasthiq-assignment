# Pharmacy CRM — SwasthiQ Internship Assignment

A full-stack Pharmacy CRM built with **FastAPI + SQLite** (backend) and **React** (frontend).

## Live Demo
- **Frontend:** https://pharmacy-crm-three.vercel.app
- **Backend API:** https://pharmacy-crm-api.onrender.com
- **API Docs (Swagger):** https://pharmacy-crm-api.onrender.com/docs

---

## Project Structure

```
swasthiq-assignment/
├── backend/
│   └── app/
│       ├── routers/
│       │   ├── dashboard.py     # Dashboard API routes
│       │   └── inventory.py     # Inventory API routes
│       ├── crud.py              # Database operations
│       ├── database.py          # SQLAlchemy setup
│       ├── main.py              # FastAPI app entry point
│       ├── models.py            # SQLAlchemy models
│       ├── schemas.py           # Pydantic request/response models
│       └── seed.py              # Sample data seeder
├── frontend/
│   └── src/
│       ├── api/index.js         # Centralized API client
│       ├── components/index.js  # Reusable components
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── Inventory.jsx
│       ├── App.js
│       └── styles.css
└── README.md
```

---

## Setup & Run Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API runs at `http://localhost:8000`
- Swagger UI at `http://localhost:8000/docs`
- Sample data is seeded automatically on first run

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- App runs at `http://localhost:3000`
- Create a `.env` file in `frontend/` with:
```
REACT_APP_API_URL=http://localhost:8000
```

---

## REST API Structure

### Dashboard Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/dashboard/summary` | Today's sales, items sold, low stock count | `200 OK` |
| GET | `/dashboard/low-stock` | Medicines with quantity < 20 | `200 OK` |
| GET | `/dashboard/recent-sales` | Last 10 sales ordered by date | `200 OK` |
| GET | `/dashboard/purchase-orders` | Items needing reorder + estimated cost | `200 OK` |

#### `GET /dashboard/summary` — Response
```json
{
  "today_sales": 810.0,
  "total_sales": 1500.0,
  "items_sold_today": 6,
  "total_items_sold": 14,
  "total_medicines": 10,
  "low_stock": 2,
  "out_of_stock": 1,
  "expired": 1
}
```

#### `GET /dashboard/recent-sales` — Response
```json
{
  "sales": [
    {
      "id": 1,
      "invoice_no": "INV-2024-3001",
      "patient_name": "Arjun Sharma",
      "payment_mode": "UPI",
      "total_amount": 375.0,
      "status": "Completed",
      "item_count": 2,
      "sale_date": "2024-11-01T10:30:00"
    }
  ]
}
```

---

### Inventory Endpoints

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/inventory/overview` | Total, active, low stock counts + total value | `200 OK` |
| GET | `/inventory/` | Paginated + filtered medicine list | `200 OK` |
| GET | `/inventory/expired` | All expired medicines | `200 OK` |
| POST | `/inventory/` | Add new medicine | `201 Created` |
| PUT | `/inventory/{id}` | Update medicine details | `200 OK` |
| PATCH | `/inventory/{id}/status` | Update medicine status | `200 OK` |

#### `GET /inventory/` — Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Case-insensitive search across name, generic name, batch no, supplier |
| `status` | string | Filter by `Active`, `Low Stock`, `Expired`, `Out of Stock` |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 10, max: 100) |

#### `GET /inventory/` — Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Dolo 650",
      "generic_name": "Paracetamol",
      "batch_no": "DL-2024-0341",
      "expiry_date": "2027-09-05",
      "quantity": 320,
      "price": 30.0,
      "supplier": "Micro Labs Ltd.",
      "status": "Active",
      "days_to_expiry": 540,
      "created_at": "2024-11-01T10:00:00",
      "updated_at": "2024-11-01T10:00:00"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "total_pages": 1,
  "has_next": false,
  "has_prev": false
}
```

#### `POST /inventory/` — Request Body
```json
{
  "name": "Paracetamol 500mg",
  "generic_name": "Paracetamol",
  "batch_no": "PCM-2024-001",
  "expiry_date": "2026-12-31",
  "quantity": 100,
  "price": 25.0,
  "supplier": "Micro Labs Ltd."
}
```
> **Note:** `status` is intentionally excluded from the request — it is always auto-calculated from `quantity` and `expiry_date`.

#### `PATCH /inventory/{id}/status` — Request Body
```json
{ "status": "Out of Stock" }
```
Valid values: `Active`, `Low Stock`, `Expired`, `Out of Stock`

---

## How Data Consistency is Ensured

### 1. Status is Always Derived, Never Trusted from User Input

The core design decision in this project is that `status` is **never set by the user** — it is always computed from two source-of-truth fields: `quantity` and `expiry_date`.

```python
def calculate_status(quantity: int, expiry_date: date) -> str:
    if expiry_date <= date.today():
        return "Expired"
    if quantity == 0:
        return "Out of Stock"
    if quantity < 20:
        return "Low Stock"
    return "Active"
```

This function is called:
- On every **CREATE** — status is set before inserting into DB
- On every **UPDATE** — status is recalculated after any field change
- On every **READ** — `sync_medicine_status()` checks if stored status matches computed status and corrects it if not

This means even if a medicine was added with a future expiry date, it will automatically show as `Expired` the next day without any manual intervention.

### 2. Status Recalculation on Every Read

```python
def sync_medicine_status(db: Session, med: models.Medicine) -> models.Medicine:
    correct_status = calculate_status(med.quantity, med.expiry_date)
    if med.status != correct_status:
        med.status = correct_status
        db.commit()
        db.refresh(med)
    return med
```

Every time medicines are fetched, this function runs for each one. If today's date has passed a medicine's expiry date, the status is corrected in the database automatically — no scheduler, no cron job, no manual update needed.

### 3. Duplicate Batch Number Prevention

Before inserting a new medicine, the system checks if the `batch_no` already exists:

```python
existing = db.query(models.Medicine).filter(
    models.Medicine.batch_no == medicine.batch_no
).first()
if existing:
    raise HTTPException(status_code=400, detail={"error": "Batch number already exists"})
```

On update, it also checks that the new `batch_no` isn't used by a *different* medicine.

### 4. Input Validation via Pydantic

All inputs are validated before reaching the database:
- Whitespace is stripped from all string fields
- Quantity cannot be negative
- Price must be greater than zero
- Only `exclude_unset=True` fields are updated — prevents accidental null overwrites

### 5. Structured Error Responses

All errors return consistent JSON with context:
```json
{
  "detail": {
    "error": "Medicine not found",
    "medicine_id": 42,
    "timestamp": "2024-11-01T10:30:00"
  }
}
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| Status never set by user | Prevents stale/incorrect status from human error |
| Status recalculated on every read | Ensures expiry-based transitions happen automatically |
| `days_to_expiry` in every response | Lets frontend show urgency without extra API calls |
| `ilike` search across 4 fields | More useful than exact-match or name-only search |
| Pagination metadata (`total_pages`, `has_next`, `has_prev`) | API consumer shouldn't need to calculate this |
| Duplicate batch_no check | Prevents duplicate inventory records |
| Seed data on startup | Works out of the box on any deployment |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy ORM |
| Database | SQLite |
| Frontend | React 18, vanilla CSS |
| Hosting | Render (API), Vercel (Frontend) |