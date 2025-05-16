import random
import sys
import os
from datetime import datetime, timedelta
import calendar
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

# Monthly budget allocation with realistic recurring patterns
MONTHLY_BUDGET = {
    "Housing": 1800,  # Constant monthly rent/mortgage
    "Groceries": 500,  # Regular expense with slight variation
    "Dining": 300,    # Variable based on social activity
    "Utilities": 200,  # Seasonal variation (more in winter/summer)
    "Transportation": 250,  # Regular with occasional spikes
    "Health": 150,    # Regular with occasional medical visits
    "Entertainment": 100,  # Variable based on events
    "Shopping": 200,  # Variable with seasonal spikes (holidays)
    "Travel": 300,    # Occasional big expenses
    "Education": 200,  # Spikes at beginning of semesters
}

# Seasonal variations (multipliers for each month)
SEASONAL_FACTORS = {
    "Utilities": {  # Higher in winter/summer for heating/cooling
        1: 1.3, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.7, 6: 1.0, 
        7: 1.2, 8: 1.3, 9: 1.0, 10: 0.8, 11: 1.0, 12: 1.2
    },
    "Entertainment": {  # Higher in summer and December
        1: 0.8, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.1, 6: 1.2, 
        7: 1.3, 8: 1.2, 9: 1.0, 10: 1.0, 11: 1.1, 12: 1.5
    },
    "Shopping": {  # Spikes for back-to-school and holidays
        1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.0, 6: 1.0, 
        7: 1.0, 8: 1.3, 9: 1.1, 10: 1.0, 11: 1.5, 12: 2.0
    },
    "Travel": {  # Summer and holiday travel
        1: 0.5, 2: 0.7, 3: 1.0, 4: 1.0, 5: 1.2, 6: 1.5, 
        7: 1.8, 8: 1.5, 9: 1.0, 10: 0.8, 11: 1.0, 12: 1.8
    },
    "Dining": {  # More dining out in summer and December
        1: 0.9, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.1, 6: 1.2, 
        7: 1.3, 8: 1.2, 9: 1.0, 10: 1.0, 11: 1.1, 12: 1.4
    }
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

def generate_realistic_monthly_expenses(db: Session, categories: dict, num_months: int = 12):
    """Generate realistic monthly expenses with patterns."""
    today = datetime.now()
    end_date = datetime(today.year, today.month, 1)  # First day of current month
    
    expenses = []
    total_by_category = {}
    
    # Generate data for the specified number of months
    for i in range(num_months - 1, -1, -1):
        # Calculate year and month
        target_month = end_date.month - i
        target_year = end_date.year
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        
        # Get days in month
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        
        # For each category, create expenses
        for category_name, base_budget in MONTHLY_BUDGET.items():
            category = categories.get(category_name)
            if not category:
                continue
                
            # Apply seasonal factor if applicable
            seasonal_factor = SEASONAL_FACTORS.get(category_name, {}).get(target_month, 1.0)
            monthly_budget = base_budget * seasonal_factor
            
            # Track total by category
            if category_name not in total_by_category:
                total_by_category[category_name] = 0
                
            # Determine how many expenses to create for this category this month
            if category_name == "Housing":
                # Usually just one monthly payment
                num_expenses = 1
            elif category_name in ["Utilities", "Education", "Health"]:
                # Fewer, larger expenses
                num_expenses = random.randint(1, 3)
            elif category_name == "Travel":
                # Occasional expenses
                if seasonal_factor > 1.2:
                    num_expenses = random.randint(1, 3)
                else:
                    num_expenses = random.randint(0, 1)
            else:
                # More frequent expenses
                num_expenses = random.randint(3, 8)
            
            # Skip if no expenses this month
            if num_expenses == 0:
                continue
                
            # Create the expenses
            remaining_budget = monthly_budget
            
            for j in range(num_expenses):
                # Last expense gets the remainder
                if j == num_expenses - 1:
                    amount = remaining_budget
                else:
                    # Random portion of remaining budget
                    max_amount = remaining_budget * 0.8
                    min_amount = remaining_budget * 0.1
                    amount = round(random.uniform(min_amount, max_amount), 2)
                    remaining_budget -= amount
                
                # Random day in the month
                expense_day = random.randint(1, days_in_month)
                expense_date = datetime(target_year, target_month, expense_day)
                
                # Get random description
                description = random.choice(EXPENSE_DESCRIPTIONS.get(
                    category_name, [f"Expense for {category_name}"]))
                
                # Create expense
                expense = Expense(
                    amount=amount,
                    description=description,
                    date=expense_date,
                    category_id=category.id
                )
                expenses.append(expense)
                total_by_category[category_name] += amount
    
    # Add all expenses to db
    db.add_all(expenses)
    db.commit()
    
    return expenses, total_by_category

def main():
    """Main function to generate quality mock data."""
    db = SessionLocal()
    try:
        # First, clear out existing expenses
        expense_count = db.query(Expense).count()
        if expense_count > 0:
            confirmation = input(f"There are {expense_count} existing expenses. Delete them first? (yes/no): ")
            if confirmation.lower() in ["yes", "y"]:
                db.query(Expense).delete()
                db.commit()
                print(f"Deleted {expense_count} existing expenses.")
            else:
                print("Keeping existing expenses.")
        
        print("Ensuring categories exist...")
        categories = ensure_categories_exist(db)
        
        num_months = 12  # Default to 12 months
        if len(sys.argv) > 1:
            try:
                num_months = int(sys.argv[1])
            except ValueError:
                print(f"Invalid argument: {sys.argv[1]}. Using default value of {num_months}.")
        
        print(f"Generating realistic expenses for the past {num_months} months...")
        expenses, totals = generate_realistic_monthly_expenses(db, categories, num_months)
        
        print(f"Successfully generated {len(expenses)} expenses.")
        
        # Print summary
        print("\nSummary by category:")
        grand_total = 0
        for category, total in sorted(totals.items(), key=lambda x: -x[1]):
            print(f"  {category}: ${total:.2f}")
            grand_total += total
            
        print(f"\nTotal expenses: ${grand_total:.2f}")
        print(f"Average monthly spending: ${grand_total / num_months:.2f}")
            
    finally:
        db.close()

if __name__ == "__main__":
    main() 