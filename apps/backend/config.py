import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration"""
    # Database Configuration (Separate Variables)
    DATABASE_HOST = os.getenv('DATABASE_HOST', 'localhost')
    DATABASE_PORT = int(os.getenv('DATABASE_PORT', '3306'))
    DATABASE_USER = os.getenv('DATABASE_USER', 'root')
    DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'class_student_attendance')
    
    # Build SQLAlchemy URI from components
    if DATABASE_PASSWORD:
        SQLALCHEMY_DATABASE_URI = (
            f'mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}'
            f'@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}'
        )
    else:
        SQLALCHEMY_DATABASE_URI = (
            f'mysql+pymysql://{DATABASE_USER}'
            f'@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}'
        )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Face Recognition
    ARCFACE_MODEL_PATH = os.getenv(
        'ARCFACE_MODEL_PATH',
        '../../../Model/Arcface/arc.onnx'
    )
    YOLO_MODEL_PATH = os.getenv(
        'YOLO_MODEL_PATH',
        '../../../Model/Yolo/yolov10s.onnx'
    )
    FACE_RECOGNITION_THRESHOLD = float(os.getenv('FACE_RECOGNITION_THRESHOLD', '0.68'))
    
    # File uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}
    
    # Server
    HOST = '0.0.0.0'
    PORT = 8000
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
