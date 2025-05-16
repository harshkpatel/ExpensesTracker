import random
import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add the parent directory to the path to import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import SessionLocal
from src.db.models import Category, Expense

# Sample categories with descriptions
CATEGORIES = [
    {"name": "Groceries", "description": "Food and household items"},
    {"name": "Dining", "description": "Restaurants and eating out"},
    {"name": "Transportation", "description": "Gas, public transit, and rideshare"},
    {"name": "Entertainment", "description": "Movies, shows, and events"},
    {"name": "Utilities", "description": "Electricity, water, internet, etc."},
    {"name": "Housing", "description": "Rent, mortgage, and housing expenses"},
    {"name": "Health", "description": "Medical expenses and health insurance"},
    {"name": "Shopping", "description": "Clothing, electronics, and other items"},
    {"name": "Travel", "description": "Flights, hotels, and vacation expenses"},
    {"name": "Education", "description": "Tuition, books, and courses"},
]

# Sample expense descriptions for each category
EXPENSE_DESCRIPTIONS = {
    "Groceries": [
        "Weekly grocery run at Trader Joe's",
        "Safeway groceries",
        "Whole Foods shopping",
        "Costco bulk purchase",
        "Fresh produce from farmers market",
    ],
    "Dining": [
        "Lunch with colleagues",
        "Dinner at Italian restaurant",
        "Coffee and pastry",
        "Sushi takeout",
        "Fast food",
    ],
    "Transportation": [
        "Gas station fill-up",
        "Uber ride",
        "Monthly transit pass",
        "Lyft to airport",
        "Parking fee",
    ],
    "Entertainment": [
        "Movie tickets",
        "Concert tickets",
        "Netflix subscription",
        "Theater show",
        "Spotify premium",
    ],
    "Utilities": [
        "Electricity bill",
        "Water bill",
        "Internet service",
        "Cell phone bill",
        "Gas bill",
    ],
    "Housing": [
        "Monthly rent",
        "Mortgage payment",
        "Home insurance",
        "HOA fees",
        "Property tax",
    ],
    "Health": [
        "Prescription medication",
        "Doctor's visit copay",
        "Health insurance premium",
        "Gym membership",
        "Dental cleaning",
    ],
    "Shopping": [
        "New shoes",
        "Laptop purchase",
        "Clothing at department store",
        "Amazon order",
        "Home decor items",
    ],
    "Travel": [
        "Flight tickets",
        "Hotel booking",
        "Car rental",
        "Travel insurance",
        "Vacation activities",
    ],
    "Education": [
        "Textbooks",
        "Online course subscription",
        "Tuition payment",
        "School supplies",
        "Workshop registration",
    ],
}

# Expense amount ranges for each category (min, max)
AMOUNT_RANGES = {
    "Groceries": (30, 200),
    "Dining": (15, 100),
    "Transportation": (10, 80),
    "Entertainment": (15, 150),
    "Utilities": (50, 300),
    "Housing": (800, 3000),
    "Health": (20, 500),
    "Shopping": (20, 500),
    "Travel": (100, 2000),
    "Education": (50, 1000),
}

def ensure_categories_exist(db: Session):
    """Make sure all categories exist in the database."""
    existing_categories = {cat.name: cat for cat in db.query(Category).all()}
    
    # Make sure Uncategorized exists and is protected
    if "Uncategorized" not in existing_categories:
        uncategorized = Category(name="Uncategorized", description="Default category", is_protected=True)
        db.add(uncategorized)
        db.commit()
    elif not existing_categories["Uncategorized"].is_protected:
        existing_categories["Uncategorized"].is_protected = True
        db.commit()
    
    # Add any missing categories
    for category_data in CATEGORIES:
        if category_data["name"] not in existing_categories:
            category = Category(**category_data)
            db.add(category)
    
    db.commit()
    
    # Return all categories
    return {cat.name: cat for cat in db.query(Category).all()}

def generate_expenses(db: Session, num_expenses: int, categories: dict):
    """Generate random expenses."""
    # Get current date and calculate date range (1 year back)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    date_range = (end_date - start_date).days
    
    expenses = []
    for _ in range(num_expenses):
        # Random date within the last year
        days_ago = random.randint(0, date_range)
        expense_date = end_date - timedelta(days=days_ago)
        
        # Random category (sometimes null/Uncategorized)
        if random.random() < 0.1:  # 10% chance of no category
            category_name = "Uncategorized"
        else:
            category_name = random.choice(list(categories.keys()))
        
        # Random amount based on category
        if category_name in AMOUNT_RANGES:
            min_amount, max_amount = AMOUNT_RANGES[category_name]
            amount = round(random.uniform(min_amount, max_amount), 2)
        else:
            amount = round(random.uniform(10, 1000), 2)
        
        # Random description based on category
        if category_name in EXPENSE_DESCRIPTIONS:
            description = random.choice(EXPENSE_DESCRIPTIONS[category_name])
        else:
            description = f"Expense for {category_name}"
        
        # Create expense
        expense = Expense(
            amount=amount,
            description=description,
            date=expense_date,
            category=category_name  # Use category name string instead of category_id
        )
        expenses.append(expense)
    
    # Add all expenses to db
    db.add_all(expenses)
    db.commit()
    
    return expenses

def main():
    """Main function to generate mock data."""
    db = SessionLocal()
    try:
        print("Ensuring categories exist...")
        categories = ensure_categories_exist(db)
        
        num_expenses = 200  # Default number of expenses to generate
        if len(sys.argv) > 1:
            try:
                num_expenses = int(sys.argv[1])
            except ValueError:
                print(f"Invalid argument: {sys.argv[1]}. Using default value of {num_expenses}.")
        
        print(f"Generating {num_expenses} random expenses...")
        expenses = generate_expenses(db, num_expenses, categories)
        
        print(f"Successfully generated {len(expenses)} expenses.")
        
        # Basic summary
        total_amount = sum(expense.amount for expense in expenses)
        print(f"Total amount of all generated expenses: ${total_amount:.2f}")
        
        category_counts = {}
        for expense in expenses:
            cat_name = expense.category if expense.category else "Uncategorized"
            if cat_name not in category_counts:
                category_counts[cat_name] = 0
            category_counts[cat_name] += 1
        
        print("\nExpenses by category:")
        for cat_name, count in category_counts.items():
            print(f"  {cat_name}: {count} expenses")
            
    finally:
        db.close()

if __name__ == "__main__":
    main() 