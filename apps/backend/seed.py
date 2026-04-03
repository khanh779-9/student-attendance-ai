"""
Database seed script - populate initial test data
Run this after creating the database and tables
"""
import os
import sys
import logging
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, GiangVien, Lop, GiangVienLop, SinhVien

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
            GiangVienLop.query.delete()
            SinhVien.query.delete()
            Lop.query.delete()
            GiangVien.query.delete()

            lecturer = GiangVien(
                MSGV='GV001',
                HoTen='Nguyễn Văn A',
                Password='123',
                Email='gv001@example.edu',
                IsActive=True
            )
            db.session.add(lecturer)

            class1 = Lop(
                MaLop='CTK42',
                TenLop='Công Nghệ Kỹ Thuật K42',
                NienKhoa='2025-2026',
                HocKy='HK2',
                CreatedByMSGV='GV001'
            )
            class2 = Lop(
                MaLop='CNTT43',
                TenLop='Công Nghệ Thông Tin K43',
                NienKhoa='2025-2026',
                HocKy='HK2',
                CreatedByMSGV='GV001'
            )
            db.session.add(class1)
            db.session.add(class2)

            gv_lop1 = GiangVienLop(MSGV='GV001', MaLop='CTK42', VaiTro='OWNER')
            gv_lop2 = GiangVienLop(MSGV='GV001', MaLop='CNTT43', VaiTro='OWNER')
            db.session.add(gv_lop1)
            db.session.add(gv_lop2)

            students = [
                SinhVien(MSSV='SV001', Ho_Ten_SV='Trần Thị B', Lop='CTK42'),
                SinhVien(MSSV='SV002', Ho_Ten_SV='Lê Văn C', Lop='CTK42'),
                SinhVien(MSSV='SV003', Ho_Ten_SV='Phạm Minh D', Lop='CTK42'),
                SinhVien(MSSV='SV004', Ho_Ten_SV='Hoàng Thị E', Lop='CNTT43'),
                SinhVien(MSSV='SV005', Ho_Ten_SV='Đỗ Quang F', Lop='CNTT43'),
            ]
            for student in students:
                db.session.add(student)
            
            db.session.commit()
            logger.info('Database seeded successfully')
            logger.info('Test credentials: MSGV=GV001 Password=123')
    except Exception as e:
        logger.exception("Error during seeding: %s", str(e))

if __name__ == '__main__':
    seed_database()
