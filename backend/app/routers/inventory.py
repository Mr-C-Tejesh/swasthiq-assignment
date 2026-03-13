from fastapi import APIRouter, Depends
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
    return crud.update_medicine(db, medicine_id, medicine)


@router.get("/expired")
def get_expired_medicines(db: Session = Depends(get_db)):

    expired_medicines = db.query(models.Medicine).filter(
        models.Medicine.expiry_date < date.today()
    ).all()

    return expired_medicines