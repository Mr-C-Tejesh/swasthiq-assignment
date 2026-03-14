from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)

def build_response(med: models.Medicine) -> dict:
    return {
        "id":             med.id,
        "name":           med.name,
        "generic_name":   med.generic_name,
        "batch_no":       med.batch_no,
        "expiry_date":    str(med.expiry_date),
        "quantity":       med.quantity,
        "price":          med.price,
        "supplier":       med.supplier,
        "status":         med.status,
        "created_at":     str(med.created_at),
        "updated_at":     str(med.updated_at),
        "days_to_expiry": (med.expiry_date - date.today()).days
    }

@router.get("/overview")
def get_inventory_overview(db: Session = Depends(get_db)):
    return crud.get_inventory_overview(db)

@router.get("/expired")
def get_expired_medicines(db: Session = Depends(get_db)):
    medicines = db.query(models.Medicine).filter(
        models.Medicine.expiry_date <= date.today()
    ).all()
    return [build_response(m) for m in medicines]

@router.get("/")
def list_medicines(
    search:  Optional[str] = Query(None),
    status:  Optional[str] = Query(None),
    page:    int           = Query(1, ge=1),
    limit:   int           = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = crud.get_medicines(db, search, status, page, limit)
    result["data"] = [build_response(m) for m in result["data"]]
    return result

@router.post("/", status_code=201)
def add_medicine(
    medicine: schemas.MedicineCreate,
    db: Session = Depends(get_db)
):
    med = crud.create_medicine(db, medicine)
    return build_response(med)

@router.put("/{medicine_id}")
def update_medicine(
    medicine_id: int,
    medicine: schemas.MedicineUpdate,
    db: Session = Depends(get_db)
):
    med = crud.update_medicine(db, medicine_id, medicine)
    return build_response(med)

@router.patch("/{medicine_id}/status")
def update_medicine_status(
    medicine_id: int,
    payload: schemas.StatusUpdate,
    db: Session = Depends(get_db)
):
    med = crud.update_medicine_status(db, medicine_id, payload.status)
    return build_response(med)