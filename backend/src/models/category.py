from pydantic import BaseModel, Field
from typing import Optional

class CategoryBase(BaseModel):
    name: str = Field(..., description="Name of the category")
    description: Optional[str] = Field(None, description="Description of the category")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int = Field(..., description="Unique identifier for the category")
    is_protected: bool = Field(default=False, description="Whether the category is protected from deletion")
    
    class Config:
        from_attributes = True

UNCATEGORIZED = "Uncategorized" 