from flask import Blueprint, request, jsonify
from models import BuoiHoc, Lop, db
from auth import require_auth
from datetime import datetime

sessions_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')
VALID_STATUS = {'PENDING', 'OPEN', 'CLOSED'}


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
    """Convert session model to API dictionary"""
    return {
        'id': session.BuoiHocID,
        'classId': session.MaLop,
        'teacherId': session.MSGV,
        'scheduledStart': session.ScheduledStart.isoformat() if session.ScheduledStart else None,
        'scheduledEnd': session.ScheduledEnd.isoformat() if session.ScheduledEnd else None,
        'actualStart': session.ActualStart.isoformat() if session.ActualStart else None,
        'actualEnd': session.ActualEnd.isoformat() if session.ActualEnd else None,
        'status': session.Status,
        'createdAt': session.session_date.isoformat() if session.session_date else None
    }

@sessions_bp.route('', methods=['GET'])
@require_auth
def get_sessions():
    """Get all sessions (optional filter by class_id)"""
    try:
        class_id_filter = request.args.get('class_id') or request.args.get('ma_lop')
        
        query = BuoiHoc.query
        if class_id_filter:
            query = query.filter_by(class_id=class_id_filter)
        
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
        class_id = data.get('classId') or data.get('ma_lop')
        
        if not class_id:
            return jsonify({'error': 'Missing required field: classId'}), 400

        lop = Lop.query.filter_by(id=class_id).first()
        if not lop:
            return jsonify({'error': 'Class not found'}), 404
        
        if lop.CreatedByMSGV and lop.CreatedByMSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        scheduled_start = _parse_iso_datetime(data.get('scheduledStart') or data.get('scheduled_start'))
        scheduled_end = _parse_iso_datetime(data.get('scheduledEnd') or data.get('scheduled_end'))
        session_date = scheduled_start.date() if scheduled_start else None
        
        new_session = BuoiHoc(
            class_id=class_id,
            session_date=session_date,
            status='PENDING',
            start_time=scheduled_start,
            end_time=scheduled_end
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify(session_to_dict(new_session)), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('/<int:session_id>', methods=['PUT'])
@require_auth
def update_session(session_id):
    """Update session status"""
    try:
        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.MSGV and session.MSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        data = _get_json_payload()
        
        status_value = data.get('status')
        if status_value is not None:
            if status_value not in VALID_STATUS:
                return jsonify({'error': f"Trạng thái không hợp lệ. Phải là một trong {sorted(VALID_STATUS)}"}), 400
            if status_value == 'PENDING':
                session.status = 'PENDING'
                session.start_time = None
                session.end_time = None
                session.session_date = None
            elif status_value == 'OPEN':
                session.status = 'OPEN'
                if not session.start_time:
                    session.start_time = datetime.utcnow()
                    session.session_date = session.start_time.date()
                session.end_time = None
            elif status_value == 'CLOSED':
                session.status = 'CLOSED'
                if not session.start_time:
                    session.start_time = datetime.utcnow()
                    session.session_date = session.start_time.date()
                if not session.end_time:
                    session.end_time = datetime.utcnow()
        
        db.session.commit()
        return jsonify(session_to_dict(session)), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('/<int:session_id>/start', methods=['POST'])
@require_auth
def start_session(session_id):
    """Start/Open a session for attendance checking"""
    try:
        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.MSGV and session.MSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        if session.Status == 'OPEN':
            return jsonify({'message': 'Buổi học đã được mở', **session_to_dict(session)}), 200

        if session.Status not in ['PENDING', 'CLOSED']:
            return jsonify({'error': f'Không thể bắt đầu buổi học với trạng thái {session.Status}'}), 400

        session.status = 'OPEN'
        session.start_time = datetime.utcnow()
        session.end_time = None
        session.session_date = session.start_time.date()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Buổi học đã được mở',
            **session_to_dict(session)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sessions_bp.route('/<int:session_id>/end', methods=['POST'])
@require_auth
def end_session(session_id):
    """End/Close a session"""
    try:
        session = BuoiHoc.query.filter_by(id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.MSGV and session.MSGV != request.msgv:
            return jsonify({'error': 'Permission denied'}), 403

        if session.Status != 'OPEN':
            return jsonify({'error': f'Chỉ có thể đóng buổi học OPEN, trạng thái hiện tại: {session.Status}'}), 400

        if not session.start_time:
            session.start_time = datetime.utcnow()
            session.session_date = session.start_time.date()
        session.status = 'CLOSED'
        session.end_time = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Buổi học đã được đóng',
            **session_to_dict(session)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
