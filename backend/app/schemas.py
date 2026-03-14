from pydantic import BaseModel, validator
from datetime import date, datetime
from typing import Optional, List


# ── Medicine Schemas ─────────────────────────────────────────────────────────

class MedicineCreate(BaseModel):
    name:         str
    generic_name: str
    batch_no:     str
    expiry_date:  date
    quantity:     int
    price:        float
    supplier:     str

    # status is intentionally excluded — always derived from quantity + expiry_date
    # if someone passes status we just ignore it

    @validator("name", "generic_name", "batch_no", "supplier", pre=True)
    def strip_whitespace(cls, v):
        # avoid saving "  Paracetamol  " with accidental spaces
        if isinstance(v, str):
            return v.strip()
        return v

    @validator("quantity")
    def quantity_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v

    @validator("price")
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return v

    @validator("expiry_date")
    def expiry_must_be_valid(cls, v):
        # we allow today's date — expires at end of day
        # we don't block past dates because a pharmacist might need to log
        # existing expired stock for record-keeping
        return v


class MedicineUpdate(BaseModel):
    name:         Optional[str]
    generic_name: Optional[str]
    batch_no:     Optional[str]
    expiry_date:  Optional[date]
    quantity:     Optional[int]
    price:        Optional[float]
    supplier:     Optional[str]

    @validator("name", "generic_name", "batch_no", "supplier", pre=True)
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @validator("quantity")
    def quantity_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Quantity cannot be negative")
        return v

    @validator("price")
    def price_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than zero")
        return v


class StatusUpdate(BaseModel):
    status: str

    @validator("status")
    def must_be_valid_status(cls, v):
        allowed = ["Active", "Low Stock", "Expired", "Out of Stock"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {allowed}")
        return v


class MedicineResponse(BaseModel):
    id:             int
    name:           str
    generic_name:   str
    batch_no:       str
    expiry_date:    date
    quantity:       int
    price:          float
    supplier:       str
    status:         str
    days_to_expiry: int   # computed field — shows urgency at a glance
    created_at:     datetime
    updated_at:     datetime

    class Config:
        orm_mode = True


# ── Sale Schemas ─────────────────────────────────────────────────────────────

class SaleItemResponse(BaseModel):
    id:         int
    medicine_id: int
    quantity:   int
    unit_price: float

    class Config:
        orm_mode = True


class SaleResponse(BaseModel):
    id:           int
    invoice_no:   str
    patient_name: str
    payment_mode: str
    total_amount: float
    status:       str
    item_count:   int
    created_at:   datetime

    class Config:
        orm_mode = True


# ── Paginated Response ───────────────────────────────────────────────────────

class PaginatedMedicines(BaseModel):
    data:        List[MedicineResponse]
    total:       int
    page:        int
    limit:       int
    total_pages: int
    has_next:    bool
    has_prev:    bool