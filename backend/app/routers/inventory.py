from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Query
from datetime import date

from ..database import get_db
from .. import crud, schemas
from .. import models

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


# ⚠️ All GET routes with fixed paths MUST come before /{medicine_id}
# Otherwise FastAPI treats "overview" and "expired" as IDs

@router.get("/overview")
def get_inventory_overview(db: Session = Depends(get_db)):
    total = db.query(models.Medicine).count()

    active = db.query(models.Medicine).filter(
        models.Medicine.status == "Active"
    ).count()

    low = db.query(models.Medicine).filter(
        models.Medicine.status == "Low Stock"
    ).count()

    all_medicines = db.query(models.Medicine).all()
    total_value = sum(m.price * m.quantity for m in all_medicines)

    return {
        "total_items": total,
        "active_stock": active,
        "low_stock": low,
        "total_value": round(total_value, 2)
    }


@router.get("/expired")
def get_expired_medicines(db: Session = Depends(get_db)):
    expired_medicines = db.query(models.Medicine).filter(
        models.Medicine.expiry_date < date.today()
    ).all()
    return expired_medicines


@router.get("/")
def list_medicines(
    search: str = Query(None),
    status: str = Query(None),
    page: int = Query(1),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    return crud.get_medicines(db, search, status, page, limit)


@router.post("/")
def add_medicine(
    medicine: schemas.MedicineCreate,
    db: Session = Depends(get_db)
):
    return crud.create_medicine(db, medicine)


@router.put("/{medicine_id}")
def update_medicine(
    medicine_id: int,
    medicine: schemas.MedicineUpdate,
    db: Session = Depends(get_db)
):
    db_medicine = db.query(models.Medicine).filter(
        models.Medicine.id == medicine_id
    ).first()

    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    return crud.update_medicine(db, medicine_id, medicine)


@router.patch("/{medicine_id}/status")
def update_medicine_status(
    medicine_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    db_medicine = db.query(models.Medicine).filter(
        models.Medicine.id == medicine_id
    ).first()

    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    valid = ["Active", "Low Stock", "Expired", "Out of Stock"]
    if payload.get("status") not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    db_medicine.status = payload["status"]
    db.commit()
    db.refresh(db_medicine)
    return db_medicine