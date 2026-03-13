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

    return {
        "total_items": total_items,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "today_sales": 124580
    }


@router.get("/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):

    medicines = db.query(models.Medicine).filter(
        models.Medicine.quantity < 20
    ).all()

    return medicines


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