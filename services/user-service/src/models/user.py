# User data models using Pydantic
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Request model - what client sends when creating a user
class UserCreate(BaseModel):
    name: str
    email: EmailStr  # Validates email format
    password: str
    phone: Optional[str] = None

# Response model - what API returns to client
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True  # Allow conversion from database objects

# Login request model
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# User update model
class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
