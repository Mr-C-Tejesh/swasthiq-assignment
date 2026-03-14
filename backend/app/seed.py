"""
seed.py — run once to populate the database with realistic sample data.
Run with: python -m app.seed

Uses real Indian medicine names, suppliers, and patient names.
Expiry dates are spread across past/present/future to demonstrate
all four status types automatically.
"""

from datetime import datetime, timezone, timedelta, date
from .database import SessionLocal
from . import models

IST = timezone(timedelta(hours=5, minutes=30))

def seed():
    db = SessionLocal()

    # skip if already seeded
    if db.query(models.Medicine).count() > 0:
        print("Database already has data — skipping seed.")
        db.close()
        return

    today = date.today()

    medicines = [
        # Active medicines
        models.Medicine(
            name="Dolo 650",
            generic_name="Paracetamol",
            batch_no="DL-2024-0341",
            expiry_date=today + timedelta(days=540),
            quantity=320,
            price=30.0,
            supplier="Micro Labs Ltd.",
            status="Active"
        ),
        models.Medicine(
            name="Augmentin 625",
            generic_name="Amoxicillin + Clavulanate",
            batch_no="AUG-2024-1192",
            expiry_date=today + timedelta(days=400),
            quantity=85,
            price=195.0,
            supplier="GlaxoSmithKline India",
            status="Active"
        ),
        models.Medicine(
            name="Metformin 500mg",
            generic_name="Metformin Hydrochloride",
            batch_no="MET-2024-2234",
            expiry_date=today + timedelta(days=620),
            quantity=210,
            price=45.0,
            supplier="Sun Pharmaceutical",
            status="Active"
        ),
        models.Medicine(
            name="Pantop 40",
            generic_name="Pantoprazole",
            batch_no="PAN-2024-3312",
            expiry_date=today + timedelta(days=480),
            quantity=150,
            price=85.0,
            supplier="Aristo Pharmaceuticals",
            status="Active"
        ),
        models.Medicine(
            name="Telma 40",
            generic_name="Telmisartan",
            batch_no="TEL-2024-4401",
            expiry_date=today + timedelta(days=730),
            quantity=95,
            price=120.0,
            supplier="Glenmark Pharmaceuticals",
            status="Active"
        ),

        # Low Stock — quantity < 20
        models.Medicine(
            name="Azithral 500",
            generic_name="Azithromycin",
            batch_no="AZI-2024-5521",
            expiry_date=today + timedelta(days=300),
            quantity=12,
            price=145.0,
            supplier="Alembic Pharmaceuticals",
            status="Low Stock"
        ),
        models.Medicine(
            name="Calpol 250mg Syrup",
            generic_name="Paracetamol Suspension",
            batch_no="CAL-2024-6634",
            expiry_date=today + timedelta(days=180),
            quantity=7,
            price=55.0,
            supplier="GlaxoSmithKline India",
            status="Low Stock"
        ),

        # Expired — expiry date in the past
        models.Medicine(
            name="Amoxil 250mg",
            generic_name="Amoxicillin",
            batch_no="AMX-2023-7745",
            expiry_date=today - timedelta(days=45),
            quantity=30,
            price=60.0,
            supplier="Cipla Ltd.",
            status="Expired"
        ),

        # Out of Stock
        models.Medicine(
            name="Insulin Glargine",
            generic_name="Insulin Glargine",
            batch_no="INS-2024-8856",
            expiry_date=today + timedelta(days=200),
            quantity=0,
            price=980.0,
            supplier="Sanofi India",
            status="Out of Stock"
        ),
        models.Medicine(
            name="Ecosprin 75mg",
            generic_name="Aspirin",
            batch_no="ECO-2024-9967",
            expiry_date=today + timedelta(days=560),
            quantity=180,
            price=25.0,
            supplier="USV Pvt. Ltd.",
            status="Active"
        ),
    ]

    db.add_all(medicines)
    db.flush()  # get IDs without committing

    # realistic sales with Indian patient names
    sales_data = [
        {
            "invoice_no":   "INV-2024-3001",
            "patient_name": "Arjun Sharma",
            "payment_mode": "UPI",
            "total_amount": 375.0,
            "status":       "Completed",
            "created_at":   datetime.now(IST).replace(tzinfo=None) - timedelta(hours=2),
            "items": [
                {"medicine": "Dolo 650",     "qty": 2},
                {"medicine": "Pantop 40",    "qty": 1},
            ]
        },
        {
            "invoice_no":   "INV-2024-3002",
            "patient_name": "Priya Venkatesh",
            "payment_mode": "Cash",
            "total_amount": 240.0,
            "status":       "Completed",
            "created_at":   datetime.now(IST).replace(tzinfo=None) - timedelta(hours=5),
            "items": [
                {"medicine": "Metformin 500mg", "qty": 1},
                {"medicine": "Telma 40",        "qty": 1},
            ]
        },
        {
            "invoice_no":   "INV-2024-3003",
            "patient_name": "Suresh Nair",
            "payment_mode": "Card",
            "total_amount": 195.0,
            "status":       "Completed",
            "created_at":   datetime.now(IST).replace(tzinfo=None) - timedelta(hours=8),
            "items": [
                {"medicine": "Augmentin 625", "qty": 1},
            ]
        },
        {
            "invoice_no":   "INV-2024-3004",
            "patient_name": "Deepa Krishnamurthy",
            "payment_mode": "UPI",
            "total_amount": 580.0,
            "status":       "Completed",
            "created_at":   datetime.now(IST).replace(tzinfo=None) - timedelta(days=1),
            "items": [
                {"medicine": "Augmentin 625", "qty": 2},
                {"medicine": "Dolo 650",      "qty": 3},
            ]
        },
        {
            "invoice_no":   "INV-2024-3005",
            "patient_name": "Ramesh Iyer",
            "payment_mode": "Cash",
            "total_amount": 110.0,
            "status":       "Completed",
            "created_at":   datetime.now(IST).replace(tzinfo=None) - timedelta(days=1, hours=3),
            "items": [
                {"medicine": "Ecosprin 75mg", "qty": 2},
                {"medicine": "Pantop 40",     "qty": 1},
            ]
        },
    ]

    # build a name → medicine lookup
    med_lookup = {m.name: m for m in medicines}

    for s in sales_data:
        sale = models.Sale(
            invoice_no=s["invoice_no"],
            patient_name=s["patient_name"],
            payment_mode=s["payment_mode"],
            total_amount=s["total_amount"],
            status=s["status"],
            created_at=s["created_at"],
        )
        db.add(sale)
        db.flush()

        for item in s["items"]:
            med = med_lookup[item["medicine"]]
            db.add(models.SaleItem(
                sale_id=sale.id,
                medicine_id=med.id,
                quantity=item["qty"],
                unit_price=med.price,
            ))

    db.commit()
    print(f"Seeded {len(medicines)} medicines and {len(sales_data)} sales.")
    db.close()


if __name__ == "__main__":
    seed()