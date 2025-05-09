from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import os
import json
from datetime import datetime, date
import cv2
import numpy as np
import pytesseract
from PIL import Image
import io
import re
import uuid
import shutil
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Initialize FastAPI app
app = FastAPI(title="Expenses Tracker API")

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary folders
UPLOAD_DIR = Path("./uploads")
DB_DIR = Path("./data")
UPLOAD_DIR.mkdir(exist_ok=True)
DB_DIR.mkdir(exist_ok=True)

# SQLite database file path
DATABASE_PATH = DB_DIR / "expenses.db"

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/expenses.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Models
class CategoryModel(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class ExpenseModel(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(Date)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models for data validation
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    
    class Config:
        orm_mode = True

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: str
    date: date
    
class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    
    class Config:
        orm_mode = True

class OCRResult(BaseModel):
    text: str
    extracted_data: Dict[str, Any]

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API routes
@app.get("/", response_class=JSONResponse)
async def root():
    return {"message": "Expenses Tracker API is running"}

# Expense CRUD endpoints
@app.post("/expenses/", response_model=Expense)
async def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = ExpenseModel(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses/", response_model=List[Expense])
async def read_expenses(db: Session = Depends(get_db)):
    return db.query(ExpenseModel).all()

@app.get("/expenses/{expense_id}", response_model=Expense)
async def read_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@app.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: int, expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.dict().items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# Category endpoints
@app.get("/categories/", response_model=List[Category])
async def read_categories(db: Session = Depends(get_db)):
    return db.query(CategoryModel).all()

@app.post("/categories/", response_model=Category)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = CategoryModel(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

# Analytics endpoints
@app.get("/analytics/summary")
async def get_summary(db: Session = Depends(get_db)):
    # Get all expenses
    expenses = db.query(ExpenseModel).all()
    
    # Calculate total expenses
    total_expenses = sum(expense.amount for expense in expenses)
    
    # Calculate category breakdown
    category_totals = {}
    for expense in expenses:
        category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
    
    category_breakdown = [
        {"category": category, "total": total}
        for category, total in category_totals.items()
    ]
    
    # Calculate monthly trend
    monthly_totals = {}
    for expense in expenses:
        month = expense.date.strftime("%Y-%m")
        monthly_totals[month] = monthly_totals.get(month, 0) + expense.amount
    
    monthly_trend = [
        {"month": month, "total": total}
        for month, total in sorted(monthly_totals.items())
    ]
    
    # Generate optimization suggestions
    suggestions = []
    if total_expenses > 1000:
        suggestions.append("Consider reviewing your spending in categories with highest expenses")
    if len(category_breakdown) > 5:
        suggestions.append("You have many expense categories. Consider consolidating similar categories")
    
    return {
        "totalExpenses": total_expenses,
        "categoryBreakdown": category_breakdown,
        "monthlyTrend": monthly_trend,
        "optimizationSuggestions": suggestions
    }

# Receipt scanning endpoint
@app.post("/scan-receipt/", response_model=OCRResult)
async def scan_receipt(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save uploaded file temporarily
    temp_file_path = UPLOAD_DIR / f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Perform OCR on the image
        image = Image.open(temp_file_path)
        ocr_text = pytesseract.image_to_string(image)
        
        # Extract information from the OCR text
        extracted_data = extract_receipt_data(ocr_text)
        
        return {
            "text": ocr_text,
            "extracted_data": extracted_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def extract_receipt_data(text):
    """Extract relevant data from OCR text"""
    # Initialize with default values
    data = {
        "total": None,
        "date": None,
        "merchant": None,
        "items": []
    }
    
    # Extract total amount
    total_pattern = r"(?i)total\s*:?\s*\$?\s*(\d+\.?\d*)"
    total_match = re.search(total_pattern, text)
    if total_match:
        data["total"] = float(total_match.group(1))
    
    # Extract date
    date_pattern = r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}"
    date_match = re.search(date_pattern, text)
    if date_match:
        data["date"] = date_match.group(0)
    
    # Extract merchant name (usually at the top of the receipt)
    lines = text.split('\n')
    if lines:
        data["merchant"] = lines[0].strip()
    
    # Extract items (lines with prices)
    item_pattern = r"(.+?)\s+\$?\s*(\d+\.?\d*)"
    for line in lines:
        item_match = re.search(item_pattern, line)
        if item_match:
            item_name = item_match.group(1).strip()
            item_price = float(item_match.group(2))
            data["items"].append({
                "name": item_name,
                "price": item_price
            })
    
    return data

@app.get("/ml/optimize")
async def get_optimization_suggestions(db: Session = Depends(get_db)):
    # Get all expenses
    expenses = db.query(ExpenseModel).all()
    
    # Calculate category totals
    category_totals = {}
    for expense in expenses:
        category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
    
    # Find categories with highest spending
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    suggestions = []
    if sorted_categories:
        highest_category = sorted_categories[0]
        suggestions.append(f"Highest spending category: {highest_category[0]} (${highest_category[1]:.2f})")
        
        # Compare with other categories
        if len(sorted_categories) > 1:
            second_highest = sorted_categories[1]
            if highest_category[1] > 2 * second_highest[1]:
                suggestions.append(f"Consider reducing spending in {highest_category[0]} as it's significantly higher than other categories")
    
    return {"suggestions": suggestions}

@app.get("/export")
async def export_data(db: Session = Depends(get_db)):
    # Get all expenses and categories
    expenses = db.query(ExpenseModel).all()
    categories = db.query(CategoryModel).all()
    
    # Convert to dictionaries
    expenses_data = [{"id": e.id, "amount": e.amount, "category": e.category, 
                     "description": e.description, "date": e.date.isoformat()} 
                    for e in expenses]
    categories_data = [{"id": c.id, "name": c.name} for c in categories]
    
    return {
        "expenses": expenses_data,
        "categories": categories_data
    }

@app.post("/import")
async def import_data(data: dict, db: Session = Depends(get_db)):
    try:
        # Import categories
        for category in data.get("categories", []):
            db_category = CategoryModel(name=category["name"])
            db.add(db_category)
        
        # Import expenses
        for expense in data.get("expenses", []):
            db_expense = ExpenseModel(
                amount=expense["amount"],
                category=expense["category"],
                description=expense["description"],
                date=datetime.fromisoformat(expense["date"]).date()
            )
            db.add(db_expense)
        
        db.commit()
        return {"message": "Data imported successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error importing data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)