# Main entry point for Driver Service
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from .database import create_tables
from .routes.drivers import router as drivers_router

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Driver Service",
    description="Microservice for driver management in Ride-Share Platform",
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

# ============ STARTUP EVENT ============
@app.on_event("startup")
async def startup_event():
    """
    Runs when the application starts.
    Creates database tables if they don't exist.
    """
    print("🚀 Starting Driver Service...")
    create_tables()
    print("✅ Driver Service ready!")

# ============ ROUTES ============
app.include_router(drivers_router)

# ============ HEALTH CHECK ============
@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    """
    return {
        "status": "healthy",
        "service": "driver-service"
    }

# ============ ROOT ENDPOINT ============
@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Driver Service",
        "version": "1.0.0",
        "status": "running"
    }

# ============ START SERVER ============
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 5001))
    host = os.getenv('HOST', '0.0.0.0')
    environment = os.getenv('ENVIRONMENT', 'development')
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=(environment == 'development')
    )
