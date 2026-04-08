from flask import Blueprint, request, jsonify, current_app
from models import SinhVien, Enrollment, db
from auth import require_auth
import os
import json
import logging
from datetime import datetime
from models import Lop
from sqlalchemy import func

face_bp = Blueprint('face', __name__, url_prefix='/api/face')
logger = logging.getLogger(__name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_enrollment_file(file, mssv):
    """Save enrollment file to uploads/enrolls/<MSSV>/ folder"""
    if not file or file.filename == '':
        return None
    
    if not allowed_file(file.filename):
        return None
    
    enrolls_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'enrolls', str(mssv))
    os.makedirs(enrolls_folder, exist_ok=True)
    
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S%f')
    filename = f"{timestamp}_{file.filename}"
    filepath = os.path.join(enrolls_folder, filename)
    
    file.save(filepath)
    logger.info("Enrollment image saved to: %s", filepath)
    return filepath

@face_bp.route('/enroll-file', methods=['POST'])
@require_auth
def enroll_face():
    """Enroll face for a student using uploaded image (supports multiple images per student)"""
    try:
        mssv = request.form.get('student_id') or request.form.get('mssv')
        registered_by_msgv = request.form.get('registered_by_msgv', request.msgv)
        file = request.files.get('file')

        logger.info("Enrollment request: mssv=%s msgv=%s", mssv, request.msgv)
        
        if not mssv:
            return jsonify({'error': 'Missing student_id in form data'}), 400
        if not file:
            return jsonify({'error': 'Missing file in request'}), 400
        
        student = SinhVien.query.filter_by(id=mssv).first()
        if not student:
            return jsonify({'error': f'Student {mssv} not found'}), 404

        filepath = save_enrollment_file(file, mssv)
        if not filepath:
            return jsonify({'error': 'Invalid file format. Allowed: jpg, jpeg, png, gif'}), 400

        logger.info("Enrollment file saved: %s", filepath)

        from face_service import FaceRecognitionService
        service = FaceRecognitionService(
            current_app.config['ARCFACE_MODEL_PATH']
        )

        face_count = service.detect_face_count(filepath)
        if face_count == 0:
            os.remove(filepath)
            return jsonify({'error': 'Không phát hiện khuôn mặt trong ảnh.'}), 400
        if face_count and face_count > 1:
            os.remove(filepath)
            return jsonify({'error': 'Phát hiện nhiều khuôn mặt trong ảnh. Vui lòng chỉ để 1 khuôn mặt.'}), 400
        
        embedding = service.extract_embedding(filepath)
        if embedding is None:
            os.remove(filepath)
            return jsonify({'error': 'Failed to extract face embedding. Please upload a clear face image'}), 400

        logger.info("Embedding extracted for %s", mssv)

        existing_faces = SinhVienKhuonMat.query.filter_by(student_id=mssv).all()
        is_first_face = len(existing_faces) == 0

        face_record = SinhVienKhuonMat(
            student_id=mssv,
            image_path=filepath,
            embedding=json.dumps(embedding)
        )
        
        db.session.add(face_record)
        db.session.commit()

        logger.info("Khuôn mặt được đăng kí thành công. Tổng khuôn mặt cho %s: %s", mssv, len(existing_faces) + 1)
        
        return jsonify({
            'faceEmbeddingId': face_record.FaceDataID,
            'isPrimary': is_first_face,
            'totalFaces': len(existing_faces) + 1,
            'message': f'Khuôn mặt được đăng kí thành công. Tổng khuôn mặt: {len(existing_faces) + 1}' if not is_first_face else 'Khuôn mặt được đăng kí thành công (khuôn mặt chính)'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.exception("Enrollment error: %s", str(e))
        return jsonify({'error': str(e)}), 500


@face_bp.route('/list/<student_id>', methods=['GET'])
@require_auth
def get_enrolled_faces(student_id):
    """Get all enrolled face vectors for a student (file-based)"""
    try:
        import numpy as np
        data_dir = os.path.join(current_app.root_path, 'Data', 'student')
        npy_path = os.path.join(data_dir, f'{student_id}.npy')
        if not os.path.exists(npy_path):
            return jsonify([]), 200
        vectors = np.load(npy_path)
        if vectors.ndim == 1:
            vectors = [vectors]
        result = [
            {
                'index': i,
                'studentId': student_id,
                'vector': vec.tolist()
            }
            for i, vec in enumerate(vectors)
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@face_bp.route('/class-diagnostic/<class_id>', methods=['GET'])
@require_auth
def class_face_diagnostic(class_id):
    """Get face enrollment status for all students in a class (file-based)"""
    try:
        logger.info("Checking face status for class %s", class_id)
        from models import Lop
        lop = Lop.query.filter_by(id=class_id).first()
        if not lop:
            return jsonify({'error': f'Class {class_id} not found'}), 404
        students = (
            db.session.query(SinhVien)
            .join(Enrollment, Enrollment.student_id == SinhVien.id)
            .filter(Enrollment.class_id == class_id)
            .all()
        )
        import numpy as np
        data_dir = os.path.join(current_app.root_path, 'Data', 'student')
        result = {
            'classId': class_id,
            'totalStudents': len(students),
            'studentsWithFaces': 0,
            'studentsWithoutFaces': 0,
            'students': []
        }
        for student in students:
            npy_path = os.path.join(data_dir, f'{student.MSSV}.npy')
            if os.path.exists(npy_path):
                try:
                    vectors = np.load(npy_path)
                    face_count = vectors.shape[0] if vectors.ndim > 1 else 1
                except Exception:
                    face_count = 0
            else:
                face_count = 0
            student_info = {
                'studentId': student.MSSV,
                'studentName': student.Ho_Ten_SV,
                'faceCount': int(face_count or 0),
                'status': 'CÓ_KHUÔN_MẶT' if face_count > 0 else 'KHÔNG_CÓ_KHUÔN_MẶT'
            }
            result['students'].append(student_info)
            if face_count > 0:
                result['studentsWithFaces'] += 1
            else:
                result['studentsWithoutFaces'] += 1
        return jsonify(result), 200
    except Exception as e:
        logger.exception("Error in class_face_diagnostic: %s", str(e))
        return jsonify({'error': str(e)}), 500
