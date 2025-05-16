from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import calendar
from ..db.models import Expense as ExpenseModel, Category as CategoryModel

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self, time_range: Optional[str] = None) -> Dict:
        """Generate comprehensive analytics summary with optional time range filtering."""
        # Apply time range filter if specified
        query = self.db.query(ExpenseModel)
        
        # Get current date for relative time ranges
        current_date = datetime.now()
        
        if time_range == 'week':
            # Last 7 days
            start_date = current_date - timedelta(days=7)
            query = query.filter(ExpenseModel.date >= start_date)
        elif time_range == 'month':
            # Last 30 days
            start_date = current_date - timedelta(days=30)
            query = query.filter(ExpenseModel.date >= start_date)
        elif time_range == 'year':
            # Last 365 days
            start_date = current_date - timedelta(days=365)
            query = query.filter(ExpenseModel.date >= start_date)
            
        # Get total expenses for the selected time range
        total_expenses = query.with_entities(func.sum(ExpenseModel.amount)).scalar() or 0

        # Get expenses by category for the selected time range
        category_query = (
            query.with_entities(
                CategoryModel.name,
                func.sum(ExpenseModel.amount).label('total')
            )
            .join(CategoryModel, ExpenseModel.category_id == CategoryModel.id)
            .group_by(CategoryModel.name)
        )
        
        category_totals = category_query.all()
        
        # Get recent expenses
        recent_expenses = (
            query
            .order_by(ExpenseModel.date.desc())
            .limit(5)
            .all()
        )
        
        # Generate monthly trends (last 6 months)
        monthly_trends = self._get_monthly_trends(query)
        
        # Generate weekly trends (last 4 weeks)
        weekly_trends = self._get_weekly_trends(query)
        
        # Generate optimization suggestions
        optimization_suggestions = self._generate_optimization_suggestions(category_totals, total_expenses)

        return {
            "totalExpenses": float(total_expenses),
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
            ],
            "monthlyTrends": monthly_trends,
            "weeklyTrends": weekly_trends,
            "optimizationSuggestions": optimization_suggestions
        }
    
    def _get_monthly_trends(self, base_query):
        """Generate monthly spending trends for the last 6 months."""
        today = datetime.now()
        monthly_data = []
        
        # Get all dates for the past year to calculate proper month-to-month trends
        date_year_ago = today - timedelta(days=365)
        
        # Query to get all expenses for the past year
        yearly_expenses = (
            base_query
            .filter(ExpenseModel.date >= date_year_ago)
            .all()
        )
        
        # Create a dict to store expenses by month
        monthly_totals = {}
        
        # Group expenses by month
        for expense in yearly_expenses:
            month_key = expense.date.strftime("%Y-%m")
            if month_key not in monthly_totals:
                monthly_totals[month_key] = 0
            monthly_totals[month_key] += expense.amount
        
        # Generate sorted months for the last 6 months
        sorted_months = []
        for i in range(5, -1, -1):  # Last 6 months
            # Calculate month and year
            target_month = today.month - i
            target_year = today.year
            
            # Adjust year if we need to go to previous year
            while target_month <= 0:
                target_month += 12
                target_year -= 1
                
            # Format the month key for lookup
            month_key = f"{target_year}-{target_month:02d}"
            month_name = calendar.month_name[target_month]
            sorted_months.append((month_key, f"{month_name} {target_year}", target_year * 100 + target_month))
        
        # Create data points in chronological order
        for month_key, month_label, sort_key in sorted_months:
            # Get the total for this month (or 0 if no expenses)
            month_total = monthly_totals.get(month_key, 0)
            
            monthly_data.append({
                "month": month_label,
                "amount": float(month_total),
                "sortKey": sort_key  # Add a proper numerical sort key
            })
            
        return monthly_data
    
    def _get_weekly_trends(self, base_query):
        """Generate weekly spending trends for the last 4 weeks."""
        today = datetime.now()
        weekly_data = []
        
        for i in range(3, -1, -1):  # Last 4 weeks
            end_date = today - timedelta(days=i*7)
            start_date = end_date - timedelta(days=6)
            
            # Ensure we're looking at complete weeks
            start_date = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
            end_date = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)
            
            # Query sum for this week
            week_sum = (
                base_query
                .filter(ExpenseModel.date >= start_date)
                .filter(ExpenseModel.date <= end_date)
                .with_entities(func.sum(ExpenseModel.amount))
                .scalar() or 0
            )
            
            # Create sort key (days since epoch)
            sort_key = (start_date - datetime(1970, 1, 1)).days
            
            weekly_data.append({
                "week": f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d')}",
                "amount": float(week_sum),
                "sortKey": sort_key  # Add a proper numerical sort key
            })
            
        return weekly_data
    
    def _generate_optimization_suggestions(self, category_totals, total_expenses):
        """Generate spending optimization suggestions based on category analysis."""
        suggestions = []
        
        # Convert to dict for easier manipulation
        category_data = {cat: float(total) for cat, total in category_totals}
        
        # Don't generate suggestions if there's not enough data
        if not category_data or total_expenses == 0:
            return ["Not enough data to generate suggestions."]
        
        # Check for high housing costs (>40% of total)
        if "Housing" in category_data and (category_data["Housing"] / total_expenses) > 0.50:
            suggestions.append("Your housing expenses exceed 50% of your total spending. Consider looking for more affordable options or roommates.")
        
        # Check for high dining out costs
        if "Dining" in category_data and (category_data["Dining"] / total_expenses) > 0.15:
            suggestions.append("You're spending over 15% on dining out. Consider cooking more meals at home to reduce expenses.")
        
        # Check for low savings (if spending on non-essentials is high)
        non_essential_categories = ["Entertainment", "Shopping", "Travel"]
        non_essential_total = sum(category_data.get(cat, 0) for cat in non_essential_categories)
        
        if non_essential_total / total_expenses > 0.30:
            suggestions.append("You're spending over 30% on non-essential categories. Consider reducing these expenses to increase your savings.")
        
        # Suggest category budgeting if expenses are unbalanced
        if len(category_data) >= 3:
            values = list(category_data.values())
            max_val = max(values)
            
            if max_val / total_expenses > 0.50:
                max_category = [cat for cat, val in category_data.items() if val == max_val][0]
                suggestions.append(f"Your {max_category} expenses are more than 50% of your total. Consider setting a budget for this category.")
        
        # If no specific suggestions, give a general one
        if not suggestions:
            suggestions.append("Your spending looks well-balanced across categories. Keep tracking to maintain good financial habits.")
        
        return suggestions 