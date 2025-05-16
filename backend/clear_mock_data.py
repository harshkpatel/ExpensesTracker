import sys
import os

# Add the parent directory to the path to import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import SessionLocal
from src.db.models import Expense

def clear_mock_expenses():
    """Remove all expenses from the database."""
    db = SessionLocal()
    try:
        # Count expenses before deletion
        expense_count = db.query(Expense).count()
        print(f"Found {expense_count} expenses in the database.")
        
        # Delete all expenses
        db.query(Expense).delete()
        db.commit()
        
        print(f"Successfully deleted all {expense_count} expenses.")
        print("Categories have been preserved.")
        
    finally:
        db.close()

if __name__ == "__main__":
    confirmation = input("This will delete ALL expenses in the database. Are you sure? (yes/no): ")
    if confirmation.lower() in ["yes", "y"]:
        clear_mock_expenses()
    else:
        print("Operation canceled.") 