from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from .. import crud, models

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns today's sales, items sold, low stock count, and medicine overview.
    All values are computed from the database — no hardcoded numbers.
    """
    return crud.get_dashboard_summary(db)


@router.get("/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):
    """
    Returns medicines with quantity below 20 or marked as expired.
    Status is recalculated on every call.
    """
    medicines = crud.get_low_stock_items(db)
    return [
        {
            **m.__dict__,
            "days_to_expiry": (m.expiry_date - date.today()).days
        }
        for m in medicines
    ]


@router.get("/recent-sales")
def get_recent_sales(db: Session = Depends(get_db)):
    """
    Returns last 10 sales ordered by most recent.
    """
    sales = crud.get_recent_sales(db)
    return {
        "sales": [
            {
                "id":           s.id,
                "invoice_no":   s.invoice_no,
                "patient_name": s.patient_name,
                "payment_mode": s.payment_mode,
                "total_amount": s.total_amount,
                "status":       s.status,
                "item_count":   len(s.items),
                "sale_date":    s.created_at.isoformat(),
            }
            for s in sales
        ]
    }


@router.get("/purchase-orders")
def purchase_order_summary(db: Session = Depends(get_db)):
    """
    Returns purchase order summary — items needing reorder and estimated cost.
    """
    return crud.get_purchase_order_summary(db)