"""
Test cases for ML models
"""
import unittest
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml-models'))

import numpy as np
import pandas as pd
from data_processor import NutritionDataProcessor
from nutrition_model import NutritionAIModel

class TestMLModels(unittest.TestCase):
    """Test cases for machine learning models"""
    
    def setUp(self):
        """Set up test data"""
        self.processor = NutritionDataProcessor()
        self.model = NutritionAIModel(model_type='random_forest', task='regression')
        
        # Generate test data
        np.random.seed(42)
        self.test_data = pd.DataFrame({
            'age': np.random.randint(20, 60, 100),
            'weight_kg': np.random.uniform(50, 100, 100),
            'height_cm': np.random.uniform(150, 190, 100),
            'daily_calories': np.random.uniform(1500, 3000, 100),
            'daily_protein_g': np.random.uniform(40, 120, 100),
            'bmi': np.random.uniform(18, 35, 100),
            'activity_level': np.random.choice(['Sedentary', 'Moderate', 'Active'], 100),
            'health_score': np.random.uniform(50, 100, 100)
        })
    
    def test_data_processor_initialization(self):
        """Test data processor initialization"""
        self.assertIsNotNone(self.processor)
        self.assertIsNone(self.processor.processed_data)
    
    def test_data_loading(self):
        """Test data loading functionality"""
        df = self.processor.load_and_clean_data()
        self.assertIsInstance(df, pd.DataFrame)
        self.assertGreater(len(df), 0)
    
    def test_feature_preprocessing(self):
        """Test feature preprocessing"""
        X, y, features = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        self.assertIsNotNone(X)
        self.assertIsNotNone(y)
        self.assertIsInstance(features, list)
        self.assertEqual(len(features), X.shape[1])
    
    def test_model_initialization(self):
        """Test model initialization"""
        self.assertEqual(self.model.model_type, 'random_forest')
        self.assertEqual(self.model.task, 'regression')
        self.assertIsNone(self.model.model)
    
    def test_model_building(self):
        """Test model building"""
        model = self.model.build_model()
        self.assertIsNotNone(model)
        self.assertIsNotNone(self.model.model)
    
    def test_model_training(self):
        """Test model training"""
        # Preprocess data
        X, y, _ = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        # Build and train model
        self.model.build_model()
        trained_model = self.model.train(X[:80], y[:80], X[80:], y[80:])
        
        self.assertIsNotNone(trained_model)
        self.assertIsNotNone(self.model.history['training_time'])
    
    def test_model_prediction(self):
        """Test model prediction"""
        # Preprocess data
        X, y, _ = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        # Build and train model
        self.model.build_model()
        self.model.train(X[:80], y[:80])
        
        # Make predictions
        predictions = self.model.predict(X[80:])
        
        self.assertIsNotNone(predictions)
        self.assertEqual(len(predictions), 20)
        self.assertIsInstance(predictions, np.ndarray)
    
    def test_model_evaluation(self):
        """Test model evaluation"""
        # Preprocess data
        X, y, _ = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        # Build and train model
        self.model.build_model()
        self.model.train(X[:80], y[:80])
        
        # Make predictions
        predictions = self.model.predict(X[80:])
        
        # Evaluate
        metrics = self.model.evaluate(y[80:], predictions)
        
        self.assertIsInstance(metrics, dict)
        self.assertIn('score', metrics)
        self.assertIn('r2', metrics)
    
    def test_health_risk_prediction(self):
        """Test health risk prediction"""
        # Preprocess data
        X, y, feature_names = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        # Build and train model
        self.model.build_model()
        self.model.train(X, y)
        
        # Test prediction with sample data
        sample_user = {
            'age': 35,
            'weight_kg': 85,
            'height_cm': 175,
            'daily_calories': 2800,
            'daily_protein_g': 95,
            'bmi': 27.8,
            'activity_level': 'Moderate'
        }
        
        # Process user data
        user_processed = self.processor.process_new_data(sample_user)
        
        # Make prediction
        prediction = self.model.predict_health_risk(user_processed, feature_names)
        
        self.assertIsInstance(prediction, dict)
        self.assertIn('health_score', prediction)
        self.assertIn('risk_level', prediction)
    
    def test_model_saving_loading(self):
        """Test model saving and loading"""
        # Preprocess data
        X, y, _ = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        # Build and train model
        self.model.build_model()
        self.model.train(X, y)
        
        # Save model
        self.model.save_model('test_model.pkl')
        
        # Create new model and load
        new_model = NutritionAIModel()
        new_model.load_model('test_model.pkl')
        
        self.assertIsNotNone(new_model.model)
        self.assertEqual(new_model.model_type, 'random_forest')
        
        # Clean up
        import os
        if os.path.exists('test_model.pkl'):
            os.remove('test_model.pkl')
    
    def test_cross_validation(self):
        """Test cross-validation"""
        # Preprocess data
        X, y, _ = self.processor.preprocess_features(self.test_data, target_column='health_score')
        
        # Build model
        self.model.build_model()
        
        # Cross-validate
        cv_scores = self.model.cross_validate(X, y, cv=3)
        
        self.assertIsInstance(cv_scores, np.ndarray)
        self.assertEqual(len(cv_scores), 3)

if __name__ == '__main__':
    print("Running ML model tests...")
    unittest.main(verbosity=2)