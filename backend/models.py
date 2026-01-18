from datetime import datetime
from .database import db

class ResearchData(db.Model):
    __tablename__ = 'research_data'
    id = db.Column(db.Integer, primary_key=True)
    data_type = db.Column(db.String(100))  # nutrition, health_metric, etc.
    category = db.Column(db.String(100))
    value = db.Column(db.Float)
    sample_size = db.Column(db.Integer)
    region = db.Column(db.String(100))
    date_recorded = db.Column(db.Date, default=datetime.utcnow)
    confidence_interval = db.Column(db.String(50))
    notes = db.Column(db.Text)

class EthicalLog(db.Model):
    __tablename__ = 'ethical_logs'
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(200))
    user_id = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    data_type = db.Column(db.String(100))
    consent_obtained = db.Column(db.Boolean, default=True)
    anonymized = db.Column(db.Boolean, default=True)

class ResearchParticipant(db.Model):
    __tablename__ = 'research_participants'
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.String(100), unique=True)  # Anonymous ID
    age_group = db.Column(db.String(50))
    gender = db.Column(db.String(20))
    region = db.Column(db.String(100))
    join_date = db.Column(db.Date, default=datetime.utcnow)
    consent_date = db.Column(db.Date)
    active = db.Column(db.Boolean, default=True)
    data_contribution_days = db.Column(db.Integer, default=0)