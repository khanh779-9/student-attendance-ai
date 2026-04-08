
from flask import Blueprint, request, jsonify, current_app
from models import SinhVien, Enrollment, db
from auth import require_auth
import os
import json
import logging
from datetime import datetime
from models import Lop
from sqlalchemy import func

# Define Blueprint at the top before using it
face_bp = Blueprint('face', __name__, url_prefix='/api/face')
logger = logging.getLogger(__name__)

# Diagnostic API: Kiểm tra trạng thái khuôn mặt sinh viên trong lớp
@face_bp.route('/class-diagnostic/<class_id>', methods=['GET'])
@require_auth
def class_face_diagnostic(class_id):
    try:
        # Get all enrollments for this class
        enrollments = Enrollment.query.filter_by(class_id=class_id).all()
        student_ids = [enr.student_id for enr in enrollments]
        students = SinhVien.query.filter(SinhVien.id.in_(student_ids)).all() if student_ids else []
        total_students = len(students)
        students_with_faces = 0
        students_without_faces = 0
        student_list = []
        for sv in students:
            npy_path = os.path.join('data', 'student', f'{sv.id}.npy')
            abs_npy_path = os.path.abspath(npy_path)
            has_face = os.path.exists(npy_path)
            face_count = 0
            if has_face:
                try:
                    import numpy as np
                    vectors = np.load(npy_path)
                    logger.info(f"[DIAG] Đọc file npy: {abs_npy_path}, shape={vectors.shape}, dtype={vectors.dtype}")
                    if len(vectors.shape) > 1:
                        face_count = vectors.shape[0]
                    elif len(vectors.shape) == 1:
                        face_count = 1
                    else:
                        face_count = 0
                    if face_count == 0:
                        logger.warning(f"[DIAG] File npy hợp lệ nhưng không có vector: {abs_npy_path}, shape={vectors.shape}")
                except Exception as ex:
                    logger.error(f"[DIAG] Lỗi đọc file npy {abs_npy_path}: {ex}")
                    face_count = 0
            else:
                logger.warning(f"[DIAG] Không tìm thấy file npy: {abs_npy_path}")
            if face_count > 0:
                students_with_faces += 1
            else:
                students_without_faces += 1
            student_list.append({
                'studentId': sv.id,
                'studentName': sv.name,
                'faceCount': face_count,
            })
        return jsonify({
            'classId': class_id,
            'totalStudents': total_students,
            'studentsWithFaces': students_with_faces,
            'studentsWithoutFaces': students_without_faces,
            'students': student_list,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
@face_bp.route('/enroll-file', methods=['POST'])
@require_auth
def enroll_face():
    """Enroll face for a student using uploaded image(s) (supports multiple images per student)"""
    try:
        mssv = request.form.get('student_id') or request.form.get('mssv')
        registered_by_msgv = request.form.get('registered_by_msgv', getattr(request, 'msgv', None))
        files = request.files.getlist('images')
        if not files or len(files) == 0:
            file = request.files.get('file')
            if file:
                files = [file]

        logger.info("Enrollment request: mssv=%s msgv=%s, num_files=%d", mssv, registered_by_msgv, len(files) if files else 0)

        if not mssv:
            return jsonify({'error': 'Missing student_id in form data'}), 400
        if not files or len(files) == 0:
            return jsonify({'error': 'Missing file(s) in request'}), 400

        student = SinhVien.query.filter_by(id=mssv).first()
        if not student:
            return jsonify({'error': f'Student {mssv} not found'}), 404

        from face_service import FaceRecognitionService
        service = FaceRecognitionService(
            current_app.config['ARCFACE_MODEL_PATH']
        )

        results = []
        import numpy as np
        from PIL import Image
        import tempfile, os
        for file in files:
            try:
                img = Image.open(file.stream)
                img = img.convert('RGB')
                fd, tmp_path = tempfile.mkstemp(suffix='.png')
                os.close(fd)
                try:
                    img.save(tmp_path)
                    face_count = service.detect_face_count(tmp_path)
                    if face_count == 0:
                        results.append({'filename': file.filename, 'error': 'Không phát hiện khuôn mặt trong ảnh.'})
                        os.remove(tmp_path)
                        continue
                    if face_count and face_count > 1:
                        results.append({'filename': file.filename, 'error': 'Phát hiện nhiều khuôn mặt trong ảnh. Vui lòng chỉ để 1 khuôn mặt.'})
                        os.remove(tmp_path)
                        continue
                    embedding = service.extract_embedding(tmp_path)
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                if embedding is None:
                    results.append({'filename': file.filename, 'error': 'Failed to extract face embedding. Please upload a clear face image'})
                    continue
                logger.info("Embedding extracted for %s", mssv)
                data_dir = os.path.join('data', 'student')
                os.makedirs(data_dir, exist_ok=True)
                npy_path = os.path.join(data_dir, f'{mssv}.npy')
                logger.info(f"[DEBUG] Sẽ lưu file npy tại: {os.path.abspath(npy_path)}")
                embedding_np = np.array(embedding)
                if os.path.exists(npy_path):
                    try:
                        old = np.load(npy_path)
                        if old.ndim == 1:
                            old = old.reshape(1, -1)
                        new = np.vstack([old, embedding_np])
                    except Exception as e:
                        logger.exception("Error loading existing npy file: %s", str(e))
                        new = embedding_np.reshape(1, -1)
                else:
                    new = embedding_np.reshape(1, -1)
                np.save(npy_path, new)
                logger.info(f"[DEBUG] Đã lưu file npy: {os.path.exists(npy_path)} tại {os.path.abspath(npy_path)}")
                results.append({'filename': file.filename, 'success': True, 'message': 'Khuôn mặt được đăng kí thành công.'})
            except Exception as e:
                logger.exception("Enrollment error for file %s: %s", file.filename, str(e))
                results.append({'filename': file.filename, 'error': str(e)})

        return jsonify({'results': results}), 200
    except Exception as e:
        logger.exception("Enrollment error: %s", str(e))
        return jsonify({'error': str(e)}), 500