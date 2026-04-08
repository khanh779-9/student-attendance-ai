-- ==============================================
-- CLASS STUDENT ATTENDANCE DATABASE TEMPLATE
-- Target: MySQL 8+
-- ==============================================

CREATE DATABASE IF NOT EXISTS class_student_attendance
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;

USE class_student_attendance;

-- =========================
-- 1. TEACHERS
-- =========================
CREATE TABLE teachers (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    password text NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. CLASSES
-- =========================
CREATE TABLE classes (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    teacher_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- =========================
-- 3. STUDENTS
-- =========================
CREATE TABLE students (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 4. ENROLLMENTS (SV - CLASS)
-- =========================
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    class_id VARCHAR(20),

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),

    UNIQUE (student_id, class_id) -- tránh trùng
);


-- =========================
-- 5. ATTENDANCE SESSIONS
-- =========================
CREATE TABLE attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id VARCHAR(20),
    session_date DATE,
    status enum('OPEN', 'CLOSED', 'PENDING') DEFAULT 'PENDING',
    start_time TIMESTAMP,
    end_time TIMESTAMP,

    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- =========================
-- 6. ATTENDANCE RECORDS
-- =========================
CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    student_id VARCHAR(20),
    checkin_time TIMESTAMP,
    status VARCHAR(20), -- present / absent

    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
    FOREIGN KEY (student_id) REFERENCES students(id),

    UNIQUE (session_id, student_id) -- mỗi SV chỉ điểm danh 1 lần
);

-- =========================
-- Dữ liệu mẫu (optional)
INSERT INTO teachers (id, name, password, email) VALUES
('GV001', 'Nguyen Van A', '123', 'nguyenvana@example.com'),
('GV002', 'Tran Thi B', '456', 'tranthib@example.com');

INSERT INTO classes (id, name, teacher_id) VALUES
('L001', 'Toan 10A1', 'GV001'),
('L002', 'Van 10A1', 'GV002');

INSERT INTO students (id, name) VALUES
('SV001', 'Le Thi C'),
('SV002', 'Pham Van D');

INSERT INTO enrollments (student_id, class_id) VALUES
('SV001', 'L001'),
('SV002', 'L001'),
('SV001', 'L002');


INSERT INTO attendance_sessions (class_id, session_date, start_time, end_time) VALUES
('L001', '2024-09-01', '2024-09-01 08:00:00', '2024-09-01 09:00:00'),
('L002', '2024-09-01', '2024-09-01 10:00:00', '2024-09-01 11:00:00');

INSERT INTO attendance_records (session_id, student_id, checkin_time, status) VALUES
(1, 'SV001', '2024-09-01 08:05:00', 'present'),
(1, 'SV002', '2024-09-01 08:10:00', 'present'),
(2, 'SV001', '2024-09-01 10:05:00', 'present');

-- =========================
-- Indexes (optional)

CREATE INDEX idx_student_id ON face_embeddings(student_id);
