from fastapi import FastAPI

from .database import engine
from . import models

from .routers import inventory, dashboard

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pharmacy CRM")

app.include_router(inventory.router)
app.include_router(dashboard.router)