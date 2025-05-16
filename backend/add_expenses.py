import requests
import random
import json
from datetime import datetime, timedelta

# Categories
CATEGORIES = ["Groceries", "Dining", "Transportation", "Entertainment", "Utilities", 
             "Housing", "Health", "Shopping", "Travel", "Education", "Uncategorized"]

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
    "Uncategorized": [
        "Miscellaneous expense",
        "Unplanned purchase",
        "One-time expense",
        "Various items",
        "Other expenses",
    ]
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
    "Uncategorized": (10, 500),
}

def generate_expense():
    # Random date within the last year
    days_ago = random.randint(0, 365)
    expense_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
    
    # Random category
    category = random.choice(CATEGORIES)
    
    # Random amount based on category
    min_amount, max_amount = AMOUNT_RANGES[category]
    amount = round(random.uniform(min_amount, max_amount), 2)
    
    # Random description based on category
    description = random.choice(EXPENSE_DESCRIPTIONS[category])
    
    return {
        "amount": amount,
        "category": category,
        "description": description,
        "date": expense_date
    }

def add_expenses(num_expenses):
    url = "http://localhost:8000/expenses/"
    headers = {"Content-Type": "application/json"}
    
    print(f"Adding {num_expenses} expenses...")
    
    success_count = 0
    
    for i in range(num_expenses):
        expense = generate_expense()
        try:
            response = requests.post(url, headers=headers, json=expense)
            if response.status_code == 200:
                success_count += 1
                if i % 10 == 0:  # Print progress every 10 expenses
                    print(f"Added {i+1}/{num_expenses} expenses...")
            else:
                print(f"Failed to add expense: {response.text}")
        except Exception as e:
            print(f"Error adding expense: {e}")
    
    print(f"Successfully added {success_count} out of {num_expenses} expenses.")

if __name__ == "__main__":
    import sys
    
    num_expenses = 150  # Default
    if len(sys.argv) > 1:
        try:
            num_expenses = int(sys.argv[1])
        except ValueError:
            print(f"Invalid argument: {sys.argv[1]}. Using default value of {num_expenses}.")
    
    add_expenses(num_expenses) 