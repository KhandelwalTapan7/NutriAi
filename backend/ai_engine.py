import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import joblib
import json
from datetime import datetime, timedelta

class NutritionAI:
    def __init__(self):
        # Initialize models
        self.nutrient_model = None
        self.health_risk_model = None
        self.recommendation_model = None
        self.scaler = StandardScaler()
        self.load_or_train_models()
        
        # Nutrition database (simplified)
        self.food_database = {
            'apple': {'calories': 95, 'protein': 0.5, 'carbs': 25, 'fats': 0.3, 'fiber': 4.4},
            'banana': {'calories': 105, 'protein': 1.3, 'carbs': 27, 'fats': 0.4, 'fiber': 3.1},
            'chicken breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fats': 3.6, 'fiber': 0},
            'rice': {'calories': 206, 'protein': 4.3, 'carbs': 45, 'fats': 0.4, 'fiber': 0.6},
            'broccoli': {'calories': 55, 'protein': 3.7, 'carbs': 11, 'fats': 0.6, 'fiber': 2.6},
            'egg': {'calories': 78, 'protein': 6, 'carbs': 0.6, 'fats': 5, 'fiber': 0},
            'salmon': {'calories': 206, 'protein': 22, 'carbs': 0, 'fats': 13, 'fiber': 0},
        }
    
    def load_or_train_models(self):
        """Load trained models or train new ones"""
        try:
            self.nutrient_model = joblib.load('models/nutrient_model.pkl')
            self.health_risk_model = joblib.load('models/health_risk_model.pkl')
            print("Models loaded successfully")
        except:
            print("Training new models...")
            self.train_models()
    
    def train_models(self):
        """Train AI models with sample data"""
        # Sample training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: age, weight, height, calories, protein, carbs, fats
        X = np.random.rand(n_samples, 7)
        X[:, 0] = np.random.randint(18, 70, n_samples)  # age
        X[:, 1] = np.random.uniform(50, 120, n_samples)  # weight
        X[:, 2] = np.random.uniform(150, 200, n_samples)  # height
        X[:, 3] = np.random.uniform(1000, 3000, n_samples)  # calories
        X[:, 4] = np.random.uniform(30, 150, n_samples)  # protein
        X[:, 5] = np.random.uniform(100, 400, n_samples)  # carbs
        X[:, 6] = np.random.uniform(20, 150, n_samples)  # fats
        
        # Health risk labels (0: low, 1: medium, 2: high)
        y_risk = np.zeros(n_samples)
        y_risk[X[:, 3] > 2500] = 1  # high calorie -> medium risk
        y_risk[X[:, 6] > 100] = 2   # high fat -> high risk
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train models
        self.health_risk_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.health_risk_model.fit(X_scaled, y_risk)
        
        # Save models
        joblib.dump(self.health_risk_model, 'models/health_risk_model.pkl')
    
    def analyze_meal(self, food_items, user_data):
        """Analyze nutritional content of a meal"""
        total_nutrients = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fats': 0,
            'fiber': 0
        }
        
        for item in food_items:
            food_name = item['name'].lower()
            quantity = item.get('quantity', 1)
            
            if food_name in self.food_database:
                nutrients = self.food_database[food_name]
                for nutrient in total_nutrients:
                    total_nutrients[nutrient] += nutrients.get(nutrient, 0) * quantity
        
        # Calculate health risk
        risk_score = self.calculate_health_risk(user_data, total_nutrients)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(total_nutrients, user_data)
        
        return {
            'nutrition_analysis': total_nutrients,
            'health_risk': risk_score,
            'recommendations': recommendations,
            'bmi': self.calculate_bmi(user_data['weight'], user_data['height']),
            'daily_targets': self.calculate_daily_targets(user_data)
        }
    
    def calculate_health_risk(self, user_data, nutrients):
        """Calculate health risk score"""
        features = np.array([[
            user_data.get('age', 30),
            user_data.get('weight', 70),
            user_data.get('height', 170),
            nutrients['calories'],
            nutrients['protein'],
            nutrients['carbs'],
            nutrients['fats']
        ]])
        
        features_scaled = self.scaler.transform(features)
        risk_prediction = self.health_risk_model.predict(features_scaled)[0]
        
        risk_levels = ['Low Risk', 'Medium Risk', 'High Risk']
        return {
            'level': risk_levels[int(risk_prediction)],
            'score': int(risk_prediction),
            'details': self.get_risk_details(int(risk_prediction))
        }
    
    def calculate_bmi(self, weight_kg, height_cm):
        """Calculate BMI"""
        height_m = height_cm / 100
        bmi = weight_kg / (height_m ** 2)
        
        if bmi < 18.5:
            category = "Underweight"
        elif bmi < 25:
            category = "Normal"
        elif bmi < 30:
            category = "Overweight"
        else:
            category = "Obese"
        
        return {'value': round(bmi, 1), 'category': category}
    
    def calculate_daily_targets(self, user_data):
        """Calculate daily nutritional targets"""
        weight = user_data.get('weight', 70)
        activity_level = user_data.get('activity_level', 'moderate')
        
        # Base calorie calculation (simplified)
        if activity_level == 'sedentary':
            calories = weight * 30
        elif activity_level == 'moderate':
            calories = weight * 35
        else:
            calories = weight * 40
        
        targets = {
            'calories': round(calories),
            'protein': round(weight * 1.2),  # 1.2g per kg of body weight
            'carbs': round(calories * 0.5 / 4),  # 50% of calories
            'fats': round(calories * 0.3 / 9),   # 30% of calories
            'fiber': 30  # grams
        }
        
        return targets
    
    def generate_recommendations(self, nutrients, user_data):
        """Generate personalized nutrition recommendations"""
        recommendations = []
        
        # Check protein intake
        target_protein = user_data.get('weight', 70) * 1.2
        if nutrients['protein'] < target_protein * 0.8:
            recommendations.append("Increase protein intake. Consider adding lean meats, legumes, or dairy.")
        
        # Check fiber intake
        if nutrients['fiber'] < 25:
            recommendations.append("Add more fiber-rich foods like vegetables, fruits, and whole grains.")
        
        # Check sugar (simplified)
        if nutrients.get('sugar', 0) > 50:
            recommendations.append("Reduce sugar intake. Limit processed foods and sugary drinks.")
        
        # Check balance
        protein_ratio = nutrients['protein'] * 4 / nutrients['calories'] if nutrients['calories'] > 0 else 0
        if protein_ratio < 0.15:
            recommendations.append("Meal is low in protein. Add a protein source for better balance.")
        
        return recommendations
    
    def get_risk_details(self, risk_level):
        """Get detailed explanation for risk level"""
        details = {
            0: "Your current nutritional intake is balanced. Keep maintaining healthy eating habits.",
            1: "Some nutritional imbalances detected. Consider adjusting portion sizes and food choices.",
            2: "High nutritional risk detected. Consult with a healthcare professional for personalized guidance."
        }
        return details.get(risk_level, "Analysis complete.")
    
    def analyze_community_health(self, user_data_list):
        """Analyze community health trends"""
        if not user_data_list:
            return {"error": "No data available"}
        
        # Extract metrics
        bmis = [self.calculate_bmi(u.get('weight', 70), u.get('height', 170))['value'] 
                for u in user_data_list]
        
        avg_calories = np.mean([u.get('avg_calories', 2000) for u in user_data_list])
        
        # Analyze trends
        obesity_rate = sum(1 for bmi in bmis if bmi >= 30) / len(bmis) * 100
        overweight_rate = sum(1 for bmi in bmis if bmi >= 25) / len(bmis) * 100
        
        # Risk distribution
        risk_scores = [self.calculate_health_risk(u, {'calories': u.get('avg_calories', 2000)})['score'] 
                      for u in user_data_list]
        
        return {
            'community_stats': {
                'sample_size': len(user_data_list),
                'avg_bmi': round(np.mean(bmis), 1),
                'avg_calories': round(avg_calories),
                'obesity_rate': round(obesity_rate, 1),
                'overweight_rate': round(overweight_rate, 1),
                'health_risk_distribution': {
                    'low_risk': round(sum(1 for s in risk_scores if s == 0) / len(risk_scores) * 100, 1),
                    'medium_risk': round(sum(1 for s in risk_scores if s == 1) / len(risk_scores) * 100, 1),
                    'high_risk': round(sum(1 for s in risk_scores if s == 2) / len(risk_scores) * 100, 1)
                }
            },
            'recommendations': self.generate_community_recommendations(obesity_rate, avg_calories)
        }
    
    def generate_community_recommendations(self, obesity_rate, avg_calories):
        """Generate recommendations for community health"""
        recommendations = []
        
        if obesity_rate > 30:
            recommendations.append("High obesity rate detected. Implement community nutrition education programs.")
        
        if avg_calories > 2500:
            recommendations.append("Average calorie intake is high. Promote balanced diet awareness in community.")
        
        if obesity_rate < 15:
            recommendations.append("Good community health indicators observed. Maintain current health initiatives.")
        
        return recommendations

# Create instance
nutrition_ai = NutritionAI()