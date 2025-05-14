import os
from datetime import datetime
from typing import Optional
from src.models.expense import ExpenseCreate
from src.db.models import Expense as ExpenseModel
from sqlalchemy.orm import Session

class ReceiptService:
    def __init__(self, db: Session):
        self.db = db
        self.receipts_dir = "receipts"
        os.makedirs(self.receipts_dir, exist_ok=True)

    async def process_receipt(self, file_content: bytes, filename: str) -> Optional[ExpenseCreate]:
        # Save the receipt
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(filename)[1]
        receipt_path = os.path.join(self.receipts_dir, f"receipt_{timestamp}{file_extension}")
        
        with open(receipt_path, "wb") as f:
            f.write(file_content)

        # TODO: Implement actual receipt scanning logic here
        # For now, return a dummy expense with a minimum valid amount
        return ExpenseCreate(
            amount=0.01,  # Minimum valid amount
            category="Uncategorized",
            description="Receipt scan pending",
            receipt_path=receipt_path
        ) 