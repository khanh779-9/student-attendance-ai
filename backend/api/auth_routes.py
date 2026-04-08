from flask import Blueprint, request, jsonify
from models import GiangVien
from auth import generate_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data or not data.get('msgv') or not data.get('password'):
            return jsonify({'error': 'Missing msgv or password'}), 400
        
        msgv = data['msgv']
        password = data['password']

        lecturer = GiangVien.query.filter_by(id=msgv).first()
        
        if not lecturer or lecturer.Password != password:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not lecturer.IsActive:
            return jsonify({'error': 'Account is inactive'}), 403

        token = generate_token(msgv)
        
        return jsonify({
            'accessToken': token,
            'teacherName': lecturer.HoTen,
            'teacherId': lecturer.MSGV
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
