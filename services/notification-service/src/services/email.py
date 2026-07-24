# Email notification service
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

# SMTP configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'noreply@ride-share.com')

class EmailService:
    """
    Service to send email notifications.
    Supports booking confirmations, payment receipts, status updates, etc.
    """
    
    @staticmethod
    def send_email(to_email, subject, body, is_html=False):
        """
        Send an email notification.
        
        Args:
            to_email (str): Recipient email address
            subject (str): Email subject
            body (str): Email body
            is_html (bool): Whether body is HTML or plain text
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = SMTP_FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MIMEText(body, 'html' if is_html else 'plain'))
            
            # Connect to SMTP server and send
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()  # Enable TLS encryption
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Error sending email to {to_email}: {e}")
            return False
    
    @staticmethod
    def send_booking_confirmation(user_email, booking_details):
        """
        Send booking confirmation email.
        
        Args:
            user_email (str): User's email
            booking_details (dict): Booking information
        """
        subject = "Booking Confirmation - Ride-Share Platform"
        
        body = f"""
        <h2>Booking Confirmed!</h2>
        <p>Dear User,</p>
        <p>Your booking has been confirmed.</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
            <li>Pickup: {booking_details.get('pickup', 'N/A')}</li>
            <li>Dropoff: {booking_details.get('dropoff', 'N/A')}</li>
            <li>Estimated Fare: ${booking_details.get('fare', 'N/A')}</li>
            <li>Estimated Time: {booking_details.get('time', 'N/A')} minutes</li>
        </ul>
        <p>Thank you for using Ride-Share Platform!</p>
        """
        
        return EmailService.send_email(user_email, subject, body, is_html=True)
    
    @staticmethod
    def send_payment_receipt(user_email, payment_details):
        """
        Send payment receipt email.
        
        Args:
            user_email (str): User's email
            payment_details (dict): Payment information
        """
        subject = "Payment Receipt - Ride-Share Platform"
        
        body = f"""
        <h2>Payment Confirmed</h2>
        <p>Dear User,</p>
        <p>Your payment has been processed successfully.</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
            <li>Transaction ID: {payment_details.get('transaction_id', 'N/A')}</li>
            <li>Fare: ${payment_details.get('fare', '0.00')}</li>
            <li>Commission: ${payment_details.get('commission', '0.00')}</li>
            <li>Total: ${payment_details.get('total', '0.00')}</li>
        </ul>
        <p>Thank you!</p>
        """
        
        return EmailService.send_email(user_email, subject, body, is_html=True)
    
    @staticmethod
    def send_driver_assignment(driver_email, driver_details, booking_details):
        """
        Send notification to driver when assigned to a booking.
        """
        subject = "New Ride Request - Ride-Share Platform"
        
        body = f"""
        <h2>New Ride Request</h2>
        <p>Dear Driver {driver_details.get('name', 'N/A')},</p>
        <p>You have been assigned a new ride.</p>
        <p><strong>Ride Details:</strong></p>
        <ul>
            <li>Pickup: {booking_details.get('pickup', 'N/A')}</li>
            <li>Dropoff: {booking_details.get('dropoff', 'N/A')}</li>
            <li>Estimated Fare: ${booking_details.get('fare', 'N/A')}</li>
        </ul>
        <p>Please accept or decline the ride.</p>
        """
        
        return EmailService.send_email(driver_email, subject, body, is_html=True)
