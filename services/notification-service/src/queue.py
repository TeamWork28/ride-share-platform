# Redis and Celery queue configuration
import redis
import os
from dotenv import load_dotenv
from celery import Celery

load_dotenv()

# Redis connection configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')

# Redis connection string
REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}" if REDIS_PASSWORD else f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Create Redis connection
redis_client = redis.from_url(REDIS_URL)

def test_redis_connection():
    """
    Test Redis connection on startup.
    """
    try:
        redis_client.ping()
        print("✅ Connected to Redis")
        return True
    except Exception as e:
        print(f"❌ Redis Connection Error: {e}")
        return False

# Celery configuration for async tasks
app = Celery(
    'notification_service',
    broker=REDIS_URL,
    backend=REDIS_URL
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
)

def queue_notification(notification_type, data):
    """
    Queue a notification task in Redis.
    notification_type: 'email', 'sms', or 'both'
    data: Dictionary with recipient, message, etc.
    """
    try:
        # Store notification in Redis queue
        queue_key = f"notification_queue:{notification_type}"
        redis_client.lpush(queue_key, str(data))
        print(f"✅ Notification queued: {notification_type}")
        return True
    except Exception as e:
        print(f"❌ Error queuing notification: {e}")
        return False

def get_queued_notifications(notification_type):
    """
    Retrieve queued notifications from Redis.
    """
    try:
        queue_key = f"notification_queue:{notification_type}"
        notifications = redis_client.lrange(queue_key, 0, -1)
        return notifications
    except Exception as e:
        print(f"❌ Error retrieving notifications: {e}")
        return []
