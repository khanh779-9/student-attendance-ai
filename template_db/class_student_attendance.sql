-- ==============================================
-- CLASS STUDENT ATTENDANCE DATABASE TEMPLATE
-- Target: MySQL 8+
-- ==============================================

CREATE DATABASE IF NOT EXISTS class_student_attendance
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;

USE class_student_attendance;

-- ----------------------------------------------
-- 1) Lecturer table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS GiangVien (
	MSGV VARCHAR(20) NOT NULL,
	HoTen VARCHAR(120) NOT NULL,
	Password VARCHAR(255) NOT NULL,
	Email VARCHAR(120) NULL,
	IsActive TINYINT(1) NOT NULL DEFAULT 1,
	CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (MSGV),
	UNIQUE KEY uq_giangvien_email (Email)
);

-- ----------------------------------------------
-- 2) Class table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS Lop (
	MaLop VARCHAR(20) NOT NULL,
	TenLop VARCHAR(150) NOT NULL,
	NienKhoa VARCHAR(20) NULL,
	HocKy VARCHAR(20) NULL,
	CreatedByMSGV VARCHAR(20) NULL,
	CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (MaLop),
	CONSTRAINT fk_lop_created_by_giangvien
		FOREIGN KEY (CreatedByMSGV) REFERENCES GiangVien(MSGV)
		ON DELETE SET NULL
		ON UPDATE CASCADE
);

-- One lecturer can manage many classes, one class can have many lecturers
CREATE TABLE IF NOT EXISTS GiangVienLop (
	MSGV VARCHAR(20) NOT NULL,
	MaLop VARCHAR(20) NOT NULL,
	VaiTro ENUM('OWNER', 'ASSISTANT') NOT NULL DEFAULT 'OWNER',
	AssignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (MSGV, MaLop),
	CONSTRAINT fk_giangvienlop_giangvien
		FOREIGN KEY (MSGV) REFERENCES GiangVien(MSGV)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT fk_giangvienlop_lop
		FOREIGN KEY (MaLop) REFERENCES Lop(MaLop)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

-- ----------------------------------------------
-- 3) Student table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS SinhVien (
	MSSV VARCHAR(20) NOT NULL,
	Ho_Ten_SV VARCHAR(120) NOT NULL,
	Lop VARCHAR(20) NOT NULL,
	NgaySinh DATE NULL,
	GioiTinh ENUM('NAM', 'NU', 'KHAC') NULL,
	IsActive TINYINT(1) NOT NULL DEFAULT 1,
	CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (MSSV),
	KEY idx_sinhvien_lop (Lop),
	CONSTRAINT fk_sinhvien_lop
		FOREIGN KEY (Lop) REFERENCES Lop(MaLop)
		ON DELETE RESTRICT
		ON UPDATE CASCADE
);

-- ----------------------------------------------
-- 4) Face registration table (DeepFace)
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS SinhVienKhuonMat (
	FaceDataID BIGINT NOT NULL AUTO_INCREMENT,
	MSSV VARCHAR(20) NOT NULL,
	ImagePath VARCHAR(500) NOT NULL,
	EmbeddingVector JSON NULL,
	ModelName VARCHAR(60) NOT NULL DEFAULT 'DeepFace',
	BackboneModel VARCHAR(60) NULL,
	DetectorBackend VARCHAR(60) NULL,
	DistanceMetric VARCHAR(30) NULL,
	IsPrimary TINYINT(1) NOT NULL DEFAULT 1,
	IsActive TINYINT(1) NOT NULL DEFAULT 1,
	RegisteredByMSGV VARCHAR(20) NULL,
	RegisteredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (FaceDataID),
	KEY idx_face_mssv (MSSV),
	KEY idx_face_model (ModelName),
	CONSTRAINT fk_face_sinhvien
		FOREIGN KEY (MSSV) REFERENCES SinhVien(MSSV)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT fk_face_registered_giangvien
		FOREIGN KEY (RegisteredByMSGV) REFERENCES GiangVien(MSGV)
		ON DELETE SET NULL
		ON UPDATE CASCADE
);

-- ----------------------------------------------
-- 5) Class session table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS BuoiHoc (
	BuoiHocID BIGINT NOT NULL AUTO_INCREMENT,
	MaLop VARCHAR(20) NOT NULL,
	MSGV VARCHAR(20) NOT NULL,
	TieuDe VARCHAR(200) NULL,
	ScheduledStart DATETIME NULL,
	ScheduledEnd DATETIME NULL,
	ActualStart DATETIME NULL,
	ActualEnd DATETIME NULL,
	Status ENUM('PLANNED', 'OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
	CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (BuoiHocID),
	KEY idx_buoihoc_lop (MaLop),
	KEY idx_buoihoc_giangvien (MSGV),
	CONSTRAINT fk_buoihoc_lop
		FOREIGN KEY (MaLop) REFERENCES Lop(MaLop)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT fk_buoihoc_giangvien
		FOREIGN KEY (MSGV) REFERENCES GiangVien(MSGV)
		ON DELETE RESTRICT
		ON UPDATE CASCADE
);

-- ----------------------------------------------
-- 6) Attendance result table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS DiemDanh (
	DiemDanhID BIGINT NOT NULL AUTO_INCREMENT,
	BuoiHocID BIGINT NOT NULL,
	MSSV VARCHAR(20) NOT NULL,
	AttendanceStatus ENUM('PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'ABSENT',
	CheckInTime DATETIME NULL,
	ConfidenceScore DECIMAL(6,5) NULL,
	MatchFaceDataID BIGINT NULL,
	CheckInMethod ENUM('DEEPFACE', 'MANUAL', 'QR', 'OTHER') NOT NULL DEFAULT 'DEEPFACE',
	Notes VARCHAR(255) NULL,
	CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (DiemDanhID),
	UNIQUE KEY uq_diemdanh_buoihoc_mssv (BuoiHocID, MSSV),
	KEY idx_diemdanh_mssv (MSSV),
	KEY idx_diemdanh_status (AttendanceStatus),
	CONSTRAINT fk_diemdanh_buoihoc
		FOREIGN KEY (BuoiHocID) REFERENCES BuoiHoc(BuoiHocID)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT fk_diemdanh_sinhvien
		FOREIGN KEY (MSSV) REFERENCES SinhVien(MSSV)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT fk_diemdanh_match_face
		FOREIGN KEY (MatchFaceDataID) REFERENCES SinhVienKhuonMat(FaceDataID)
		ON DELETE SET NULL
		ON UPDATE CASCADE
);



-- ----------------------------------------------
-- Sample seed data
-- ----------------------------------------------
INSERT INTO GiangVien (MSGV, HoTen, Password, Email)
VALUES
	('GV001', 'Nguyen Van A', '$2b$12$example_hash_replace_me', 'gva@example.edu')
ON DUPLICATE KEY UPDATE HoTen = VALUES(HoTen);

INSERT INTO Lop (MaLop, TenLop, NienKhoa, HocKy, CreatedByMSGV)
VALUES
	('CTK42', 'Cong Nghe Ky Thuat K42', '2025-2026', 'HK2', 'GV001')
ON DUPLICATE KEY UPDATE TenLop = VALUES(TenLop);

INSERT INTO GiangVienLop (MSGV, MaLop, VaiTro)
VALUES
	('GV001', 'CTK42', 'OWNER')
ON DUPLICATE KEY UPDATE VaiTro = VALUES(VaiTro);

INSERT INTO SinhVien (MSSV, Ho_Ten_SV, Lop)
VALUES
	('SV001', 'Tran Thi B', 'CTK42'),
	('SV002', 'Le Van C', 'CTK42')
ON DUPLICATE KEY UPDATE Ho_Ten_SV = VALUES(Ho_Ten_SV);

-- NOTE:
-- 1) PasswordHash should store hashed passwords (bcrypt/argon2), not plain text.
-- 2) EmbeddingVector can store DeepFace embedding output as JSON array.
-- 3) For performance at scale, you can move vector data to a dedicated vector DB.
