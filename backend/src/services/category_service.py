from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.category import CategoryCreate, Category
from ..db.models import Category as CategoryModel

class CategoryService:
    def __init__(self, db: Session):
        self.db = db

    def create_category(self, category: CategoryCreate) -> Category:
        db_category = CategoryModel(
            name=category.name,
            description=category.description
        )
        self.db.add(db_category)
        self.db.commit()
        self.db.refresh(db_category)
        return Category.from_orm(db_category)

    def get_categories(self, skip: int = 0, limit: int = 100) -> List[Category]:
        categories = self.db.query(CategoryModel).offset(skip).limit(limit).all()
        return [Category.from_orm(category) for category in categories]

    def get_category(self, category_id: int) -> Optional[Category]:
        category = self.db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
        return Category.from_orm(category) if category else None

    def delete_category(self, category_id: int) -> bool:
        category = self.db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
        if category:
            self.db.delete(category)
            self.db.commit()
            return True
        return False 