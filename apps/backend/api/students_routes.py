from flask import Blueprint, request, jsonify
from models import SinhVien, Lop, db
from auth import require_auth

students_bp = Blueprint('students', __name__, url_prefix='/api/students')


def _get_json_payload():
    return request.get_json(silent=True) or {}

def student_to_dict(sv):
    """Convert SinhVien model to dictionary"""
    return {
        'MSSV': sv.MSSV,
        'Ho_Ten_SV': sv.Ho_Ten_SV,
        'Lop': sv.Lop,
        'NgaySinh': sv.NgaySinh.isoformat() if sv.NgaySinh else None,
        'GioiTinh': sv.GioiTinh,
        'IsActive': sv.IsActive,
        'CreatedAt': sv.CreatedAt.isoformat() if sv.CreatedAt else None,
        'UpdatedAt': sv.UpdatedAt.isoformat() if sv.UpdatedAt else None
    }

@students_bp.route('', methods=['GET'])
@require_auth
def get_students():
    """Get all students (optional filter by ma_lop)"""
    try:
        ma_lop_filter = request.args.get('ma_lop')
        
        query = SinhVien.query
        if ma_lop_filter:
            query = query.filter_by(Lop=ma_lop_filter)
        
        students = query.all()
        return jsonify([student_to_dict(s) for s in students]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@students_bp.route('', methods=['POST'])
@require_auth
def create_student():
    """Create new student"""
    try:
        data = _get_json_payload()
        
        required_fields = ['mssv', 'ho_ten_sv', 'lop']
        if not all(field in data for field in required_fields):
            return jsonify({'error': f'Missing required fields: {required_fields}'}), 400
        
        existing = SinhVien.query.filter_by(MSSV=data['mssv']).first()
        if existing:
            return jsonify({'error': 'Student already exists'}), 409

        lop = Lop.query.filter_by(MaLop=data['lop']).first()
        if not lop:
            return jsonify({'error': 'Class not found'}), 404
        
        new_student = SinhVien(
            MSSV=data['mssv'],
            Ho_Ten_SV=data['ho_ten_sv'],
            Lop=data['lop'],
            NgaySinh=data.get('ngay_sinh'),
            GioiTinh=data.get('gioi_tinh')
        )
        
        db.session.add(new_student)
        db.session.commit()
        
        return jsonify(student_to_dict(new_student)), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@students_bp.route('/<mssv>', methods=['PUT'])
@require_auth
def update_student(mssv):
    """Update student"""
    try:
        student = SinhVien.query.filter_by(MSSV=mssv).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        data = _get_json_payload()
        
        if 'ho_ten_sv' in data:
            student.Ho_Ten_SV = data['ho_ten_sv']
        if 'lop' in data:
            lop = Lop.query.filter_by(MaLop=data['lop']).first()
            if not lop:
                return jsonify({'error': 'Class not found'}), 404
            student.Lop = data['lop']
        if 'ngay_sinh' in data:
            student.NgaySinh = data['ngay_sinh']
        if 'gioi_tinh' in data:
            student.GioiTinh = data['gioi_tinh']
        
        db.session.commit()
        return jsonify(student_to_dict(student)), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
