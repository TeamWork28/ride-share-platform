# Main entry point for Notification Service
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

from .queue import test_redis_connection, queue_notification
from .services.email import EmailService
from .services.sms import SMSService

load_dotenv()

app = FastAPI(
    title="Notification Service",
    description="Microservice for sending notifications (email/SMS) in Ride-Share Platform",
    version="1.0.0"
)

# ============ MIDDLEWARE ============
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ DATA MODELS ============
class EmailNotification(BaseModel):
    to_email: str
    subject: str
    body: str
    is_html: bool = False

class SMSNotification(BaseModel):
    phone_number: str
    message: str

class BookingConfirmation(BaseModel):
    user_email: str
    booking_details: dict

class PaymentReceipt(BaseModel):
    user_email: str
    payment_details: dict

class RideStatusUpdate(BaseModel):
    phone_number: str
    status: str
    driver_name: Optional[str] = None

# ============ STARTUP EVENT ============
@app.on_event("startup")
async def startup_event():
    """
    Test Redis connection when service starts.
    """
    print("🚀 Starting Notification Service...")
    redis_connected = test_redis_connection()
    if redis_connected:
        print("✅ Notification Service ready!")
    else:
        print("⚠️ Redis connection failed, but service starting anyway")

# ============ EMAIL ENDPOINTS ============
@app.post("/email/send")
async def send_email(notification: EmailNotification):
    """
    Send a custom email notification.
    """
    try:
        success = EmailService.send_email(
            notification.to_email,
            notification.subject,
            notification.body,
            notification.is_html
        )
        
        if success:
            return {"message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/booking-confirmation")
async def send_booking_confirmation(notification: BookingConfirmation):
    """
    Send booking confirmation email.
    """
    try:
        success = EmailService.send_booking_confirmation(
            notification.user_email,
            notification.booking_details
        )
        
        if success:
            return {"message": "Booking confirmation email sent"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/payment-receipt")
async def send_payment_receipt(notification: PaymentReceipt):
    """
    Send payment receipt email.
    """
    try:
        success = EmailService.send_payment_receipt(
            notification.user_email,
            notification.payment_details
        )
        
        if success:
            return {"message": "Payment receipt email sent"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ SMS ENDPOINTS ============
@app.post("/sms/send")
async def send_sms(notification: SMSNotification):
    """
    Send a custom SMS notification.
    """
    try:
        success = SMSService.send_sms(
            notification.phone_number,
            notification.message
        )
        
        if success:
            return {"message": "SMS sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send SMS")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sms/otp")
async def send_otp(phone_number: str, otp_code: str):
    """
    Send OTP verification code via SMS.
    """
    try:
        success = SMSService.send_otp(phone_number, otp_code)
        
        if success:
            return {"message": "OTP sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send OTP")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sms/ride-status")
async def send_ride_status(notification: RideStatusUpdate):
    """
    Send ride status update SMS.
    """
    try:
        success = SMSService.send_ride_status_update(
            notification.phone_number,
            notification.status,
            notification.driver_name
        )
        
        if success:
            return {"message": "Status update SMS sent"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send SMS")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ HEALTH CHECK ============
@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "notification-service"
    }

# ============ ROOT ENDPOINT ============
@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Notification Service",
        "version": "1.0.0",
        "status": "running"
    }

# ============ START SERVER ============
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 5002))
    host = os.getenv('HOST', '0.0.0.0')
    environment = os.getenv('ENVIRONMENT', 'development')
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=(environment == 'development')
    )
