from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
import datetime
import os
from dotenv import load_dotenv

load_dotenv()  # טעינת משתני הסביבה מקובץ .env

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///voting_system.db')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_secret_key_here')
db = SQLAlchemy(app)

# מודלים
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Survey(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_locked = db.Column(db.Boolean, default=False)
    options = db.relationship('SurveyOption', backref='survey', lazy=True, cascade="all, delete-orphan")

class SurveyOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey('survey.id'), nullable=False)
    option_text = db.Column(db.String(255), nullable=False)

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    survey_id = db.Column(db.Integer, db.ForeignKey('survey.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('survey_option.id'), nullable=False)
    voted_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'survey_id', name='_user_survey_uc'),)

# פונקציית עזר לאימות טוקן
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# נתיבים
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    hashed_password = generate_password_hash(data['password'])
    new_user = User(username=data['username'], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
                           app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"token": token, "is_admin": user.is_admin}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/surveys', methods=['GET'])
@token_required
def get_surveys(current_user):
    surveys = Survey.query.all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'description': s.description,
        'is_locked': s.is_locked,
        'options': [{'id': o.id, 'text': o.option_text} for o in s.options]
    } for s in surveys]), 200

@app.route('/vote', methods=['POST'])
@token_required
def vote(current_user):
    data = request.json
    survey = Survey.query.get_or_404(data['survey_id'])
    if survey.is_locked:
        return jsonify({"message": "This survey is locked and no longer accepts votes"}), 400
    existing_vote = Vote.query.filter_by(user_id=current_user.id, survey_id=data['survey_id']).first()
    if existing_vote:
        return jsonify({"message": "You have already voted in this survey"}), 400
    new_vote = Vote(user_id=current_user.id, survey_id=data['survey_id'], option_id=data['option_id'])
    db.session.add(new_vote)
    db.session.commit()
    return jsonify({"message": "Vote recorded successfully"}), 201

@app.route('/survey', methods=['POST'])
@token_required
def create_survey(current_user):
    if not current_user.is_admin:
        return jsonify({"message": "Admin privileges required"}), 403
    data = request.json
    new_survey = Survey(title=data['title'], description=data['description'])
    for option in data['options']:
        new_survey.options.append(SurveyOption(option_text=option))
    db.session.add(new_survey)
    db.session.commit()
    return jsonify({"message": "Survey created successfully"}), 201

@app.route('/results', methods=['GET'])
@token_required
def get_results(current_user):
    if not current_user.is_admin:
        return jsonify({"message": "Admin privileges required"}), 403
    surveys = Survey.query.all()
    results = []
    for survey in surveys:
        survey_results = {
            'id': survey.id,
            'title': survey.title,
            'description': survey.description,
            'is_locked': survey.is_locked,
            'total_votes': sum(Vote.query.filter_by(survey_id=survey.id).count() for option in survey.options),
            'options': []
        }
        for option in survey.options:
            vote_count = Vote.query.filter_by(survey_id=survey.id, option_id=option.id).count()
            survey_results['options'].append({
                'id': option.id,
                'text': option.option_text,
                'votes': vote_count
            })
        results.append(survey_results)
    return jsonify(results), 200

@app.route('/export', methods=['GET'])
@token_required
def export_results(current_user):
    if not current_user.is_admin:
        return jsonify({"message": "Admin privileges required"}), 403
    surveys = Survey.query.all()
    export_data = []
    for survey in surveys:
        survey_data = {
            'Survey ID': survey.id,
            'Survey Title': survey.title,
            'Votes': []
        }
        votes = Vote.query.filter_by(survey_id=survey.id).all()
        for vote in votes:
            user = User.query.get(vote.user_id)
            option = SurveyOption.query.get(vote.option_id)
            survey_data['Votes'].append({
                'User': user.username,
                'Option': option.option_text,
                'Voted At': vote.voted_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        export_data.append(survey_data)
    return jsonify(export_data), 200

@app.route('/user-votes', methods=['GET'])
@token_required
def get_user_votes(current_user):
    votes = Vote.query.filter_by(user_id=current_user.id).all()
    user_votes = {vote.survey_id: True for vote in votes}
    return jsonify(user_votes), 200

@app.route('/survey/<int:survey_id>', methods=['PUT'])
@token_required
def update_survey(current_user, survey_id):
    if not current_user.is_admin:
        return jsonify({"message": "Admin privileges required"}), 403
    
    survey = Survey.query.get_or_404(survey_id)
    data = request.json
    
    survey.title = data['title']
    survey.description = data['description']
    
    # עדכון אפשרויות קיימות ויצירת חדשות
    existing_options = {option.id: option for option in survey.options}
    new_options = []
    for option_data in data['options']:
        if 'id' in option_data and option_data['id'] in existing_options:
            option = existing_options[option_data['id']]
            option.option_text = option_data['text']
        else:
            option = SurveyOption(option_text=option_data['text'])
            new_options.append(option)
    
    survey.options = list(existing_options.values()) + new_options
    
    db.session.commit()
    return jsonify({"message": "Survey updated successfully"}), 200

@app.route('/survey/<int:survey_id>', methods=['DELETE'])
@token_required
def delete_survey(current_user, survey_id):
    if not current_user.is_admin:
        return jsonify({"message": "Admin privileges required"}), 403
    
    survey = Survey.query.get_or_404(survey_id)
    db.session.delete(survey)
    db.session.commit()
    return jsonify({"message": "Survey deleted successfully"}), 200

@app.route('/survey/<int:survey_id>/lock', methods=['PUT'])
@token_required
def toggle_survey_lock(current_user, survey_id):
    if not current_user.is_admin:
        return jsonify({"message": "Admin privileges required"}), 403
    
    survey = Survey.query.get_or_404(survey_id)
    data = request.json
    survey.is_locked = data['is_locked']
    db.session.commit()
    return jsonify({"message": "Survey lock status updated successfully"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # יצירת טבלאות בסיס הנתונים אם הן לא קיימות
        
        # בדוק אם יש כבר משתמש אדמין
        admin_user = User.query.filter_by(is_admin=True).first()
        if not admin_user:
            # צור משתמש אדמין חדש
            admin_username = "admin"
            admin_password = "admin123"  # שנה את זה!
            hashed_password = generate_password_hash(admin_password)
            new_admin = User(username=admin_username, password_hash=hashed_password, is_admin=True)
            db.session.add(new_admin)
            db.session.commit()
            print(f"Admin user created: {admin_username}")
    
    app.run(debug=True)