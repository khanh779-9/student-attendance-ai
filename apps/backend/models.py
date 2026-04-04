from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Teacher(db.Model):
    __tablename__ = 'teachers'

    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    password = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    classes = db.relationship('Classroom', backref='teacher', lazy=True)

    @property
    def MSGV(self):
        return self.id

    @property
    def HoTen(self):
        return self.name

    @property
    def Email(self):
        return self.email

    @property
    def Password(self):
        return self.password

    @property
    def IsActive(self):
        return True


class Classroom(db.Model):
    __tablename__ = 'classes'

    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    teacher_id = db.Column(db.String(20), db.ForeignKey('teachers.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sessions = db.relationship('AttendanceSession', backref='classroom', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='classroom', lazy=True, cascade='all, delete-orphan')

    @property
    def MaLop(self):
        return self.id

    @property
    def TenLop(self):
        return self.name

    @property
    def CreatedByMSGV(self):
        return self.teacher_id


class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    face_records = db.relationship('FaceEmbedding', backref='student', lazy=True, cascade='all, delete-orphan')
    attendance_records = db.relationship('AttendanceRecord', backref='student', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='student', lazy=True, cascade='all, delete-orphan')

    @property
    def MSSV(self):
        return self.id

    @property
    def Ho_Ten_SV(self):
        return self.name

    @property
    def Lop(self):
        first_enrollment = self.enrollments[0] if self.enrollments else None
        return first_enrollment.class_id if first_enrollment else None


class Enrollment(db.Model):
    __tablename__ = 'enrollments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(20), db.ForeignKey('students.id'), nullable=False)
    class_id = db.Column(db.String(20), db.ForeignKey('classes.id'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('student_id', 'class_id', name='uq_enrollments_student_class'),
    )


class FaceEmbedding(db.Model):
    __tablename__ = 'face_embeddings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(20), db.ForeignKey('students.id'), nullable=False)
    embedding = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def FaceDataID(self):
        return self.id

    @property
    def MSSV(self):
        return self.student_id

    @property
    def EmbeddingVector(self):
        return self.embedding

    @property
    def ImagePath(self):
        return self.image_path

    @property
    def IsActive(self):
        return True

    @property
    def IsPrimary(self):
        return False

    @property
    def RegisteredAt(self):
        return self.created_at

    @property
    def ModelName(self):
        return 'ArcFace'


class AttendanceSession(db.Model):
    __tablename__ = 'attendance_sessions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    class_id = db.Column(db.String(20), db.ForeignKey('classes.id'), nullable=False)
    session_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='PENDING')
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)

    attendance_records = db.relationship('AttendanceRecord', backref='session', lazy=True, cascade='all, delete-orphan')

    @property
    def BuoiHocID(self):
        return self.id

    @property
    def MaLop(self):
        return self.class_id

    @property
    def MSGV(self):
        if self.classroom:
            return self.classroom.teacher_id
        return None

    @property
    def ScheduledStart(self):
        return self.start_time

    @property
    def ScheduledEnd(self):
        return self.end_time

    @property
    def ActualStart(self):
        return self.start_time

    @property
    def ActualEnd(self):
        return self.end_time

    @property
    def Status(self):
        return (self.status or 'PENDING').upper()


class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.Integer, db.ForeignKey('attendance_sessions.id'), nullable=False)
    student_id = db.Column(db.String(20), db.ForeignKey('students.id'), nullable=False)
    checkin_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=True)

    __table_args__ = (
        db.UniqueConstraint('session_id', 'student_id', name='uq_attendance_session_student'),
    )

    @property
    def DiemDanhID(self):
        return self.id

    @property
    def BuoiHocID(self):
        return self.session_id

    @property
    def MSSV(self):
        return self.student_id

    @property
    def AttendanceStatus(self):
        value = (self.status or '').upper()
        return value if value else 'ABSENT'

    @AttendanceStatus.setter
    def AttendanceStatus(self, value):
        self.status = (value or '').lower() if value else None

    @property
    def CheckInTime(self):
        return self.checkin_time

    @CheckInTime.setter
    def CheckInTime(self, value):
        self.checkin_time = value

    @property
    def ConfidenceScore(self):
        return None

    @property
    def MatchFaceDataID(self):
        return None

    @property
    def CheckInMethod(self):
        return 'ARCFACE'


# Backward-compatible aliases used by existing route imports.
GiangVien = Teacher
Lop = Classroom
SinhVien = Student
SinhVienKhuonMat = FaceEmbedding
BuoiHoc = AttendanceSession
DiemDanh = AttendanceRecord


