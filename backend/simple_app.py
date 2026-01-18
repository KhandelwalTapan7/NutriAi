from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        'message': 'NutriAI API Running!',
        'endpoints': ['/api/analyze', '/api/health', '/api/community']
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    return jsonify({
        'success': True,
        'calories': 450,
        'protein': 25,
        'carbs': 60,
        'risk': 'Low',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/community', methods=['GET'])
def community():
    return jsonify({
        'users': 1500,
        'avg_bmi': 25.8,
        'obesity_rate': 28.5
    })

if __name__ == '__main__':
    print("✅ NutriAI Backend Started!")
    print("🌐 http://localhost:5000")
    app.run(debug=True, port=5000)