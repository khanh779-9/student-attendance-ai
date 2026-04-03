from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class GiangVien(db.Model):
    __tablename__ = 'GiangVien'
    
    MSGV = db.Column(db.String(20), primary_key=True)
    HoTen = db.Column(db.String(120), nullable=False)
    Password = db.Column(db.String(255), nullable=False)
    Email = db.Column(db.String(120), unique=True, nullable=True)
    IsActive = db.Column(db.Boolean, default=True)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    classes = db.relationship('Lop', backref='creator', lazy=True, foreign_keys='Lop.CreatedByMSGV')
    giangvien_lops = db.relationship('GiangVienLop', backref='giangvien', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('BuoiHoc', backref='instructor', lazy=True)
    registered_faces = db.relationship('SinhVienKhuonMat', backref='registered_by_lecturer', lazy=True)

class Lop(db.Model):
    __tablename__ = 'Lop'
    
    MaLop = db.Column(db.String(20), primary_key=True)
    TenLop = db.Column(db.String(150), nullable=False)
    NienKhoa = db.Column(db.String(20), nullable=True)
    HocKy = db.Column(db.String(20), nullable=True)
    CreatedByMSGV = db.Column(db.String(20), db.ForeignKey('GiangVien.MSGV'), nullable=True)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    students = db.relationship('SinhVien', backref='class_ref', lazy=True, cascade='all, delete-orphan')
    giangvien_lops = db.relationship('GiangVienLop', backref='lop', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('BuoiHoc', backref='class_ref', lazy=True, cascade='all, delete-orphan')

class GiangVienLop(db.Model):
    __tablename__ = 'GiangVienLop'
    
    MSGV = db.Column(db.String(20), db.ForeignKey('GiangVien.MSGV'), primary_key=True)
    MaLop = db.Column(db.String(20), db.ForeignKey('Lop.MaLop'), primary_key=True)
    VaiTro = db.Column(db.String(20), default='OWNER')
    AssignedAt = db.Column(db.DateTime, default=datetime.utcnow)

class SinhVien(db.Model):
    __tablename__ = 'SinhVien'
    
    MSSV = db.Column(db.String(20), primary_key=True)
    Ho_Ten_SV = db.Column(db.String(120), nullable=False)
    Lop = db.Column(db.String(20), db.ForeignKey('Lop.MaLop'), nullable=False)
    NgaySinh = db.Column(db.Date, nullable=True)
    GioiTinh = db.Column(db.String(10), nullable=True)  # NAM, NU, KHAC
    IsActive = db.Column(db.Boolean, default=True)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    face_records = db.relationship('SinhVienKhuonMat', backref='student', lazy=True, cascade='all, delete-orphan')
    attendance_records = db.relationship('DiemDanh', backref='student', lazy=True, cascade='all, delete-orphan')

class SinhVienKhuonMat(db.Model):
    __tablename__ = 'SinhVienKhuonMat'
    
    FaceDataID = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    MSSV = db.Column(db.String(20), db.ForeignKey('SinhVien.MSSV'), nullable=False)
    ImagePath = db.Column(db.String(500), nullable=False)
    EmbeddingVector = db.Column(db.Text, nullable=True)  # Store as JSON string
    ModelName = db.Column(db.String(60), default='ArcFace')
    BackboneModel = db.Column(db.String(60), nullable=True)
    DetectorBackend = db.Column(db.String(60), nullable=True)
    DistanceMetric = db.Column(db.String(30), nullable=True)
    IsPrimary = db.Column(db.Boolean, default=True)
    IsActive = db.Column(db.Boolean, default=True)
    RegisteredByMSGV = db.Column(db.String(20), db.ForeignKey('GiangVien.MSGV'), nullable=True)
    RegisteredAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    attendance_matches = db.relationship('DiemDanh', backref='matched_face', lazy=True, foreign_keys='DiemDanh.MatchFaceDataID')

class BuoiHoc(db.Model):
    __tablename__ = 'BuoiHoc'
    
    BuoiHocID = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    MaLop = db.Column(db.String(20), db.ForeignKey('Lop.MaLop'), nullable=False)
    MSGV = db.Column(db.String(20), db.ForeignKey('GiangVien.MSGV'), nullable=False)
    TieuDe = db.Column(db.String(200), nullable=True)
    ScheduledStart = db.Column(db.DateTime, nullable=True)
    ScheduledEnd = db.Column(db.DateTime, nullable=True)
    ActualStart = db.Column(db.DateTime, nullable=True)
    ActualEnd = db.Column(db.DateTime, nullable=True)
    Status = db.Column(db.String(20), default='PLANNED')  # PLANNED, OPEN, CLOSED, CANCELLED
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    attendance_records = db.relationship('DiemDanh', backref='session', lazy=True, cascade='all, delete-orphan')

class DiemDanh(db.Model):
    __tablename__ = 'DiemDanh'
    
    DiemDanhID = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    BuoiHocID = db.Column(db.BigInteger, db.ForeignKey('BuoiHoc.BuoiHocID'), nullable=False)
    MSSV = db.Column(db.String(20), db.ForeignKey('SinhVien.MSSV'), nullable=False)
    AttendanceStatus = db.Column(db.String(20), default='ABSENT')  # PRESENT, LATE, ABSENT, EXCUSED
    CheckInTime = db.Column(db.DateTime, nullable=True)
    ConfidenceScore = db.Column(db.Float, nullable=True)
    MatchFaceDataID = db.Column(db.BigInteger, db.ForeignKey('SinhVienKhuonMat.FaceDataID'), nullable=True)
    CheckInMethod = db.Column(db.String(20), default='DEEPFACE')  # DEEPFACE, MANUAL, QR, OTHER
    Notes = db.Column(db.String(255), nullable=True)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('BuoiHocID', 'MSSV', name='uq_diemdanh_buoihoc_mssv'),
    )


