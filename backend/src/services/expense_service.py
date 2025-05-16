from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..models.expense import ExpenseCreate, Expense
from ..db.models import Expense as ExpenseModel, Category as CategoryModel
from ..models.category import UNCATEGORIZED

class ExpenseService:
    def __init__(self, db: Session):
        self.db = db

    def create_expense(self, expense: ExpenseCreate) -> Expense:
        # If no category is specified, use Uncategorized
        if not expense.category_id:
            uncategorized = self.db.query(CategoryModel).filter(CategoryModel.name == UNCATEGORIZED).first()
            if not uncategorized:
                raise ValueError("Uncategorized category not found")
            expense.category_id = uncategorized.id

        db_expense = ExpenseModel(
            amount=expense.amount,
            description=expense.description,
            date=expense.date,
            category_id=expense.category_id,
            receipt_path=expense.receipt_path
        )
        self.db.add(db_expense)
        self.db.commit()
        self.db.refresh(db_expense)
        return Expense.from_orm(db_expense)

    def get_expenses(self, skip: int = 0, limit: int = 100) -> List[Expense]:
        expenses = self.db.query(ExpenseModel).offset(skip).limit(limit).all()
        return [Expense.from_orm(expense) for expense in expenses]

    def get_expense(self, expense_id: int) -> Optional[Expense]:
        expense = self.db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
        return Expense.from_orm(expense) if expense else None

    def update_expense(self, expense_id: int, expense: ExpenseCreate) -> Optional[Expense]:
        db_expense = self.get_expense(expense_id)
        if db_expense:
            for key, value in expense.dict(exclude_unset=True).items():
                setattr(db_expense, key, value)
            self.db.commit()
            self.db.refresh(db_expense)
            return db_expense
        return None

    def delete_expense(self, expense_id: int) -> bool:
        expense = self.db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
        if expense:
            self.db.delete(expense)
            self.db.commit()
            return True
        return False 