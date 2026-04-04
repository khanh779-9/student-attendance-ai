from flask import Blueprint, request, jsonify, current_app
from models import DiemDanh, BuoiHoc, SinhVien, SinhVienKhuonMat, Enrollment, db
from auth import require_auth
from datetime import datetime
import os
import json
import csv
import tempfile
import logging
from io import StringIO
from flask import make_response

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')
logger = logging.getLogger(__name__)


def _build_checkin_response(accepted, student_id=None, student_name=None, attendance_status=None,
                            message="", confidence=0.0, distance=None, threshold=0.0):
    """Build standardized check-in response payload."""
    return {
        'accepted': accepted,
        'studentId': student_id,
        'studentName': student_name,
        'attendanceStatus': attendance_status,
        'message': message,
        'confidenceScore': round(confidence, 4) if confidence else 0.0,
        'distanceScore': round(distance, 4) if distance is not None else None,
        'threshold': round(threshold, 4),
    }

@attendance_bp.route('/checkin-file', methods=['POST'])
@require_auth
def checkin_face():
    """Check-in student using face recognition from uploaded image with confidence threshold."""
    temp_filepath = None
    try:
        logger.info("Attendance check-in request")
        
        session_id = request.form.get('session_id', type=int) or request.form.get('buoi_hoc_id', type=int)
        threshold = float(request.form.get('threshold', current_app.config['FACE_RECOGNITION_THRESHOLD']))
        threshold_value = round(threshold, 4)
        file = request.files.get('file')
        
        if not session_id or not file:
            logger.warning("Missing session_id or file")
            return jsonify({'error': 'Missing session_id or file'}), 400

        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            logger.warning("Session %s not found", session_id)
            return jsonify({'error': 'Session not found'}), 404
        
        if session.Status != 'OPEN':
            logger.warning("Trạng thái buổi học là %s, không phải OPEN", session.Status)
            return jsonify({'error': f'Trạng thái buổi học là {session.Status}, không phải OPEN'}), 400

        try:
            temp_dir = tempfile.gettempdir()
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S%f')
            temp_filename = f"checkin_temp_{timestamp}_{file.filename}"
            temp_filepath = os.path.join(temp_dir, temp_filename)
            file.save(temp_filepath)
        except Exception as e:
            logger.exception("Failed to save temporary file: %s", str(e))
            return jsonify({'error': 'Failed to process file'}), 400

        from face_service import FaceRecognitionService
        service = FaceRecognitionService(current_app.config['ARCFACE_MODEL_PATH'])

        face_count = service.detect_face_count(temp_filepath)
        if face_count == 0:
            logger.info("No face detected in check-in image")
            return jsonify(_build_checkin_response(
                accepted=False,
                message='Không phát hiện khuôn mặt trong ảnh.',
                threshold=threshold_value,
            )), 400
        if face_count and face_count > 1:
            logger.info("Multiple faces detected in check-in image: %s", face_count)
            return jsonify(_build_checkin_response(
                accepted=False,
                message='Phát hiện nhiều khuôn mặt trong ảnh. Vui lòng chỉ để 1 khuôn mặt.',
                threshold=threshold_value,
            )), 400

        class_students = (
            db.session.query(SinhVien)
            .join(Enrollment, Enrollment.student_id == SinhVien.id)
            .filter(Enrollment.class_id == session.MaLop)
            .all()
        )
        logger.info("Found %s students in class %s", len(class_students), session.MaLop)
        
        enrolled_embeddings = []
        for student in class_students:
            faces = SinhVienKhuonMat.query.filter_by(student_id=student.MSSV).all()
            
            for face in faces:
                try:
                    embedding = json.loads(face.EmbeddingVector)
                    enrolled_embeddings.append({
                        'embedding': embedding,
                        'mssv': student.MSSV,
                        'face_data_id': face.FaceDataID,
                        'student_name': student.Ho_Ten_SV
                    })
                except Exception as e:
                    logger.warning("Failed to load embedding for %s: %s", student.MSSV, str(e))
                    continue
        
        if not enrolled_embeddings:
            logger.warning("No enrolled faces found for class")
            return jsonify(_build_checkin_response(
                accepted=False,
                message='Chưa có sinh viên đăng kí khuôn mặt',
                threshold=threshold_value,
            )), 400

        logger.info("Starting face recognition")
        result = service.recognize_face(
            temp_filepath,
            enrolled_embeddings,
            threshold=threshold,
        )
        
        if result is None:
            logger.warning("No match found - face inconclusive")
            return jsonify(_build_checkin_response(
                accepted=False,
                message='Khuôn mặt không xác định',
                threshold=threshold_value,
            )), 400
        
        confidence = float(result['confidence'])
        distance = float(result['distance'])
        threshold_value = round(float(result['threshold']), 4)
        accepted = bool(result['accepted'])
        
        if not accepted:
            logger.info("Recognition rejected: confidence %.4f < threshold %s", confidence, threshold)
            return jsonify(_build_checkin_response(
                accepted=False,
                message='Khuôn mặt không xác định',
                confidence=confidence,
                distance=distance,
                threshold=threshold_value,
            )), 400

        mssv = str(result['face_data']['mssv'])
        student_name = str(result['face_data']['student_name'])
        face_data_id = int(result['face_data']['face_data_id'])
        
        logger.info("Recognition accepted: MSSV=%s Name=%s Confidence=%.4f", mssv, student_name, confidence)

        existing_checkin = DiemDanh.query.filter_by(
            session_id=session_id,
            student_id=mssv
        ).first()
        
        if existing_checkin:
            logger.info("Student %s already checked in", mssv)
            return jsonify(_build_checkin_response(
                accepted=True,
                student_id=mssv,
                student_name=student_name,
                attendance_status=existing_checkin.AttendanceStatus,
                message='Sinh viên đã điểm danh rồi',
                confidence=confidence,
                distance=distance,
                threshold=threshold_value,
            )), 200

        new_attendance = DiemDanh(
            session_id=session_id,
            student_id=mssv,
            status='present',
            checkin_time=datetime.utcnow()
        )
        db.session.add(new_attendance)
        db.session.commit()
        
        logger.info("Attendance record created for %s", mssv)
        
        return jsonify(_build_checkin_response(
            accepted=True,
            student_id=mssv,
            student_name=student_name,
            attendance_status='PRESENT',
            message='Điểm danh thành công',
            confidence=confidence,
            distance=distance,
            threshold=threshold_value,
        )), 200
    
    except Exception as e:
        logger.exception("Error in checkin_face: %s", str(e))
        db.session.rollback()
        return jsonify({'error': f'Checkin error: {str(e)}'}), 500
    
    finally:
        if temp_filepath and os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
                logger.debug("Temporary file cleaned up: %s", temp_filepath)
            except Exception as e:
                logger.warning("Failed to cleanup temp file: %s", str(e))

@attendance_bp.route('/session/<int:session_id>/stats', methods=['GET'])
@require_auth
def get_session_stats(session_id):
    """Get attendance statistics for a session"""
    try:
        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        class_students = (
            db.session.query(SinhVien.id)
            .join(Enrollment, Enrollment.student_id == SinhVien.id)
            .filter(Enrollment.class_id == session.MaLop)
            .count()
        )

        attendance = DiemDanh.query.filter_by(session_id=session_id).all()

        stats = {
            'totalStudents': class_students,
            'presentCount': sum(1 for a in attendance if a.AttendanceStatus == 'PRESENT'),
            'lateCount': sum(1 for a in attendance if a.AttendanceStatus == 'LATE'),
            'absentCount': sum(1 for a in attendance if a.AttendanceStatus == 'ABSENT'),
            'excusedCount': sum(1 for a in attendance if a.AttendanceStatus == 'EXCUSED'),
            'recognizedCount': sum(1 for a in attendance if a.CheckInMethod in ('ARCFACE', 'DEEPFACE'))
        }
        
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/session/<int:session_id>/history', methods=['GET'])
@require_auth
def get_attendance_history(session_id):
    """Get attendance history for a session"""
    try:
        logger.info("Loading attendance history for session %s", session_id)
        
        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            logger.warning("Session %s not found", session_id)
            return jsonify({'error': 'Session not found'}), 404
        
        attendance_records = DiemDanh.query.filter_by(session_id=session_id).all()
        logger.info("Found %s attendance records", len(attendance_records))
        
        result = []
        for record in attendance_records:
            student = record.student
            result.append({
                'studentId': str(record.MSSV),
                'studentName': str(student.Ho_Ten_SV) if student else 'Không xác định',
                'attendanceStatus': str(record.AttendanceStatus),
                'checkinTime': record.CheckInTime.isoformat() if record.CheckInTime else None,
                'confidenceScore': None,
                'checkinMethod': str(record.CheckInMethod)
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.exception("Error loading attendance history: %s", str(e))
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/session/<int:session_id>/history.csv', methods=['GET'])
@require_auth
def export_attendance_csv(session_id):
    """Export attendance history as CSV"""
    try:
        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        attendance_records = DiemDanh.query.filter_by(session_id=session_id).all()

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['MSSV', 'Họ Tên', 'Trạng Thái', 'Thời Gian Check-in', 'Độ Tin Cậy', 'Phương Thức'])
        
        for record in attendance_records:
            student = record.student
            writer.writerow([
                record.MSSV,
                student.Ho_Ten_SV,
                record.AttendanceStatus,
                record.CheckInTime.isoformat() if record.CheckInTime else '',
                '',
                record.CheckInMethod
            ])

        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename=attendance_{session_id}.csv'
        response.headers['Content-Type'] = 'text/csv'
        return response
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
