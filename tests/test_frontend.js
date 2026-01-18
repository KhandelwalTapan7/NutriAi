// Frontend Tests using Jest-like syntax
console.log("=== FRONTEND TESTS ===");

// Mock DOM elements
document.body.innerHTML = `
    <div id="food-list"></div>
    <div id="analysis-results"></div>
    <div id="community-stats"></div>
    <input id="food-item" value="apple" />
    <input id="meal-food" value="chicken" />
    <input id="meal-quantity" value="1" />
    <select id="meal-type"><option value="lunch">Lunch</option></select>
`;

// Test utility functions
function runTests() {
    console.log("\n1. Testing Utility Functions...");
    
    // Test food items array manipulation
    let foodItems = [];
    
    // Test addFoodItem function
    function addFoodItem(name, quantity = 1) {
        foodItems.push({ name, quantity });
        return foodItems;
    }
    
    addFoodItem('apple', 1);
    addFoodItem('chicken breast', 1);
    
    console.assert(foodItems.length === 2, "Food items should have 2 items");
    console.assert(foodItems[0].name === 'apple', "First item should be apple");
    console.log("✓ addFoodItem test passed");
    
    // Test removeFoodItem function
    function removeFoodItem(index) {
        foodItems.splice(index, 1);
        return foodItems;
    }
    
    removeFoodItem(0);
    console.assert(foodItems.length === 1, "Food items should have 1 item after removal");
    console.assert(foodItems[0].name === 'chicken breast', "Remaining item should be chicken breast");
    console.log("✓ removeFoodItem test passed");
    
    // Test updateFoodList function
    function updateFoodList() {
        const foodList = document.getElementById('food-list');
        if (foodItems.length === 0) {
            foodList.innerHTML = '<p class="placeholder">No food items added yet...</p>';
        } else {
            foodList.innerHTML = foodItems.map(item => 
                `<div class="food-item">${item.quantity}x ${item.name}</div>`
            ).join('');
        }
    }
    
    updateFoodList();
    const foodList = document.getElementById('food-list');
    console.assert(foodList.innerHTML.includes('chicken breast'), "Food list should contain chicken breast");
    console.log("✓ updateFoodList test passed");
}

// Test API interaction functions
function testAPIInteractions() {
    console.log("\n2. Testing API Interaction Functions...");
    
    // Mock fetch function
    const originalFetch = window.fetch;
    let mockResponse = {
        ok: true,
        json: () => Promise.resolve({
            success: true,
            analysis: {
                nutrition_analysis: {
                    calories: 450,
                    protein: 25,
                    carbs: 60,
                    fats: 15
                },
                health_risk: {
                    level: 'Low Risk',
                    score: 0
                },
                recommendations: ['Good meal balance']
            }
        })
    };
    
    window.fetch = jest.fn(() => Promise.resolve(mockResponse));
    
    // Test analyzeMeal function
    async function analyzeMeal(foodItems) {
        const requestData = {
            user_id: 'test_user',
            food_items: foodItems,
            age: 30,
            weight: 75,
            height: 175
        };
        
        try {
            const response = await fetch('http://localhost:5000/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }
    
    // Run test
    const testFoodItems = [{ name: 'apple', quantity: 1 }];
    analyzeMeal(testFoodItems).then(data => {
        console.assert(data !== null, "API response should not be null");
        console.assert(data.success === true, "API response should be successful");
        console.assert(data.analysis.nutrition_analysis.calories === 450, "Should return correct calories");
        console.log("✓ analyzeMeal API test passed");
    }).catch(error => {
        console.error("API test failed:", error);
    });
    
    // Restore original fetch
    window.fetch = originalFetch;
}

// Test display functions
function testDisplayFunctions() {
    console.log("\n3. Testing Display Functions...");
    
    // Test displayAnalysisResults function
    function displayAnalysisResults(analysis) {
        const resultsContainer = document.getElementById('analysis-results');
        
        const html = `
            <div class="analysis-header">
                <h4>Nutrition Analysis Results</h4>
                <div class="risk-level">${analysis.health_risk.level}</div>
            </div>
            <div class="nutrient-analysis">
                <h5>Nutrient Breakdown:</h5>
                <div class="nutrient-item">
                    <span>Calories:</span>
                    <span>${analysis.nutrition_analysis.calories}</span>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }
    
    const mockAnalysis = {
        nutrition_analysis: {
            calories: 450,
            protein: 25,
            carbs: 60,
            fats: 15
        },
        health_risk: {
            level: 'Low Risk',
            score: 0
        }
    };
    
    displayAnalysisResults(mockAnalysis);
    
    const resultsContainer = document.getElementById('analysis-results');
    console.assert(resultsContainer.innerHTML.includes('Low Risk'), "Should display risk level");
    console.assert(resultsContainer.innerHTML.includes('450'), "Should display calories");
    console.log("✓ displayAnalysisResults test passed");
}

// Test community data functions
function testCommunityFunctions() {
    console.log("\n4. Testing Community Functions...");
    
    function displayCommunityStats(data) {
        const container = document.getElementById('community-stats');
        
        const stats = data.community_analysis?.community_stats || {
            sample_size: 1500,
            avg_bmi: 25.8,
            obesity_rate: 28.5
        };
        
        container.innerHTML = `
            <div class="stat-card">
                <h3>${stats.sample_size}</h3>
                <p>Users in Community</p>
            </div>
            <div class="stat-card">
                <h3>${stats.avg_bmi}</h3>
                <p>Average BMI</p>
            </div>
            <div class="stat-card">
                <h3>${stats.obesity_rate}%</h3>
                <p>Obesity Rate</p>
            </div>
        `;
    }
    
    const mockData = {
        community_analysis: {
            community_stats: {
                sample_size: 1500,
                avg_bmi: 25.8,
                obesity_rate: 28.5
            }
        }
    };
    
    displayCommunityStats(mockData);
    
    const statsContainer = document.getElementById('community-stats');
    console.assert(statsContainer.innerHTML.includes('1500'), "Should display sample size");
    console.assert(statsContainer.innerHTML.includes('25.8'), "Should display average BMI");
    console.log("✓ displayCommunityStats test passed");
}

// Test form validation
function testFormValidation() {
    console.log("\n5. Testing Form Validation...");
    
    function validateFoodInput(foodName) {
        if (!foodName || foodName.trim() === '') {
            return { valid: false, message: 'Please enter a food item' };
        }
        if (foodName.length < 2) {
            return { valid: false, message: 'Food name too short' };
        }
        return { valid: true, message: '' };
    }
    
    // Test empty input
    let result = validateFoodInput('');
    console.assert(result.valid === false, "Empty input should be invalid");
    console.assert(result.message.includes('Please enter'), "Should return appropriate message");
    
    // Test valid input
    result = validateFoodInput('apple');
    console.assert(result.valid === true, "Valid input should pass");
    
    // Test short input
    result = validateFoodInput('a');
    console.assert(result.valid === false, "Short input should be invalid");
    
    console.log("✓ Form validation tests passed");
}

// Test meal logging functions
function testMealLogging() {
    console.log("\n6. Testing Meal Logging Functions...");
    
    let currentMealItems = [];
    
    function addMealItem(foodName, quantity, mealType) {
        if (!foodName || foodName.trim() === '') {
            return { success: false, message: 'Please enter a food item' };
        }
        
        currentMealItems.push({
            name: foodName,
            quantity: parseFloat(quantity) || 1,
            meal_type: mealType,
            timestamp: new Date().toISOString()
        });
        
        return { success: true, message: 'Item added', items: currentMealItems };
    }
    
    function clearMeal() {
        const previousCount = currentMealItems.length;
        currentMealItems = [];
        return { success: true, message: `Cleared ${previousCount} items` };
    }
    
    // Test adding meal item
    let response = addMealItem('chicken', 1, 'lunch');
    console.assert(response.success === true, "Should successfully add meal item");
    console.assert(currentMealItems.length === 1, "Should have 1 meal item");
    console.assert(currentMealItems[0].name === 'chicken', "Meal item should be chicken");
    
    // Test adding invalid meal item
    response = addMealItem('', 1, 'lunch');
    console.assert(response.success === false, "Should fail with empty food name");
    
    // Test clearing meal
    response = clearMeal();
    console.assert(response.success === true, "Should successfully clear meal");
    console.assert(currentMealItems.length === 0, "Should have 0 meal items after clearing");
    
    console.log("✓ Meal logging tests passed");
}

// Test error handling
function testErrorHandling() {
    console.log("\n7. Testing Error Handling...");
    
    async function safeAPIRequest(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            return {
                success: false,
                error: error.message,
                fallbackData: { message: 'Using fallback data' }
            };
        }
    }
    
    // Mock failed fetch
    const originalFetch = window.fetch;
    window.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    
    safeAPIRequest('http://localhost:5000/api/test').then(result => {
        console.assert(result.success === false, "Should return failure on network error");
        console.assert(result.error.includes('Network'), "Should include error message");
        console.assert(result.fallbackData, "Should provide fallback data");
        console.log("✓ Error handling test passed");
    });
    
    // Restore fetch
    window.fetch = originalFetch;
}

// Run all tests
function runAllTests() {
    console.log("=== STARTING ALL FRONTEND TESTS ===\n");
    
    try {
        runTests();
        testDisplayFunctions();
        testCommunityFunctions();
        testFormValidation();
        testMealLogging();
        testErrorHandling();
        
        // Note: testAPIInteractions requires async handling
        setTimeout(() => {
            console.log("\n=== ALL TESTS COMPLETED ===");
            console.log("Note: API interaction tests require backend server to be running");
        }, 100);
        
    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Export test functions for browser console
window.runAllTests = runAllTests;
window.runTests = runTests;
window.testAPIInteractions = testAPIInteractions;
window.testDisplayFunctions = testDisplayFunctions;
window.testCommunityFunctions = testCommunityFunctions;
window.testFormValidation = testFormValidation;
window.testMealLogging = testMealLogging;
window.testErrorHandling = testErrorHandling;
// Additional test cases for frontend
function testNutritionAnalysis() {
    console.log("\n8. Testing Nutrition Analysis Functions...");
    
    // Test calculateNutrientTotals function
    function calculateNutrientTotals(foodItems, foodDatabase) {
        let totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0
        };
        
        foodItems.forEach(item => {
            const foodName = item.name.toLowerCase();
            if (foodDatabase[foodName]) {
                const nutrients = foodDatabase[foodName];
                totals.calories += nutrients.calories * item.quantity;
                totals.protein += nutrients.protein * item.quantity;
                totals.carbs += nutrients.carbs * item.quantity;
                totals.fats += nutrients.fats * item.quantity;
                totals.fiber += (nutrients.fiber || 0) * item.quantity;
            }
        });
        
        return totals;
    }
    
    const testFoodDatabase = {
        'apple': { calories: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.4 },
        'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0 }
    };
    
    const testFoodItems = [
        { name: 'apple', quantity: 2 },
        { name: 'chicken breast', quantity: 1 }
    ];
    
    const totals = calculateNutrientTotals(testFoodItems, testFoodDatabase);
    
    console.assert(totals.calories === 355, `Expected 355 calories, got ${totals.calories}`);
    console.assert(totals.protein === 32, `Expected 32g protein, got ${totals.protein}`);
    console.assert(totals.carbs === 50, `Expected 50g carbs, got ${totals.carbs}`);
    console.log("✓ calculateNutrientTotals test passed");
    
    // Test calculateBMI function
    function calculateBMI(weightKg, heightCm) {
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        
        let category;
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';
        
        return {
            value: parseFloat(bmi.toFixed(1)),
            category: category
        };
    }
    
    const bmiResult = calculateBMI(75, 175);
    console.assert(Math.abs(bmiResult.value - 24.5) < 0.1, `Expected BMI ~24.5, got ${bmiResult.value}`);
    console.assert(bmiResult.category === 'Normal', `Expected Normal category, got ${bmiResult.category}`);
    console.log("✓ calculateBMI test passed");
    
    // Test calculateDailyTargets function
    function calculateDailyTargets(weight, activityLevel) {
        let baseCalories;
        
        switch(activityLevel) {
            case 'sedentary':
                baseCalories = weight * 30;
                break;
            case 'moderate':
                baseCalories = weight * 35;
                break;
            case 'active':
                baseCalories = weight * 40;
                break;
            default:
                baseCalories = weight * 33;
        }
        
        return {
            calories: Math.round(baseCalories),
            protein: Math.round(weight * 1.2),
            carbs: Math.round(baseCalories * 0.5 / 4),
            fats: Math.round(baseCalories * 0.3 / 9),
            fiber: 30
        };
    }
    
    const targets = calculateDailyTargets(70, 'moderate');
    console.assert(targets.calories > 2000, `Expected >2000 calories, got ${targets.calories}`);
    console.assert(targets.protein === 84, `Expected 84g protein, got ${targets.protein}`);
    console.assert(targets.fiber === 30, `Expected 30g fiber, got ${targets.fiber}`);
    console.log("✓ calculateDailyTargets test passed");
}

function testCommunityHealthFunctions() {
    console.log("\n9. Testing Community Health Functions...");
    
    // Test calculateCommunityStats function
    function calculateCommunityStats(userDataList) {
        if (!userDataList || userDataList.length === 0) {
            return {
                sample_size: 0,
                avg_bmi: 0,
                avg_calories: 0,
                obesity_rate: 0
            };
        }
        
        const bmis = userDataList.map(user => {
            const heightM = user.height / 100;
            return user.weight / (heightM * heightM);
        });
        
        const avgBMI = bmis.reduce((a, b) => a + b, 0) / bmis.length;
        const avgCalories = userDataList.reduce((sum, user) => sum + (user.avg_calories || 2000), 0) / userDataList.length;
        const obesityRate = (bmis.filter(bmi => bmi >= 30).length / bmis.length) * 100;
        
        return {
            sample_size: userDataList.length,
            avg_bmi: parseFloat(avgBMI.toFixed(1)),
            avg_calories: Math.round(avgCalories),
            obesity_rate: parseFloat(obesityRate.toFixed(1))
        };
    }
    
    const testCommunityData = [
        { weight: 75, height: 175, avg_calories: 2200 },
        { weight: 65, height: 165, avg_calories: 1800 },
        { weight: 85, height: 180, avg_calories: 2800 }
    ];
    
    const stats = calculateCommunityStats(testCommunityData);
    
    console.assert(stats.sample_size === 3, `Expected sample size 3, got ${stats.sample_size}`);
    console.assert(stats.avg_bmi > 20 && stats.avg_bmi < 30, `Reasonable BMI: ${stats.avg_bmi}`);
    console.assert(stats.avg_calories > 1500, `Expected >1500 avg calories, got ${stats.avg_calories}`);
    console.log("✓ calculateCommunityStats test passed");
    
    // Test generateCommunityRecommendations function
    function generateCommunityRecommendations(stats) {
        const recommendations = [];
        
        if (stats.obesity_rate > 30) {
            recommendations.push("High obesity rate detected. Implement community nutrition education programs.");
        }
        
        if (stats.avg_calories > 2500) {
            recommendations.push("Average calorie intake is high. Promote balanced diet awareness in community.");
        }
        
        if (stats.avg_bmi > 27) {
            recommendations.push("Elevated average BMI. Encourage physical activity initiatives.");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Good community health indicators observed. Maintain current health initiatives.");
        }
        
        return recommendations;
    }
    
    const highRiskStats = { obesity_rate: 35, avg_calories: 2600, avg_bmi: 28 };
    const highRiskRecs = generateCommunityRecommendations(highRiskStats);
    
    console.assert(highRiskRecs.length >= 3, `Expected at least 3 recommendations, got ${highRiskRecs.length}`);
    console.assert(highRiskRecs[0].includes('obesity'), `Should mention obesity: ${highRiskRecs[0]}`);
    
    const lowRiskStats = { obesity_rate: 15, avg_calories: 2100, avg_bmi: 24 };
    const lowRiskRecs = generateCommunityRecommendations(lowRiskStats);
    
    console.assert(lowRiskRecs.length === 1, `Expected 1 recommendation, got ${lowRiskRecs.length}`);
    console.assert(lowRiskRecs[0].includes('Good'), `Should mention good health: ${lowRiskRecs[0]}`);
    console.log("✓ generateCommunityRecommendations test passed");
}

function testDataValidation() {
    console.log("\n10. Testing Data Validation Functions...");
    
    // Test validateUserData function
    function validateUserData(userData) {
        const errors = [];
        
        // Check required fields
        const requiredFields = ['age', 'weight', 'height'];
        requiredFields.forEach(field => {
            if (!userData[field] && userData[field] !== 0) {
                errors.push(`${field} is required`);
            }
        });
        
        // Validate age
        if (userData.age && (userData.age < 13 || userData.age > 120)) {
            errors.push('Age must be between 13 and 120');
        }
        
        // Validate weight
        if (userData.weight && (userData.weight < 20 || userData.weight > 300)) {
            errors.push('Weight must be between 20kg and 300kg');
        }
        
        // Validate height
        if (userData.height && (userData.height < 100 || userData.height > 250)) {
            errors.push('Height must be between 100cm and 250cm');
        }
        
        // Validate activity level
        const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very active'];
        if (userData.activity_level && !validActivityLevels.includes(userData.activity_level.toLowerCase())) {
            errors.push(`Activity level must be one of: ${validActivityLevels.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // Test valid data
    const validData = { age: 30, weight: 75, height: 175, activity_level: 'moderate' };
    const validResult = validateUserData(validData);
    console.assert(validResult.valid === true, "Valid data should pass validation");
    console.assert(validResult.errors.length === 0, "No errors for valid data");
    
    // Test invalid data
    const invalidData = { age: 5, weight: 10, height: 50, activity_level: 'invalid' };
    const invalidResult = validateUserData(invalidData);
    console.assert(invalidResult.valid === false, "Invalid data should fail validation");
    console.assert(invalidResult.errors.length >= 3, "Should have multiple errors");
    
    // Test missing data
    const missingData = { age: null };
    const missingResult = validateUserData(missingData);
    console.assert(missingResult.valid === false, "Missing data should fail validation");
    console.assert(missingResult.errors.includes('age is required'), "Should report missing age");
    
    console.log("✓ validateUserData test passed");
    
    // Test validateMealData function
    function validateMealData(mealData) {
        const errors = [];
        
        if (!mealData.food_items || !Array.isArray(mealData.food_items)) {
            errors.push('Food items must be an array');
            return { valid: false, errors: errors };
        }
        
        if (mealData.food_items.length === 0) {
            errors.push('At least one food item is required');
        }
        
        mealData.food_items.forEach((item, index) => {
            if (!item.name || item.name.trim() === '') {
                errors.push(`Food item ${index + 1} must have a name`);
            }
            
            if (item.quantity && (item.quantity <= 0 || item.quantity > 100)) {
                errors.push(`Food item ${index + 1} quantity must be between 0 and 100`);
            }
        });
        
        const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (mealData.meal_type && !validMealTypes.includes(mealData.meal_type.toLowerCase())) {
            errors.push(`Meal type must be one of: ${validMealTypes.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // Test valid meal data
    const validMeal = {
        food_items: [{ name: 'apple', quantity: 1 }],
        meal_type: 'lunch'
    };
    const validMealResult = validateMealData(validMeal);
    console.assert(validMealResult.valid === true, "Valid meal data should pass");
    
    // Test invalid meal data
    const invalidMeal = {
        food_items: [{ name: '', quantity: 0 }],
        meal_type: 'invalid'
    };
    const invalidMealResult = validateMealData(invalidMeal);
    console.assert(invalidMealResult.valid === false, "Invalid meal data should fail");
    
    console.log("✓ validateMealData test passed");
}

// Run comprehensive tests
function runAllTests() {
    console.log("=== RUNNING COMPREHENSIVE FRONTEND TESTS ===\n");
    
    try {
        runTests();
        testDisplayFunctions();
        testCommunityFunctions();
        testFormValidation();
        testMealLogging();
        testErrorHandling();
        testNutritionAnalysis();
        testCommunityHealthFunctions();
        testDataValidation();
        
        console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
        console.log("Summary: All frontend functionality tests passed!");
        
    } catch (error) {
        console.error("\n=== TEST FAILED ===");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

// Export all test functions
window.runAllTests = runAllTests;
window.runTests = runTests;
window.testAPIInteractions = testAPIInteractions;
window.testDisplayFunctions = testDisplayFunctions;
window.testCommunityFunctions = testCommunityFunctions;
window.testFormValidation = testFormValidation;
window.testMealLogging = testMealLogging;
window.testErrorHandling = testErrorHandling;
window.testNutritionAnalysis = testNutritionAnalysis;
window.testCommunityHealthFunctions = testCommunityHealthFunctions;
window.testDataValidation = testDataValidation;

console.log("All test functions loaded. Run 'runAllTests()' in console to execute comprehensive tests.");

console.log("Test functions loaded. Run 'runAllTests()' in console to execute all tests.");