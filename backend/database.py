from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    age = db.Column(db.Integer)
    weight = db.Column(db.Float)  # in kg
    height = db.Column(db.Float)  # in cm
    gender = db.Column(db.String(10))
    health_conditions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    nutrition_logs = db.relationship('NutritionLog', backref='user', lazy=True)
    health_metrics = db.relationship('HealthMetric', backref='user', lazy=True)

class NutritionLog(db.Model):
    __tablename__ = 'nutrition_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    meal_type = db.Column(db.String(50))  # breakfast, lunch, dinner, snack
    food_item = db.Column(db.String(200), nullable=False)
    calories = db.Column(db.Float)
    protein = db.Column(db.Float)  # in grams
    carbs = db.Column(db.Float)    # in grams
    fats = db.Column(db.Float)     # in grams
    fiber = db.Column(db.Float)    # in grams
    sugar = db.Column(db.Float)    # in grams
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    image_url = db.Column(db.String(500))  # for food image analysis

class HealthMetric(db.Model):
    __tablename__ = 'health_metrics'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    metric_type = db.Column(db.String(50))  # weight, blood_pressure, glucose, etc.
    value = db.Column(db.Float)
    unit = db.Column(db.String(20))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)

class CommunityHealth(db.Model):
    __tablename__ = 'community_health'
    id = db.Column(db.Integer, primary_key=True)
    region = db.Column(db.String(100))
    health_indicator = db.Column(db.String(100))  # obesity_rate, diabetes_rate, etc.
    value = db.Column(db.Float)
    date_recorded = db.Column(db.Date)
    population_sample = db.Column(db.Integer)