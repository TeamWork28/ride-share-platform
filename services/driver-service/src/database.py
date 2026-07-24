# Database connection module for Driver Service
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'root_password'),
    'database': os.getenv('DB_NAME', 'ride_share_db'),
    'port': int(os.getenv('DB_PORT', 3306))
}

def get_db_connection():
    """
    Create and return a MySQL database connection.
    """
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("✅ Connected to MySQL database")
            return connection
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None

def create_tables():
    """
    Create necessary database tables for drivers.
    """
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create drivers table
        create_drivers_table = """
        CREATE TABLE IF NOT EXISTS drivers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(15) NOT NULL,
            license_number VARCHAR(50) UNIQUE NOT NULL,
            vehicle_type VARCHAR(50),
            vehicle_number VARCHAR(50) UNIQUE,
            rating DECIMAL(3, 2) DEFAULT 5.00,
            total_rides INT DEFAULT 0,
            status ENUM('active', 'inactive', 'on_ride') DEFAULT 'inactive',
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
        
        cursor.execute(create_drivers_table)
        connection.commit()
        print("✅ Database tables created/verified")
        return True
        
    except Error as e:
        print(f"❌ Error creating tables: {e}")
        return False
    finally:
        cursor.close()
        connection.close()
