from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    generic_name = Column(String, nullable=False)
    batch_no     = Column(String, nullable=False, unique=True)
    expiry_date  = Column(Date, nullable=False)
    quantity     = Column(Integer, nullable=False, default=0)
    price        = Column(Float, nullable=False)
    supplier     = Column(String, nullable=False)

    # status is never set by the user — always derived from quantity + expiry_date
    # stored in DB so we can filter/search by it, but always recalculated on read
    status = Column(String, nullable=False, default="Active")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sale_items = relationship("SaleItem", back_populates="medicine")


class Sale(Base):
    __tablename__ = "sales"

    id           = Column(Integer, primary_key=True, index=True)
    invoice_no   = Column(String, nullable=False, unique=True)
    patient_name = Column(String, nullable=False)
    payment_mode = Column(String, nullable=False, default="Cash")
    total_amount = Column(Float, nullable=False)
    status       = Column(String, nullable=False, default="Completed")
    created_at   = Column(DateTime, default=datetime.utcnow)

    items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id          = Column(Integer, primary_key=True, index=True)
    sale_id     = Column(Integer, ForeignKey("sales.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity    = Column(Integer, nullable=False)
    unit_price  = Column(Float, nullable=False)

    sale     = relationship("Sale", back_populates="items")
    medicine = relationship("Medicine", back_populates="sale_items")