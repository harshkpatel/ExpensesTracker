from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.database import get_db
from ..models.expense import Expense, ExpenseCreate
from ..services.expense_service import ExpenseService

router = APIRouter()

@router.post("/expenses/", response_model=Expense)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    return service.create_expense(expense)

@router.get("/expenses/", response_model=List[Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    return service.get_expenses(skip=skip, limit=limit)

@router.get("/expenses/{expense_id}", response_model=Expense)
def read_expense(expense_id: int, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    expense = service.get_expense(expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    if not service.delete_expense(expense_id):
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"} 