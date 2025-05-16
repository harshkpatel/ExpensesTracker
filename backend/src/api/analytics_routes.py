from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from src.db.database import get_db
from src.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/analytics/summary")
def get_analytics_summary(
    time_range: Optional[str] = Query(None, description="Time range for analysis: 'week', 'month', 'year', or None for all time"),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_summary(time_range) 