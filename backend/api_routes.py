from flask import Blueprint, request, jsonify
from datetime import datetime
import json

# Simple AI engine mock (no imports needed)
class NutritionAI:
    def __init__(self):
        self.food_database = {
            'apple': {'calories': 95, 'protein': 0.5, 'carbs': 25, 'fats': 0.3, 'fiber': 4.4},
            'banana': {'calories': 105, 'protein': 1.3, 'carbs': 27, 'fats': 0.4, 'fiber': 3.1},
            'chicken breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fats': 3.6, 'fiber': 0},
            'rice': {'calories': 206, 'protein': 4.3, 'carbs': 45, 'fats': 0.4, 'fiber': 0.6},
            'broccoli': {'calories': 55, 'protein': 3.7, 'carbs': 11, 'fats': 0.6, 'fiber': 2.6},
            'egg': {'calories': 78, 'protein': 6, 'carbs': 0.6, 'fats': 5, 'fiber': 0},
            'salmon': {'calories': 206, 'protein': 22, 'carbs': 0, 'fats': 13, 'fiber': 0},
        }
    
    def calculate_bmi(self, weight_kg, height_cm):
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
        weight = user_data.get('weight', 70)
        activity_level = user_data.get('activity_level', 'moderate')
        
        if activity_level == 'sedentary':
            calories = weight * 30
        elif activity_level == 'moderate':
            calories = weight * 35
        else:
            calories = weight * 40
        
        return {
            'calories': round(calories),
            'protein': round(weight * 1.2),
            'carbs': round(calories * 0.5 / 4),
            'fats': round(calories * 0.3 / 9),
            'fiber': 30
        }
    
    def analyze_meal(self, food_items, user_data):
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
        
        # Calculate health risk (simplified)
        risk_score = 0
        if total_nutrients['calories'] > 2500:
            risk_score = 1
        if total_nutrients['fats'] > 100:
            risk_score = 2
        
        risk_levels = ['Low Risk', 'Medium Risk', 'High Risk']
        risk_level = risk_levels[min(risk_score, 2)]
        
        # Generate recommendations
        recommendations = []
        if total_nutrients['protein'] < 50:
            recommendations.append("Increase protein intake")
        if total_nutrients['fiber'] < 25:
            recommendations.append("Add more fiber-rich foods")
        
        return {
            'nutrition_analysis': total_nutrients,
            'health_risk': {
                'level': risk_level,
                'score': risk_score,
                'details': 'Analysis complete'
            },
            'bmi': self.calculate_bmi(user_data.get('weight', 70), user_data.get('height', 170)),
            'daily_targets': self.calculate_daily_targets(user_data),
            'recommendations': recommendations
        }

# Create AI instance
nutrition_ai = NutritionAI()

api = Blueprint('api', __name__)

# Mock user data
mock_users = {
    'user1': {'id': 1, 'username': 'john_doe', 'age': 30, 'weight': 75, 'height': 175},
    'user2': {'id': 2, 'username': 'jane_smith', 'age': 25, 'weight': 65, 'height': 165}
}

@api.route('/')
def api_index():
    return jsonify({
        'message': 'NutriAI API',
        'version': '1.0',
        'endpoints': {
            '/analyze': 'POST - Analyze nutrition',
            '/health-risk': 'POST - Health risk assessment',
            '/community-health': 'GET - Community health data',
            '/log-meal': 'POST - Log a meal',
            '/user-data/<user_id>': 'GET - User data',
            '/recommendations': 'POST - Get recommendations'
        }
    })

@api.route('/analyze', methods=['POST'])
def analyze_nutrition():
    data = request.json
    
    if not data or 'food_items' not in data:
        return jsonify({'error': 'No food items provided'}), 400
    
    user_id = data.get('user_id', 'user1')
    user_data = mock_users.get(user_id, {
        'age': 30,
        'weight': 70,
        'height': 170,
        'activity_level': 'moderate'
    })
    
    analysis = nutrition_ai.analyze_meal(data['food_items'], user_data)
    
    return jsonify({
        'success': True,
        'analysis': analysis,
        'timestamp': datetime.utcnow().isoformat()
    })

@api.route('/health-risk', methods=['POST'])
def calculate_health_risk():
    data = request.json
    
    user_data = {
        'age': data.get('age', 30),
        'weight': data.get('weight', 70),
        'height': data.get('height', 170),
        'activity_level': data.get('activity_level', 'moderate')
    }
    
    bmi = nutrition_ai.calculate_bmi(user_data['weight'], user_data['height'])
    daily_targets = nutrition_ai.calculate_daily_targets(user_data)
    
    # Simple risk calculation
    bmi_value = bmi['value']
    if bmi_value < 18.5:
        risk = 'Underweight - Consider increasing calorie intake'
    elif bmi_value < 25:
        risk = 'Normal - Maintain healthy lifestyle'
    elif bmi_value < 30:
        risk = 'Overweight - Consider diet and exercise'
    else:
        risk = 'Obese - Consult healthcare professional'
    
    return jsonify({
        'user_profile': user_data,
        'bmi': bmi,
        'health_risk': {'level': bmi['category'], 'details': risk},
        'daily_targets': daily_targets
    })

@api.route('/community-health', methods=['GET'])
def get_community_health():
    # Mock community data
    community_data = {
        'community_stats': {
            'sample_size': 1500,
            'avg_bmi': 25.8,
            'avg_calories': 2150,
            'obesity_rate': 28.5,
            'health_risk_distribution': {
                'low_risk': 60,
                'medium_risk': 30,
                'high_risk': 10
            }
        },
        'regional_data': {
            'North': {'obesity_rate': 32.5, 'avg_bmi': 26.8},
            'South': {'obesity_rate': 28.2, 'avg_bmi': 25.4},
            'East': {'obesity_rate': 25.7, 'avg_bmi': 24.9},
            'West': {'obesity_rate': 30.1, 'avg_bmi': 26.2}
        }
    }
    
    return jsonify(community_data)

@api.route('/log-meal', methods=['POST'])
def log_meal():
    data = request.json
    
    meal_data = {
        'user_id': data.get('user_id', 'user1'),
        'meal_type': data.get('meal_type', 'lunch'),
        'food_items': data.get('food_items', []),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    user_data = mock_users.get(meal_data['user_id'], {
        'age': 30, 'weight': 70, 'height': 170
    })
    
    analysis = nutrition_ai.analyze_meal(meal_data['food_items'], user_data)
    
    return jsonify({
        'success': True,
        'meal_logged': meal_data,
        'analysis': analysis,
        'message': 'Meal logged successfully'
    })

@api.route('/user-data/<user_id>', methods=['GET'])
def get_user_data(user_id):
    user = mock_users.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    history = {
        'last_7_days': {
            'avg_calories': 2150,
            'avg_protein': 85,
            'avg_carbs': 240,
            'meals_logged': 21
        }
    }
    
    return jsonify({
        'user_profile': user,
        'history': history
    })

@api.route('/recommendations', methods=['POST'])
def get_recommendations():
    data = request.json
    
    user_data = {
        'age': data.get('age', 30),
        'weight': data.get('weight', 70),
        'height': data.get('height', 170),
        'activity_level': data.get('activity_level', 'moderate'),
        'goals': data.get('goals', ['maintain_weight'])
    }
    
    recommendations = []
    goals = user_data['goals']
    
    if 'weight_loss' in goals:
        recommendations.extend([
            "Reduce calorie intake by 500 calories per day",
            "Increase protein intake to preserve muscle mass",
            "Include 30 minutes of cardio daily"
        ])
    
    if 'muscle_gain' in goals:
        recommendations.extend([
            "Increase protein intake to 1.6-2.2g per kg of body weight",
            "Consume calorie surplus of 300-500 calories",
            "Focus on strength training 3-4 times per week"
        ])
    
    return jsonify({
        'personalized_recommendations': recommendations,
        'user_profile': user_data
    })