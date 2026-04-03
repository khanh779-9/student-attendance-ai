from flask import Blueprint, request, jsonify
from models import BuoiHoc, Lop, GiangVienLop, db
from auth import require_auth
from datetime import datetime

sessions_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')
VALID_STATUS = {'PLANNED', 'OPEN', 'CLOSED', 'CANCELLED'}


def _get_json_payload():
    return request.get_json(silent=True) or {}


def _parse_iso_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (ValueError, TypeError, AttributeError):
        return None

def session_to_dict(session):
    """Convert BuoiHoc model to dictionary"""
    return {
        'BuoiHocID': session.BuoiHocID,
        'MaLop': session.MaLop,
        'MSGV': session.MSGV,
        'TieuDe': session.TieuDe,
        'ScheduledStart': session.ScheduledStart.isoformat() if session.ScheduledStart else None,
        'ScheduledEnd': session.ScheduledEnd.isoformat() if session.ScheduledEnd else None,
        'ActualStart': session.ActualStart.isoformat() if session.ActualStart else None,
        'ActualEnd': session.ActualEnd.isoformat() if session.ActualEnd else None,
        'Status': session.Status,
        'CreatedAt': session.CreatedAt.isoformat() if session.CreatedAt else None
    }

@sessions_bp.route('', methods=['GET'])
@require_auth
def get_sessions():
    """Get all sessions (optional filter by ma_lop)"""
    try:
        ma_lop_filter = request.args.get('ma_lop')
        
        query = BuoiHoc.query
        if ma_lop_filter:
            query = query.filter_by(MaLop=ma_lop_filter)
        
        sessions = query.all()
        return jsonify([session_to_dict(s) for s in sessions]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('', methods=['POST'])
@require_auth
def create_session():
    """Create new session"""
    try:
        data = _get_json_payload()
        
        required_fields = ['ma_lop']
        if not all(field in data for field in required_fields):
            return jsonify({'error': f'Missing required fields: {required_fields}'}), 400

        lop = Lop.query.filter_by(MaLop=data['ma_lop']).first()
        if not lop:
            return jsonify({'error': 'Class not found'}), 404
        
        permission = GiangVienLop.query.filter_by(
            MSGV=request.msgv,
            MaLop=data['ma_lop']
        ).first()
        if not permission:
            return jsonify({'error': 'Permission denied'}), 403

        scheduled_start = _parse_iso_datetime(data.get('scheduled_start'))
        scheduled_end = _parse_iso_datetime(data.get('scheduled_end'))
        
        new_session = BuoiHoc(
            MaLop=data['ma_lop'],
            MSGV=request.msgv,
            TieuDe=data.get('tieu_de'),
            ScheduledStart=scheduled_start,
            ScheduledEnd=scheduled_end,
            Status='PLANNED'
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            'buoi_hoc_id': new_session.BuoiHocID,
            **session_to_dict(new_session)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('/<int:buoi_hoc_id>', methods=['PUT'])
@require_auth
def update_session(buoi_hoc_id):
    """Update session status"""
    try:
        session = BuoiHoc.query.filter_by(BuoiHocID=buoi_hoc_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.MSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        data = _get_json_payload()
        
        if 'status' in data:
            if data['status'] not in VALID_STATUS:
                return jsonify({'error': f"Trạng thái không hợp lệ. Phải là một trong {sorted(VALID_STATUS)}"}), 400
            session.Status = data['status']

            if data['status'] == 'OPEN' and not session.ActualStart:
                session.ActualStart = datetime.utcnow()
            elif data['status'] == 'CLOSED' and not session.ActualEnd:
                session.ActualEnd = datetime.utcnow()
        
        db.session.commit()
        return jsonify(session_to_dict(session)), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('/<int:buoi_hoc_id>/start', methods=['POST'])
@require_auth
def start_session(buoi_hoc_id):
    """Start/Open a session for attendance checking"""
    try:
        session = BuoiHoc.query.filter_by(BuoiHocID=buoi_hoc_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.MSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        if session.Status == 'OPEN':
            return jsonify({'message': 'Buổi học đã được mở', **session_to_dict(session)}), 200

        if session.Status not in ['PLANNED', 'CLOSED']:
            return jsonify({'error': f'Không thể bắt đầu buổi học với trạng thái {session.Status}'}), 400

        session.Status = 'OPEN'
        session.ActualStart = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Buổi học đã được mở',
            **session_to_dict(session)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('/<int:buoi_hoc_id>/end', methods=['POST'])
@require_auth
def end_session(buoi_hoc_id):
    """End/Close a session"""
    try:
        session = BuoiHoc.query.filter_by(BuoiHocID=buoi_hoc_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.MSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        if session.Status != 'OPEN':
            return jsonify({'error': f'Chỉ có thể đóng buổi học OPEN, trạng thái hiện tại: {session.Status}'}), 400

        session.Status = 'CLOSED'
        session.ActualEnd = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Buổi học đã được đóng',
            **session_to_dict(session)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
