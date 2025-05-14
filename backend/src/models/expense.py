from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount of the expense")
    category: str = Field(..., description="Category of the expense")
    description: Optional[str] = Field(None, description="Description of the expense")
    date: datetime = Field(default_factory=datetime.now, description="Date of the expense")
    receipt_path: Optional[str] = Field(None, description="Path to the receipt image")

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int = Field(..., description="Unique identifier for the expense")
    
    class Config:
        from_attributes = True 