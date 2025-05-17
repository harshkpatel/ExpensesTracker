from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.services.receipt_service import ReceiptService
from src.services.expense_service import ExpenseService
from src.models.expense import Expense

router = APIRouter()

@router.post("/receipts/upload", response_model=dict)
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Simple receipt image upload endpoint"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    receipt_service = ReceiptService(db)
    
    # Read file content
    file_content = await file.read()
    
    # Just save the receipt without OCR processing
    return await receipt_service.save_receipt(file_content, file.filename)

@router.post("/receipts/scan", response_model=Expense)
async def scan_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Legacy endpoint for backward compatibility"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    receipt_service = ReceiptService(db)
    expense_service = ExpenseService(db)
    
    # Read file content
    file_content = await file.read()
    
    # Process receipt (simplified now just to save the file)
    expense_data = await receipt_service.process_receipt(file_content, file.filename)
    
    # Create expense with minimal data
    return expense_service.create_expense(expense_data) 