# Hệ thống điểm danh nhận diện khuôn mặt bằng AI

Đồ án báo cá

Giai đoạn 1: Thử nghiệm pp trích đặc trưng (ko train)

## 1. Tổng quan

Dự án gồm 2 cục:

- Backend: Python Flask, SQLAlchemy, MySQL, ONNX Runtime (cụ thể là ArcFace)
- Frontend: React, Vite, Tailwind CSS

Chức năng:

- Đăng nhập giảng viên
- Quản lý lớp học, sinh viên
- Đăng ký khuôn mặt sinh viên
- Tạo buổi học và điểm danh bằng nhận diện khuôn mặt
- Xem thống kê, lịch sử điểm danh
- Vân vân và mây mây

## 2. Cấu trúc thư mục

```text
NhanDien_HinhAnh
  apps
    backend
    frontend
  Model
    Arcface
    Yolo
  template_db
    class_student_attendance.sql
```

## 3. Yêu cầu môi trường

### 3.1 Backend

- Python 3.8 trở lên
- MySQL 8 trở lên

### 3.2 Frontend

- Node.js 18 trở lên
- npm

## 4. Cài đặt cơ sở dữ liệu

Từ thư mục gốc dự án, import file SQL mẫu:

```bash
mysql -u root -p < template_db/class_student_attendance.sql
```

Sau khi import xong, đảm bảo database có tên `class_student_attendance` hoặc chỉnh lại trong file `.env` của backend.

## 5. Cài đặt và chạy Backend

Di chuyển vào backend:

```bash
cd apps/backend
```

Cài thư viện Python:

```bash
pip install -r requirements.txt
```

Tạo file `.env` (hoặc chỉnh file có sẵn) với các biến quan trọng:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=class_student_attendance
JWT_SECRET_KEY=your_secret_key
ARCFACE_MODEL_PATH=../../Model/Arcface/arc.onnx
YOLO_MODEL_PATH=../../Model/Yolo/yolov10s.onnx
FACE_RECOGNITION_THRESHOLD=0.04223
FLASK_ENV=development
```

Nạp dữ liệu mẫu:

```bash
python seed.py
```

Chạy backend:

```bash
python app.py
```

Backend mặc định chạy tại:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
```

## 6. Cài đặt và chạy Frontend

Mở terminal khác và chạy:

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

## 7. Cấu hình Frontend gọi API

Frontend gọi API qua `apps/frontend/src/api.js`.

Nếu backend chạy khác `http://localhost:8000`, hãy chỉnh base URL theo cấu hình thực tế hoặc dùng biến môi trường Vite.

Ví dụ file `.env.local` trong `apps/frontend`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Sau khi chỉnh biến môi trường, cần khởi động lại frontend.

## 8. Tài khoản thử nghiệm

Sau khi chạy `python seed.py`, có thể đăng nhập bằng:

- MSGV: `GV001`
- Mật khẩu: `123`

## 9. Luồng sử dụng

1. Đăng nhập bằng tài khoản giảng viên.
2. Tạo lớp học ở trang Quản lý lớp.
3. Thêm sinh viên ở trang Đăng ký.
4. Đăng ký khuôn mặt cho sinh viên.
5. Tạo buổi học và mở điểm danh.
6. Dùng camera hoặc ảnh để check-in.
7. Xem thống kê và lịch sử điểm danh.

## 10. Script

### Frontend

- `npm run dev`: chạy môi trường phát triển
- `npm run build`: build production

### Backend

- `python app.py`: chạy server backend
- `python seed.py`: nạp dữ liệu mẫu
