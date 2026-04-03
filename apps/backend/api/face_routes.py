from flask import Blueprint, request, jsonify, current_app
from models import SinhVienKhuonMat, SinhVien, db
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
        mssv = request.form.get('mssv')
        registered_by_msgv = request.form.get('registered_by_msgv', request.msgv)
        file = request.files.get('file')

        logger.info("Enrollment request: mssv=%s msgv=%s", mssv, request.msgv)
        
        if not mssv:
            return jsonify({'error': 'Missing mssv in form data'}), 400
        if not file:
            return jsonify({'error': 'Missing file in request'}), 400
        
        student = SinhVien.query.filter_by(MSSV=mssv).first()
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

        existing_faces = SinhVienKhuonMat.query.filter_by(MSSV=mssv, IsActive=True).all()
        is_first_face = len(existing_faces) == 0

        face_record = SinhVienKhuonMat(
            MSSV=mssv,
            ImagePath=filepath,
            EmbeddingVector=json.dumps(embedding),
            ModelName='ArcFace',
            BackboneModel='ResNet100',
            DetectorBackend='HaarCascade',
            DistanceMetric='COSINE',
            IsPrimary=is_first_face,
            RegisteredByMSGV=registered_by_msgv
        )
        
        db.session.add(face_record)
        db.session.commit()

        logger.info("Khuôn mặt được đăng kí thành công. Tổng khuôn mặt cho %s: %s", mssv, len(existing_faces) + 1)
        
        return jsonify({
            'face_data_id': face_record.FaceDataID,
            'is_primary': is_first_face,
            'total_faces': len(existing_faces) + 1,
            'message': f'Khuôn mặt được đăng kí thành công. Tổng khuôn mặt: {len(existing_faces) + 1}' if not is_first_face else 'Khuôn mặt được đăng kí thành công (khuôn mặt chính)'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.exception("Enrollment error: %s", str(e))
        return jsonify({'error': str(e)}), 500

@face_bp.route('/list/<mssv>', methods=['GET'])
@require_auth
def get_enrolled_faces(mssv):
    """Get all enrolled faces for a student"""
    try:
        student = SinhVien.query.filter_by(MSSV=mssv).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        faces = SinhVienKhuonMat.query.filter_by(
            MSSV=mssv,
            IsActive=True
        ).all()
        
        result = []
        for face in faces:
            result.append({
                'FaceDataID': face.FaceDataID,
                'MSSV': face.MSSV,
                'ImagePath': face.ImagePath,
                'ModelName': face.ModelName,
                'IsPrimary': face.IsPrimary,
                'RegisteredAt': face.RegisteredAt.isoformat() if face.RegisteredAt else None
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@face_bp.route('/class-diagnostic/<ma_lop>', methods=['GET'])
@require_auth
def class_face_diagnostic(ma_lop):
    """Get face enrollment status for all students in a class"""
    try:
        logger.info("Checking face status for class %s", ma_lop)
        
        lop = Lop.query.filter_by(MaLop=ma_lop).first()
        if not lop:
            return jsonify({'error': f'Class {ma_lop} not found'}), 404
        
        students = SinhVien.query.filter_by(Lop=ma_lop).all()
        
        result = {
            'ma_lop': ma_lop,
            'total_students': len(students),
            'students_with_faces': 0,
            'students_without_faces': 0,
            'students': []
        }
        
        for student in students:
            face_count = db.session.query(func.count(SinhVienKhuonMat.FaceDataID)).filter_by(
                MSSV=student.MSSV, IsActive=True
            ).scalar()
            
            student_info = {
                'mssv': student.MSSV,
                'ho_ten_sv': student.Ho_Ten_SV,
                'face_count': int(face_count or 0),
                'status': 'CÓ_KHUÔN_MẶT' if face_count and face_count > 0 else 'KHÔNG_CÓ_KHUÔN_MẶT'
            }
            
            result['students'].append(student_info)
            
            if face_count and face_count > 0:
                result['students_with_faces'] += 1
            else:
                result['students_without_faces'] += 1
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.exception("Error in class_face_diagnostic: %s", str(e))
        return jsonify({'error': str(e)}), 500
