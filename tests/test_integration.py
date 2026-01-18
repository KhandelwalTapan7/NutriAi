"""
Integration tests for the complete system
"""
import unittest
import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.app import create_app
from backend.database import db
from ml_models.data_processor import NutritionDataProcessor
from ml_models.nutrition_model import NutritionAIModel

class TestIntegration(unittest.TestCase):
    """Integration tests for complete system"""
    
    def setUp(self):
        """Set up test environment"""
        # Create Flask app
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        # Initialize database
        with self.app.app_context():
            db.create_all()
        
        # Initialize ML components
        self.processor = NutritionDataProcessor()
        self.model = NutritionAIModel()
    
    def tearDown(self):
        """Clean up after tests"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_end_to_end_nutrition_analysis(self):
        """Test complete nutrition analysis pipeline"""
        # Step 1: API call to analyze nutrition
        test_meal = {
            'food_items': [
                {'name': 'apple', 'quantity': 2},
                {'name': 'chicken breast', 'quantity': 1}
            ],
            'user_id': 'test_user',
            'age': 30,
            'weight': 75,
            'height': 175
        }
        
        response = self.client.post('/api/analyze',
                                   data=json.dumps(test_meal),
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Verify analysis structure
        self.assertIn('analysis', data)
        analysis = data['analysis']
        self.assertIn('nutrition_analysis', analysis)
        self.assertIn('health_risk', analysis)
        self.assertIn('recommendations', analysis)
    
    def test_data_processing_pipeline(self):
        """Test complete data processing pipeline"""
        # Generate test data
        df = self.processor.load_and_clean_data()
        
        # Preprocess features
        X, y, features = self.processor.preprocess_features(df, target_column='health_score')
        
        # Verify preprocessing
        self.assertIsNotNone(X)
        self.assertIsNotNone(y)
        self.assertGreater(len(features), 0)
        
        # Feature selection
        X_selected, selected_features, importance_df = self.processor.feature_selection(X, y, k=10)
        
        self.assertEqual(X_selected.shape[1], min(10, X.shape[1]))
        self.assertEqual(len(selected_features), X_selected.shape[1])
    
    def test_ml_training_pipeline(self):
        """Test complete ML training pipeline"""
        # Generate and process data
        df = self.processor.load_and_clean_data()
        X, y, features = self.processor.preprocess_features(df, target_column='health_score')
        X_selected, selected_features, _ = self.processor.feature_selection(X, y, k=10)
        
        # Train model
        self.model.build_model()
        self.model.train(X_selected[:800], y[:800], X_selected[800:], y[800:])
        
        # Verify training
        self.assertIsNotNone(self.model.model)
        self.assertGreater(self.model.history['training_time'], 0)
        
        # Make predictions
        predictions = self.model.predict(X_selected[800:])
        
        self.assertEqual(len(predictions), len(y[800:]))
        
        # Evaluate
        metrics = self.model.evaluate(y[800:], predictions)
        
        self.assertIn('score', metrics)
        self.assertIsInstance(metrics['score'], float)
    
    def test_community_health_analysis(self):
        """Test community health analysis pipeline"""
        # Get community health data
        response = self.client.get('/api/community-health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        # Verify community analysis structure
        self.assertIn('community_analysis', data)
        self.assertIn('regional_data', data)
        
        community_stats = data['community_analysis']['community_stats']
        self.assertIn('sample_size', community_stats)
        self.assertIn('avg_bmi', community_stats)
        self.assertIn('obesity_rate', community_stats)
    
    def test_user_profile_management(self):
        """Test user profile management"""
        # Get user data
        response = self.client.get('/api/user-data/user1')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        # Verify user data structure
        self.assertIn('user_profile', data)
        self.assertIn('history', data)
        self.assertIn('current_status', data)
        
        user_profile = data['user_profile']
        self.assertIn('username', user_profile)
        self.assertIn('age', user_profile)
    
    def test_personalized_recommendations(self):
        """Test personalized recommendations"""
        test_data = {
            'age': 35,
            'weight': 80,
            'height': 180,
            'activity_level': 'moderate',
            'goals': ['weight_loss', 'improve_health']
        }
        
        response = self.client.post('/api/recommendations',
                                   data=json.dumps(test_data),
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        # Verify recommendations structure
        self.assertIn('personalized_recommendations', data)
        self.assertIn('meal_plan_suggestions', data)
        
        recommendations = data['personalized_recommendations']
        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)
    
    def test_system_health(self):
        """Test system health check"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('services', data)
        
        services = data['services']
        self.assertEqual(services['database'], 'connected')
        self.assertEqual(services['ai_engine'], 'active')
        self.assertEqual(services['api'], 'running')

if __name__ == '__main__':
    print("Running integration tests...")
    unittest.main(verbosity=2)