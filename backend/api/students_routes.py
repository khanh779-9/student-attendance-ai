from flask import Blueprint, request, jsonify
from models import SinhVien, Lop, Enrollment, db
from auth import require_auth

students_bp = Blueprint('students', __name__, url_prefix='/api/students')


def _get_json_payload():
    return request.get_json(silent=True) or {}

def student_to_dict(sv, class_id=None):
    """Convert student model to API dictionary"""
    return {
        'id': sv.MSSV,
        'name': sv.Ho_Ten_SV,
        'classId': class_id if class_id is not None else sv.Lop,
        'createdAt': sv.created_at.isoformat() if sv.created_at else None
    }

@students_bp.route('', methods=['GET'])
@require_auth
def get_students():
    """Get all students (optional filter by class_id)"""
    try:
        class_id_filter = request.args.get('class_id') or request.args.get('ma_lop')
        
        if class_id_filter:
            rows = (
                db.session.query(SinhVien, Enrollment.class_id)
                .join(Enrollment, Enrollment.student_id == SinhVien.id)
                .filter(Enrollment.class_id == class_id_filter)
                .all()
            )
            return jsonify([student_to_dict(student, class_id) for student, class_id in rows]), 200

        rows = (
            db.session.query(SinhVien, Enrollment.class_id)
            .outerjoin(Enrollment, Enrollment.student_id == SinhVien.id)
            .all()
        )
        return jsonify([student_to_dict(student, class_id) for student, class_id in rows]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@students_bp.route('', methods=['POST'])
@require_auth
def create_student():
    """Create new student"""
    try:
        data = _get_json_payload()
        student_id = data.get('id') or data.get('mssv')
        student_name = data.get('name') or data.get('ho_ten_sv')
        class_id = data.get('classId') or data.get('lop')
        
        if not student_id or not student_name or not class_id:
            return jsonify({'error': 'Missing required fields: id, name, classId'}), 400
        
        existing = SinhVien.query.filter_by(id=student_id).first()
        if existing:
            return jsonify({'error': 'Student already exists'}), 409

        lop = Lop.query.filter_by(id=class_id).first()
        if not lop:
            return jsonify({'error': 'Class not found'}), 404
        
        new_student = SinhVien(
            id=student_id,
            name=student_name
        )
        
        db.session.add(new_student)
        db.session.flush()

        enrollment = Enrollment(
            student_id=student_id,
            class_id=class_id
        )
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify(student_to_dict(new_student, class_id)), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['PUT'])
@require_auth
def update_student(student_id):
    """Update student"""
    try:
        student = SinhVien.query.filter_by(id=student_id).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        data = _get_json_payload()
        
        student_name = data.get('name') or data.get('ho_ten_sv')
        if student_name is not None:
            student.name = student_name

        current_class_id = student.Lop
        class_id = data.get('classId') or data.get('lop')
        if class_id is not None:
            lop = Lop.query.filter_by(id=class_id).first()
            if not lop:
                return jsonify({'error': 'Class not found'}), 404

            existing = Enrollment.query.filter_by(
                student_id=student.MSSV,
                class_id=class_id
            ).first()
            if not existing:
                Enrollment.query.filter_by(student_id=student.MSSV).delete()
                db.session.add(Enrollment(student_id=student.MSSV, class_id=class_id))
            current_class_id = class_id
        
        db.session.commit()
        return jsonify(student_to_dict(student, current_class_id)), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
