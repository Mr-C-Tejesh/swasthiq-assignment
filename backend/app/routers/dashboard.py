from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    total_items = db.query(models.Medicine).count()

    low_stock = db.query(models.Medicine).filter(
        models.Medicine.status == "Low Stock"
    ).count()

    out_of_stock = db.query(models.Medicine).filter(
        models.Medicine.status == "Out of Stock"
    ).count()

    all_medicines = db.query(models.Medicine).all()
    items_sold = sum(m.quantity for m in all_medicines)

    return {
        "total_items": total_items,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "today_sales": 124580,
        "items_sold": items_sold,
        "purchase_orders_value": 96250
    }


@router.get("/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):
    medicines = db.query(models.Medicine).filter(
        models.Medicine.quantity < 20
    ).all()
    return medicines


@router.get("/recent-sales")
def get_recent_sales():
    # No Sales model yet — returns sample data so UI is not empty
    return {
        "sales": [
            {
                "id": 1,
                "invoice_no": "INV-2024-1234",
                "patient_name": "Rajesh Kumar",
                "item_count": 3,
                "payment_mode": "Card",
                "total_amount": 340,
                "status": "Completed",
                "sale_date": "2024-11-01"
            },
            {
                "id": 2,
                "invoice_no": "INV-2024-1235",
                "patient_name": "Sarah Smith",
                "item_count": 2,
                "payment_mode": "Cash",
                "total_amount": 145,
                "status": "Completed",
                "sale_date": "2024-11-01"
            },
            {
                "id": 3,
                "invoice_no": "INV-2024-1236",
                "patient_name": "Michael Johnson",
                "item_count": 5,
                "payment_mode": "UPI",
                "total_amount": 525,
                "status": "Completed",
                "sale_date": "2024-11-01"
            }
        ]
    }


@router.get("/purchase-orders")
def purchase_order_summary(db: Session = Depends(get_db)):
    pending_orders = db.query(models.Medicine).filter(
        models.Medicine.quantity < 20
    ).count()

    completed_orders = db.query(models.Medicine).filter(
        models.Medicine.quantity >= 20
    ).count()

    return {
        "pending_orders": pending_orders,
        "completed_orders": completed_orders
    }