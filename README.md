# Pharmacy CRM – SwasthiQ Assignment

## Overview
This project is a Pharmacy CRM system built using FastAPI for the backend and React for the frontend.

The system allows pharmacists to manage medicines, track inventory status, and view dashboard statistics.

---

## Tech Stack

Backend
- FastAPI
- SQLite
- SQLAlchemy

Frontend
- React (Functional Components + Hooks)

---

## Project Structure

swasthiq-assignment
 ├ backend
 ├ frontend
 └ README.md

---

## API Structure

### Inventory APIs

GET /inventory  
Returns list of medicines with search, filter, and pagination.

POST /inventory  
Adds a new medicine to inventory.

GET /inventory/expired  
Returns medicines where expiry_date < today.

---

### Dashboard APIs

GET /dashboard/summary  
Returns total items, low stock items, and out of stock items.

GET /dashboard/low-stock  
Returns medicines with low quantity.

GET /dashboard/purchase-orders  
Returns purchase order statistics.

---

## Data Consistency

The backend ensures correct inventory status automatically.

Rules used:

quantity = 0 → Out of Stock  
quantity < threshold → Low Stock  
expiry_date < today → Expired  
otherwise → Active

Whenever a medicine is created or updated, the backend recalculates the correct status. This ensures the frontend always receives consistent data.

---

## Running the Project

Backend

cd backend  
pip install -r requirements.txt  
uvicorn app.main:app --reload  

Frontend

cd frontend  
npm install  
npm start