# SMS notification service
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SMS_API_KEY = os.getenv('SMS_API_KEY')
SMS_API_URL = os.getenv('SMS_API_URL', 'https://api.sms-provider.com/send')

class SMSService:
    """
    Service to send SMS notifications.
    Integrates with SMS provider (Twilio, AWS SNS, etc.)
    """
    
    @staticmethod
    def send_sms(phone_number, message):
        """
        Send an SMS notification.
        
        Args:
            phone_number (str): Recipient phone number
            message (str): SMS message (max 160 characters recommended)
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Prepare SMS payload
            payload = {
                'api_key': SMS_API_KEY,
                'phone': phone_number,
                'message': message
            }
            
            # Send SMS via API
            response = requests.post(SMS_API_URL, json=payload, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ SMS sent to {phone_number}")
                return True
            else:
                print(f"❌ SMS send failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending SMS to {phone_number}: {e}")
            return False
    
    @staticmethod
    def send_otp(phone_number, otp_code):
        """
        Send OTP (One-Time Password) for verification.
        
        Args:
            phone_number (str): User's phone number
            otp_code (str): 6-digit OTP code
        """
        message = f"Your Ride-Share verification code is: {otp_code}. Valid for 5 minutes."
        return SMSService.send_sms(phone_number, message)
    
    @staticmethod
    def send_ride_status_update(phone_number, status, driver_name=None):
        """
        Send ride status update SMS.
        
        Args:
            phone_number (str): User's phone number
            status (str): Ride status (confirmed, on_way, arrived, completed)
            driver_name (str): Driver's name (optional)
        """
        status_messages = {
            'confirmed': f"Your ride is confirmed! Driver {driver_name} is on the way.",
            'on_way': f"Driver {driver_name} is on the way. ETA: 5 minutes.",
            'arrived': f"Your driver has arrived. Please come out.",
            'completed': "Thank you for using Ride-Share! Rate your driver.",
        }
        
        message = status_messages.get(status, "Ride status update")
        return SMSService.send_sms(phone_number, message)
    
    @staticmethod
    def send_payment_confirmation(phone_number, amount, transaction_id):
        """
        Send payment confirmation SMS.
        
        Args:
            phone_number (str): User's phone number
            amount (float): Amount paid
            transaction_id (str): Transaction ID
        """
        message = f"Payment successful! Amount: ${amount}. Transaction ID: {transaction_id}"
        return SMSService.send_sms(phone_number, message)
