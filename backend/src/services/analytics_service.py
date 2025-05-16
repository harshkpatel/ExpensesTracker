from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Dict, List
from ..db.models import Expense as ExpenseModel, Category as CategoryModel

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self) -> Dict:
        # Get total expenses
        total_expenses = self.db.query(func.sum(ExpenseModel.amount)).scalar() or 0

        # Get expenses by category name
        category_totals = (
            self.db.query(
                CategoryModel.name,
                func.sum(ExpenseModel.amount).label('total')
            )
            .join(CategoryModel, ExpenseModel.category_id == CategoryModel.id)
            .group_by(CategoryModel.name)
            .all()
        )

        # Get recent expenses
        recent_expenses = (
            self.db.query(ExpenseModel)
            .order_by(ExpenseModel.date.desc())
            .limit(5)
            .all()
        )

        return {
            "totalExpenses": total_expenses,
            "categoryBreakdown": [
                {"category": cat_name, "total": float(total)}
                for cat_name, total in category_totals
            ],
            "recentExpenses": [
                {
                    "id": expense.id,
                    "amount": float(expense.amount),
                    "category": expense.category.name if expense.category else "Uncategorized",
                    "description": expense.description,
                    "date": expense.date.isoformat()
                }
                for expense in recent_expenses
            ]
        } 