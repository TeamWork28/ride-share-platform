# Driver routes - API endpoints
from fastapi import APIRouter, HTTPException, status
from ..models.driver import (
    DriverCreate, DriverResponse, DriverLogin, 
    DriverUpdate, DriverStatusUpdate, DriverRating
)
from ..database import get_db_connection
import mysql.connector
from mysql.connector import Error

router = APIRouter(prefix="/drivers", tags=["drivers"])

# ============ REGISTER DRIVER ============
@router.post("/register", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def register_driver(driver: DriverCreate):
    """
    Register a new driver with license and vehicle info.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        insert_query = """
        INSERT INTO drivers (name, email, phone, license_number, vehicle_type, vehicle_number)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            driver.name, driver.email, driver.phone,
            driver.license_number, driver.vehicle_type, driver.vehicle_number
        ))
        connection.commit()
        driver_id = cursor.lastrowid
        
        # Fetch and return created driver
        select_query = "SELECT * FROM drivers WHERE id = %s"
        cursor.execute(select_query, (driver_id,))
        created_driver = cursor.fetchone()
        
        return created_driver
        
    except Error as e:
        connection.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Email or license already exists")
        raise HTTPException(status_code=500, detail=f"Error creating driver: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ GET ALL DRIVERS ============
@router.get("/", response_model=list[DriverResponse])
async def get_all_drivers(status: str = None):
    """
    Get list of all drivers, optionally filtered by status.
    Query params: status (active, inactive, on_ride)
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        if status:
            query = "SELECT * FROM drivers WHERE status = %s"
            cursor.execute(query, (status,))
        else:
            query = "SELECT * FROM drivers"
            cursor.execute(query)
        
        drivers = cursor.fetchall()
        return drivers
        
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drivers: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ GET DRIVER BY ID ============
@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: int):
    """
    Get a specific driver's profile.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM drivers WHERE id = %s"
        cursor.execute(query, (driver_id,))
        driver = cursor.fetchone()
        
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        return driver
        
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Error fetching driver: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ UPDATE DRIVER STATUS ============
@router.put("/{driver_id}/status", response_model=DriverResponse)
async def update_driver_status(driver_id: int, status_update: DriverStatusUpdate):
    """
    Update driver's availability status.
    Status options: active, inactive, on_ride
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        valid_statuses = ['active', 'inactive', 'on_ride']
        if status_update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        query = "UPDATE drivers SET status = %s WHERE id = %s"
        cursor.execute(query, (status_update.status, driver_id))
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        # Fetch and return updated driver
        select_query = "SELECT * FROM drivers WHERE id = %s"
        cursor.execute(select_query, (driver_id,))
        updated_driver = cursor.fetchone()
        
        return updated_driver
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating driver: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ UPDATE DRIVER PROFILE ============
@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: int, driver_update: DriverUpdate):
    """
    Update driver's profile information.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        update_fields = []
        values = []
        
        if driver_update.name:
            update_fields.append("name = %s")
            values.append(driver_update.name)
        
        if driver_update.phone:
            update_fields.append("phone = %s")
            values.append(driver_update.phone)
        
        if driver_update.vehicle_type:
            update_fields.append("vehicle_type = %s")
            values.append(driver_update.vehicle_type)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(driver_id)
        query = f"UPDATE drivers SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, values)
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        # Fetch and return updated driver
        select_query = "SELECT * FROM drivers WHERE id = %s"
        cursor.execute(select_query, (driver_id,))
        updated_driver = cursor.fetchone()
        
        return updated_driver
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating driver: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ RATE DRIVER ============
@router.post("/{driver_id}/rate", response_model=DriverResponse)
async def rate_driver(driver_id: int, rating: DriverRating):
    """
    Add rating to driver from completed rides.
    Updates driver's average rating and total rides.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        if rating.rating < 1 or rating.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Get current driver stats
        select_query = "SELECT rating, total_rides FROM drivers WHERE id = %s"
        cursor.execute(select_query, (driver_id,))
        driver = cursor.fetchone()
        
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        # Calculate new average rating
        current_rating = driver['rating']
        current_rides = driver['total_rides']
        new_rides = current_rides + 1
        new_rating = ((current_rating * current_rides) + rating.rating) / new_rides
        
        # Update driver
        update_query = """
        UPDATE drivers 
        SET rating = %s, total_rides = %s 
        WHERE id = %s
        """
        cursor.execute(update_query, (new_rating, new_rides, driver_id))
        connection.commit()
        
        # Fetch and return updated driver
        cursor.execute(select_query, (driver_id,))
        updated_driver = cursor.fetchone()
        
        return updated_driver
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error rating driver: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ VERIFY DRIVER ============
@router.put("/{driver_id}/verify")
async def verify_driver(driver_id: int):
    """
    Mark driver as verified after document verification.
    Admin-only endpoint.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "UPDATE drivers SET is_verified = TRUE WHERE id = %s"
        cursor.execute(query, (driver_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        select_query = "SELECT * FROM drivers WHERE id = %s"
        cursor.execute(select_query, (driver_id,))
        updated_driver = cursor.fetchone()
        
        return {"message": "Driver verified", "driver": updated_driver}
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error verifying driver: {str(e)}")
    finally:
        cursor.close()
        connection.close()
