from sqlalchemy.orm import Session
from . import models, schemas
from datetime import date


def calculate_status(quantity, expiry_date):

    if expiry_date < date.today():
        return "Expired"

    if quantity == 0:
        return "Out of Stock"

    if quantity < 20:
        return "Low Stock"

    return "Active"


def get_medicines(db: Session, search: str = None, status: str = None, page: int = 1, limit: int = 10):

    query = db.query(models.Medicine)

    if search:
        query = query.filter(models.Medicine.name.contains(search))

    if status:
        query = query.filter(models.Medicine.status == status)

    total = query.count()

    offset = (page - 1) * limit

    medicines = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": medicines
    }

def create_medicine(db: Session, medicine: schemas.MedicineCreate):
    data = medicine.dict()

    data["status"] = calculate_status(
        data["quantity"],
        data["expiry_date"]
    )

    db_medicine = models.Medicine(**data)

    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)

    return db_medicine


def update_medicine(db: Session, medicine_id: int, medicine: schemas.MedicineUpdate):
    
    db_medicine = db.query(models.Medicine).filter(
        models.Medicine.id == medicine_id
    ).first()

    data = medicine.dict()

    # recalculate status automatically
    data["status"] = calculate_status(
        data["quantity"],
        data["expiry_date"]
    )

    for key, value in data.items():
        setattr(db_medicine, key, value)

    db.commit()
    db.refresh(db_medicine)

    return db_medicine