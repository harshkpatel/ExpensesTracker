from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import os
import json
from datetime import datetime, date
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
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://expenses-tracker-frontend.vercel.app",  # Production frontend
    ],
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
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
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
async def get_summary(db: Session = Depends(get_db), time_range: str = "month"):
    # Get all expenses
    all_expenses = db.query(ExpenseModel).all()
    
    # Calculate total expenses for all time (used for some suggestions)
    total_expenses = sum(expense.amount for expense in all_expenses)
    
    # Filter expenses by time range
    filtered_expenses = []
    from datetime import datetime, timedelta
    
    # Get today's date
    today = datetime.now().date()
    
    # Filter expenses based on time range
    if time_range == "week":
        # Last 7 days
        start_date = today - timedelta(days=6)
        filtered_expenses = [
            expense for expense in all_expenses
            if expense.date >= start_date and expense.date <= today
        ]
    elif time_range == "month":
        # Last 30 days
        start_date = today - timedelta(days=29)
        filtered_expenses = [
            expense for expense in all_expenses
            if expense.date >= start_date and expense.date <= today
        ]
    elif time_range == "year":
        # Last 365 days
        start_date = today - timedelta(days=364)
        filtered_expenses = [
            expense for expense in all_expenses
            if expense.date >= start_date and expense.date <= today
        ]
    else:
        # Default to all expenses
        filtered_expenses = all_expenses
    
    # Calculate time-specific total
    period_total = sum(expense.amount for expense in filtered_expenses)
    
    # Calculate category breakdown based on filtered expenses
    category_totals = {}
    for expense in filtered_expenses:
        category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
    
    category_breakdown = [
        {"category": category, "total": total}
        for category, total in category_totals.items()
    ]
    
    # Calculate monthly trend based on time range
    monthly_totals = {}
    
    # Use different expenses data based on time range
    if time_range == "year":
        # For yearly view, only include months in the last 365 days
        for expense in filtered_expenses:
            month = expense.date.strftime("%Y-%m")
            monthly_totals[month] = monthly_totals.get(month, 0) + expense.amount
    else:
        # For other views, include all historical months for context
        # but ensure we return the filtered total for the current period
        for expense in all_expenses:
            month = expense.date.strftime("%Y-%m")
            monthly_totals[month] = monthly_totals.get(month, 0) + expense.amount
    
    # Sort by month chronologically
    monthly_trend = [
        {"month": month, "total": total}
        for month, total in sorted(monthly_totals.items())
    ]
    
    # Get recent expenses (last 5)
    recent_expenses = db.query(ExpenseModel).order_by(ExpenseModel.date.desc()).limit(5).all()
    recent_expenses_list = [
        {
            "id": expense.id,
            "amount": expense.amount,
            "category": expense.category,
            "description": expense.description,
            "date": expense.date.isoformat()
        }
        for expense in recent_expenses
    ]
    
    # Create weekly trends data
    weekly_trends = []
    if time_range in ["week", "month", "year"]:
        # Get today and calculate dates for the last 4 weeks
        for i in range(4):
            # Calculate week end (most recent day of the week)
            week_end = today - timedelta(days=i * 7)
            # Calculate week start (7 days before week end)
            week_start = week_end - timedelta(days=6)
            
            # Format for display
            week_label = f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d')}"
            
            # Find expenses in this week
            week_expenses = [
                expense for expense in all_expenses 
                if week_start <= expense.date <= week_end
            ]
            
            # Calculate total for the week
            week_total = sum(expense.amount for expense in week_expenses)
            
            weekly_trends.append({
                "week": week_label,
                "amount": week_total,
                "sortKey": 4 - i  # Most recent week has highest sortKey
            })
    
    # Create daily data for weekly view
    daily_data = []
    if time_range == "week":
        # Get 7 days ago
        week_ago = today - timedelta(days=6)
        
        # Query expenses for the last 7 days
        weekly_expenses = [e for e in all_expenses if week_ago <= e.date <= today]
        
        # Group by date
        daily_totals = {}
        daily_expenses = {}
        
        for expense in weekly_expenses:
            date_str = expense.date.isoformat()
            if date_str not in daily_totals:
                daily_totals[date_str] = 0
                daily_expenses[date_str] = []
            
            daily_totals[date_str] += expense.amount
            daily_expenses[date_str].append({
                "id": expense.id,
                "amount": expense.amount,
                "category": expense.category,
                "description": expense.description
            })
        
        # Create array of daily data
        for i in range(7):
            current_date = week_ago + timedelta(days=i)
            date_str = current_date.isoformat()
            
            daily_data.append({
                "date": date_str,
                "total": daily_totals.get(date_str, 0),
                "expenses": daily_expenses.get(date_str, []),
                "day_of_week": current_date.weekday(),
                "day": current_date.day,
                "month": current_date.month, 
                "chronological_key": i  # 0 is oldest, 6 is newest
            })
    
    # Generate optimization suggestions
    suggestions = []
    if total_expenses > 1000:
        suggestions.append("Consider reviewing your spending in categories with highest expenses")
    if len(category_breakdown) > 5:
        suggestions.append("You have many expense categories. Consider consolidating similar categories")
    
    result = {
        "totalExpenses": period_total,  # Now returns period-specific total instead of all-time total
        "categoryBreakdown": category_breakdown,
        "monthlyTrend": monthly_trend,
        "weeklyTrends": weekly_trends,
        "recentExpenses": recent_expenses_list,
        "optimizationSuggestions": suggestions
    }
    
    # Add daily data if in weekly view
    if daily_data:
        result["dailyData"] = daily_data
    
    return result

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