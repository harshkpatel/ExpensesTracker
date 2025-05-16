from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.category import CategoryCreate, Category, UNCATEGORIZED, CategoryUpdate
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
        if category and not category.is_protected:
            # Get the uncategorized category
            uncategorized = self.get_category_by_name(UNCATEGORIZED)
            if not uncategorized:
                # Create uncategorized category if it doesn't exist
                uncategorized = self.create_category(CategoryCreate(name=UNCATEGORIZED))
                uncategorized.is_protected = True
                self.db.commit()
            
            # Move all expenses to uncategorized
            for expense in category.expenses:
                expense.category_id = uncategorized.id
            
            self.db.delete(category)
            self.db.commit()
            return True
        return False

    def get_category_by_name(self, name: str) -> Optional[Category]:
        category = self.db.query(CategoryModel).filter(CategoryModel.name == name).first()
        return Category.from_orm(category) if category else None

    def update_category(self, category_id: int, category: CategoryUpdate) -> Optional[Category]:
        db_category = self.get_category(category_id)
        if db_category and not db_category.is_protected:
            for key, value in category.dict(exclude_unset=True).items():
                setattr(db_category, key, value)
            self.db.commit()
            self.db.refresh(db_category)
            return db_category
        return None

    def ensure_uncategorized_exists(self):
        """Ensure the Uncategorized category exists and is protected."""
        uncategorized = self.get_category_by_name(UNCATEGORIZED)
        if not uncategorized:
            uncategorized = self.create_category(CategoryCreate(name=UNCATEGORIZED))
            uncategorized.is_protected = True
            self.db.commit()
        elif not uncategorized.is_protected:
            uncategorized.is_protected = True
            self.db.commit()
        return uncategorized 