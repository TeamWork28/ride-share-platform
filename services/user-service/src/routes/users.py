# User routes - API endpoints
from fastapi import APIRouter, HTTPException, status
from ..models.user import UserCreate, UserResponse, UserLogin, UserUpdate
from ..database import get_db_connection
import mysql.connector
from mysql.connector import Error

router = APIRouter(prefix="/users", tags=["users"])

# ============ CREATE USER (Registration) ============
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    Register a new user.
    - Validates email format (done by Pydantic)
    - Stores user in MySQL database
    - Returns user data (without password)
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Insert user into database
        insert_query = """
        INSERT INTO users (name, email, password, phone)
        VALUES (%s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (user.name, user.email, user.password, user.phone))
        connection.commit()
        user_id = cursor.lastrowid
        
        # Fetch and return the created user
        select_query = "SELECT id, name, email, phone, created_at FROM users WHERE id = %s"
        cursor.execute(select_query, (user_id,))
        created_user = cursor.fetchone()
        
        return created_user
        
    except Error as e:
        connection.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ GET ALL USERS ============
@router.get("/", response_model=list[UserResponse])
async def get_all_users():
    """
    Get list of all users.
    Returns: List of users without passwords
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT id, name, email, phone, created_at FROM users"
        cursor.execute(query)
        users = cursor.fetchall()
        return users
        
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ GET USER BY ID ============
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """
    Get a specific user by ID.
    Returns: User data without password
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT id, name, email, phone, created_at FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
        
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ LOGIN USER ============
@router.post("/login", status_code=status.HTTP_200_OK)
async def login_user(credentials: UserLogin):
    """
    Authenticate user with email and password.
    Returns: User ID and success message
    (In production, would return JWT token)
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT id, password FROM users WHERE email = %s"
        cursor.execute(query, (credentials.email,))
        user = cursor.fetchone()
        
        if not user or user['password'] != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return {"message": "Login successful", "user_id": user['id']}
        
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ UPDATE USER ============
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    """
    Update user information.
    Only updates fields that are provided.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Build dynamic update query
        update_fields = []
        values = []
        
        if user_update.name:
            update_fields.append("name = %s")
            values.append(user_update.name)
        
        if user_update.phone:
            update_fields.append("phone = %s")
            values.append(user_update.phone)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, values)
        connection.commit()
        
        # Fetch and return updated user
        select_query = "SELECT id, name, email, phone, created_at FROM users WHERE id = %s"
        cursor.execute(select_query, (user_id,))
        updated_user = cursor.fetchone()
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return updated_user
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ============ DELETE USER ============
@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(user_id: int):
    """
    Delete a user by ID.
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = "DELETE FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")
    finally:
        cursor.close()
        connection.close()
