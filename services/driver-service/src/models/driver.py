# Driver data models using Pydantic
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Request model - Driver registration
class DriverCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    license_number: str
    vehicle_type: str
    vehicle_number: str

# Request model - Driver login
class DriverLogin(BaseModel):
    email: EmailStr
    phone: str

# Response model - Driver data
class DriverResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    license_number: str
    vehicle_type: str
    vehicle_number: str
    rating: float
    total_rides: int
    status: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Update driver model
class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    status: Optional[str] = None

# Driver status update
class DriverStatusUpdate(BaseModel):
    status: str  # active, inactive, on_ride

# Driver rating model
class DriverRating(BaseModel):
    rating: float  # 1-5 stars
    review: Optional[str] = None
