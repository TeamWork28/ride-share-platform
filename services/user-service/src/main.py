# Main entry point for User Service
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from .database import create_tables
from .routes.users import router as users_router

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="User Service",
    description="Microservice for user management in Ride-Share Platform",
    version="1.0.0"
)

# ============ MIDDLEWARE ============
# Allow CORS (Cross-Origin Resource Sharing) for API Gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (can be restricted in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ STARTUP EVENT ============
@app.on_event("startup")
async def startup_event():
    """
    Runs when the application starts.
    Creates database tables if they don't exist.
    """
    print("🚀 Starting User Service...")
    create_tables()
    print("✅ User Service ready!")

# ============ ROUTES ============
app.include_router(users_router)

# ============ HEALTH CHECK ============
@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    """
    return {
        "status": "healthy",
        "service": "user-service"
    }

# ============ ROOT ENDPOINT ============
@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "User Service",
        "version": "1.0.0",
        "status": "running"
    }

# ============ START SERVER ============
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    environment = os.getenv('ENVIRONMENT', 'development')
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=(environment == 'development')
    )
