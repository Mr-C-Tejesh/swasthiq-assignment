from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import date, datetime
from . import models, schemas
from datetime import datetime, timezone, timedelta
IST = timezone(timedelta(hours=5, minutes=30))
def ist_now():
    return datetime.now(IST).replace(tzinfo=None)


# ── Status Logic ─────────────────────────────────────────────────────────────
# Single source of truth for status calculation.
# Called on every read so status is always accurate regardless of when
# the medicine was added or last edited.

def calculate_status(quantity: int, expiry_date: date) -> str:
    # check expiry first — an expired medicine is expired even if qty > 0
    if expiry_date <= date.today():
        return "Expired"
    if quantity == 0:
        return "Out of Stock"
    if quantity < 20:
        return "Low Stock"
    return "Active"


def days_until_expiry(expiry_date: date) -> int:
    # negative means already expired
    return (expiry_date - date.today()).days


def sync_medicine_status(db: Session, med: models.Medicine) -> models.Medicine:
    """
    Recalculate and persist status for a single medicine.
    Called on every read — this is how we keep status always accurate
    without needing a scheduled job.
    """
    correct_status = calculate_status(med.quantity, med.expiry_date)
    if med.status != correct_status:
        med.status = correct_status
        db.commit()
        db.refresh(med)
    return med


# ── Medicine CRUD ─────────────────────────────────────────────────────────────

def get_medicine_by_id(db: Session, medicine_id: int) -> models.Medicine:
    med = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Medicine not found",
                "medicine_id": medicine_id,
                "timestamp": ist_now().isoformat()
            }
        )
    return med


def get_medicines(
    db: Session,
    search: str = None,
    status: str = None,
    page: int = 1,
    limit: int = 10
) -> dict:

    query = db.query(models.Medicine)

    # case-insensitive search across name, generic_name, batch_no, supplier
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            models.Medicine.name.ilike(term)         |
            models.Medicine.generic_name.ilike(term) |
            models.Medicine.batch_no.ilike(term)     |
            models.Medicine.supplier.ilike(term)
        )

    if status:
        query = query.filter(models.Medicine.status == status)

    total = query.count()
    total_pages = (total + limit - 1) // limit  # ceiling division

    offset = (page - 1) * limit
    medicines = query.order_by(models.Medicine.name).offset(offset).limit(limit).all()

    # recalculate status for every medicine on every fetch
    # this ensures expiry-based status is always up to date
    for med in medicines:
        sync_medicine_status(db, med)

    return {
        "data":        medicines,
        "total":       total,
        "page":        page,
        "limit":       limit,
        "total_pages": total_pages,
        "has_next":    page < total_pages,
        "has_prev":    page > 1,
    }


def create_medicine(db: Session, medicine: schemas.MedicineCreate) -> models.Medicine:

    # check for duplicate batch number before inserting
    existing = db.query(models.Medicine).filter(
        models.Medicine.batch_no == medicine.batch_no
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Batch number already exists",
                "batch_no": medicine.batch_no,
                "timestamp": ist_now().isoformat()
            }
        )

    data = medicine.dict()

    # status is always computed — user never sets it
    data["status"] = calculate_status(data["quantity"], data["expiry_date"])

    db_medicine = models.Medicine(**data)
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine


def update_medicine(
    db: Session,
    medicine_id: int,
    medicine: schemas.MedicineUpdate
) -> models.Medicine:

    db_medicine = get_medicine_by_id(db, medicine_id)

    # only update fields that were actually sent
    update_data = medicine.dict(exclude_unset=True)

    # if batch_no is being changed, check it's not taken by another medicine
    if "batch_no" in update_data:
        conflict = db.query(models.Medicine).filter(
            models.Medicine.batch_no == update_data["batch_no"],
            models.Medicine.id != medicine_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Batch number already in use by another medicine",
                    "batch_no": update_data["batch_no"],
                    "timestamp": ist_now().isoformat()
                }
            )

    for key, value in update_data.items():
        setattr(db_medicine, key, value)

    # recalculate status after update
    db_medicine.status = calculate_status(db_medicine.quantity, db_medicine.expiry_date)
    db_medicine.updated_at = ist_now()

    db.commit()
    db.refresh(db_medicine)
    return db_medicine


def update_medicine_status(
    db: Session,
    medicine_id: int,
    new_status: str
) -> models.Medicine:
    db_medicine = get_medicine_by_id(db, medicine_id)
    db_medicine.status = new_status
    db_medicine.updated_at = ist_now()
    db.commit()
    db.refresh(db_medicine)
    return db_medicine


# ── Dashboard Queries ─────────────────────────────────────────────────────────

def get_dashboard_summary(db: Session) -> dict:

    # sync all medicine statuses before computing summary
    all_medicines = db.query(models.Medicine).all()
    for med in all_medicines:
        sync_medicine_status(db, med)

    total_items = len(all_medicines)

    low_stock   = sum(1 for m in all_medicines if m.status == "Low Stock")
    out_of_stock = sum(1 for m in all_medicines if m.status == "Out of Stock")
    expired     = sum(1 for m in all_medicines if m.status == "Expired")

    # today's sales from actual Sales table
    today = date.today()
    today_sales = db.query(func.sum(models.Sale.total_amount)).filter(
        func.date(models.Sale.created_at) == today
    ).scalar() or 0

    total_sales = db.query(func.sum(models.Sale.total_amount)).scalar() or 0

    items_sold_today = db.query(func.sum(models.SaleItem.quantity)).join(
        models.Sale
    ).filter(
        func.date(models.Sale.created_at) == today
    ).scalar() or 0

    total_items_sold = db.query(func.sum(models.SaleItem.quantity)).scalar() or 0

    return {
        "today_sales":      round(today_sales, 2),
        "total_sales":      round(total_sales, 2),
        "items_sold_today": items_sold_today,
        "total_items_sold": total_items_sold,
        "total_medicines":  total_items,
        "low_stock":        low_stock,
        "out_of_stock":     out_of_stock,
        "expired":          expired,
    }


def get_low_stock_items(db: Session) -> list:
    medicines = db.query(models.Medicine).filter(
        models.Medicine.quantity < 20
    ).all()
    for med in medicines:
        sync_medicine_status(db, med)
    return medicines


def get_recent_sales(db: Session, limit: int = 10) -> list:
    sales = db.query(models.Sale).order_by(
        models.Sale.created_at.desc()
    ).limit(limit).all()
    return sales


def get_purchase_order_summary(db: Session) -> dict:
    # using low stock + out of stock as proxy for items needing reorder
    needs_reorder = db.query(models.Medicine).filter(
        models.Medicine.quantity < 20
    ).count()

    total_reorder_value = db.query(models.Medicine).filter(
        models.Medicine.quantity < 20
    ).all()

    # estimate reorder cost — bring everything up to 100 units
    estimated_cost = sum(
        (100 - m.quantity) * m.price
        for m in total_reorder_value
        if m.quantity < 20
    )

    return {
        "items_needing_reorder": needs_reorder,
        "estimated_reorder_cost": round(estimated_cost, 2),
        "pending_orders": 5,  # placeholder until PurchaseOrder model is added
    }


def get_inventory_overview(db: Session) -> dict:
    medicines = db.query(models.Medicine).all()

    # sync all statuses
    for med in medicines:
        sync_medicine_status(db, med)

    total       = len(medicines)
    active      = sum(1 for m in medicines if m.status == "Active")
    low_stock   = sum(1 for m in medicines if m.status == "Low Stock")
    expired     = sum(1 for m in medicines if m.status == "Expired")
    out_of_stock = sum(1 for m in medicines if m.status == "Out of Stock")
    total_value = sum(m.price * m.quantity for m in medicines)

    return {
        "total_items":   total,
        "active_stock":  active,
        "low_stock":     low_stock,
        "expired":       expired,
        "out_of_stock":  out_of_stock,
        "total_value":   round(total_value, 2),
    }