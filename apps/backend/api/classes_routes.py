from flask import Blueprint, request, jsonify
from models import Lop, db
from auth import require_auth

classes_bp = Blueprint('classes', __name__, url_prefix='/api/classes')


def _get_json_payload():
    return request.get_json(silent=True) or {}

def class_to_dict(lop):
    """Convert class model to API dictionary"""
    return {
        'id': lop.MaLop,
        'name': lop.TenLop,
        'teacherId': lop.CreatedByMSGV,
        'createdAt': lop.created_at.isoformat() if lop.created_at else None
    }

@classes_bp.route('', methods=['GET'])
@require_auth
def get_classes():
    """Get all classes (optional filter by class_id)"""
    try:
        class_id_filter = request.args.get('class_id') or request.args.get('ma_lop')
        
        query = Lop.query
        if class_id_filter:
            query = query.filter(Lop.id.ilike(f'%{class_id_filter}%'))
        
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
        class_id = data.get('id') or data.get('ma_lop')
        class_name = data.get('name') or data.get('ten_lop')
        
        if not class_id or not class_name:
            return jsonify({'error': 'Missing required fields: id, name'}), 400
        
        existing = Lop.query.filter_by(id=class_id).first()
        if existing:
            return jsonify({'error': 'Class already exists'}), 409
        
        new_class = Lop(
            id=class_id,
            name=class_name,
            teacher_id=request.msgv
        )
        
        db.session.add(new_class)
        db.session.commit()
        
        return jsonify(class_to_dict(new_class)), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@classes_bp.route('/<class_id>', methods=['PUT'])
@require_auth
def update_class(class_id):
    """Update class"""
    try:
        lop = Lop.query.filter_by(id=class_id).first()
        if not lop:
            return jsonify({'error': 'Class not found'}), 404

        if lop.CreatedByMSGV and lop.CreatedByMSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        data = _get_json_payload()
        
        class_name = data.get('name') or data.get('ten_lop')
        if class_name is not None:
            lop.name = class_name
        
        db.session.commit()
        return jsonify(class_to_dict(lop)), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
