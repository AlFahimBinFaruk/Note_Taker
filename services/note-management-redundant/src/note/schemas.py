from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoteCreate(BaseModel):
    """Schema for creating a note - user sends this"""
    title: str
    description: Optional[str] = None


class NoteUpdate(BaseModel):
    """Schema for updating a note"""
    title: Optional[str] = None
    description: Optional[str] = None


class NoteRead(BaseModel):
    """Schema for reading note - API returns this"""
    id: str  # MongoDB ObjectId converted to string
    title: str
    description: Optional[str]
    user_id: int
    username: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Allows creation from Beanie documents