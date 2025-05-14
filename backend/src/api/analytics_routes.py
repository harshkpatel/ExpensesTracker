from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    service = AnalyticsService(db)
    return service.get_summary() 