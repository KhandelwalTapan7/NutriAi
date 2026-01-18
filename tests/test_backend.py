import unittest
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app
from database import db, User, NutritionLog, HealthMetric
import json
from datetime import datetime

class TestBackendAPI(unittest.TestCase):
    """Test cases for backend API"""
    
    def setUp(self):
        """Set up test client and database"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
    
    def tearDown(self):
        """Clean up after tests"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertIn('endpoints', data)
    
    def test_analyze_nutrition(self):
        """Test nutrition analysis endpoint"""
        test_data = {
            'food_items': [
                {'name': 'apple', 'quantity': 1},
                {'name': 'chicken breast', 'quantity': 1}
            ],
            'user_id': 'test_user',
            'age': 30,
            'weight': 75,
            'height': 175
        }
        
        response = self.client.post('/api/analyze', 
                                   data=json.dumps(test_data),
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('success', data)
        self.assertIn('analysis', data)
        self.assertIn('nutrition_analysis', data['analysis'])
    
    def test_health_risk_calculation(self):
        """Test health risk calculation endpoint"""
        test_data = {
            'age': 45,
            'weight': 90,
            'height': 180,
            'avg_calories': 3000,
            'activity_level': 'sedentary'
        }
        
        response = self.client.post('/api/health-risk',
                                   data=json.dumps(test_data),
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('user_profile', data)
        self.assertIn('bmi', data)
        self.assertIn('health_risk', data)
    
    def test_community_health_endpoint(self):
        """Test community health endpoint"""
        response = self.client.get('/api/community-health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('community_analysis', data)
        self.assertIn('regional_data', data)
    
    def test_log_meal_endpoint(self):
        """Test meal logging endpoint"""
        test_data = {
            'user_id': 'test_user',
            'meal_type': 'lunch',
            'food_items': [
                {'name': 'salad', 'quantity': 1},
                {'name': 'grilled chicken', 'quantity': 1}
            ]
        }
        
        response = self.client.post('/api/log-meal',
                                   data=json.dumps(test_data),
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('analysis', data)
    
    def test_user_data_endpoint(self):
        """Test user data endpoint"""
        response = self.client.get('/api/user-data/user1')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('user_profile', data)
        self.assertIn('history', data)
    
    def test_recommendations_endpoint(self):
        """Test recommendations endpoint"""
        test_data = {
            'age': 30,
            'weight': 70,
            'height': 170,
            'activity_level': 'moderate',
            'goals': ['weight_loss', 'improve_health']
        }
        
        response = self.client.post('/api/recommendations',
                                   data=json.dumps(test_data),
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('personalized_recommendations', data)
        self.assertIn('meal_plan_suggestions', data)
    
    def test_food_search_endpoint(self):
        """Test food search endpoint"""
        response = self.client.get('/api/food-search?q=apple')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('results', data)
        self.assertIn('count', data)
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_invalid_endpoint(self):
        """Test invalid endpoint returns 404"""
        response = self.client.get('/api/nonexistent')
        self.assertEqual(response.status_code, 404)


class TestDatabaseModels(unittest.TestCase):
    """Test cases for database models"""
    
    def setUp(self):
        """Set up test database"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with self.app.app_context():
            db.create_all()
    
    def tearDown(self):
        """Clean up after tests"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_create_user(self):
        """Test creating a user"""
        with self.app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                password_hash='hashed_password',
                age=30,
                weight=70.5,
                height=175.0,
                gender='male'
            )
            db.session.add(user)
            db.session.commit()
            
            retrieved_user = User.query.filter_by(username='testuser').first()
            self.assertIsNotNone(retrieved_user)
            self.assertEqual(retrieved_user.email, 'test@example.com')
            self.assertEqual(retrieved_user.age, 30)
    
    def test_create_nutrition_log(self):
        """Test creating a nutrition log"""
        with self.app.app_context():
            # First create a user
            user = User(
                username='testuser',
                email='test@example.com',
                password_hash='hashed_password'
            )
            db.session.add(user)
            db.session.commit()
            
            # Create nutrition log
            log = NutritionLog(
                user_id=user.id,
                meal_type='lunch',
                food_item='chicken salad',
                calories=450.0,
                protein=35.0,
                carbs=25.0,
                fats=20.0
            )
            db.session.add(log)
            db.session.commit()
            
            retrieved_log = NutritionLog.query.filter_by(user_id=user.id).first()
            self.assertIsNotNone(retrieved_log)
            self.assertEqual(retrieved_log.meal_type, 'lunch')
            self.assertEqual(retrieved_log.calories, 450.0)
    
    def test_create_health_metric(self):
        """Test creating a health metric"""
        with self.app.app_context():
            # Create a user
            user = User(
                username='testuser',
                email='test@example.com',
                password_hash='hashed_password'
            )
            db.session.add(user)
            db.session.commit()
            
            # Create health metric
            metric = HealthMetric(
                user_id=user.id,
                metric_type='blood_pressure',
                value=120.0,
                unit='mmHg',
                notes='Normal reading'
            )
            db.session.add(metric)
            db.session.commit()
            
            retrieved_metric = HealthMetric.query.filter_by(user_id=user.id).first()
            self.assertIsNotNone(retrieved_metric)
            self.assertEqual(retrieved_metric.metric_type, 'blood_pressure')
            self.assertEqual(retrieved_metric.value, 120.0)


class TestAIEngine(unittest.TestCase):
    """Test cases for AI engine"""
    
    def setUp(self):
        """Set up AI engine"""
        from ai_engine import NutritionAI
        self.ai_engine = NutritionAI()
    
    def test_calculate_bmi(self):
        """Test BMI calculation"""
        bmi = self.ai_engine.calculate_bmi(75, 175)
        self.assertIn('value', bmi)
        self.assertIn('category', bmi)
        self.assertAlmostEqual(bmi['value'], 24.5, places=1)
    
    def test_analyze_meal(self):
        """Test meal analysis"""
        food_items = [
            {'name': 'apple', 'quantity': 1},
            {'name': 'chicken breast', 'quantity': 1}
        ]
        user_data = {'age': 30, 'weight': 75, 'height': 175}
        
        analysis = self.ai_engine.analyze_meal(food_items, user_data)
        
        self.assertIn('nutrition_analysis', analysis)
        self.assertIn('health_risk', analysis)
        self.assertIn('recommendations', analysis)
        self.assertIn('calories', analysis['nutrition_analysis'])
    
    def test_calculate_daily_targets(self):
        """Test daily target calculation"""
        user_data = {'weight': 70, 'activity_level': 'moderate'}
        targets = self.ai_engine.calculate_daily_targets(user_data)
        
        self.assertIn('calories', targets)
        self.assertIn('protein', targets)
        self.assertIn('carbs', targets)
        self.assertIn('fats', targets)
    
    def test_community_health_analysis(self):
        """Test community health analysis"""
        user_data_list = [
            {'weight': 75, 'height': 175, 'avg_calories': 2200, 'age': 30},
            {'weight': 65, 'height': 165, 'avg_calories': 1800, 'age': 25}
        ]
        
        analysis = self.ai_engine.analyze_community_health(user_data_list)
        
        self.assertIn('community_stats', analysis)
        self.assertIn('avg_bmi', analysis['community_stats'])
        self.assertIn('recommendations', analysis)


if __name__ == '__main__':
    print("Running backend tests...")
    unittest.main(verbosity=2)