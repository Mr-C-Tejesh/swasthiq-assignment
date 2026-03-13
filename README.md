# Pharmacy CRM – SwasthiQ Assignment

## Overview
A Pharmacy CRM system built with FastAPI and React that allows managing medicines,
monitoring stock, and viewing dashboard analytics.

## Tech Stack
Backend: FastAPI, SQLite
Frontend: React (functional components + hooks)

## API Design

### Inventory APIs
GET /inventory
POST /inventory
GET /inventory/expired

### Dashboard APIs
GET /dashboard/summary
GET /dashboard/low-stock
GET /dashboard/purchase-orders

## Data Consistency

When medicines are created or updated, the backend automatically recalculates
the medicine status based on quantity and expiry date.

Status rules:
- quantity = 0 → Out of Stock
- quantity < threshold → Low Stock
- expiry_date < today → Expired
- otherwise → Active

This ensures the frontend always receives consistent inventory state.