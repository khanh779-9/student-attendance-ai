import os
import logging
from flask import Flask
from flask_cors import CORS
from config import config
from models import db

from api.auth_routes import auth_bp
from api.classes_routes import classes_bp
from api.students_routes import students_bp
from api.face_routes import face_bp
from api.sessions_routes import sessions_bp
from api.attendance_routes import attendance_bp

logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO').upper(),
    format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
)
logger = logging.getLogger(__name__)

def validate_database_config():
    """Validate database configuration variables"""
    required_vars = [
        'DATABASE_HOST',
        'DATABASE_PORT',
        'DATABASE_USER',
        'DATABASE_PASSWORD',
        'DATABASE_NAME'
    ]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.warning("Missing environment variables: %s", ', '.join(missing))
        logger.warning("Using default values from config.py")
    
    host = os.getenv('DATABASE_HOST', 'localhost')
    port = os.getenv('DATABASE_PORT', '3306')
    user = os.getenv('DATABASE_USER', 'root')
    db_name = os.getenv('DATABASE_NAME', 'class_student_attendance')
    
    logger.info("Database configuration: host=%s port=%s user=%s database=%s", host, port, user, db_name)

def create_app(config_name='development'):
    """Create and configure Flask app"""
    app = Flask(__name__)

    validate_database_config()

    app.config.from_object(config[config_name])

    db.init_app(app)

    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(classes_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(face_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(attendance_bp)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    @app.route('/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200

    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables initialized")
        except Exception as e:
            logger.warning("Failed to create tables: %s", str(e))
            logger.warning("Make sure your database credentials are correct")
            logger.warning("Check DATABASE_* environment variables in .env file")
            logger.warning("Server will continue running, but database operations will fail")

    logger.info(
        "Backend server running on http://0.0.0.0:%s (%s)",
        app.config['PORT'],
        os.getenv('FLASK_ENV', 'development').upper(),
    )
    
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
