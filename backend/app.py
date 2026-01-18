from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import hashlib
import uuid
from typing import Dict, List, Optional
import re

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'

# In-memory databases with better structure
users_db: Dict[str, Dict] = {}
meals_db: Dict[str, List] = {}
sessions_db: Dict[str, Dict] = {}

# Nutrition database for more accurate analysis
NUTRITION_DB = {
    'apple': {'calories': 95, 'protein': 0.5, 'carbs': 25, 'fats': 0.3, 'fiber': 4.4},
    'banana': {'calories': 105, 'protein': 1.3, 'carbs': 27, 'fats': 0.4, 'fiber': 3.1},
    'chicken breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fats': 3.6, 'fiber': 0},
    'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fats': 0.3, 'fiber': 0.4},
    'pasta': {'calories': 131, 'protein': 5, 'carbs': 25, 'fats': 1.1, 'fiber': 1.2},
    'salad': {'calories': 15, 'protein': 1, 'carbs': 3, 'fats': 0.1, 'fiber': 1.5},
    'salmon': {'calories': 206, 'protein': 22, 'carbs': 0, 'fats': 13, 'fiber': 0},
    'eggs': {'calories': 72, 'protein': 6.3, 'carbs': 0.4, 'fats': 4.8, 'fiber': 0},
    'bread': {'calories': 79, 'protein': 3.1, 'carbs': 15, 'fats': 0.9, 'fiber': 0.9},
    'milk': {'calories': 42, 'protein': 3.4, 'carbs': 5, 'fats': 1, 'fiber': 0},
    'yogurt': {'calories': 59, 'protein': 3.5, 'carbs': 4.7, 'fats': 3.3, 'fiber': 0},
    'broccoli': {'calories': 34, 'protein': 2.8, 'carbs': 7, 'fats': 0.4, 'fiber': 2.6},
    'carrot': {'calories': 41, 'protein': 0.9, 'carbs': 10, 'fats': 0.2, 'fiber': 2.8},
    'potato': {'calories': 77, 'protein': 2, 'carbs': 17, 'fats': 0.1, 'fiber': 2.2},
    'cheese': {'calories': 113, 'protein': 7, 'carbs': 0.4, 'fats': 9, 'fiber': 0},
    'beef': {'calories': 250, 'protein': 26, 'carbs': 0, 'fats': 17, 'fiber': 0},
    'fish': {'calories': 206, 'protein': 22, 'carbs': 0, 'fats': 13, 'fiber': 0},
    'tofu': {'calories': 76, 'protein': 8, 'carbs': 1.9, 'fats': 4.8, 'fiber': 0.3},
    'beans': {'calories': 132, 'protein': 8.7, 'carbs': 25, 'fats': 0.5, 'fiber': 8.7},
    'nuts': {'calories': 607, 'protein': 20, 'carbs': 21, 'fats': 54, 'fiber': 7},
}

# Helper functions
def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 8:
        return False
    return True

def calculate_daily_targets(weight: float, height: float, age: int, gender: str, activity_level: str, goal: str) -> Dict:
    """Calculate personalized daily nutritional targets"""
    # Calculate BMR using Mifflin-St Jeor Equation
    if gender.lower() == 'male':
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    
    # Activity multipliers
    activity_multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
    }
    
    activity_mult = activity_multipliers.get(activity_level.lower(), 1.55)
    maintenance_calories = bmr * activity_mult
    
    # Adjust for goals
    if goal == 'weight_loss':
        target_calories = maintenance_calories * 0.85  # 15% deficit
    elif goal == 'muscle_gain':
        target_calories = maintenance_calories * 1.15  # 15% surplus
    else:  # maintain
        target_calories = maintenance_calories
    
    # Macronutrient distribution (40% carbs, 30% protein, 30% fat for balanced)
    protein_grams = (target_calories * 0.3) / 4
    carb_grams = (target_calories * 0.4) / 4
    fat_grams = (target_calories * 0.3) / 9
    
    return {
        'calories': round(target_calories),
        'protein': round(protein_grams),
        'carbs': round(carb_grams),
        'fats': round(fat_grams),
        'fiber': 30  # Recommended daily fiber
    }

def authenticate_token(token: str) -> Optional[Dict]:
    """Validate authentication token"""
    if token in sessions_db:
        session = sessions_db[token]
        if datetime.fromisoformat(session['expires']) > datetime.now():
            return users_db.get(session['user_id'])
    return None

def require_auth(f):
    """Decorator for authentication"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = token[7:]  # Remove 'Bearer ' prefix
        user = authenticate_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.user = user
        request.user_id = user['id']
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Routes
@app.route('/api/analyze', methods=['POST'])
@require_auth
def analyze_meal():
    """Analyze a meal and return nutritional information"""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'food_items' not in data:
            return jsonify({'error': 'Food items are required'}), 400
        
        food_items = data.get('food_items', [])
        if not isinstance(food_items, list) or len(food_items) == 0:
            return jsonify({'error': 'At least one food item is required'}), 400
        
        # Extract user data for personalized analysis
        user = request.user
        user_profile = user.get('profile', {})
        
        # Calculate nutrition
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        total_fiber = 0
        processed_items = []
        
        for item in food_items:
            food_name = item.get('name', '').lower().strip()
            quantity = item.get('quantity', 1)
            unit = item.get('unit', 'serving')
            
            # Find closest match in nutrition database
            nutrition = None
            for key in NUTRITION_DB:
                if key in food_name or food_name in key:
                    nutrition = NUTRITION_DB[key].copy()
                    break
            
            # Default values if not found
            if not nutrition:
                nutrition = {'calories': 150, 'protein': 5, 'carbs': 20, 'fats': 5, 'fiber': 2}
            
            # Adjust for quantity
            adjusted_nutrition = {k: v * quantity for k, v in nutrition.items()}
            
            total_calories += adjusted_nutrition['calories']
            total_protein += adjusted_nutrition['protein']
            total_carbs += adjusted_nutrition['carbs']
            total_fats += adjusted_nutrition['fats']
            total_fiber += adjusted_nutrition['fiber']
            
            processed_items.append({
                'name': food_name.title(),
                'quantity': quantity,
                'unit': unit,
                'nutrition': adjusted_nutrition
            })
        
        # Calculate health assessment
        bmi = calculate_bmi(user_profile.get('weight', 70), user_profile.get('height', 170))
        risk_score = calculate_risk_score(total_calories, total_fats, total_carbs, bmi)
        meal_score = calculate_meal_score(total_calories, total_protein, total_carbs, total_fats, total_fiber)
        
        # Generate personalized recommendations
        daily_targets = user.get('daily_targets', calculate_daily_targets(
            user_profile.get('weight', 70),
            user_profile.get('height', 170),
            user_profile.get('age', 30),
            user_profile.get('gender', 'male'),
            user_profile.get('activity_level', 'moderately_active'),
            user_profile.get('goal', 'maintain_weight')
        ))
        
        recommendations = generate_recommendations(
            total_calories, total_protein, total_carbs, total_fats, total_fiber,
            daily_targets, len(food_items), user_profile.get('goal', 'maintain_weight')
        )
        
        # Prepare response
        response = {
            'success': True,
            'analysis': {
                'nutrition': {
                    'calories': round(total_calories),
                    'protein': round(total_protein, 1),
                    'carbs': round(total_carbs, 1),
                    'fats': round(total_fats, 1),
                    'fiber': round(total_fiber, 1),
                    'sodium': round(total_fats * 0.1, 1),  # Estimate
                    'sugar': round(total_carbs * 0.2, 1)   # Estimate
                },
                'health_assessment': {
                    'risk_level': risk_score['level'],
                    'risk_score': risk_score['score'],
                    'risk_factors': risk_score['factors'],
                    'meal_score': meal_score,
                    'meal_grade': get_meal_grade(meal_score)
                },
                'bmi_context': {
                    'value': round(bmi, 1),
                    'category': get_bmi_category(bmi),
                    'message': get_bmi_message(bmi, user_profile.get('goal'))
                },
                'comparison': {
                    'daily_targets': daily_targets,
                    'percentage_of_daily': {
                        'calories': round((total_calories / daily_targets['calories']) * 100),
                        'protein': round((total_protein / daily_targets['protein']) * 100),
                        'carbs': round((total_carbs / daily_targets['carbs']) * 100),
                        'fats': round((total_fats / daily_targets['fats']) * 100)
                    }
                },
                'recommendations': recommendations,
                'food_details': processed_items,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Save meal to history
        meal_record = {
            'id': str(uuid.uuid4()),
            'foods': processed_items,
            'analysis': response['analysis'],
            'timestamp': datetime.now().isoformat(),
            'location': data.get('location'),
            'meal_type': data.get('meal_type', 'other'),
            'notes': data.get('notes', '')
        }
        
        if request.user_id not in meals_db:
            meals_db[request.user_id] = []
        
        meals_db[request.user_id].append(meal_record)
        
        # Update user statistics
        update_user_stats(request.user_id)
        
        return jsonify(response)
        
    except Exception as e:
        app.logger.error(f"Error in analyze_meal: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

def calculate_risk_score(calories: float, fats: float, carbs: float, bmi: float) -> Dict:
    """Calculate health risk score"""
    score = 0
    factors = []
    
    if calories > 1000:
        score += 2
        factors.append('High calorie intake')
    elif calories > 800:
        score += 1
        factors.append('Moderate-high calorie intake')
    
    if fats > 40:
        score += 2
        factors.append('High fat content')
    elif fats > 25:
        score += 1
        factors.append('Moderate-high fat content')
    
    if carbs > 100:
        score += 1
        factors.append('High carbohydrate content')
    
    if bmi > 30:
        score += 2
        factors.append('Obesity BMI range')
    elif bmi > 25:
        score += 1
        factors.append('Overweight BMI range')
    
    if score == 0:
        level = 'Low Risk'
    elif score <= 2:
        level = 'Moderate Risk'
    elif score <= 4:
        level = 'High Risk'
    else:
        level = 'Very High Risk'
    
    return {'score': score, 'level': level, 'factors': factors}

def calculate_meal_score(calories: float, protein: float, carbs: float, fats: float, fiber: float) -> int:
    """Calculate overall meal score (0-100)"""
    score = 100
    
    # Deduct for excessive calories
    if calories > 800:
        score -= min(30, (calories - 800) / 10)
    
    # Bonus for good protein
    if protein > 20:
        score += min(10, (protein - 20) / 2)
    
    # Bonus for fiber
    if fiber > 5:
        score += min(10, fiber)
    
    # Deduct for high fats without protein
    if fats > 30 and protein < 15:
        score -= 15
    
    # Ensure score is within bounds
    return max(0, min(100, round(score)))

def generate_recommendations(calories: float, protein: float, carbs: float, fats: float, 
                           fiber: float, targets: Dict, food_count: int, goal: str) -> List[str]:
    """Generate personalized recommendations"""
    recommendations = []
    
    # Protein recommendations
    protein_percentage = (protein / targets['protein']) * 100
    if protein_percentage < 50:
        recommendations.append("Consider adding lean protein like chicken, fish, or tofu")
    elif protein_percentage > 150:
        recommendations.append("High protein intake - ensure adequate hydration")
    
    # Calorie recommendations based on goal
    calorie_percentage = (calories / targets['calories']) * 100
    if goal == 'weight_loss' and calorie_percentage > 40:
        recommendations.append("For weight loss, consider smaller portions or lower-calorie alternatives")
    elif goal == 'muscle_gain' and protein_percentage < 30:
        recommendations.append("For muscle gain, increase protein intake with this meal")
    
    # Fiber recommendations
    if fiber < 5:
        recommendations.append("Add more fiber-rich foods like vegetables, fruits, or whole grains")
    
    # Variety recommendations
    if food_count < 3:
        recommendations.append("Include more food variety for balanced nutrition")
    
    # Positive reinforcement
    if calorie_percentage <= 35 and protein_percentage >= 25 and fiber >= 5:
        recommendations.append("Great meal composition! Well balanced and nutritious.")
    
    return recommendations

def get_meal_grade(score: int) -> str:
    """Convert score to letter grade"""
    if score >= 90:
        return 'A'
    elif score >= 80:
        return 'B'
    elif score >= 70:
        return 'C'
    elif score >= 60:
        return 'D'
    else:
        return 'F'

def get_bmi_message(bmi: float, goal: str) -> str:
    """Get personalized BMI message"""
    category = get_bmi_category(bmi)
    if goal == 'weight_loss' and category in ['Overweight', 'Obese']:
        return "Focus on calorie deficit and regular exercise for healthy weight loss"
    elif goal == 'muscle_gain' and category == 'Normal':
        return "Great BMI for muscle gain - focus on protein intake and strength training"
    elif category == 'Normal':
        return "Healthy BMI range - maintain with balanced nutrition and activity"
    else:
        return f"Your BMI indicates {category.lower()}. Consider consulting a nutritionist."

def update_user_stats(user_id: str):
    """Update user statistics based on meal history"""
    if user_id not in meals_db or not meals_db[user_id]:
        return
    
    user_meals = meals_db[user_id]
    recent_meals = [m for m in user_meals 
                   if datetime.fromisoformat(m['timestamp']) > datetime.now() - timedelta(days=7)]
    
    if not recent_meals:
        return
    
    # Calculate averages
    total_calories = sum(m['analysis']['nutrition']['calories'] for m in recent_meals)
    total_meals = len(recent_meals)
    
    if user_id in users_db:
        users_db[user_id]['stats'] = {
            'avg_daily_calories': round(total_calories / min(total_meals, 7)),
            'meals_logged_7d': total_meals,
            'avg_meal_score': round(sum(m['analysis']['health_assessment']['meal_score'] 
                                      for m in recent_meals) / total_meals),
            'last_updated': datetime.now().isoformat()
        }

@app.route('/api/user/profile', methods=['GET'])
@require_auth
def get_user_profile():
    """Get complete user profile"""
    user = request.user
    user_id = request.user_id
    
    # Calculate statistics
    stats = user.get('stats', {})
    meals_count = len(meals_db.get(user_id, []))
    
    # Get recent meals
    recent_meals = []
    if user_id in meals_db:
        recent_meals = sorted(meals_db[user_id], 
                            key=lambda x: x['timestamp'], 
                            reverse=True)[:5]
    
    profile_data = {
        'success': True,
        'profile': {
            'personal_info': {
                'name': user.get('name'),
                'email': user.get('email'),
                'age': user.get('profile', {}).get('age'),
                'gender': user.get('profile', {}).get('gender'),
                'joined': user.get('joined')
            },
            'health_metrics': {
                'weight': user.get('profile', {}).get('weight'),
                'height': user.get('profile', {}).get('height'),
                'bmi': round(calculate_bmi(
                    user.get('profile', {}).get('weight', 70),
                    user.get('profile', {}).get('height', 170)
                ), 1),
                'goal': user.get('profile', {}).get('goal'),
                'activity_level': user.get('profile', {}).get('activity_level')
            },
            'nutrition_targets': user.get('daily_targets', {}),
            'statistics': {
                'total_meals_logged': meals_count,
                'avg_meal_score': stats.get('avg_meal_score', 0),
                'avg_daily_calories': stats.get('avg_daily_calories', 0),
                'current_streak': calculate_streak(user_id),
                'completion_rate': min(100, meals_count)  # Simplified
            },
            'preferences': user.get('preferences', {
                'dietary_restrictions': [],
                'allergies': [],
                'favorite_foods': [],
                'disliked_foods': []
            })
        },
        'recent_meals': recent_meals[:3]  # Only return basic info
    }
    
    return jsonify(profile_data)

def calculate_streak(user_id: str) -> int:
    """Calculate consecutive days with meals logged"""
    if user_id not in meals_db:
        return 0
    
    dates = set()
    for meal in meals_db[user_id]:
        meal_date = datetime.fromisoformat(meal['timestamp']).date()
        dates.add(meal_date)
    
    dates = sorted(dates, reverse=True)
    streak = 0
    current_date = datetime.now().date()
    
    for i in range(len(dates)):
        expected_date = current_date - timedelta(days=i)
        if expected_date in dates:
            streak += 1
        else:
            break
    
    return streak

@app.route('/api/user/profile', methods=['PUT'])
@require_auth
def update_user_profile():
    """Update user profile"""
    try:
        data = request.json
        user = request.user
        user_id = request.user_id
        
        # Update basic info
        if 'name' in data:
            user['name'] = data['name']
        
        # Update profile info
        if 'profile' in data:
            user['profile'] = {**user.get('profile', {}), **data['profile']}
            
            # Recalculate daily targets if relevant fields changed
            profile = user['profile']
            if any(field in data['profile'] for field in ['weight', 'height', 'age', 'gender', 'activity_level', 'goal']):
                user['daily_targets'] = calculate_daily_targets(
                    profile.get('weight', 70),
                    profile.get('height', 170),
                    profile.get('age', 30),
                    profile.get('gender', 'male'),
                    profile.get('activity_level', 'moderately_active'),
                    profile.get('goal', 'maintain_weight')
                )
        
        # Update preferences
        if 'preferences' in data:
            user['preferences'] = {**user.get('preferences', {}), **data['preferences']}
        
        users_db[user_id] = user
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': user
        })
        
    except Exception as e:
        app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@app.route('/api/meals', methods=['GET'])
@require_auth
def get_meals():
    """Get user's meal history with filtering"""
    try:
        user_id = request.user_id
        if user_id not in meals_db:
            return jsonify({'success': True, 'meals': [], 'total': 0})
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        meal_type = request.args.get('meal_type')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Filter meals
        meals = meals_db[user_id]
        
        if start_date:
            start = datetime.fromisoformat(start_date)
            meals = [m for m in meals if datetime.fromisoformat(m['timestamp']) >= start]
        
        if end_date:
            end = datetime.fromisoformat(end_date)
            meals = [m for m in meals if datetime.fromisoformat(m['timestamp']) <= end]
        
        if meal_type:
            meals = [m for m in meals if m.get('meal_type') == meal_type]
        
        # Sort by timestamp (newest first)
        meals = sorted(meals, key=lambda x: x['timestamp'], reverse=True)
        
        # Paginate
        total = len(meals)
        paginated_meals = meals[offset:offset + limit]
        
        return jsonify({
            'success': True,
            'meals': paginated_meals,
            'pagination': {
                'total': total,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error getting meals: {str(e)}")
        return jsonify({'error': 'Failed to retrieve meals'}), 500

@app.route('/api/meals/<meal_id>', methods=['GET'])
@require_auth
def get_meal(meal_id):
    """Get a specific meal"""
    user_id = request.user_id
    
    if user_id not in meals_db:
        return jsonify({'error': 'Meal not found'}), 404
    
    for meal in meals_db[user_id]:
        if meal['id'] == meal_id:
            return jsonify({'success': True, 'meal': meal})
    
    return jsonify({'error': 'Meal not found'}), 404

@app.route('/api/meals/<meal_id>', methods=['DELETE'])
@require_auth
def delete_meal(meal_id):
    """Delete a meal"""
    user_id = request.user_id
    
    if user_id not in meals_db:
        return jsonify({'error': 'Meal not found'}), 404
    
    for i, meal in enumerate(meals_db[user_id]):
        if meal['id'] == meal_id:
            deleted_meal = meals_db[user_id].pop(i)
            update_user_stats(user_id)
            return jsonify({
                'success': True,
                'message': 'Meal deleted successfully',
                'deleted_meal': deleted_meal
            })
    
    return jsonify({'error': 'Meal not found'}), 404

@app.route('/api/dashboard/summary', methods=['GET'])
@require_auth
def get_dashboard_summary():
    """Get dashboard summary with insights"""
    user_id = request.user_id
    user = request.user
    profile = user.get('profile', {})
    
    # Calculate BMI
    bmi = calculate_bmi(profile.get('weight', 70), profile.get('height', 170))
    
    # Get recent meals (last 7 days)
    recent_meals = []
    if user_id in meals_db:
        week_ago = datetime.now() - timedelta(days=7)
        recent_meals = [m for m in meals_db[user_id] 
                       if datetime.fromisoformat(m['timestamp']) > week_ago]
    
    # Calculate insights
    if recent_meals:
        total_calories = sum(m['analysis']['nutrition']['calories'] for m in recent_meals)
        avg_calories = total_calories / len(recent_meals)
        avg_score = sum(m['analysis']['health_assessment']['meal_score'] 
                       for m in recent_meals) / len(recent_meals)
        
        # Identify common patterns
        common_foods = {}
        for meal in recent_meals:
            for food in meal.get('foods', []):
                name = food.get('name')
                common_foods[name] = common_foods.get(name, 0) + 1
        
        top_foods = sorted(common_foods.items(), key=lambda x: x[1], reverse=True)[:3]
    else:
        avg_calories = 0
        avg_score = 0
        top_foods = []
    
    # Generate insights
    insights = generate_insights(profile, bmi, recent_meals)
    
    return jsonify({
        'success': True,
        'summary': {
            'health_overview': {
                'bmi': round(bmi, 1),
                'bmi_category': get_bmi_category(bmi),
                'goal': profile.get('goal', 'maintain_weight'),
                'progress': calculate_progress(user_id, profile.get('goal'))
            },
            'nutrition_tracking': {
                'meals_logged_today': len([m for m in recent_meals 
                                          if datetime.fromisoformat(m['timestamp']).date() == datetime.now().date()]),
                'avg_meal_score': round(avg_score, 1),
                'avg_calories_per_meal': round(avg_calories),
                'current_streak': calculate_streak(user_id)
            },
            'insights': insights,
            'top_foods': [{'name': food, 'count': count} for food, count in top_foods],
            'recommended_actions': get_recommended_actions(profile, insights)
        }
    })

def generate_insights(profile: Dict, bmi: float, recent_meals: List) -> List[str]:
    """Generate personalized insights"""
    insights = []
    goal = profile.get('goal', 'maintain_weight')
    
    # BMI insights
    bmi_category = get_bmi_category(bmi)
    if goal == 'weight_loss' and bmi_category in ['Overweight', 'Obese']:
        insights.append(f"Your BMI suggests weight loss could benefit your health. Target 0.5-1kg per week.")
    elif goal == 'muscle_gain' and bmi_category == 'Normal':
        insights.append("Good baseline for muscle gain. Focus on strength training and protein intake.")
    
    # Meal frequency insights
    if recent_meals:
        avg_daily_meals = len(recent_meals) / 7
        if avg_daily_meals < 2:
            insights.append("Consider eating more frequent, smaller meals for better metabolism.")
        elif avg_daily_meals > 5:
            insights.append("You're eating frequently. Ensure meals are appropriately portioned.")
    
    # Progress insights
    if len(recent_meals) >= 3:
        latest_scores = [m['analysis']['health_assessment']['meal_score'] 
                        for m in recent_meals[:3]]
        if all(score >= 80 for score in latest_scores):
            insights.append("Excellent recent meal choices! Keep up the great work.")
        elif any(score < 60 for score in latest_scores):
            insights.append("Some recent meals could be improved. Focus on balanced nutrition.")
    
    return insights[:3]  # Limit to 3 insights

def calculate_progress(user_id: str, goal: str) -> Dict:
    """Calculate progress towards goal"""
    # Simplified progress calculation
    if user_id not in meals_db:
        return {'percentage': 0, 'description': 'Start logging meals to track progress'}
    
    recent_meals = [m for m in meals_db[user_id] 
                   if datetime.fromisoformat(m['timestamp']) > datetime.now() - timedelta(days=30)]
    
    if not recent_meals:
        return {'percentage': 0, 'description': 'No recent meals logged'}
    
    # Calculate consistency
    days_with_meals = len(set(datetime.fromisoformat(m['timestamp']).date() 
                             for m in recent_meals))
    consistency = min(100, (days_with_meals / 30) * 100)
    
    if goal == 'weight_loss':
        return {
            'percentage': round(consistency * 0.7),  # Weighted for consistency
            'description': f'Logged meals on {days_with_meals} of last 30 days'
        }
    else:
        return {
            'percentage': round(consistency),
            'description': f'Consistent logging on {days_with_meals} days'
        }

def get_recommended_actions(profile: Dict, insights: List[str]) -> List[Dict]:
    """Get recommended actions based on profile and insights"""
    actions = []
    goal = profile.get('goal', 'maintain_weight')
    
    if goal == 'weight_loss':
        actions.append({
            'title': 'Log Breakfast',
            'description': 'Start your day with tracked nutrition',
            'icon': '🍳',
            'priority': 'high'
        })
        actions.append({
            'title': 'Add Vegetables',
            'description': 'Include veggies in your next meal',
            'icon': '🥦',
            'priority': 'medium'
        })
    
    actions.append({
        'title': 'Review Recent Meals',
        'description': 'Check your meal history for patterns',
        'icon': '📊',
        'priority': 'low'
    })
    
    return actions

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login with token generation"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Find user
        user_id = hashlib.sha256(email.encode()).hexdigest()[:32]
        
        if user_id not in users_db:
            return jsonify({'error': 'User not found. Please register first.'}), 404
        
        user = users_db[user_id]
        
        # Verify password (in production, use proper password hashing with salt)
        stored_hash = user.get('password_hash')
        if not stored_hash or stored_hash != hash_password(password):
            return jsonify({'error': 'Invalid password'}), 401
        
        # Generate session token
        token = str(uuid.uuid4())
        expires = datetime.now() + timedelta(days=7)
        
        sessions_db[token] = {
            'user_id': user_id,
            'created': datetime.now().isoformat(),
            'expires': expires.isoformat(),
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        # Remove password hash from response
        user_response = user.copy()
        user_response.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'token': token,
            'expires': expires.isoformat(),
            'user': {
                'id': user_id,
                'name': user.get('name'),
                'email': user.get('email'),
                'profile': user.get('profile', {})
            }
        })
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        
        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if not validate_password(password):
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        if not name:
            name = email.split('@')[0].title()
        
        # Check if user exists
        user_id = hashlib.sha256(email.encode()).hexdigest()[:32]
        
        if user_id in users_db:
            return jsonify({'error': 'User already exists'}), 409
        
        # Get profile data
        profile = {
            'age': data.get('age', 25),
            'weight': data.get('weight', 70),
            'height': data.get('height', 170),
            'gender': data.get('gender', 'male'),
            'goal': data.get('goal', 'maintain_weight'),
            'activity_level': data.get('activity_level', 'moderately_active')
        }
        
        # Calculate daily targets
        daily_targets = calculate_daily_targets(
            profile['weight'],
            profile['height'],
            profile['age'],
            profile['gender'],
            profile['activity_level'],
            profile['goal']
        )
        
        # Create user
        users_db[user_id] = {
            'id': user_id,
            'email': email,
            'name': name,
            'password_hash': hash_password(password),
            'profile': profile,
            'daily_targets': daily_targets,
            'preferences': {
                'dietary_restrictions': data.get('dietary_restrictions', []),
                'allergies': data.get('allergies', []),
                'favorite_foods': data.get('favorite_foods', []),
                'disliked_foods': data.get('disliked_foods', [])
            },
            'joined': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat()
        }
        
        # Generate session token
        token = str(uuid.uuid4())
        expires = datetime.now() + timedelta(days=7)
        
        sessions_db[token] = {
            'user_id': user_id,
            'created': datetime.now().isoformat(),
            'expires': expires.isoformat(),
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'token': token,
            'expires': expires.isoformat(),
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'profile': profile
            }
        })
        
    except Exception as e:
        app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """User logout"""
    token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
    
    if token in sessions_db:
        del sessions_db[token]
    
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/community/insights', methods=['GET'])
def get_community_insights():
    """Get community health insights"""
    # Calculate statistics from all users
    total_users = len(users_db)
    total_meals = sum(len(meals) for meals in meals_db.values())
    
    # Calculate average BMI
    bmis = []
    for user in users_db.values():
        profile = user.get('profile', {})
        if 'weight' in profile and 'height' in profile:
            bmi = calculate_bmi(profile['weight'], profile['height'])
            bmis.append(bmi)
    
    avg_bmi = round(sum(bmis) / len(bmis), 1) if bmis else 25.8
    
    # Calculate goal distribution
    goals = {}
    for user in users_db.values():
        goal = user.get('profile', {}).get('goal', 'maintain_weight')
        goals[goal] = goals.get(goal, 0) + 1
    
    # Generate community data
    community_data = {
        'success': True,
        'insights': {
            'overview': {
                'total_users': total_users,
                'total_meals_logged': total_meals,
                'avg_meals_per_user': round(total_meals / max(1, total_users), 1),
                'active_users_7d': calculate_active_users()
            },
            'health_stats': {
                'avg_bmi': avg_bmi,
                'bmi_distribution': calculate_bmi_distribution(bmis),
                'goal_distribution': goals,
                'most_common_foods': get_community_foods()
            },
            'trends': {
                'avg_meal_score': calculate_community_avg_score(),
                'popular_goals': sorted(goals.items(), key=lambda x: x[1], reverse=True)[:3],
                'improvement_rate': '72%'  # Mock data
            }
        },
        'leaderboards': {
            'consistency': get_consistency_leaders(),
            'meal_quality': get_quality_leaders()
        }
    }
    
    return jsonify(community_data)

def calculate_active_users() -> int:
    """Calculate number of users active in last 7 days"""
    week_ago = datetime.now() - timedelta(days=7)
    active_users = set()
    
    for user_id, meals in meals_db.items():
        for meal in meals:
            if datetime.fromisoformat(meal['timestamp']) > week_ago:
                active_users.add(user_id)
                break
    
    return len(active_users)

def calculate_bmi_distribution(bmis: List[float]) -> Dict[str, int]:
    """Calculate BMI category distribution"""
    distribution = {'Underweight': 0, 'Normal': 0, 'Overweight': 0, 'Obese': 0}
    
    for bmi in bmis:
        category = get_bmi_category(bmi)
        distribution[category] = distribution.get(category, 0) + 1
    
    # Convert to percentages
    total = sum(distribution.values())
    if total > 0:
        for category in distribution:
            distribution[category] = round((distribution[category] / total) * 100)
    
    return distribution

def get_community_foods() -> List[Dict]:
    """Get most common foods across community"""
    food_counts = {}
    
    for meals in meals_db.values():
        for meal in meals:
            for food in meal.get('foods', []):
                name = food.get('name')
                if name:
                    food_counts[name] = food_counts.get(name, 0) + 1
    
    top_foods = sorted(food_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    return [{'food': food, 'count': count} for food, count in top_foods]

def calculate_community_avg_score() -> float:
    """Calculate average meal score across community"""
    scores = []
    
    for meals in meals_db.values():
        for meal in meals:
            score = meal['analysis']['health_assessment']['meal_score']
            scores.append(score)
    
    return round(sum(scores) / len(scores), 1) if scores else 0

def get_consistency_leaders() -> List[Dict]:
    """Get users with highest consistency streaks"""
    leaders = []
    
    for user_id, user in users_db.items():
        streak = calculate_streak(user_id)
        if streak > 0:
            leaders.append({
                'name': user.get('name', 'Anonymous'),
                'streak': streak,
                'meals_logged': len(meals_db.get(user_id, []))
            })
    
    return sorted(leaders, key=lambda x: x['streak'], reverse=True)[:5]

def get_quality_leaders() -> List[Dict]:
    """Get users with highest average meal scores"""
    leaders = []
    
    for user_id, user in users_db.items():
        user_meals = meals_db.get(user_id, [])
        if user_meals:
            avg_score = sum(m['analysis']['health_assessment']['meal_score'] 
                          for m in user_meals) / len(user_meals)
            leaders.append({
                'name': user.get('name', 'Anonymous'),
                'avg_score': round(avg_score, 1),
                'meals_logged': len(user_meals)
            })
    
    return sorted(leaders, key=lambda x: x['avg_score'], reverse=True)[:5]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'stats': {
            'users': len(users_db),
            'meals': sum(len(meals) for meals in meals_db.values()),
            'sessions': len(sessions_db)
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Keep your original functions for compatibility
def calculate_bmi(weight, height):
    """Calculate BMI"""
    height_m = height / 100
    return weight / (height_m ** 2)

def get_bmi_category(bmi):
    """Get BMI category"""
    if bmi < 18.5:
        return 'Underweight'
    elif bmi < 25:
        return 'Normal'
    elif bmi < 30:
        return 'Overweight'
    else:
        return 'Obese'

if __name__ == '__main__':
    print("🚀 Starting Enhanced Nutrition API Server...")
    print("=" * 50)
    print("API Documentation:")
    print("  POST   /api/auth/login     - User login")
    print("  POST   /api/auth/register  - User registration")
    print("  POST   /api/auth/logout    - User logout")
    print("  POST   /api/analyze        - Analyze a meal (Auth required)")
    print("  GET    /api/user/profile   - Get user profile (Auth required)")
    print("  PUT    /api/user/profile   - Update profile (Auth required)")
    print("  GET    /api/meals          - Get meal history (Auth required)")
    print("  GET    /api/dashboard/summary - Dashboard data (Auth required)")
    print("  GET    /api/community/insights - Community insights")
    print("  GET    /api/health         - Health check")
    print("=" * 50)
    print("Server running at: http://localhost:5000")
    print("Debug mode: ON")
    app.run(debug=True, port=5000)