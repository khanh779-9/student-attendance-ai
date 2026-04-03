from flask import Blueprint, request, jsonify
from models import Lop, GiangVienLop, db
from auth import require_auth

classes_bp = Blueprint('classes', __name__, url_prefix='/api/classes')


def _get_json_payload():
    return request.get_json(silent=True) or {}

def class_to_dict(lop):
    """Convert Lop model to dictionary"""
    return {
        'MaLop': lop.MaLop,
        'TenLop': lop.TenLop,
        'NienKhoa': lop.NienKhoa,
        'HocKy': lop.HocKy,
        'CreatedByMSGV': lop.CreatedByMSGV,
        'CreatedAt': lop.CreatedAt.isoformat() if lop.CreatedAt else None,
        'UpdatedAt': lop.UpdatedAt.isoformat() if lop.UpdatedAt else None
    }

@classes_bp.route('', methods=['GET'])
@require_auth
def get_classes():
    """Get all classes (optional filter by ma_lop)"""
    try:
        ma_lop_filter = request.args.get('ma_lop')
        
        query = Lop.query
        if ma_lop_filter:
            query = query.filter(Lop.MaLop.ilike(f'%{ma_lop_filter}%'))
        
        classes = query.all()
        return jsonify([class_to_dict(c) for c in classes]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@classes_bp.route('', methods=['POST'])
@require_auth
def create_class():
    """Create new class"""
    try:
        data = _get_json_payload()
        
        required_fields = ['ma_lop', 'ten_lop']
        if not all(field in data for field in required_fields):
            return jsonify({'error': f'Missing required fields: {required_fields}'}), 400
        
        existing = Lop.query.filter_by(MaLop=data['ma_lop']).first()
        if existing:
            return jsonify({'error': 'Class already exists'}), 409
        
        new_class = Lop(
            MaLop=data['ma_lop'],
            TenLop=data['ten_lop'],
            NienKhoa=data.get('nien_khoa'),
            HocKy=data.get('hoc_ky'),
            CreatedByMSGV=request.msgv
        )
        
        db.session.add(new_class)

        giangvien_lop = GiangVienLop(
            MSGV=request.msgv,
            MaLop=data['ma_lop'],
            VaiTro='OWNER'
        )
        db.session.add(giangvien_lop)
        db.session.commit()
        
        return jsonify(class_to_dict(new_class)), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@classes_bp.route('/<ma_lop>', methods=['PUT'])
@require_auth
def update_class(ma_lop):
    """Update class"""
    try:
        lop = Lop.query.filter_by(MaLop=ma_lop).first()
        if not lop:
            return jsonify({'error': 'Class not found'}), 404

        permission = GiangVienLop.query.filter_by(
            MSGV=request.msgv,
            MaLop=ma_lop
        ).first()
        if not permission:
            return jsonify({'error': 'Permission denied'}), 403

        data = _get_json_payload()
        
        if 'ten_lop' in data:
            lop.TenLop = data['ten_lop']
        if 'nien_khoa' in data:
            lop.NienKhoa = data['nien_khoa']
        if 'hoc_ky' in data:
            lop.HocKy = data['hoc_ky']
        
        db.session.commit()
        return jsonify(class_to_dict(lop)), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
