from sqlalchemy import Column, Integer, String, Float, Date
from .database import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    generic_name = Column(String)

    batch_no = Column(String)

    expiry_date = Column(Date)

    quantity = Column(Integer)

    price = Column(Float)

    supplier = Column(String)

    status = Column(String)