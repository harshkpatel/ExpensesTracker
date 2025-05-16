from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from src.api import expense_routes, receipt_routes, analytics_routes, category_routes
from src.db.database import engine, SessionLocal
from src.db import models
from src.services.category_service import CategoryService

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create necessary directories
os.makedirs("receipts", exist_ok=True)

app = FastAPI(title="Expenses Tracker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for receipts
app.mount("/receipts", StaticFiles(directory="receipts"), name="receipts")

# Include routers
app.include_router(expense_routes.router, prefix="/api", tags=["expenses"])
app.include_router(receipt_routes.router, prefix="/api", tags=["receipts"])
app.include_router(analytics_routes.router, prefix="/api", tags=["analytics"])
app.include_router(category_routes.router, prefix="/api", tags=["categories"])

@app.on_event("startup")
async def startup_event():
    # Ensure Uncategorized category exists
    db = SessionLocal()
    try:
        category_service = CategoryService(db)
        category_service.ensure_uncategorized_exists()
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Expense Tracker API"} 