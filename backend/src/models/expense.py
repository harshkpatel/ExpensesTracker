from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    amount: float = Field(..., description="Amount of the expense")
    description: Optional[str] = Field(None, description="Description of the expense")
    date: datetime = Field(default_factory=datetime.utcnow, description="Date of the expense")
    category_id: Optional[int] = Field(None, description="ID of the category")
    receipt_path: Optional[str] = Field(None, description="Path to the receipt file")

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int = Field(..., description="Unique identifier for the expense")
    
    class Config:
        from_attributes = True 