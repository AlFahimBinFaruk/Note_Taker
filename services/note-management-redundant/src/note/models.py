from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime

class Note(Document):
    # MongoDB automatically creates an '_id' field (ObjectId)
    user_id: int
    title: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name="notes"
        indexes=[
            "user_id", # index for faster queries by user
            "created_at"
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Math notes",
                "description": "a^2=b^2+c^2+2ab",
            }
        }