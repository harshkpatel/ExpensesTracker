from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.services.receipt_service import ReceiptService
from src.services.expense_service import ExpenseService
from src.models.expense import Expense

router = APIRouter()

@router.post("/receipts/scan", response_model=Expense)
async def scan_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    receipt_service = ReceiptService(db)
    expense_service = ExpenseService(db)
    
    # Read file content
    file_content = await file.read()
    
    # Process receipt
    expense_data = await receipt_service.process_receipt(file_content, file.filename)
    
    # Create expense
    return expense_service.create_expense(expense_data) 