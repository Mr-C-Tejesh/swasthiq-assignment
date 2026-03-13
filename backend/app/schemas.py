from pydantic import BaseModel
from datetime import date


class MedicineBase(BaseModel):
    name: str
    generic_name: str
    batch_no: str
    expiry_date: date
    quantity: int
    price: float
    supplier: str
    status: str


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(MedicineBase):
    pass


class Medicine(MedicineBase):
    id: int

    class Config:
        orm_mode = True