// Admin Panel JavaScript
console.log("NutriAI Admin Panel Initialized");

// Global state
let adminState = {
    participants: [],
    models: [],
    analytics: {},
    lastUpdate: new Date()
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    loadDashboardData();
    setupEventListeners// Admin Panel JavaScript
console.log("NutriAI Admin Panel Initialized");

// Global state
let adminState = {
    participants: [],
    models: [],
    analytics: {},
    lastUpdate: new Date()
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    loadDashboardData();
    setupEventListeners();
    loadParticipants();
    loadModels();
    updateLastSyncTime();
    
    // Auto-refresh every 30 seconds
    setInterval(refreshData, 30000);
});

function initializeAdminPanel() {
    console.log("Initializing Admin Panel...");
    
    // Set up navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Load mock data for demonstration
    loadMockData();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target section
            const targetId = this.getAttribute('href').substring(1);
            
            // Update active state
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            document.getElementById(targetId).style.display = 'block';
            
            // Load section-specific data
            switch(targetId) {
                case 'users':
                    loadParticipants();
                    break;
                case 'analytics':
                    loadAnalytics();
                    break;
                case 'models':
                    loadModels();
                    break;
                case 'data':
                    loadDataManagement();
                    break;
            }
        });
    });
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchParticipants(this.value);
        });
    }
    
    // Analytics period selector
    const periodSelect = document.getElementById('analytics-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            loadAnalytics(this.value);
        });
    }
    
    // Refresh button
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    // Export button
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboard);
    }
}

// Dashboard Functions
function loadDashboardData() {
    console.log("Loading dashboard data...");
    
    // Update stats
    updateStats();
    
    // Load charts
    loadDashboardCharts();
    
    // Load recent activity
    loadRecentActivity();
}

function updateStats() {
    // Update participant count
    document.getElementById('total-participants').textContent = '1,542';
    document.getElementById('total-meals').textContent = '45,827';
    document.getElementById('avg-risk').textContent = 'Medium';
    document.getElementById('model-accuracy').textContent = '94.2%';
    
    // Update data management stats
    document.getElementById('total-data-points').textContent = '156,382';
    document.getElementById('data-quality').textContent = '96.5%';
    document.getElementById('storage-used').textContent = '2.9 GB';
    document.getElementById('last-backup').textContent = '2 hours';
}

function loadDashboardCharts() {
    // Participation Growth Chart
    const participationCtx = document.getElementById('participationChart');
    if (participationCtx) {
        new Chart(participationCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'New Participants',
                    data: [120, 145, 180, 210, 195, 230, 250],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Participants'
                        }
                    }
                }
            }
        });
    }
    
    // Risk Distribution Chart
    const riskCtx = document.getElementById('riskChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function loadRecentActivity() {
    // This would typically come from an API
    const activities = [
        { type: 'success', text: 'New participant enrolled in nutrition study', time: '2 minutes ago' },
        { type: 'warning', text: 'AI model retrained with 95.1% accuracy', time: '15 minutes ago' },
        { type: 'info', text: 'Data export completed for monthly report', time: '1 hour ago' },
        { type: 'success', text: 'Research paper submitted to journal', time: '3 hours ago' }
    ];
    
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        // Keep existing items, just update times
        const activityItems = activityList.querySelectorAll('.activity-item');
        activities.forEach((activity, index) => {
            if (activityItems[index]) {
                const timeSpan = activityItems[index].querySelector('.activity-time');
                if (timeSpan) {
                    timeSpan.textContent = activity.time;
                }
            }
        });
    }
}

// Participants Management
function loadParticipants() {
    console.log("Loading participants data...");
    
    // Mock data
    const participants = [
        { id: 'P001', ageGroup: '26-35', region: 'Urban', healthScore: 85, riskLevel: 'Low', dataPoints: 342, status: 'Active' },
        { id: 'P002', ageGroup: '36-50', region: 'Suburban', healthScore: 72, riskLevel: 'Medium', dataPoints: 189, status: 'Active' },
        { id: 'P003', ageGroup: '18-25', region: 'Urban', healthScore: 91, riskLevel: 'Low', dataPoints: 456, status: 'Active' },
        { id: 'P004', ageGroup: '51-65', region: 'Rural', healthScore: 68, riskLevel: 'Medium', dataPoints: 234, status: 'Inactive' },
        { id: 'P005', ageGroup: '26-35', region: 'Urban', healthScore: 78, riskLevel: 'Medium', dataPoints: 312, status: 'Active' },
        { id: 'P006', ageGroup: '36-50', region: 'Suburban', healthScore: 94, riskLevel: 'Low', dataPoints: 521, status: 'Active' },
        { id: 'P007', ageGroup: '18-25', region: 'Urban', healthScore: 61, riskLevel: 'High', dataPoints: 187, status: 'Active' },
        { id: 'P008', ageGroup: '51-65', region: 'Rural', healthScore: 82, riskLevel: 'Low', dataPoints: 276, status: 'Active' }
    ];
    
    adminState.participants = participants;
    renderParticipantsTable(participants);
    loadDemographicCharts(participants);
}

function renderParticipantsTable(participants) {
    const tableBody = document.getElementById('participants-list');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    participants.forEach(participant => {
        const row = document.createElement('tr');
        
        // Determine risk color
        let riskColor = '#2ecc71'; // Low - green
        if (participant.riskLevel === 'Medium') riskColor = '#f39c12'; // Medium - orange
        if (participant.riskLevel === 'High') riskColor = '#e74c3c'; // High - red
        
        // Determine status badge
        let statusBadge = participant.status === 'Active' ? 
            '<span class="status-badge active">Active</span>' : 
            '<span class="status-badge inactive">Inactive</span>';
        
        row.innerHTML = `
            <td><strong>${participant.id}</strong></td>
            <td>${participant.ageGroup}</td>
            <td>${participant.region}</td>
            <td>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${participant.healthScore}%; background: ${riskColor};"></div>
                    <span>${participant.healthScore}</span>
                </div>
            </td>
            <td><span class="risk-badge" style="background: ${riskColor};">${participant.riskLevel}</span></td>
            <td>${participant.dataPoints}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-small" onclick="viewParticipant('${participant.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-small" onclick="editParticipant('${participant.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-danger" onclick="deleteParticipant('${participant.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function searchParticipants(query) {
    if (!query.trim()) {
        renderParticipantsTable(adminState.participants);
        return;
    }
    
    const filtered = adminState.participants.filter(participant => 
        participant.id.toLowerCase().includes(query.toLowerCase()) ||
        participant.ageGroup.toLowerCase().includes(query.toLowerCase()) ||
        participant.region.toLowerCase().includes(query.toLowerCase()) ||
        participant.riskLevel.toLowerCase().includes(query.toLowerCase())
    );
    
    renderParticipantsTable(filtered);
}

function loadDemographicCharts(participants) {
    // Age Group Chart
    const ageCtx = document.getElementById('ageChart');
    if (ageCtx) {
        const ageGroups = {};
        participants.forEach(p => {
            ageGroups[p.ageGroup] = (ageGroups[p.ageGroup] || 0) + 1;
        });
        
        new Chart(ageCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    label: 'Participants',
                    data: Object.values(ageGroups),
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Age Distribution'
                    }
                }
            }
        });
    }
    
    // Region Chart
    const regionCtx = document.getElementById('regionChart');
    if (regionCtx) {
        const regions = {};
        participants.forEach(p => {
            regions[p.region] = (regions[p.region] || 0) + 1;
        });
        
        new Chart(regionCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(regions),
                datasets: [{
                    data: Object.values(regions),
                    backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Regional Distribution'
                    }
                }
            }
        });
    }
    
    // Gender Chart (mock data)
    const genderCtx = document.getElementById('genderChart');
    if (genderCtx) {
        new Chart(genderCtx, {
            type: 'doughnut',
            data: {
                labels: ['Male', 'Female', 'Other'],
                datasets: [{
                    data: [52, 45, 3],
                    backgroundColor: ['#3498db', '#e74c3c', '#2ecc71']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Gender Distribution'
                    }
                }
            }
        });
    }
}

// Analytics Functions
function loadAnalytics(period = '30d') {
    console.log(`Loading analytics for period: ${period}`);
    
    // Load nutrition trends chart
    loadNutritionTrendsChart(period);
    
    // Load health outcomes chart
    loadHealthOutcomesChart(period);
    
    // Load correlation chart
    loadCorrelationChart();
    
    // Load predictive insights
    loadPredictiveInsights();
}

function loadNutritionTrendsChart(period) {
    const ctx = document.getElementById('nutritionTrendsChart');
    if (!ctx) return;
    
    // Mock data based on period
    let labels, calorieData, proteinData;
    
    switch(period) {
        case '7d':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            calorieData = [2100, 2250, 2050, 2300, 2150, 2400, 1900];
            proteinData = [85, 92, 78, 95, 88, 102, 72];
            break;
        case '30d':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            calorieData = [2150, 2200, 2180, 2100];
            proteinData = [88, 92, 90, 85];
            break;
        default:
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            calorieData = [2200, 2180, 2150, 2100, 2080, 2050];
            proteinData = [90, 88, 87, 85, 84, 82];
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Avg Calories',
                    data: calorieData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Avg Protein (g)',
                    data: proteinData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Nutrition Trends Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function loadHealthOutcomesChart(period) {
    const ctx = document.getElementById('healthOutcomesChart');
    if (!ctx) return;
    
    // Mock data
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Low BMI', 'Normal BMI', 'Overweight', 'Obese'],
            datasets: [{
                label: 'Participants',
                data: [15, 65, 45, 25],
                backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'BMI Distribution'
                }
            }
        }
    });
}

function loadCorrelationChart() {
    const ctx = document.getElementById('correlationChart');
    if (!ctx) return;
    
    // Mock correlation matrix
    const correlationData = {
        labels: ['Calories', 'Protein', 'Carbs', 'Fats', 'Sugar', 'BMI', 'Activity'],
        datasets: [{
            label: 'Correlation',
            data: [
                1.00, 0.65, 0.85, 0.72, 0.45, 0.78, -0.62,
                0.65, 1.00, 0.45, 0.32, 0.18, 0.25, -0.45,
                0.85, 0.45, 1.00, 0.68, 0.52, 0.65, -0.58,
                0.72, 0.32, 0.68, 1.00, 0.42, 0.72, -0.52,
                0.45, 0.18, 0.52, 0.42, 1.00, 0.48, -0.38,
                0.78, 0.25, 0.65, 0.72, 0.48, 1.00, -0.68,
                -0.62, -0.45, -0.58, -0.52, -0.38, -0.68, 1.00
            ],
            backgroundColor: function(context) {
                const value = context.dataset.data[context.dataIndex];
                let alpha = Math.abs(value);
                let color = value > 0 ? '52, 152, 219' : '231, 76, 60';
                return `rgba(${color}, ${alpha})`;
            }
        }]
    };
    
    new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [correlationData]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Feature Correlation Matrix'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const row = context.row;
                            const column = context.column;
                            const value = context.dataset.data[context.dataIndex];
                            const rowLabel = correlationData.labels[row];
                            const colLabel = correlationData.labels[column];
                            return `${rowLabel} vs ${colLabel}: ${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function loadPredictiveInsights() {
    const insightsContainer = document.getElementById('predictive-insights');
    if (!insightsContainer) return;
    
    const insights = [
        {
            title: "Sugar Intake Impact",
            description: "Participants consuming >50g sugar daily have 3.2x higher diabetes risk",
            confidence: "High (92%)"
        },
        {
            title: "Protein & Muscle Mass",
            description: "Each 10g increase in daily protein correlates with +1.2% muscle mass",
            confidence: "Medium (78%)"
        },
        {
            title: "Sleep & Weight Loss",
            description: "7+ hours sleep increases weight loss success by 45%",
            confidence: "High (88%)"
        },
        {
            title: "Activity vs BMI",
            description: "30 min daily activity reduces BMI by 0.8 points on average",
            confidence: "High (91%)"
        }
    ];
    
    insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <h4>${insight.title}</h4>
            <p>${insight.description}</p>
            <div class="insight-meta">
                <span class="confidence">Confidence: ${insight.confidence}</span>
            </div>
        </div>
    `).join('');
}

function runAdvancedAnalysis() {
    console.log("Running advanced analysis...");
    
    // Show loading state
    const runBtn = document.querySelector('#analytics .btn-primary');
    const originalText = runBtn.innerHTML;
    runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    runBtn.disabled = true;
    
    // Simulate analysis
    setTimeout(() => {
        // Update charts with new data
        loadAnalytics(document.getElementById('analytics-period').value);
        
        // Show success message
        showNotification('Advanced analysis completed successfully!', 'success');
        
        // Restore button
        runBtn.innerHTML = originalText;
        runBtn.disabled = false;
    }, 2000);
}

// Model Management
function loadModels() {
    console.log("Loading AI models data...");
    
    // Load model performance chart
    loadModelPerformanceChart();
}

function loadModelPerformanceChart() {
    const ctx = document.getElementById('modelPerformanceChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Nutrition Analyzer',
                    data: [89.2, 90.5, 91.8, 92.3, 93.1, 93.8, 94.2],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Risk Predictor',
                    data: [85.5, 86.8, 88.2, 89.1, 90.3, 90.8, 91.0],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Health Monitor',
                    data: [82.1, 84.3, 85.8, 86.5, 87.2, 87.8, 88.5],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Model Accuracy Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 80,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Accuracy (%)'
                    }
                }
            }
        }
    });
}

function trainNewModel() {
    console.log("Training new AI model...");
    
    // Show confirmation dialog
    if (!confirm('Start training a new AI model? This may take several minutes.')) {
        return;
    }
    
    // Show loading state
    const trainBtn = document.querySelector('#models .btn-primary');
    const originalText = trainBtn.innerHTML;
    trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training...';
    trainBtn.disabled = true;
    
    // Simulate training
    setTimeout(() => {
        // Update model status
        const modelCard = document.querySelector('.model-card:last-child');
        if (modelCard) {
            const statusSpan = modelCard.querySelector('.model-status');
            if (statusSpan) {
                statusSpan.textContent = 'Active';
                statusSpan.className = 'model-status active';
            }
            
            const retrainBtn = modelCard.querySelector('.btn-small:last-child');
            if (retrainBtn) {
                retrainBtn.innerHTML = '<i class="fas fa-sync"></i> Retrain';
                retrainBtn.disabled = false;
                retrainBtn.classList.remove('disabled');
                retrainBtn.onclick = function() { retrainModel('community'); };
            }
        }
        
        // Show success message
        showNotification('New AI model trained successfully! Accuracy: 95.1%', 'success');
        
        // Restore button
        trainBtn.innerHTML = originalText;
        trainBtn.disabled = false;
        
        // Refresh performance chart
        loadModelPerformanceChart();
    }, 3000);
}

function retrainModel(modelType) {
    console.log(`Retraining ${modelType} model...`);
    
    // Show loading state
    showNotification(`Retraining ${modelType} model...`, 'info');
    
    // Simulate retraining
    setTimeout(() => {
        showNotification(`${modelType} model retrained successfully!`, 'success');
        loadModelPerformanceChart();
    }, 2000);
}

function evaluateModels() {
    console.log("Evaluating all models...");
    
    // Show loading state
    const evaluateBtn = document.querySelector('#models .btn-secondary');
    const originalText = evaluateBtn.innerHTML;
    evaluateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Evaluating...';
    evaluateBtn.disabled = true;
    
    // Simulate evaluation
    setTimeout(() => {
        // Update model metrics
        const modelCards = document.querySelectorAll('.model-card');
        
        // Update nutrition analyzer
        if (modelCards[0]) {
            const metrics = modelCards[0].querySelectorAll('.metric-value');
            metrics[0].textContent = '94.8%';
            metrics[1].textContent = '93.2%';
            metrics[2].textContent = '94.1%';
        }
        
        // Update risk predictor
        if (modelCards[1]) {
            const metrics = modelCards[1].querySelectorAll('.metric-value');
            metrics[0].textContent = '0.92';
            metrics[1].textContent = '90.5%';
            metrics[2].textContent = '92.8%';
        }
        
        showNotification('All models evaluated successfully!', 'success');
        
        // Restore button
        evaluateBtn.innerHTML = originalText;
        evaluateBtn.disabled = false;
    }, 2500);
}

function viewModelDetails(modelType) {
    alert(`Viewing details for ${modelType} model\n\nThis would show detailed model architecture, training parameters, and performance metrics.`);
}

// Data Management
function loadDataManagement() {
    console.log("Loading data management...");
    
    // Load recent data entries
    loadRecentData();
    
    // Load data quality issues
    loadDataIssues();
}

function loadRecentData() {
    const tbody = document.getElementById('recent-data');
    if (!tbody) return;
    
    const recentData = [
        { timestamp: '2024-01-15 14:30', type: 'Nutrition Log', participant: 'P001', value: '650 calories', quality: 'Good' },
        { timestamp: '2024-01-15 14:25', type: 'Health Metric', participant: 'P003', value: 'BP: 120/80', quality: 'Excellent' },
        { timestamp: '2024-01-15 14:20', type: 'Survey Response', participant: 'P002', value: 'Sleep: 7.5 hours', quality: 'Good' },
        { timestamp: '2024-01-15 14:15', type: 'Nutrition Log', participant: 'P005', value: 'Protein: 45g', quality: 'Fair' },
        { timestamp: '2024-01-15 14:10', type: 'Activity Data', participant: 'P004', value: 'Steps: 8,542', quality: 'Excellent' }
    ];
    
    tbody.innerHTML = recentData.map(entry => `
        <tr>
            <td>${entry.timestamp}</td>
            <td>${entry.type}</td>
            <td>${entry.participant}</td>
            <td>${entry.value}</td>
            <td><span class="quality-badge ${entry.quality.toLowerCase()}">${entry.quality}</span></td>
        </tr>
    `).join('');
}

function loadDataIssues() {
    const tbody = document.getElementById('data-issues');
    if (!tbody) return;
    
    const issues = [
        { type: 'Missing Values', count: 342, severity: 'Low', action: 'Auto-fill' },
        { type: 'Outliers', count: 128, severity: 'Medium', action: 'Review' },
        { type: 'Inconsistent Units', count: 45, severity: 'High', action: 'Convert' },
        { type: 'Duplicate Entries', count: 23, severity: 'Low', action: 'Remove' },
        { type: 'Timing Errors', count: 12, severity: 'Medium', action: 'Correct' }
    ];
    
    tbody.innerHTML = issues.map(issue => {
        let severityClass = 'low';
        if (issue.severity === 'Medium') severityClass = 'medium';
        if (issue.severity === 'High') severityClass = 'high';
        
        return `
            <tr>
                <td>${issue.type}</td>
                <td>${issue.count}</td>
                <td><span class="severity-badge ${severityClass}">${issue.severity}</span></td>
                <td><button class="btn-small" onclick="resolveIssue('${issue.type}')">${issue.action}</button></td>
            </tr>
        `;
    }).join('');
}

function backupData() {
    console.log("Starting data backup...");
    
    // Show loading state
    const backupBtn = document.querySelector('#data .btn-primary');
    const originalText = backupBtn.innerHTML;
    backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backing up...';
    backupBtn.disabled = true;
    
    // Simulate backup
    setTimeout(() => {
        // Update last backup time
        document.getElementById('last-backup').textContent = 'Just now';
        
        showNotification('Data backup completed successfully!', 'success');
        
        // Restore button
        backupBtn.innerHTML = originalText;
        backupBtn.disabled = false;
    }, 3000);
}

function cleanData() {
    console.log("Cleaning data...");
    
    if (!confirm('Clean data by removing duplicates and fixing inconsistencies?')) {
        return;
    }
    
    // Show loading state
    const cleanBtn = document.querySelector('#data .btn-secondary');
    const originalText = cleanBtn.innerHTML;
    cleanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cleaning...';
    cleanBtn.disabled = true;
    
    // Simulate cleaning
    setTimeout(() => {
        // Update data quality
        document.getElementById('data-quality').textContent = '98.2%';
        
        // Clear issues table
        const tbody = document.getElementById('data-issues');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-issues">No data quality issues found!</td>
                </tr>
            `;
        }
        
        showNotification('Data cleaning completed! Data quality improved to 98.2%', 'success');
        
        // Restore button
        cleanBtn.innerHTML = originalText;
        cleanBtn.disabled = false;
    }, 2500);
}

function resolveIssue(issueType) {
    console.log(`Resolving issue: ${issueType}`);
    
    showNotification(`Resolving ${issueType.toLowerCase()}...`, 'info');
    
    setTimeout(() => {
        showNotification(`${issueType} resolved successfully!`, 'success');
        loadDataIssues(); // Refresh issues list
    }, 1000);
}

// Participant Modal Functions
function addParticipant() {
    const modal = document.getElementById('participantModal');
    modal.style.display = 'flex';
    
    // Reset form
    document.getElementById('participantForm').reset();
}

function closeModal() {
    const modal = document.getElementById('participantModal');
    modal.style.display = 'none';
}

function saveParticipant() {
    const form = document.getElementById('participantForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form values
    const participant = {
        id: document.getElementById('participantId').value,
        ageGroup: document.getElementById('ageGroup').value,
        gender: document.getElementById('gender').value,
        region: document.getElementById('region').value,
        weight: document.getElementById('weight').value,
        height: document.getElementById('height').value,
        age: document.getElementById('age').value,
        consents: {
            research: document.getElementById('consentResearch').checked,
            data: document.getElementById('consentData').checked,
            contact: document.getElementById('consentContact').checked
        }
    };
    
    console.log("Saving participant:", participant);
    
    // Add to state
    const newParticipant = {
        id: participant.id,
        ageGroup: participant.ageGroup,
        region: participant.region,
        healthScore: Math.floor(Math.random() * 30) + 70, // Random score 70-100
        riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        dataPoints: Math.floor(Math.random() * 200) + 100,
        status: 'Active'
    };
    
    adminState.participants.unshift(newParticipant);
    
    // Update UI
    renderParticipantsTable(adminState.participants);
    loadDemographicCharts(adminState.participants);
    
    // Close modal
    closeModal();
    
    // Show success message
    showNotification(`Participant ${participant.id} added successfully!`, 'success');
    
    // Update stats
    updateStats();
}

function viewParticipant(participantId) {
    const participant = adminState.participants.find(p => p.id === participantId);
    if (participant) {
        alert(`Participant Details:\n\nID: ${participant.id}\nAge Group: ${participant.ageGroup}\nRegion: ${participant.region}\nHealth Score: ${participant.healthScore}\nRisk Level: ${participant.riskLevel}\nData Points: ${participant.dataPoints}\nStatus: ${participant.status}`);
    }
}

function editParticipant(participantId) {
    const participant = adminState.participants.find(p => p.id === participantId);
    if (participant) {
        alert(`Edit participant ${participantId}\n\nThis would open an edit form with current values.`);
    }
}

function deleteParticipant(participantId) {
    if (!confirm(`Are you sure you want to delete participant ${participantId}?\n\nNote: This will anonymize their data but keep it for research purposes.`)) {
        return;
    }
    
    // Remove from state
    adminState.participants = adminState.participants.filter(p => p.id !== participantId);
    
    // Update UI
    renderParticipantsTable(adminState.participants);
    loadDemographicCharts(adminState.participants);
    
    showNotification(`Participant ${participantId} deleted (anonymized)`, 'warning');
}

// Utility Functions
function refreshData() {
    console.log("Refreshing all data...");
    
    // Update last update time
    adminState.lastUpdate = new Date();
    document.getElementById('last-update').textContent = 'Just now';
    
    // Refresh all sections
    loadDashboardData();
    if (document.getElementById('users').style.display === 'block') {
        loadParticipants();
    }
    if (document.getElementById('analytics').style.display === 'block') {
        loadAnalytics();
    }
    if (document.getElementById('models').style.display === 'block') {
        loadModels();
    }
    if (document.getElementById('data').style.display === 'block') {
        loadDataManagement();
    }
    
    showNotification('Data refreshed successfully!', 'success');
}

function exportDashboard() {
    console.log("Exporting dashboard data...");
    
    // Create export data
    const exportData = {
        timestamp: new Date().toISOString(),
        participants: adminState.participants.length,
        totalMeals: document.getElementById('total-meals').textContent,
        avgRisk: document.getElementById('avg-risk').textContent,
        modelAccuracy: document.getElementById('model-accuracy').textContent,
        exportType: 'dashboard_summary'
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nutriai_dashboard_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Dashboard data exported successfully!', 'success');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function updateLastSyncTime() {
    const syncElement = document.getElementById('sync-time');
    if (syncElement) {
        const now = new Date();
        syncElement.textContent = now.toLocaleString();
    }
}

function loadMockData() {
    // Additional mock data initialization
    console.log("Loading mock data for demonstration...");
    
    // Add some CSS for badges
    const style = document.createElement('style');
    style.textContent = `
        .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .status-badge.active {
            background: #d4edda;
            color: #155724;
        }
        .status-badge.inactive {
            background: #f8d7da;
            color: #721c24;
        }
        .risk-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
        }
        .score-bar {
            width: 80px;
            height: 20px;
            background: #eee;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        .score-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        .score-bar span {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #2c3e50;
        }
        .quality-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .quality-badge.excellent {
            background: #d4edda;
            color: #155724;
        }
        .quality-badge.good {
            background: #d1ecf1;
            color: #0c5460;
        }
        .quality-badge.fair {
            background: #fff3cd;
            color: #856404;
        }
        .severity-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
        }
        .severity-badge.low {
            background: #2ecc71;
        }
        .severity-badge.medium {
            background: #f39c12;
        }
        .severity-badge.high {
            background: #e74c3c;
        }
        .no-issues {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 20px !important;
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        .notification.success {
            border-left: 4px solid #2ecc71;
        }
        .notification.warning {
            border-left: 4px solid #f39c12;
        }
        .notification.info {
            border-left: 4px solid #3498db;
        }
        .notification-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            color: #7f8c8d;
            cursor: pointer;
            margin-left: 10px;
        }
        .btn-danger {
            background: #e74c3c;
            color: white;
        }
        .btn-danger:hover {
            background: #c0392b;
        }
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export functions for HTML onclick
window.refreshData = refreshData;
window.exportDashboard = exportDashboard;
window.addParticipant = addParticipant;
window.closeModal = closeModal;
window.saveParticipant = saveParticipant;
window.viewParticipant = viewParticipant;
window.editParticipant = editParticipant;
window.deleteParticipant = deleteParticipant;
window.trainNewModel = trainNewModel;
window.evaluateModels = evaluateModels;
window.retrainModel = retrainModel;
window.viewModelDetails = viewModelDetails;
window.backupData = backupData;
window.cleanData = cleanData;
window.runAdvancedAnalysis = runAdvancedAnalysis;
window.resolveIssue = resolveIssue;