# Backend - Face Recognition Attendance System

Complete Python/Flask backend for face recognition-based student attendance system.

## Features

- **Authentication**: JWT-based lecturer login
- **Class Management**: CRUD operations for classes
- **Student Management**: CRUD operations for students
- **Face Enrollment**: Store face embeddings using ArcFace model
- **Real-time Attendance**: Automatic face recognition check-in using YOLO detection + ArcFace embeddings
- **Session Management**: Create and manage class sessions
- **Attendance History**: View statistics and export attendance as CSV
- **AI Integration**: Uses ONNX models (YOLO + ArcFace) for fast inference

## Architecture

```
Backend (Python/Flask)
├── Authentication (JWT)
├── Database Layer (SQLAlchemy)
├── API Routes
│   ├── /api/auth/login
│   ├── /api/classes
│   ├── /api/students
│   ├── /api/face/{enroll, list}
│   ├── /api/sessions
│   └── /api/attendance/{checkin, stats, history}
├── Face Recognition Service
│   ├── YOLO Face Detection
│   └── ArcFace Embedding Extraction
└── Database (MySQL)
```

## Setup Instructions

### 1. Prerequisites

- Python 3.8+
- MySQL 8.0+
- ONNX Runtime support

### 2. Install Dependencies

```bash
cd apps/backend
pip install -r requirements.txt
```

**Note for Windows**: If you have issues with `onnxruntime`, try:
```bash
pip install --no-cache-dir onnxruntime
```

### 3. Database Setup

Create MySQL database:
```sql
-- Run the SQL file from template_db/
mysql -u root -p < ../../template_db/class_student_attendance.sql
```

Or use MySQL Workbench to execute the SQL file.

### 4. Environment Configuration

The backend uses separate database configuration variables instead of a single DATABASE_URL for better security and flexibility.

Copy `.env.example` to `.env` (or use provided `.env` file):
```bash
cp .env.example .env
```

Edit `.env` and update these variables:
```
# Database Configuration (Separate Variables)
DATABASE_HOST=localhost        # MySQL server hostname
DATABASE_PORT=3306             # MySQL server port
DATABASE_USER=root             # MySQL username
DATABASE_PASSWORD=YOUR_PASSWORD # MySQL password
DATABASE_NAME=class_student_attendance  # Database name

# JWT Secret Key
JWT_SECRET_KEY=your-secure-random-key

# Face Recognition Models
ARCFACE_MODEL_PATH=../../Model/Arcface/arc.onnx
YOLO_MODEL_PATH=../../Model/Yolo/yolov10s.onnx
FACE_RECOGNITION_THRESHOLD=0.68

# Flask Environment
FLASK_ENV=development
```

**How it works**:
- Python-dotenv automatically loads variables from `.env` file
- `config.py` combines these variables into a SQLAlchemy connection string
- By using separate variables, you get:
  - ✅ Better security (no full URLs in logs)
  - ✅ Easier environment configuration
  - ✅ Clearer separation of concerns
  - ✅ Support for multi-host setups

### 5. Initialize Database with Test Data

```bash
python seed.py
```

This creates:
- Test lecturer: MSGV=GV001, Password=password123
- Test classes: CTK42, CNTT43
- Test students: SV001-SV005

### 6. Run Backend Server

```bash
python app.py
```

Server will start on `http://localhost:8000`

## API Documentation

### Authentication

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "msgv": "GV001",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "ho_ten": "Nguyễn Văn A",
  "msgv": "GV001"
}
```

All other endpoints require `Authorization: Bearer <token>` header.

### Class Management

**Get Classes**
```
GET /api/classes?ma_lop=CTK
Headers: Authorization: Bearer <token>
```

**Create Class**
```
POST /api/classes
Content-Type: application/json
Headers: Authorization: Bearer <token>

{
  "ma_lop": "CTK42",
  "ten_lop": "Công Nghệ Kỹ Thuật K42",
  "nien_khoa": "2025-2026",
  "hoc_ky": "HK2"
}
```

### Student Management

**Get Students**
```
GET /api/students?ma_lop=CTK42
Headers: Authorization: Bearer <token>
```

**Create Student**
```
POST /api/students
Content-Type: application/json
Headers: Authorization: Bearer <token>

{
  "mssv": "SV001",
  "ho_ten_sv": "Trần Thị B",
  "lop": "CTK42",
  "ngay_sinh": "2005-01-15",
  "gioi_tinh": "NU"
}
```

### Face Enrollment

**Enroll Face for Student**
```
POST /api/face/enroll-file
Content-Type: multipart/form-data
Headers: Authorization: Bearer <token>

Form Data:
- mssv: "SV001"
- file: <image file>

Response:
{
  "face_data_id": 123,
  "message": "Face enrolled successfully"
}
```

**Get Enrolled Faces**
```
GET /api/face/list/<mssv>
Headers: Authorization: Bearer <token>
```

### Session Management

**Create Session**
```
POST /api/sessions
Content-Type: application/json
Headers: Authorization: Bearer <token>

{
  "ma_lop": "CTK42",
  "tieu_de": "Buổi học hôm nay",
  "scheduled_start": "2025-04-02T08:00:00Z",
  "scheduled_end": "2025-04-02T10:00:00Z"
}

Response:
{
  "buoi_hoc_id": 1,
  ...
}
```

**Update Session Status**
```
PUT /api/sessions/<buoi_hoc_id>
Content-Type: application/json
Headers: Authorization: Bearer <token>

{
  "status": "OPEN"  // PLANNED, OPEN, CLOSED, CANCELLED
}
```

### Attendance Check-in

**Check-in via Face Recognition**
```
POST /api/attendance/checkin-file
Content-Type: multipart/form-data
Headers: Authorization: Bearer <token>

Form Data:
- buoi_hoc_id: 1
- file: <image file>
- threshold: 0.68 (optional)

Response:
{
  "accepted": true,
  "mssv": "SV001",
  "distance": 0.35,
  "confidence_score": 0.65,
  "deduplicated": false,
  "message": "Student checked in successfully"
}
```

**Get Session Statistics**
```
GET /api/attendance/session/<buoi_hoc_id>/stats
Headers: Authorization: Bearer <token>

Response:
{
  "total_students": 30,
  "present_count": 28,
  "late_count": 1,
  "absent_count": 1,
  "excused_count": 0,
  "recognized_count": 28
}
```

**Get Attendance History**
```
GET /api/attendance/session/<buoi_hoc_id>/history
Headers: Authorization: Bearer <token>

Response: [
  {
    "mssv": "SV001",
    "ho_ten_sv": "Trần Thị B",
    "attendance_status": "PRESENT",
    "check_in_time": "2025-04-02T08:15:00",
    "confidence_score": 0.87,
    "check_in_method": "DEEPFACE"
  }
]
```

**Export Attendance as CSV**
```
GET /api/attendance/session/<buoi_hoc_id>/history.csv
Headers: Authorization: Bearer <token>

Returns: CSV file download
```

## Database Schema

See `../template_db/class_student_attendance.sql` for complete schema.

Key tables:
- **GiangVien**: Lecturer accounts
- **Lop**: Classes
- **SinhVien**: Students
- **SinhVienKhuonMat**: Face registrations with ArcFace embeddings
- **BuoiHoc**: Class sessions
- **DiemDanh**: Attendance records

## Face Recognition Details

### YOLO Model (Face Detection)
- Model: `yolov10s.onnx`
- Input: Image
- Output: Bounding boxes with confidence scores
- Purpose: Detect faces in images

### ArcFace Model (Face Embedding)
- Model: `arc.onnx`
- Input: Face image (112x112)
- Output: 512-dimensional embedding vector
- Purpose: Extract face features for comparison

### Recognition Process
1. Load input image
2. Detect faces using YOLO
3. Extract face ROI for each detection
4. Generate embedding using ArcFace for each face
5. Compare with enrolled student embeddings using L2 distance
6. Calculate confidence: `1 - distance`
7. Accept if distance < threshold (default: 0.68)

## Performance Tips

1. **Model Loading**: Models are loaded once on startup for better performance
2. **Batch Processing**: Can process multiple faces in single image
3. **GPU Support**: Set `providers=['CUDAExecutionProvider']` in face_service.py if GPU available
4. **Database Indexing**: Schema includes indexes on frequently queried fields

## Troubleshooting

### Issue: "No face found in image"
- Ensure image has clear, frontal face
- Check lighting conditions
- Try higher resolution image

### Issue: "No module named 'onnxruntime'"
```bash
pip install --no-cache-dir onnxruntime
```

### Issue: MySQL connection error
- Verify MySQL is running
- Check database variables in .env (DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME)
- Ensure database is created

### Issue: JWT token errors
- Token may be expired (24 hour expiry)
- Get new token via login endpoint

## Development

### Project Structure
```
backend/
├── app.py              # Flask app factory
├── config.py           # Configuration
├── models.py           # SQLAlchemy models
├── auth.py             # JWT & password utilities
├── face_service.py     # Face recognition logic
├── seed.py             # Test data generator
├── api/                # API blueprints
│   ├── auth_routes.py
│   ├── classes_routes.py
│   ├── students_routes.py
│   ├── face_routes.py
│   ├── sessions_routes.py
│   └── attendance_routes.py
└── uploads/            # Generated face images
```

### Adding New Endpoints

1. Create route file in `api/`
2. Create Blueprint
3. Register in `app.py`

Example:
```python
# api/custom_routes.py
from flask import Blueprint
custom_bp = Blueprint('custom', __name__, url_prefix='/api/custom')

@custom_bp.route('/endpoint', methods=['GET'])
@require_auth
def endpoint():
    return {'data': 'value'}, 200

# app.py
app.register_blueprint(custom_bp)
```

## Security Notes

- Change `JWT_SECRET_KEY` in production
- Use HTTPS in production
- Validate all user inputs
- Limit upload file sizes
- Implement rate limiting for production
- Use environment variables for sensitive data

## License

Internal Use Only
