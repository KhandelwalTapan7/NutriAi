// API Base URL - Auto-detect based on environment
const API_BASE_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // For Render deployment - use the current domain
    return `${window.location.origin}/api`;
})();

console.log('API Base URL:', API_BASE_URL);

// Global state
let currentUser = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    weight: 75,
    height: 175,
    bmi: 24.5
};

let foodItems = [];
let isAnalyzing = false;
let lastAnalysis = null;

// Toast notification system
class Toast {
    static show(message, type = 'success', duration = 3000) {
        // Remove existing toast
        const existingToast = document.getElementById('global-toast');
        if (existingToast) existingToast.remove();

        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = `toast-notification toast-${type}`;
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease-out;
                    min-width: 300px;
                    max-width: 400px;
                    border-left: 4px solid;
                }
                .toast-success { border-left-color: #10b981; }
                .toast-error { border-left-color: #ef4444; }
                .toast-warning { border-left-color: #f59e0b; }
                .toast-info { border-left-color: #3b82f6; }
                .toast-notification i:first-child {
                    font-size: 20px;
                }
                .toast-success i:first-child { color: #10b981; }
                .toast-error i:first-child { color: #ef4444; }
                .toast-warning i:first-child { color: #f59e0b; }
                .toast-info i:first-child { color: #3b82f6; }
                .toast-close {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }
}

// Modal system
class Modal {
    static open(title, content, options = {}) {
        // Close existing modal
        this.close();
        
        const modal = document.createElement('div');
        modal.id = 'global-modal';
        modal.className = 'modal-overlay';
        
        const buttons = options.buttons || [
            { text: 'Cancel', class: 'btn-secondary', action: 'Modal.close()' },
            { text: 'Confirm', class: 'btn-primary', action: 'Modal.confirm()' }
        ];
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="Modal.close()">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class}" 
                                onclick="${btn.action}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9998;
                    animation: fadeIn 0.3s;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s;
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h3 {
                    margin: 0;
                    color: #1f2937;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                }
                .modal-body {
                    padding: 20px;
                    color: #4b5563;
                }
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
        
        // Store callbacks
        if (options.onConfirm) {
            window.modalOnConfirm = options.onConfirm;
        }
        if (options.onCancel) {
            window.modalOnCancel = options.onCancel;
        }
    }
    
    static close() {
        const modal = document.getElementById('global-modal');
        if (modal) modal.remove();
        if (window.modalOnCancel) {
            window.modalOnCancel();
            delete window.modalOnCancel;
        }
        delete window.modalOnConfirm;
    }
    
    static confirm() {
        if (window.modalOnConfirm) {
            window.modalOnConfirm();
        }
        this.close();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Check for saved user data
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
    
    // Initialize based on current page
    const path = window.location.pathname;
    const pageName = path.split('/').pop();
    
    console.log('Current page:', pageName);
    
    if (pageName === 'index.html' || pageName === '' || pageName.includes('home')) {
        console.log('Initializing home page');
        loadDemoData();
        setupHomePageListeners();
    } else if (pageName === 'dashboard.html') {
        console.log('Initializing dashboard page');
        loadDashboardData();
        setupDashboardListeners();
    } else if (pageName === 'nutrition.html') {
        console.log('Initializing nutrition page');
        loadNutritionData();
        setupNutritionListeners();
    } else if (pageName === 'community.html') {
        console.log('Initializing community page');
        loadCommunityData();
        setupCommunityListeners();
    } else if (pageName === 'login.html' || pageName === 'signup.html') {
        console.log('Initializing auth page');
        setupAuthListeners();
    }
    
    // Setup global listeners
    setupGlobalListeners();
    
    // Check login status
    checkLoginStatus();
    
    // Show welcome message
    setTimeout(() => {
        Toast.show('Welcome to NutriAI!', 'info');
    }, 500);
});

// Setup global listeners
function setupGlobalListeners() {
    // Navigation active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a, .nav-links a, .sidebar a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const linkPage = href.split('/').pop();
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // User profile click
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', showProfile);
    }
    
    // Notifications button
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotifications);
    }
}

// Setup home page listeners
function setupHomePageListeners() {
    // Add food item button
    const addButton = document.querySelector('.food-input button, .quick-action-btn');
    if (addButton) {
        addButton.addEventListener('click', addFoodItem);
    }
    
    // Enter key in food input
    const foodInput = document.getElementById('food-item');
    if (foodInput) {
        foodInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addFoodItem();
            }
        });
    }
    
    // Analyze button
    const analyzeButton = document.querySelector('.btn-analyze, .analyze-btn');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeMeal);
    }
    
    // Clear button
    const clearButton = document.querySelector('.btn-clear, .clear-btn');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllFoodItems);
    }
    
    // Save meal button
    const saveButton = document.querySelector('.btn-save, .save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', saveMeal);
    }
    
    // Quick add buttons
    const quickAddButtons = document.querySelectorAll('.quick-add-btn');
    quickAddButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const food = this.getAttribute('data-food') || this.textContent.trim();
            addFoodItemByName(food);
        });
    });
}

// Setup dashboard listeners
function setupDashboardListeners() {
    // Refresh data button
    const refreshBtn = document.querySelector('.btn-refresh, .refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboardData);
    }
    
    // View details buttons
    const viewDetailBtns = document.querySelectorAll('.view-details, .details-btn');
    viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type') || 'general';
            viewDetails(type);
        });
    });
    
    // Export data button
    const exportBtn = document.querySelector('.btn-export, .export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboardData);
    }
    
    // Goal update button
    const goalBtn = document.querySelector('.btn-goal, .goal-btn');
    if (goalBtn) {
        goalBtn.addEventListener('click', updateGoal);
    }
    
    // Chart controls
    const chartBtns = document.querySelectorAll('.chart-btn');
    chartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('onclick');
            if (action) {
                eval(action);
            }
        });
    });
}

// Setup nutrition listeners
function setupNutritionListeners() {
    // Add nutrient button
    const addNutrientBtn = document.querySelector('.btn-add-nutrient');
    if (addNutrientBtn) {
        addNutrientBtn.addEventListener('click', addCustomNutrient);
    }
    
    // Track water button
    const waterBtn = document.querySelector('.btn-water, .water-btn');
    if (waterBtn) {
        waterBtn.addEventListener('click', trackWater);
    }
    
    // Generate report button
    const reportBtn = document.querySelector('.btn-report, .report-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', generateNutritionReport);
    }
}

// Setup community listeners
function setupCommunityListeners() {
    // Post message button
    const postBtn = document.querySelector('.btn-post, .post-btn');
    if (postBtn) {
        postBtn.addEventListener('click', postCommunityMessage);
    }
    
    // Like buttons
    const likeBtns = document.querySelectorAll('.btn-like, .like-btn');
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id') || '1';
            likePost(postId);
        });
    });
    
    // Comment buttons
    const commentBtns = document.querySelectorAll('.btn-comment, .comment-btn');
    commentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id') || '1';
            showCommentBox(postId);
        });
    });
    
    // Share buttons
    const shareBtns = document.querySelectorAll('.btn-share, .share-btn');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id') || '1';
            sharePost(postId);
        });
    });
}

// Setup auth listeners
function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    const demoLoginBtn = document.querySelector('.demo-login-btn');
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }
    
    const forgotPasswordBtn = document.querySelector('.forgot-password');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', handleForgotPassword);
    }
}

// Add food item to list
function addFoodItem() {
    const foodInput = document.getElementById('food-item');
    if (!foodInput) {
        Toast.show('Food input not found', 'error');
        return;
    }
    
    const foodName = foodInput.value.trim();
    
    if (!foodName) {
        Toast.show('Please enter a food item', 'warning');
        foodInput.focus();
        return;
    }
    
    // Check for duplicates
    if (foodItems.some(item => item.name.toLowerCase() === foodName.toLowerCase())) {
        Toast.show('This food item is already in the list', 'warning');
        foodInput.value = '';
        foodInput.focus();
        return;
    }
    
    // Add to array
    foodItems.push({
        id: Date.now(),
        name: foodName,
        quantity: 1,
        unit: 'serving',
        timestamp: new Date().toISOString()
    });
    
    // Update UI
    updateFoodList();
    
    // Clear input
    foodInput.value = '';
    foodInput.focus();
    
    Toast.show(`Added "${foodName}" to your meal`, 'success');
}

// Add food item by name (for quick add buttons)
function addFoodItemByName(foodName) {
    if (!foodName) return;
    
    // Check for duplicates
    if (foodItems.some(item => item.name.toLowerCase() === foodName.toLowerCase())) {
        Toast.show('This food item is already in the list', 'warning');
        return;
    }
    
    foodItems.push({
        id: Date.now(),
        name: foodName,
        quantity: 1,
        unit: 'serving',
        timestamp: new Date().toISOString()
    });
    
    updateFoodList();
    Toast.show(`Added "${foodName}" to your meal`, 'success');
}

// Update food list in UI
function updateFoodList() {
    const foodList = document.getElementById('food-list');
    if (!foodList) return;
    
    foodList.innerHTML = '';
    
    if (foodItems.length === 0) {
        foodList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <p>No food items added yet.</p>
                <p class="small">Start by adding some foods!</p>
            </div>
        `;
        return;
    }
    
    foodItems.forEach((item, index) => {
        const foodItemDiv = document.createElement('div');
        foodItemDiv.className = 'food-item';
        foodItemDiv.innerHTML = `
            <div class="food-item-info">
                <span class="food-name">${item.name}</span>
                <span class="food-quantity">${item.quantity} ${item.unit}</span>
            </div>
            <div class="food-item-actions">
                <button onclick="decreaseQuantity(${index})" class="btn-quantity" title="Decrease">
                    <i class="fas fa-minus"></i>
                </button>
                <button onclick="increaseQuantity(${index})" class="btn-quantity" title="Increase">
                    <i class="fas fa-plus"></i>
                </button>
                <button onclick="removeFoodItem(${index})" class="btn-remove" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        foodList.appendChild(foodItemDiv);
    });
}

// Quantity controls
function increaseQuantity(index) {
    if (index >= 0 && index < foodItems.length) {
        foodItems[index].quantity += 0.5;
        updateFoodList();
        Toast.show(`Increased ${foodItems[index].name} quantity to ${foodItems[index].quantity}`, 'info');
    }
}

function decreaseQuantity(index) {
    if (index >= 0 && index < foodItems.length) {
        if (foodItems[index].quantity > 0.5) {
            foodItems[index].quantity -= 0.5;
            updateFoodList();
            Toast.show(`Decreased ${foodItems[index].name} quantity to ${foodItems[index].quantity}`, 'info');
        } else {
            removeFoodItem(index);
        }
    }
}

// Remove food item
function removeFoodItem(index) {
    if (index >= 0 && index < foodItems.length) {
        const removedItem = foodItems[index].name;
        foodItems.splice(index, 1);
        updateFoodList();
        Toast.show(`Removed "${removedItem}" from your meal`, 'info');
    }
}

// Clear all food items
function clearAllFoodItems() {
    if (foodItems.length === 0) {
        Toast.show('Food list is already empty', 'info');
        return;
    }
    
    Modal.open('Clear All Items', 
        'Are you sure you want to clear all food items? This action cannot be undone.',
        {
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', action: 'Modal.close()' },
                { text: 'Clear All', class: 'btn-danger', action: 'confirmClearAll()' }
            ]
        }
    );
}

function confirmClearAll() {
    const count = foodItems.length;
    foodItems = [];
    updateFoodList();
    Modal.close();
    Toast.show(`Cleared ${count} food item${count === 1 ? '' : 's'}`, 'success');
}

// Save meal to history
function saveMeal() {
    if (foodItems.length === 0) {
        Toast.show('Add some food items before saving', 'warning');
        return;
    }
    
    if (!lastAnalysis) {
        Toast.show('Please analyze the meal first before saving', 'warning');
        return;
    }
    
    const mealName = prompt('Enter a name for this meal:', `Meal ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    if (!mealName) return;
    
    // In a real app, this would save to backend
    const mealData = {
        id: Date.now(),
        name: mealName,
        foods: [...foodItems],
        analysis: lastAnalysis,
        timestamp: new Date().toISOString(),
        userId: currentUser.id
    };
    
    // Save to localStorage for demo
    let savedMeals = JSON.parse(localStorage.getItem('nutritionMeals') || '[]');
    savedMeals.push(mealData);
    localStorage.setItem('nutritionMeals', JSON.stringify(savedMeals));
    
    Toast.show(`Meal "${mealName}" saved successfully!`, 'success');
    
    // Clear current items
    foodItems = [];
    updateFoodList();
    
    // Clear analysis results
    const resultsContainer = document.getElementById('analysis-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    lastAnalysis = null;
}

// Analyze meal using AI
async function analyzeMeal() {
    if (isAnalyzing) {
        Toast.show('Analysis already in progress', 'warning');
        return;
    }
    
    if (foodItems.length === 0) {
        Toast.show('Please add some food items first', 'warning');
        return;
    }
    
    const analyzeButton = document.querySelector('.btn-analyze, .analyze-btn');
    const originalButtonHTML = analyzeButton ? analyzeButton.innerHTML : '';
    
    if (analyzeButton) {
        analyzeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeButton.disabled = true;
    }
    
    isAnalyzing = true;
    
    try {
        // Prepare request data
        const requestData = {
            user_id: currentUser.id,
            food_items: foodItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit
            })),
            user_info: {
                age: currentUser.age,
                weight: currentUser.weight,
                height: currentUser.height,
                bmi: currentUser.bmi
            },
            timestamp: new Date().toISOString()
        };
        
        Toast.show('Analyzing your meal...', 'info');
        
        // Try API call first, fallback to mock if fails
        let analysisResult;
        try {
            // Uncomment for real API call
            // const response = await fetch(`${API_BASE_URL}/analyze`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(requestData)
            // });
            
            // if (!response.ok) throw new Error('API request failed');
            // analysisResult = await response.json();
            
            // For demo, use mock data
            await new Promise(resolve => setTimeout(resolve, 2000));
            analysisResult = generateMockAnalysis(requestData);
            
        } catch (apiError) {
            console.log('API call failed, using mock data:', apiError);
            analysisResult = generateMockAnalysis(requestData);
        }
        
        // Display results
        displayAnalysisResults(analysisResult.analysis || analysisResult);
        lastAnalysis = analysisResult.analysis || analysisResult;
        
        Toast.show('Meal analysis complete!', 'success');
        
    } catch (error) {
        console.error('Error analyzing meal:', error);
        Toast.show('Failed to analyze meal. Using demo data.', 'error');
        displayMockAnalysis();
    } finally {
        isAnalyzing = false;
        if (analyzeButton) {
            analyzeButton.innerHTML = originalButtonHTML;
            analyzeButton.disabled = false;
        }
    }
}

// Generate mock analysis for demo
function generateMockAnalysis(requestData) {
    const foodNames = requestData.food_items.map(f => f.name).join(', ');
    const totalQuantity = requestData.food_items.reduce((sum, f) => sum + f.quantity, 0);
    
    // Generate realistic data based on food items
    let baseCalories = 0;
    let baseProtein = 0;
    let baseCarbs = 0;
    let baseFats = 0;
    
    // Simple food database
    const foodDB = {
        'apple': { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
        'banana': { calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
        'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
        'brown rice': { calories: 215, protein: 5, carbs: 45, fats: 1.8 },
        'broccoli': { calories: 55, protein: 3.7, carbs: 11, fats: 0.6 },
        'salmon': { calories: 206, protein: 22, carbs: 0, fats: 13 },
        'eggs': { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
        'bread': { calories: 265, protein: 9, carbs: 49, fats: 3.2 },
        'milk': { calories: 103, protein: 8, carbs: 12, fats: 2.4 },
        'yogurt': { calories: 150, protein: 13, carbs: 17, fats: 4 },
        'almonds': { calories: 164, protein: 6, carbs: 6, fats: 14 },
        'cheese': { calories: 402, protein: 25, carbs: 1.3, fats: 33 }
    };
    
    // Calculate nutrients based on food items
    requestData.food_items.forEach(item => {
        const foodKey = Object.keys(foodDB).find(key => 
            item.name.toLowerCase().includes(key)
        );
        
        if (foodKey) {
            const nutrients = foodDB[foodKey];
            baseCalories += nutrients.calories * item.quantity;
            baseProtein += nutrients.protein * item.quantity;
            baseCarbs += nutrients.carbs * item.quantity;
            baseFats += nutrients.fats * item.quantity;
        } else {
            // Default values for unknown foods
            baseCalories += 150 * item.quantity;
            baseProtein += 10 * item.quantity;
            baseCarbs += 20 * item.quantity;
            baseFats += 5 * item.quantity;
        }
    });
    
    // Add some randomness
    const calories = Math.max(200, Math.round(baseCalories * (0.8 + Math.random() * 0.4)));
    const protein = Math.max(5, Math.round(baseProtein * (0.8 + Math.random() * 0.4) * 10) / 10);
    const carbs = Math.max(10, Math.round(baseCarbs * (0.8 + Math.random() * 0.4) * 10) / 10);
    const fats = Math.max(2, Math.round(baseFats * (0.8 + Math.random() * 0.4) * 10) / 10);
    
    // Calculate meal score based on balance
    const calorieScore = Math.min(100, Math.max(60, 100 - Math.abs(calories - 500) / 10));
    const proteinScore = Math.min(100, Math.max(60, protein * 2));
    const balanceScore = Math.min(100, Math.max(60, 100 - Math.abs(protein - carbs / 2) - Math.abs(fats - 15)));
    const mealScore = Math.round((calorieScore + proteinScore + balanceScore) / 3);
    
    // Determine risk level
    let riskLevel = 'Low Risk';
    let riskDetails = 'This meal is well-balanced and nutritious.';
    
    if (calories > 800) {
        riskLevel = 'High Risk';
        riskDetails = 'This meal is very high in calories. Consider reducing portion sizes.';
    } else if (fats > 30) {
        riskLevel = 'Medium Risk';
        riskDetails = 'High fat content. Consider choosing leaner options.';
    } else if (carbs > 100 && protein < 20) {
        riskLevel = 'Medium Risk';
        riskDetails = 'High carb, low protein meal. Consider adding more protein.';
    }
    
    // BMI category
    const bmi = requestData.user_info.bmi;
    let bmiCategory = 'Normal';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
    else if (bmi >= 30) bmiCategory = 'Obese';
    
    return {
        analysis: {
            nutrition_analysis: {
                calories: calories,
                protein: protein,
                carbs: carbs,
                fats: fats,
                fiber: Math.round((Math.random() * 10 + 5) * 10) / 10,
                sugar: Math.round((Math.random() * 20 + 5) * 10) / 10,
                sodium: Math.round(Math.random() * 800 + 200)
            },
            health_risk: {
                level: riskLevel,
                score: riskLevel === 'Low Risk' ? 0 : riskLevel === 'Medium Risk' ? 1 : 2,
                details: riskDetails
            },
            bmi: {
                value: bmi,
                category: bmiCategory
            },
            daily_targets: {
                calories: 2200,
                protein: 90,
                carbs: 275,
                fats: 73,
                fiber: 30
            },
            recommendations: [
                'Good variety of foods in this meal',
                calories > 600 ? 'Consider reducing portion sizes for calorie control' : 'Appropriate calorie intake',
                protein < 20 ? 'Add more protein-rich foods like chicken, fish, or legumes' : 'Adequate protein for muscle maintenance',
                carbs > 100 ? 'Consider choosing complex carbs over simple sugars' : 'Good carbohydrate sources',
                'Drink water with your meal for better digestion'
            ],
            food_suggestions: [
                'Add a side salad for more fiber',
                'Include a fruit for dessert',
                'Consider grilled instead of fried options',
                'Use herbs and spices instead of salt'
            ],
            meal_score: mealScore,
            analyzed_foods: foodNames
        }
    };
}

// Display analysis results
function displayAnalysisResults(analysis) {
    const resultsContainer = document.getElementById('analysis-results');
    if (!resultsContainer) {
        // Create results container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'analysis-results';
        container.className = 'analysis-results';
        document.querySelector('.main-content')?.appendChild(container);
        resultsContainer = container;
    }
    
    // Calculate percentages for progress bars
    const targets = analysis.daily_targets;
    const nutrients = analysis.nutrition_analysis;
    
    const caloriePercent = Math.min((nutrients.calories / targets.calories) * 100, 100);
    const proteinPercent = Math.min((nutrients.protein / targets.protein) * 100, 100);
    const carbPercent = Math.min((nutrients.carbs / targets.carbs) * 100, 100);
    const fatPercent = Math.min((nutrients.fats / targets.fats) * 100, 100);
    const fiberPercent = Math.min((nutrients.fiber / targets.fiber) * 100, 100);
    
    // Determine risk class
    const riskClass = `risk-${analysis.health_risk.level.toLowerCase().replace(' ', '-')}`;
    
    // Determine score color
    let scoreColor = '#10b981'; // Green
    if (analysis.meal_score < 70) scoreColor = '#f59e0b'; // Orange
    if (analysis.meal_score < 60) scoreColor = '#ef4444'; // Red
    
    resultsContainer.innerHTML = `
        <div class="analysis-container">
            <div class="analysis-header">
                <h4><i class="fas fa-chart-pie"></i> Nutrition Analysis Results</h4>
                <div class="meal-score" style="background: ${scoreColor}">
                    Score: ${analysis.meal_score}/100
                </div>
            </div>
            
            <div class="risk-banner ${riskClass}">
                <i class="fas fa-${analysis.meal_score >= 70 ? 'check' : 'exclamation'}-circle"></i>
                <strong>Health Risk:</strong> ${analysis.health_risk.level}
                <span class="risk-details">${analysis.health_risk.details}</span>
            </div>
            
            <div class="analysis-grid">
                <div class="analysis-section">
                    <h5><i class="fas fa-user"></i> Your Health Info</h5>
                    <div class="info-item">
                        <span>BMI:</span>
                        <span class="value">${analysis.bmi.value} (${analysis.bmi.category})</span>
                    </div>
                    <div class="info-item">
                        <span>Age:</span>
                        <span class="value">${currentUser.age} years</span>
                    </div>
                    <div class="info-item">
                        <span>Weight:</span>
                        <span class="value">${currentUser.weight} kg</span>
                    </div>
                    <div class="info-item">
                        <span>Daily Target Calories:</span>
                        <span class="value">${targets.calories} kcal</span>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h5><i class="fas fa-utensils"></i> Nutrient Breakdown</h5>
                    
                    <div class="nutrient-item">
                        <div class="nutrient-header">
                            <span>Calories</span>
                            <span>${nutrients.calories.toFixed(0)} / ${targets.calories} kcal</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${caloriePercent}%"></div>
                        </div>
                        <div class="nutrient-percent">${caloriePercent.toFixed(1)}% of daily target</div>
                    </div>
                    
                    <div class="nutrient-item">
                        <div class="nutrient-header">
                            <span>Protein</span>
                            <span>${nutrients.protein.toFixed(1)}g / ${targets.protein}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${proteinPercent}%"></div>
                        </div>
                        <div class="nutrient-percent">${proteinPercent.toFixed(1)}% of daily target</div>
                    </div>
                    
                    <div class="nutrient-item">
                        <div class="nutrient-header">
                            <span>Carbohydrates</span>
                            <span>${nutrients.carbs.toFixed(1)}g / ${targets.carbs}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${carbPercent}%"></div>
                        </div>
                        <div class="nutrient-percent">${carbPercent.toFixed(1)}% of daily target</div>
                    </div>
                    
                    <div class="nutrient-item">
                        <div class="nutrient-header">
                            <span>Fats</span>
                            <span>${nutrients.fats.toFixed(1)}g / ${targets.fats}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${fatPercent}%"></div>
                        </div>
                        <div class="nutrient-percent">${fatPercent.toFixed(1)}% of daily target</div>
                    </div>
                    
                    <div class="nutrient-item">
                        <div class="nutrient-header">
                            <span>Fiber</span>
                            <span>${nutrients.fiber.toFixed(1)}g / ${targets.fiber}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${fiberPercent}%"></div>
                        </div>
                        <div class="nutrient-percent">${fiberPercent.toFixed(1)}% of daily target</div>
                    </div>
                </div>
            </div>
            
            <div class="recommendations-section">
                <h5><i class="fas fa-lightbulb"></i> AI Recommendations</h5>
                <div class="recommendations-grid">
                    ${analysis.recommendations.map(rec => `
                        <div class="recommendation-card">
                            <i class="fas fa-check"></i>
                            <span>${rec}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="food-suggestions">
                <h5><i class="fas fa-plus-circle"></i> Food Suggestions</h5>
                <div class="suggestions-list">
                    ${analysis.food_suggestions.map(sug => `
                        <span class="suggestion-tag">${sug}</span>
                    `).join('')}
                </div>
            </div>
            
            <div class="analysis-actions">
                <button class="btn btn-secondary" onclick="saveMeal()">
                    <i class="fas fa-save"></i> Save This Meal
                </button>
                <button class="btn btn-primary" onclick="shareAnalysis()">
                    <i class="fas fa-share-alt"></i> Share Results
                </button>
                <button class="btn btn-info" onclick="showDetailedReport()">
                    <i class="fas fa-chart-bar"></i> Detailed Report
                </button>
            </div>
        </div>
    `;
}

// Mock analysis for demo purposes
function displayMockAnalysis() {
    const mockData = {
        user_id: currentUser.id,
        food_items: foodItems,
        user_info: {
            age: currentUser.age,
            weight: currentUser.weight,
            height: currentUser.height,
            bmi: currentUser.bmi
        }
    };
    
    const mockResponse = generateMockAnalysis(mockData);
    displayAnalysisResults(mockResponse.analysis);
    lastAnalysis = mockResponse.analysis;
}

// Load demo data
function loadDemoData() {
    // Add some sample food items if list is empty
    if (foodItems.length === 0) {
        const sampleFoods = ['Apple', 'Chicken Breast', 'Brown Rice', 'Broccoli', 'Almonds'];
        sampleFoods.forEach(food => {
            foodItems.push({
                id: Date.now(),
                name: food,
                quantity: 1,
                unit: 'serving',
                timestamp: new Date().toISOString()
            });
        });
    }
    
    updateFoodList();
    Toast.show('Demo data loaded. Try adding more foods or click Analyze!', 'info');
}

// Dashboard functions
async function loadDashboardData() {
    try {
        Toast.show('Loading dashboard data...', 'info');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demo
        const mockData = {
            user_profile: {
                username: currentUser.name,
                age: currentUser.age,
                weight: currentUser.weight,
                height: currentUser.height,
                goal: 'Maintain Weight',
                activity_level: 'Moderately Active'
            },
            current_status: {
                bmi: { value: currentUser.bmi, category: 'Normal' },
                weight_trend: -0.5,
                weekly_progress: 75
            },
            history: {
                last_7_days: {
                    avg_calories: 2150,
                    meals_logged: 21,
                    avg_health_score: 82,
                    water_intake: 2.1
                },
                last_30_days: {
                    weight_change: -1.2,
                    meals_analyzed: 89,
                    avg_meal_score: 78
                }
            }
        };
        
        updateDashboardUI(mockData);
        createDashboardCharts(mockData);
        
        Toast.show('Dashboard loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        Toast.show('Failed to load dashboard data', 'error');
        loadMockDashboardData();
    }
}

function updateDashboardUI(data) {
    // Update user info
    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateElement('user-name', data.user_profile.username);
    updateElement('user-age', data.user_profile.age);
    updateElement('user-weight', `${data.user_profile.weight} kg`);
    updateElement('user-height', `${data.user_profile.height} cm`);
    updateElement('user-bmi', data.current_status.bmi.value);
    updateElement('user-goal', data.user_profile.goal);
    updateElement('user-activity', data.user_profile.activity_level);
    
    // Update stats
    const elements = {
        'total-calories': data.history.last_7_days.avg_calories,
        'meals-logged': data.history.last_7_days.meals_logged,
        'health-score': data.history.last_7_days.avg_health_score,
        'water-intake': `${data.history.last_7_days.water_intake}L`,
        'weight-change': data.history.last_30_days.weight_change > 0 ? 
            `+${data.history.last_30_days.weight_change} kg` : 
            `${data.history.last_30_days.weight_change} kg`,
        'meals-analyzed': data.history.last_30_days.meals_analyzed,
        'avg-meal-score': data.history.last_30_days.avg_meal_score
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        updateElement(id, value);
    });
    
    // Update progress bars
    const updateProgress = (id, value) => {
        const progress = document.getElementById(id);
        if (progress) {
            progress.style.width = `${Math.min(value, 100)}%`;
            progress.textContent = `${Math.round(value)}%`;
        }
    };
    
    updateProgress('weekly-progress', data.current_status.weekly_progress);
    updateProgress('calorie-progress', (data.history.last_7_days.avg_calories / 2200) * 100);
    updateProgress('water-progress', (data.history.last_7_days.water_intake / 2.5) * 100);
}

function createDashboardCharts(data) {
    // Calorie chart
    const calorieCtx = document.getElementById('calorieChart');
    if (calorieCtx) {
        const ctx = calorieCtx.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Calories',
                    data: [2100, 2200, 2150, 2300, 2000, 2500, 1800],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Weekly Calorie Intake',
                        color: '#1f2937',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 1500,
                        title: {
                            display: true,
                            text: 'Calories',
                            color: '#6b7280'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }
    
    // Nutrient breakdown chart
    const nutrientCtx = document.getElementById('nutrientChart');
    if (nutrientCtx) {
        const ctx = nutrientCtx.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fats', 'Fiber'],
                datasets: [{
                    data: [30, 45, 20, 5],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            color: '#6b7280'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Nutrient Distribution',
                        color: '#1f2937',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }
}

function refreshDashboardData() {
    Toast.show('Refreshing dashboard data...', 'info');
    loadDashboardData();
}

function viewDetails(type) {
    const details = {
        'calories': 'Daily calorie target: 2200 kcal. Current average: 2150 kcal. You are within a healthy range.',
        'meals': 'Total meals logged this week: 21. Average score: 82/100. Keep up the good work!',
        'water': 'Daily water goal: 2.5L. Current average: 2.1L. Try to drink one more glass today.',
        'progress': 'Weekly progress: 75%. Goal: Maintain weight with balanced nutrition. You\'re doing great!',
        'general': 'Your overall health is improving. Continue tracking your meals and staying active.'
    };
    
    Modal.open(`${type.charAt(0).toUpperCase() + type.slice(1)} Details`, 
        details[type] || 'Details not available.',
        {
            buttons: [
                { text: 'Close', class: 'btn-secondary', action: 'Modal.close()' }
            ]
        }
    );
}

function exportDashboardData() {
    Toast.show('Exporting dashboard data as PDF...', 'info');
    
    setTimeout(() => {
        Toast.show('Dashboard data exported successfully!', 'success');
        
        // Create a simple text file for demo
        const data = {
            user: currentUser,
            exportDate: new Date().toISOString(),
            message: 'Nutrition Dashboard Data Export'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nutrition-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 1500);
}

function updateGoal() {
    const currentGoal = document.getElementById('user-goal')?.textContent || 'Maintain Weight';
    const newGoal = prompt('Enter your new goal:', currentGoal);
    if (newGoal && newGoal.trim()) {
        document.getElementById('user-goal').textContent = newGoal;
        Toast.show(`Goal updated to: ${newGoal}`, 'success');
        
        // Save to localStorage
        currentUser.goal = newGoal;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Nutrition page functions
async function loadNutritionData() {
    try {
        Toast.show('Loading nutrition data...', 'info');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
            daily_targets: {
                calories: 2200,
                protein: 90,
                carbs: 275,
                fats: 73,
                fiber: 30,
                sugar: 36,
                sodium: 2300
            },
            bmi: {
                value: currentUser.bmi,
                category: 'Normal'
            },
            health_risk: {
                level: 'Low Risk',
                score: 0
            },
            todays_intake: {
                calories: 850,
                protein: 35,
                carbs: 110,
                fats: 28,
                fiber: 12,
                water: 1.5
            },
            nutrient_deficiencies: ['Vitamin D', 'Calcium'],
            recommendations: [
                'Increase calcium intake with dairy or leafy greens',
                'Get 15 minutes of sunlight daily for Vitamin D',
                'Drink at least 1 more liter of water today',
                'Include more colorful vegetables in your meals'
            ]
        };
        
        displayNutritionOverview(mockData);
        
        Toast.show('Nutrition data loaded!', 'success');
        
    } catch (error) {
        console.error('Error loading nutrition data:', error);
        Toast.show('Failed to load nutrition data', 'error');
        displayMockNutritionOverview();
    }
}

function displayNutritionOverview(data) {
    const container = document.getElementById('nutrition-overview');
    if (!container) return;
    
    // Calculate percentages
    const calcPercent = (intake, target) => Math.min((intake / target) * 100, 100);
    
    const caloriesPercent = calcPercent(data.todays_intake.calories, data.daily_targets.calories);
    const proteinPercent = calcPercent(data.todays_intake.protein, data.daily_targets.protein);
    const carbsPercent = calcPercent(data.todays_intake.carbs, data.daily_targets.carbs);
    const fatsPercent = calcPercent(data.todays_intake.fats, data.daily_targets.fats);
    const fiberPercent = calcPercent(data.todays_intake.fiber, data.daily_targets.fiber);
    const waterPercent = calcPercent(data.todays_intake.water, 2.5);
    
    container.innerHTML = `
        <div class="nutrition-dashboard">
            <div class="dashboard-header">
                <h3><i class="fas fa-apple-alt"></i> Today's Nutrition</h3>
                <div class="health-status ${data.health_risk.level.toLowerCase().replace(' ', '-')}">
                    ${data.health_risk.level}
                </div>
            </div>
            
            <div class="nutrition-grid">
                <div class="nutrition-card">
                    <h4><i class="fas fa-bullseye"></i> Daily Targets</h4>
                    ${Object.entries(data.daily_targets).map(([key, value]) => `
                        <div class="target-item">
                            <span>${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                            <span class="target-value">${typeof value === 'number' ? 
                                (key === 'calories' ? value + ' kcal' : value + (key === 'sodium' ? ' mg' : 'g')) : 
                                value}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="nutrition-card">
                    <h4><i class="fas fa-chart-line"></i> Today's Progress</h4>
                    
                    <div class="progress-item">
                        <div class="progress-header">
                            <span>Calories</span>
                            <span>${data.todays_intake.calories}/${data.daily_targets.calories} kcal</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${caloriesPercent}%"></div>
                        </div>
                        <div class="progress-percent">${caloriesPercent.toFixed(1)}%</div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-header">
                            <span>Protein</span>
                            <span>${data.todays_intake.protein}g/${data.daily_targets.protein}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${proteinPercent}%"></div>
                        </div>
                        <div class="progress-percent">${proteinPercent.toFixed(1)}%</div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-header">
                            <span>Carbohydrates</span>
                            <span>${data.todays_intake.carbs}g/${data.daily_targets.carbs}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${carbsPercent}%"></div>
                        </div>
                        <div class="progress-percent">${carbsPercent.toFixed(1)}%</div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-header">
                            <span>Fats</span>
                            <span>${data.todays_intake.fats}g/${data.daily_targets.fats}g</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${fatsPercent}%"></div>
                        </div>
                        <div class="progress-percent">${fatsPercent.toFixed(1)}%</div>
                    </div>
                    
                    <div class="progress-item">
                        <div class="progress-header">
                            <span>Water</span>
                            <span>${data.todays_intake.water}L/2.5L</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${waterPercent}%"></div>
                        </div>
                        <div class="progress-percent">${waterPercent.toFixed(1)}%</div>
                    </div>
                </div>
                
                <div class="nutrition-card">
                    <h4><i class="fas fa-exclamation-triangle"></i> Areas to Improve</h4>
                    ${data.nutrient_deficiencies.length > 0 ? `
                        <div class="deficiency-list">
                            ${data.nutrient_deficiencies.map(def => `
                                <div class="deficiency-item">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <span>${def}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="no-deficiencies">No deficiencies detected! Great job!</p>'}
                    
                    <h5 class="mt-3"><i class="fas fa-lightbulb"></i> Recommendations</h5>
                    <ul class="recommendations-list">
                        ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="nutrition-actions">
                <button class="btn btn-primary" onclick="logMeal()">
                    <i class="fas fa-plus"></i> Log a Meal
                </button>
                <button class="btn btn-success" onclick="trackWater()">
                    <i class="fas fa-tint"></i> Track Water
                </button>
                <button class="btn btn-info" onclick="generateNutritionReport()">
                    <i class="fas fa-file-pdf"></i> Generate Report
                </button>
                <button class="btn btn-warning" onclick="setReminders()">
                    <i class="fas fa-bell"></i> Set Reminders
                </button>
            </div>
        </div>
    `;
}

function logMeal() {
    Toast.show('Redirecting to meal analysis...', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function trackWater() {
    const amount = prompt('How much water did you drink? (in liters)', '0.5');
    if (amount && !isNaN(parseFloat(amount))) {
        const waterAmount = parseFloat(amount);
        Toast.show(`Logged ${waterAmount}L of water`, 'success');
        
        // Update water progress in the UI
        const waterEl = document.querySelector('.progress-item:nth-child(5) .progress-header span:last-child');
        if (waterEl) {
            const currentText = waterEl.textContent;
            const currentMatch = currentText.match(/(\d+\.?\d*)L\/2\.5L/);
            if (currentMatch) {
                const current = parseFloat(currentMatch[1]);
                const newAmount = current + waterAmount;
                waterEl.textContent = `${newAmount.toFixed(1)}L/2.5L`;
                
                const percent = (newAmount / 2.5) * 100;
                const fill = document.querySelector('.progress-item:nth-child(5) .progress-fill');
                const percentEl = document.querySelector('.progress-item:nth-child(5) .progress-percent');
                if (fill) fill.style.width = `${percent}%`;
                if (percentEl) percentEl.textContent = `${percent.toFixed(1)}%`;
            }
        }
    } else {
        Toast.show('Please enter a valid number', 'error');
    }
}

function generateNutritionReport() {
    Toast.show('Generating nutrition report...', 'info');
    setTimeout(() => {
        Toast.show('Nutrition report generated and downloaded!', 'success');
        
        // Create a simple report for demo
        const report = {
            title: 'Nutrition Report',
            date: new Date().toLocaleDateString(),
            user: currentUser.name,
            summary: 'Your nutrition is on track! Continue with balanced meals.',
            recommendations: [
                'Drink 2.5L of water daily',
                'Include protein in every meal',
                'Eat colorful vegetables',
                'Limit processed foods'
            ]
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nutrition-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 2000);
}

function setReminders() {
    const time = prompt('Set reminder time (HH:MM):', '13:00');
    if (time && time.match(/^\d{2}:\d{2}$/)) {
        Toast.show(`Reminder set for ${time} daily`, 'success');
        
        // Save to localStorage
        const reminders = JSON.parse(localStorage.getItem('nutritionReminders') || '[]');
        reminders.push({
            id: Date.now(),
            time: time,
            type: 'daily',
            enabled: true
        });
        localStorage.setItem('nutritionReminders', JSON.stringify(reminders));
    } else {
        Toast.show('Please enter time in HH:MM format', 'error');
    }
}

// Community page functions
async function loadCommunityData() {
    try {
        Toast.show('Loading community data...', 'info');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
            community_analysis: {
                community_stats: {
                    sample_size: 1542,
                    avg_bmi: 25.8,
                    obesity_rate: 28.5,
                    avg_health_score: 76,
                    health_risk_distribution: {
                        low_risk: 65,
                        medium_risk: 25,
                        high_risk: 10
                    }
                }
            },
            regional_data: {
                'North America': { obesity_rate: 32.5, avg_bmi: 26.2 },
                'Europe': { obesity_rate: 22.8, avg_bmi: 24.8 },
                'Asia': { obesity_rate: 18.2, avg_bmi: 23.5 },
                'South America': { obesity_rate: 26.7, avg_bmi: 25.5 }
            },
            recent_posts: [
                {
                    id: 1,
                    user: 'Sarah M.',
                    avatar: 'SM',
                    time: '2 hours ago',
                    content: 'Just completed my first week of healthy eating! Feeling great and already lost 1kg!',
                    likes: 24,
                    comments: 8
                },
                {
                    id: 2,
                    user: 'Mike T.',
                    avatar: 'MT',
                    time: '5 hours ago',
                    content: 'Does anyone have good low-carb lunch ideas for office workers?',
                    likes: 15,
                    comments: 12
                },
                {
                    id: 3,
                    user: 'Nutrition Pro',
                    avatar: 'NP',
                    time: '1 day ago',
                    content: 'Tip: Drinking water before meals can help control appetite and aid digestion!',
                    likes: 42,
                    comments: 5
                }
            ]
        };
        
        displayCommunityStats(mockData);
        createCommunityCharts(mockData);
        displayCommunityPosts(mockData.recent_posts);
        
        Toast.show('Community data loaded!', 'success');
        
    } catch (error) {
        console.error('Error loading community data:', error);
        Toast.show('Failed to load community data', 'error');
        displayMockCommunityData();
    }
}

function displayCommunityStats(data) {
    const container = document.getElementById('community-stats');
    if (!container) return;
    
    const stats = data.community_analysis.community_stats;
    
    container.innerHTML = `
        <div class="community-stats-grid">
            <div class="community-stat-card">
                <div class="stat-icon" style="background: #3b82f6;">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.sample_size.toLocaleString()}</h3>
                    <p>Active Users</p>
                </div>
            </div>
            
            <div class="community-stat-card">
                <div class="stat-icon" style="background: #10b981;">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.avg_health_score}/100</h3>
                    <p>Avg Health Score</p>
                </div>
            </div>
            
            <div class="community-stat-card">
                <div class="stat-icon" style="background: #f59e0b;">
                    <i class="fas fa-weight"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.avg_bmi.toFixed(1)}</h3>
                    <p>Average BMI</p>
                </div>
            </div>
            
            <div class="community-stat-card">
                <div class="stat-icon" style="background: #ef4444;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.obesity_rate}%</h3>
                    <p>Obesity Rate</p>
                </div>
            </div>
        </div>
    `;
}

function createCommunityCharts(data) {
    // Risk distribution chart
    const riskCtx = document.getElementById('riskChart');
    if (riskCtx) {
        const ctx = riskCtx.getContext('2d');
        const riskData = data.community_analysis.community_stats.health_risk_distribution;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [riskData.low_risk, riskData.medium_risk, riskData.high_risk],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            color: '#6b7280'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Health Risk Distribution',
                        color: '#1f2937',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }
    
    // Regional data chart
    const regionalCtx = document.getElementById('regionalChart');
    if (regionalCtx) {
        const ctx = regionalCtx.getContext('2d');
        const regions = Object.keys(data.regional_data);
        const obesityRates = regions.map(region => data.regional_data[region].obesity_rate);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regions,
                datasets: [{
                    label: 'Obesity Rate (%)',
                    data: obesityRates,
                    backgroundColor: '#3b82f6',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Obesity Rates by Region',
                        color: '#1f2937',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 40,
                        title: {
                            display: true,
                            text: 'Obesity Rate (%)',
                            color: '#6b7280'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }
}

function displayCommunityPosts(posts) {
    const container = document.getElementById('community-posts');
    if (!container) return;
    
    container.innerHTML = posts.map(post => `
        <div class="community-post" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-user">
                    <div class="user-avatar">${post.avatar}</div>
                    <div>
                        <div class="user-name">${post.user}</div>
                        <div class="post-time">${post.time}</div>
                    </div>
                </div>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-actions">
                <button class="btn-like" onclick="likePost(${post.id})">
                    <i class="fas fa-thumbs-up"></i> Like (${post.likes})
                </button>
                <button class="btn-comment" onclick="showCommentBox(${post.id})">
                    <i class="fas fa-comment"></i> Comment (${post.comments})
                </button>
                <button class="btn-share" onclick="sharePost(${post.id})">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        </div>
    `).join('');
}

function postCommunityMessage() {
    const messageInput = document.getElementById('community-message');
    if (!messageInput) {
        Toast.show('Message input not found', 'error');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) {
        Toast.show('Please enter a message', 'warning');
        return;
    }
    
    const newPost = {
        id: Date.now(),
        user: currentUser.name,
        avatar: currentUser.name.split(' ').map(n => n[0]).join(''),
        time: 'Just now',
        content: message,
        likes: 0,
        comments: 0
    };
    
    const container = document.getElementById('community-posts');
    if (container) {
        const postHTML = `
            <div class="community-post" data-post-id="${newPost.id}">
                <div class="post-header">
                    <div class="post-user">
                        <div class="user-avatar">${newPost.avatar}</div>
                        <div>
                            <div class="user-name">${newPost.user}</div>
                            <div class="post-time">${newPost.time}</div>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    ${newPost.content}
                </div>
                <div class="post-actions">
                    <button class="btn-like" onclick="likePost(${newPost.id})">
                        <i class="fas fa-thumbs-up"></i> Like (${newPost.likes})
                    </button>
                    <button class="btn-comment" onclick="showCommentBox(${newPost.id})">
                        <i class="fas fa-comment"></i> Comment (${newPost.comments})
                    </button>
                    <button class="btn-share" onclick="sharePost(${newPost.id})">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', postHTML);
    }
    
    messageInput.value = '';
    Toast.show('Message posted successfully!', 'success');
}

function likePost(postId) {
    const post = document.querySelector(`[data-post-id="${postId}"]`);
    if (post) {
        const likeBtn = post.querySelector('.btn-like');
        if (likeBtn) {
            const currentText = likeBtn.innerHTML;
            const likeMatch = currentText.match(/Like\s*\((\d+)\)/);
            const currentLikes = likeMatch ? parseInt(likeMatch[1]) : 0;
            likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Like (${currentLikes + 1})`;
            likeBtn.style.color = '#3b82f6';
            
            // Reset color after 1 second
            setTimeout(() => {
                likeBtn.style.color = '';
            }, 1000);
            
            Toast.show('Post liked!', 'success');
        }
    }
}

function showCommentBox(postId) {
    const comment = prompt('Enter your comment:');
    if (comment && comment.trim()) {
        const post = document.querySelector(`[data-post-id="${postId}"]`);
        if (post) {
            const commentBtn = post.querySelector('.btn-comment');
            if (commentBtn) {
                const currentText = commentBtn.innerHTML;
                const commentMatch = currentText.match(/Comment\s*\((\d+)\)/);
                const currentComments = commentMatch ? parseInt(commentMatch[1]) : 0;
                commentBtn.innerHTML = `<i class="fas fa-comment"></i> Comment (${currentComments + 1})`;
                Toast.show('Comment added!', 'success');
            }
        }
    }
}

function sharePost(postId) {
    Toast.show('Post shared to your profile!', 'success');
    
    // In a real app, this would use the Web Share API
    if (navigator.share) {
        navigator.share({
            title: 'NutriAI Community Post',
            text: 'Check out this post from the NutriAI community!',
            url: window.location.href
        });
    }
}

// Authentication functions
async function handleLogin(event) {
    if (event) event.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        Toast.show('Login form not found', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        Toast.show('Please fill in all fields', 'error');
        return;
    }
    
    Toast.show('Logging in...', 'info');
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock successful login
        currentUser = {
            id: 'user_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            age: 30,
            weight: 75,
            height: 175,
            bmi: 24.5,
            goal: 'Maintain Weight'
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        
        Toast.show('Login successful!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        Toast.show('Login failed. Please check your credentials.', 'error');
    }
}

function handleDemoLogin() {
    document.getElementById('email').value = 'demo@nutriai.com';
    document.getElementById('password').value = 'demo123';
    handleLogin();
}

async function handleSignup(event) {
    if (event) event.preventDefault();
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        Toast.show('Signup form not found', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!name || !email || !password || !confirmPassword) {
        Toast.show('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        Toast.show('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        Toast.show('Password must be at least 6 characters', 'error');
        return;
    }
    
    Toast.show('Creating your account...', 'info');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        currentUser = {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            age: 25,
            weight: 70,
            height: 170,
            bmi: 24.2,
            goal: 'Maintain Weight'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        
        Toast.show('Account created successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        Toast.show('Signup failed. Please try again.', 'error');
    }
}

function handleForgotPassword() {
    const email = prompt('Enter your email address:');
    if (email && email.includes('@')) {
        Toast.show(`Password reset link sent to ${email}`, 'success');
    } else {
        Toast.show('Please enter a valid email address', 'error');
    }
}

function handleLogout() {
    Modal.open('Confirm Logout', 
        'Are you sure you want to logout?',
        {
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', action: 'Modal.close()' },
                { text: 'Logout', class: 'btn-danger', action: 'confirmLogout()' }
            ]
        }
    );
}

function confirmLogout() {
    localStorage.removeItem('currentUser');
    localStorage.setItem('isLoggedIn', 'false');
    Modal.close();
    Toast.show('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const savedUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn && savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Update UI based on login status
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userMenu = document.querySelector('.user-menu');
    
    if (isLoggedIn) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (userMenu) {
            const userName = document.querySelector('.user-name');
            if (userName) {
                userName.textContent = currentUser.name.split(' ')[0];
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Redirect to login if trying to access protected pages
        const protectedPages = ['dashboard.html', 'nutrition.html', 'community.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
}

// Utility functions
function shareAnalysis() {
    if (!lastAnalysis) {
        Toast.show('No analysis available to share', 'warning');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'My Nutrition Analysis',
            text: `I analyzed my meal and got a score of ${lastAnalysis.meal_score}/100! Check it out.`,
            url: window.location.href
        }).then(() => {
            Toast.show('Analysis shared successfully!', 'success');
        }).catch(error => {
            console.error('Error sharing:', error);
            Toast.show('Sharing cancelled', 'info');
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `I analyzed my meal and got a score of ${lastAnalysis.meal_score}/100!`;
        prompt('Copy this link to share:', shareText);
        Toast.show('Share text copied to clipboard', 'success');
    }
}

function showDetailedReport() {
    if (!lastAnalysis) {
        Toast.show('No analysis available', 'warning');
        return;
    }
    
    let reportHTML = `
        <div class="detailed-report">
            <h4>Complete Nutrient Breakdown</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Nutrient</th>
                        <th>Amount</th>
                        <th>Daily Target</th>
                        <th>% of Target</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const nutrients = lastAnalysis.nutrition_analysis;
    const targets = lastAnalysis.daily_targets;
    
    for (const [key, value] of Object.entries(nutrients)) {
        if (targets[key]) {
            const percent = ((value / targets[key]) * 100).toFixed(1);
            const unit = key === 'calories' ? 'kcal' : 
                        key === 'sodium' ? 'mg' : 'g';
            
            reportHTML += `
                <tr>
                    <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                    <td>${typeof value === 'number' ? value.toFixed(1) : value}${unit}</td>
                    <td>${targets[key]}${unit}</td>
                    <td>${percent}%</td>
                </tr>
            `;
        }
    }
    
    reportHTML += `
                </tbody>
            </table>
            
            <div class="report-summary">
                <h5>Summary</h5>
                <p><strong>Meal Score:</strong> ${lastAnalysis.meal_score}/100</p>
                <p><strong>Health Risk:</strong> ${lastAnalysis.health_risk.level}</p>
                <p><strong>BMI:</strong> ${lastAnalysis.bmi.value} (${lastAnalysis.bmi.category})</p>
            </div>
        </div>
    `;
    
    Modal.open('Detailed Analysis Report',
        reportHTML,
        {
            buttons: [
                { text: 'Close', class: 'btn-secondary', action: 'Modal.close()' },
                { text: 'Export as PDF', class: 'btn-primary', action: 'exportReport()' }
            ]
        }
    );
}

function exportReport() {
    Toast.show('Exporting report as PDF...', 'info');
    setTimeout(() => {
        Toast.show('Report exported successfully!', 'success');
        Modal.close();
    }, 1500);
}

function showProfile() {
    Modal.open('Profile Settings',
        `
        <div class="profile-content">
            <div class="profile-header">
                <div class="user-avatar-large">${currentUser.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                    <h4>${currentUser.name}</h4>
                    <p>${currentUser.email}</p>
                </div>
            </div>
            
            <div class="profile-info">
                <div class="info-item">
                    <label>Age</label>
                    <input type="number" id="profile-age" value="${currentUser.age}" min="1" max="120">
                </div>
                <div class="info-item">
                    <label>Weight (kg)</label>
                    <input type="number" id="profile-weight" value="${currentUser.weight}" min="20" max="200" step="0.1">
                </div>
                <div class="info-item">
                    <label>Height (cm)</label>
                    <input type="number" id="profile-height" value="${currentUser.height}" min="100" max="250">
                </div>
                <div class="info-item">
                    <label>Daily Calorie Goal</label>
                    <input type="range" id="calorie-goal" min="1200" max="3000" value="2200" step="50">
                    <span id="calorie-goal-value">2200 kcal</span>
                </div>
            </div>
        </div>
        `,
        {
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', action: 'Modal.close()' },
                { text: 'Save Changes', class: 'btn-primary', action: 'saveProfile()' }
            ]
        }
    );
    
    // Setup calorie goal slider
    const calorieSlider = document.getElementById('calorie-goal');
    const calorieValue = document.getElementById('calorie-goal-value');
    if (calorieSlider && calorieValue) {
        calorieSlider.addEventListener('input', function() {
            calorieValue.textContent = `${this.value} kcal`;
        });
    }
}

function saveProfile() {
    const age = document.getElementById('profile-age')?.value;
    const weight = document.getElementById('profile-weight')?.value;
    const height = document.getElementById('profile-height')?.value;
    const calorieGoal = document.getElementById('calorie-goal')?.value;
    
    if (age) currentUser.age = parseInt(age);
    if (weight) currentUser.weight = parseFloat(weight);
    if (height) currentUser.height = parseInt(height);
    if (calorieGoal) currentUser.calorieGoal = parseInt(calorieGoal);
    
    // Recalculate BMI
    if (weight && height) {
        const heightM = height / 100;
        currentUser.bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    Modal.close();
    Toast.show('Profile updated successfully!', 'success');
}

function toggleNotifications() {
    const notifications = [
        { id: 1, title: 'Water Reminder', message: 'Time to drink water! Stay hydrated.', time: '10 min ago' },
        { id: 2, title: 'Meal Time', message: 'Don\'t forget to log your lunch!', time: '1 hour ago' },
        { id: 3, title: 'Weekly Report', message: 'Your weekly nutrition report is ready.', time: '1 day ago' }
    ];
    
    let notificationsHTML = `
        <div class="notifications-list">
            <h4>Notifications</h4>
    `;
    
    notifications.forEach(notif => {
        notificationsHTML += `
            <div class="notification-item">
                <div class="notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${notif.time}</div>
                </div>
            </div>
        `;
    });
    
    notificationsHTML += `</div>`;
    
    Modal.open('Notifications', notificationsHTML, {
        buttons: [
            { text: 'Close', class: 'btn-secondary', action: 'Modal.close()' },
            { text: 'Mark All as Read', class: 'btn-primary', action: 'markNotificationsAsRead()' }
        ]
    });
}

function markNotificationsAsRead() {
    Toast.show('All notifications marked as read', 'success');
    Modal.close();
}

function addCustomNutrient() {
    const nutrient = prompt('Enter nutrient name:', '');
    if (nutrient && nutrient.trim()) {
        Toast.show(`Added custom nutrient: ${nutrient}`, 'success');
    }
}

// Initialize mock data functions
function loadMockDashboardData() {
    const mockData = {
        user_profile: {
            username: currentUser.name,
            age: currentUser.age,
            weight: currentUser.weight,
            height: currentUser.height,
            goal: 'Maintain Weight',
            activity_level: 'Moderately Active'
        },
        current_status: {
            bmi: { value: currentUser.bmi, category: 'Normal' },
            weight_trend: -0.5,
            weekly_progress: 75
        },
        history: {
            last_7_days: {
                avg_calories: 2150,
                meals_logged: 21,
                avg_health_score: 82,
                water_intake: 2.1
            },
            last_30_days: {
                weight_change: -1.2,
                meals_analyzed: 89,
                avg_meal_score: 78
            }
        }
    };
    
    updateDashboardUI(mockData);
}

function displayMockNutritionOverview() {
    const mockData = {
        daily_targets: {
            calories: 2200,
            protein: 90,
            carbs: 275,
            fats: 73,
            fiber: 30,
            sugar: 36,
            sodium: 2300
        },
        bmi: {
            value: currentUser.bmi,
            category: 'Normal'
        },
        health_risk: {
            level: 'Low Risk',
            score: 0
        },
        todays_intake: {
            calories: 850,
            protein: 35,
            carbs: 110,
            fats: 28,
            fiber: 12,
            water: 1.5
        },
        nutrient_deficiencies: ['Vitamin D', 'Calcium'],
        recommendations: [
            'Increase calcium intake with dairy or leafy greens',
            'Get 15 minutes of sunlight daily for Vitamin D',
            'Drink at least 1 more liter of water today'
        ]
    };
    
    displayNutritionOverview(mockData);
}

function displayMockCommunityData() {
    const mockData = {
        community_analysis: {
            community_stats: {
                sample_size: 1542,
                avg_bmi: 25.8,
                obesity_rate: 28.5,
                avg_health_score: 76,
                health_risk_distribution: {
                    low_risk: 65,
                    medium_risk: 25,
                    high_risk: 10
                }
            }
        },
        regional_data: {
            'North America': { obesity_rate: 32.5, avg_bmi: 26.2 },
            'Europe': { obesity_rate: 22.8, avg_bmi: 24.8 },
            'Asia': { obesity_rate: 18.2, avg_bmi: 23.5 },
            'South America': { obesity_rate: 26.7, avg_bmi: 25.5 }
        },
        recent_posts: [
            {
                id: 1,
                user: 'Sarah M.',
                avatar: 'SM',
                time: '2 hours ago',
                content: 'Just completed my first week of healthy eating! Feeling great and already lost 1kg!',
                likes: 24,
                comments: 8
            },
            {
                id: 2,
                user: 'Mike T.',
                avatar: 'MT',
                time: '5 hours ago',
                content: 'Does anyone have good low-carb lunch ideas for office workers?',
                likes: 15,
                comments: 12
            }
        ]
    };
    
    displayCommunityStats(mockData);
    createCommunityCharts(mockData);
    displayCommunityPosts(mockData.recent_posts);
}

// Make functions globally available
window.addFoodItem = addFoodItem;
window.addFoodItemByName = addFoodItemByName;
window.removeFoodItem = removeFoodItem;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.analyzeMeal = analyzeMeal;
window.clearAllFoodItems = clearAllFoodItems;
window.confirmClearAll = confirmClearAll;
window.saveMeal = saveMeal;
window.shareAnalysis = shareAnalysis;
window.showDetailedReport = showDetailedReport;
window.showProfile = showProfile;
window.toggleNotifications = toggleNotifications;
window.handleLogin = handleLogin;
window.handleDemoLogin = handleDemoLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.confirmLogout = confirmLogout;
window.Modal = Modal;
window.Toast = Toast;
window.loadDashboardData = loadDashboardData;
window.loadNutritionData = loadNutritionData;
window.loadCommunityData = loadCommunityData;
window.refreshDashboardData = refreshDashboardData;
window.viewDetails = viewDetails;
window.exportDashboardData = exportDashboardData;
window.updateGoal = updateGoal;
window.logMeal = logMeal;
window.trackWater = trackWater;
window.generateNutritionReport = generateNutritionReport;
window.setReminders = setReminders;
window.postCommunityMessage = postCommunityMessage;
window.likePost = likePost;
window.showCommentBox = showCommentBox;
window.sharePost = sharePost;
window.addCustomNutrient = addCustomNutrient;