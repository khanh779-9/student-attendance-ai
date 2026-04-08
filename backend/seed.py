"""
Database seed script - populate initial test data
Run this after creating the database and tables
"""
import os
import sys
import logging
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, GiangVien, Lop, SinhVien, Enrollment

logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO').upper(),
    format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
)
logger = logging.getLogger(__name__)

def seed_database():
    """Seed database with test data"""
    try:
        app = create_app('development')
        
        with app.app_context():
            try:
                db.session.execute('SELECT 1')
                logger.info("Database connected successfully")
            except Exception as e:
                logger.exception("Database connection failed: %s", str(e))
                logger.warning("Ensure database exists and credentials are correct")
                return

            logger.info("Clearing existing data...")
            Enrollment.query.delete()
            SinhVien.query.delete()
            Lop.query.delete()
            GiangVien.query.delete()

            lecturer = GiangVien(
                id='GV001',
                name='Nguyễn Văn A',
                email='123'
            )
            db.session.add(lecturer)

            class1 = Lop(
                id='CTK42',
                name='Công Nghệ Kỹ Thuật K42',
                teacher_id='GV001'
            )
            class2 = Lop(
                id='CNTT43',
                name='Công Nghệ Thông Tin K43',
                teacher_id='GV001'
            )
            db.session.add(class1)
            db.session.add(class2)

            students = [
                SinhVien(id='SV001', name='Trần Thị B'),
                SinhVien(id='SV002', name='Lê Văn C'),
                SinhVien(id='SV003', name='Phạm Minh D'),
                SinhVien(id='SV004', name='Hoàng Thị E'),
                SinhVien(id='SV005', name='Đỗ Quang F'),
            ]
            for student in students:
                db.session.add(student)

            enrollments = [
                Enrollment(student_id='SV001', class_id='CTK42'),
                Enrollment(student_id='SV002', class_id='CTK42'),
                Enrollment(student_id='SV003', class_id='CTK42'),
                Enrollment(student_id='SV004', class_id='CNTT43'),
                Enrollment(student_id='SV005', class_id='CNTT43'),
            ]
            for enrollment in enrollments:
                db.session.add(enrollment)
            
            db.session.commit()
            logger.info('Database seeded successfully')
            logger.info('Test credentials: MSGV=GV001 Password=123')
    except Exception as e:
        logger.exception("Error during seeding: %s", str(e))

if __name__ == '__main__':
    seed_database()
