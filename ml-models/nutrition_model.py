import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge, Lasso
from sklearn.svm import SVR, SVC
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
from sklearn.model_selection import cross_val_score, GridSearchCV, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures
import xgboost as xgb
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class NutritionAIModel:
    """AI Model for nutrition and health prediction"""
    
    def __init__(self, model_type='random_forest', task='regression'):
        """
        Initialize nutrition AI model
        
        Parameters:
        -----------
        model_type : str
            Type of model to use: 'random_forest', 'xgboost', 'svm', 'neural_network', 'ensemble'
        task : str
            Type of task: 'regression' or 'classification'
        """
        self.model_type = model_type
        self.task = task
        self.model = None
        self.best_params = None
        self.feature_importance = None
        self.scaler = None
        self.history = {
            'training_history': [],
            'validation_history': [],
            'best_score': 0,
            'training_time': 0
        }
        
    def build_model(self, input_shape=None, params=None):
        """Build the specified model architecture"""
        
        if self.task == 'regression':
            if self.model_type == 'random_forest':
                default_params = {
                    'n_estimators': 100,
                    'max_depth': 10,
                    'min_samples_split': 2,
                    'min_samples_leaf': 1,
                    'random_state': 42,
                    'n_jobs': -1
                }
                if params:
                    default_params.update(params)
                self.model = RandomForestRegressor(**default_params)
                
            elif self.model_type == 'xgboost':
                default_params = {
                    'n_estimators': 100,
                    'max_depth': 6,
                    'learning_rate': 0.1,
                    'subsample': 0.8,
                    'colsample_bytree': 0.8,
                    'random_state': 42,
                    'n_jobs': -1
                }
                if params:
                    default_params.update(params)
                self.model = xgb.XGBRegressor(**default_params)
                
            elif self.model_type == 'svm':
                default_params = {
                    'kernel': 'rbf',
                    'C': 1.0,
                    'epsilon': 0.1
                }
                if params:
                    default_params.update(params)
                self.model = SVR(**default_params)
                
            elif self.model_type == 'neural_network':
                default_params = {
                    'hidden_layer_sizes': (100, 50),
                    'activation': 'relu',
                    'solver': 'adam',
                    'alpha': 0.0001,
                    'learning_rate': 'constant',
                    'max_iter': 500,
                    'random_state': 42
                }
                if params:
                    default_params.update(params)
                self.model = MLPRegressor(**default_params)
                
            elif self.model_type == 'ensemble':
                # Create ensemble of multiple models
                from sklearn.ensemble import VotingRegressor
                
                rf = RandomForestRegressor(n_estimators=100, random_state=42)
                xgb_model = xgb.XGBRegressor(n_estimators=100, random_state=42)
                gb = GradientBoostingRegressor(n_estimators=100, random_state=42)
                
                self.model = VotingRegressor([
                    ('rf', rf),
                    ('xgb', xgb_model),
                    ('gb', gb)
                ])
                
        else:  # classification
            if self.model_type == 'random_forest':
                default_params = {
                    'n_estimators': 100,
                    'max_depth': 10,
                    'min_samples_split': 2,
                    'min_samples_leaf': 1,
                    'random_state': 42,
                    'n_jobs': -1,
                    'class_weight': 'balanced'
                }
                if params:
                    default_params.update(params)
                self.model = RandomForestClassifier(**default_params)
                
            elif self.model_type == 'xgboost':
                default_params = {
                    'n_estimators': 100,
                    'max_depth': 6,
                    'learning_rate': 0.1,
                    'subsample': 0.8,
                    'colsample_bytree': 0.8,
                    'random_state': 42,
                    'n_jobs': -1,
                    'scale_pos_weight': 1
                }
                if params:
                    default_params.update(params)
                self.model = xgb.XGBClassifier(**default_params)
                
            elif self.model_type == 'svm':
                default_params = {
                    'kernel': 'rbf',
                    'C': 1.0,
                    'probability': True,
                    'random_state': 42
                }
                if params:
                    default_params.update(params)
                self.model = SVC(**default_params)
                
            elif self.model_type == 'neural_network':
                default_params = {
                    'hidden_layer_sizes': (100, 50),
                    'activation': 'relu',
                    'solver': 'adam',
                    'alpha': 0.0001,
                    'learning_rate': 'constant',
                    'max_iter': 500,
                    'random_state': 42
                }
                if params:
                    default_params.update(params)
                self.model = MLPClassifier(**default_params)
                
        print(f"Built {self.model_type} model for {self.task} task")
        return self.model
    
    def train(self, X_train, y_train, X_val=None, y_val=None, hyperparameter_tuning=False):
        """
        Train the model
        
        Parameters:
        -----------
        X_train : array-like
            Training features
        y_train : array-like
            Training labels
        X_val : array-like, optional
            Validation features
        y_val : array-like, optional
            Validation labels
        hyperparameter_tuning : bool
            Whether to perform hyperparameter tuning
        """
        import time
        
        start_time = time.time()
        
        if self.model is None:
            self.build_model(input_shape=X_train.shape[1])
        
        if hyperparameter_tuning:
            print("Performing hyperparameter tuning...")
            self._hyperparameter_tuning(X_train, y_train)
        
        print(f"Training {self.model_type} model...")
        
        # Train the model
        self.model.fit(X_train, y_train)
        
        # Calculate training metrics
        train_predictions = self.predict(X_train)
        train_metrics = self.evaluate(y_train, train_predictions)
        
        # Store history
        self.history['training_history'].append({
            'iteration': len(self.history['training_history']) + 1,
            'train_score': train_metrics['score'],
            'train_loss': train_metrics.get('loss', None)
        })
        
        # If validation data is provided
        if X_val is not None and y_val is not None:
            val_predictions = self.predict(X_val)
            val_metrics = self.evaluate(y_val, val_predictions)
            
            self.history['validation_history'].append({
                'iteration': len(self.history['validation_history']) + 1,
                'val_score': val_metrics['score'],
                'val_loss': val_metrics.get('loss', None)
            })
            
            print(f"Validation Score: {val_metrics['score']:.4f}")
        
        # Calculate feature importance if available
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importance = self.model.feature_importances_
        
        # Calculate training time
        training_time = time.time() - start_time
        self.history['training_time'] = training_time
        
        print(f"Training completed in {training_time:.2f} seconds")
        print(f"Training Score: {train_metrics['score']:.4f}")
        
        return self.model
    
    def _hyperparameter_tuning(self, X_train, y_train, cv=5):
        """Perform hyperparameter tuning"""
        
        if self.task == 'regression':
            if self.model_type == 'random_forest':
                param_grid = {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [5, 10, 15, None],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                }
                scoring = 'r2'
                
            elif self.model_type == 'xgboost':
                param_grid = {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [3, 6, 9],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.6, 0.8, 1.0]
                }
                scoring = 'r2'
                
        else:  # classification
            if self.model_type == 'random_forest':
                param_grid = {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [5, 10, 15, None],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4],
                    'class_weight': ['balanced', None]
                }
                scoring = 'f1_weighted'
                
            elif self.model_type == 'xgboost':
                param_grid = {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [3, 6, 9],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.6, 0.8, 1.0]
                }
                scoring = 'f1_weighted'
        
        # Perform grid search
        grid_search = GridSearchCV(
            self.model, param_grid, cv=cv, scoring=scoring,
            n_jobs=-1, verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        # Update model with best parameters
        self.model = grid_search.best_estimator_
        self.best_params = grid_search.best_params_
        
        print(f"Best parameters: {self.best_params}")
        print(f"Best score: {grid_search.best_score_:.4f}")
    
    def predict(self, X):
        """Make predictions"""
        if self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        return self.model.predict(X)
    
    def predict_proba(self, X):
        """Predict probabilities (for classification)"""
        if self.task != 'classification':
            raise ValueError("Probability prediction only available for classification tasks")
        
        if hasattr(self.model, 'predict_proba'):
            return self.model.predict_proba(X)
        else:
            raise AttributeError("Model does not support probability predictions")
    
    def evaluate(self, y_true, y_pred):
        """Evaluate model performance"""
        
        if self.task == 'regression':
            metrics = {
                'mae': mean_absolute_error(y_true, y_pred),
                'mse': mean_squared_error(y_true, y_pred),
                'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
                'r2': r2_score(y_true, y_pred),
                'score': r2_score(y_true, y_pred)  # Primary metric
            }
            
            print("\n=== REGRESSION METRICS ===")
            print(f"MAE: {metrics['mae']:.4f}")
            print(f"MSE: {metrics['mse']:.4f}")
            print(f"RMSE: {metrics['rmse']:.4f}")
            print(f"R² Score: {metrics['r2']:.4f}")
            
        else:  # classification
            metrics = {
                'accuracy': accuracy_score(y_true, y_pred),
                'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
                'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
                'f1': f1_score(y_true, y_pred, average='weighted', zero_division=0),
                'score': f1_score(y_true, y_pred, average='weighted', zero_division=0)  # Primary metric
            }
            
            # For binary classification, add AUC
            if len(np.unique(y_true)) == 2:
                if hasattr(self.model, 'predict_proba'):
                    y_proba = self.model.predict_proba(y_true.reshape(-1, 1) if len(y_true.shape) == 1 else y_true)
                    metrics['auc'] = roc_auc_score(y_true, y_proba[:, 1])
            
            print("\n=== CLASSIFICATION METRICS ===")
            print(f"Accuracy: {metrics['accuracy']:.4f}")
            print(f"Precision: {metrics['precision']:.4f}")
            print(f"Recall: {metrics['recall']:.4f}")
            print(f"F1 Score: {metrics['f1']:.4f}")
            
            if 'auc' in metrics:
                print(f"AUC: {metrics['auc']:.4f}")
            
            # Print classification report
            print("\nClassification Report:")
            print(classification_report(y_true, y_pred, zero_division=0))
            
            # Plot confusion matrix
            self._plot_confusion_matrix(y_true, y_pred)
        
        return metrics
    
    def _plot_confusion_matrix(self, y_true, y_pred):
        """Plot confusion matrix for classification"""
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=np.unique(y_true),
                   yticklabels=np.unique(y_true))
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig('confusion_matrix.png', dpi=150, bbox_inches='tight')
        plt.show()
    
    def plot_feature_importance(self, feature_names, top_n=20):
        """Plot feature importance"""
        if self.feature_importance is None:
            print("No feature importance available for this model")
            return
        
        # Create importance DataFrame
        importance_df = pd.DataFrame({
            'feature': feature_names[:len(self.feature_importance)],
            'importance': self.feature_importance
        }).sort_values('importance', ascending=False)
        
        # Plot top N features
        plt.figure(figsize=(10, 8))
        top_features = importance_df.head(top_n)
        
        bars = plt.barh(range(len(top_features)), top_features['importance'])
        plt.yticks(range(len(top_features)), top_features['feature'])
        plt.xlabel('Importance')
        plt.title(f'Top {top_n} Feature Importance')
        
        # Add value labels
        for i, (bar, importance) in enumerate(zip(bars, top_features['importance'])):
            plt.text(importance * 1.01, i, f'{importance:.4f}', 
                    va='center', fontsize=9)
        
        plt.gca().invert_yaxis()
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=150, bbox_inches='tight')
        plt.show()
        
        return importance_df
    
    def plot_training_history(self):
        """Plot training history"""
        if not self.history['training_history']:
            print("No training history available")
            return
        
        train_history = pd.DataFrame(self.history['training_history'])
        val_history = pd.DataFrame(self.history['validation_history']) if self.history['validation_history'] else None
        
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))
        
        # Plot score
        ax1 = axes[0]
        ax1.plot(train_history['iteration'], train_history['train_score'], 
                label='Training Score', marker='o')
        
        if val_history is not None:
            ax1.plot(val_history['iteration'], val_history['val_score'], 
                    label='Validation Score', marker='s')
        
        ax1.set_xlabel('Iteration')
        ax1.set_ylabel('Score')
        ax1.set_title('Training History - Score')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot loss if available
        if 'train_loss' in train_history.columns:
            ax2 = axes[1]
            ax2.plot(train_history['iteration'], train_history['train_loss'], 
                    label='Training Loss', marker='o')
            
            if val_history is not None and 'val_loss' in val_history.columns:
                ax2.plot(val_history['iteration'], val_history['val_loss'], 
                        label='Validation Loss', marker='s')
            
            ax2.set_xlabel('Iteration')
            ax2.set_ylabel('Loss')
            ax2.set_title('Training History - Loss')
            ax2.legend()
            ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=150, bbox_inches='tight')
        plt.show()
    
    def cross_validate(self, X, y, cv=5):
        """Perform cross-validation"""
        if self.model is None:
            self.build_model(input_shape=X.shape[1])
        
        if self.task == 'regression':
            scoring = ['r2', 'neg_mean_absolute_error', 'neg_mean_squared_error']
        else:
            scoring = ['accuracy', 'precision_weighted', 'recall_weighted', 'f1_weighted']
        
        cv_results = cross_val_score(self.model, X, y, cv=cv, 
                                    scoring='r2' if self.task == 'regression' else 'f1_weighted',
                                    n_jobs=-1)
        
        print(f"\n=== CROSS-VALIDATION RESULTS ({cv}-fold) ===")
        print(f"Scores: {cv_results}")
        print(f"Mean Score: {cv_results.mean():.4f}")
        print(f"Std Dev: {cv_results.std():.4f}")
        
        return cv_results
    
    def save_model(self, filepath='nutrition_model.pkl'):
        """Save the trained model"""
        if self.model is None:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'model': self.model,
            'model_type': self.model_type,
            'task': self.task,
            'best_params': self.best_params,
            'feature_importance': self.feature_importance,
            'history': self.history,
            'saved_at': datetime.now().isoformat(),
            'model_version': '1.0.0'
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='nutrition_model.pkl'):
        """Load a trained model"""
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.model_type = model_data['model_type']
        self.task = model_data['task']
        self.best_params = model_data['best_params']
        self.feature_importance = model_data['feature_importance']
        self.history = model_data['history']
        
        print(f"Model loaded from {filepath}")
        print(f"Model type: {self.model_type}")
        print(f"Task: {self.task}")
        print(f"Saved at: {model_data['saved_at']}")
        print(f"Version: {model_data['model_version']}")
        
        return self
    
    def predict_health_risk(self, user_data, feature_names):
        """
        Predict health risk for a user
        Returns detailed risk analysis
        """
        if self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        # Convert user data to appropriate format
        if isinstance(user_data, dict):
            # Convert to DataFrame with correct feature order
            input_data = pd.DataFrame([user_data])
            
            # Ensure all features are present
            for feature in feature_names:
                if feature not in input_data.columns:
                    input_data[feature] = 0  # Default value for missing features
            
            # Reorder columns
            input_data = input_data[feature_names]
        else:
            input_data = user_data
        
        # Make prediction
        if self.task == 'regression':
            prediction = self.predict(input_data)[0]
            
            # Interpret regression prediction (health score)
            risk_level = self._interpret_health_score(prediction)
            
            return {
                'health_score': float(prediction),
                'risk_level': risk_level['level'],
                'risk_score': risk_level['score'],
                'recommendations': risk_level['recommendations'],
                'confidence': 0.85  # Placeholder
            }
        
        else:  # classification
            prediction = self.predict(input_data)[0]
            probability = self.predict_proba(input_data)[0]
            
            risk_levels = ['Low Risk', 'Medium Risk', 'High Risk']
            risk_level = risk_levels[int(prediction)] if prediction < len(risk_levels) else 'Unknown'
            
            return {
                'risk_level': risk_level,
                'risk_score': float(prediction),
                'probability': float(max(probability)),
                'probabilities': probability.tolist(),
                'confidence': float(max(probability))
            }
    
    def _interpret_health_score(self, score):
        """Interpret health score into risk levels"""
        if score >= 80:
            return {
                'level': 'Excellent',
                'score': 1,
                'recommendations': ['Maintain current healthy habits', 'Regular health checkups']
            }
        elif score >= 70:
            return {
                'level': 'Good',
                'score': 2,
                'recommendations': ['Increase physical activity', 'Monitor portion sizes']
            }
        elif score >= 60:
            return {
                'level': 'Fair',
                'score': 3,
                'recommendations': ['Improve diet quality', 'Reduce processed foods', 'Increase exercise']
            }
        elif score >= 50:
            return {
                'level': 'Poor',
                'score': 4,
                'recommendations': ['Consult healthcare professional', 'Significant lifestyle changes needed']
            }
        else:
            return {
                'level': 'Critical',
                'score': 5,
                'recommendations': ['Immediate medical consultation', 'Major lifestyle intervention required']
            }


# Example usage
if __name__ == "__main__":
    print("=== NUTRITION AI MODEL DEMO ===")
    
    # Generate sample data
    from data_processor import NutritionDataProcessor
    
    # Create data processor
    processor = NutritionDataProcessor()
    df = processor.load_and_clean_data()
    
    # Preprocess data
    X, y, feature_names = processor.preprocess_features(df, target_column='health_score')
    
    # Feature selection
    X_selected, selected_features, _ = processor.feature_selection(X, y, k=15)
    
    # Train-test split
    X_train, X_test, y_train, y_test = processor.create_train_test_split(X_selected, y)
    
    # Create and train model
    print("\n=== TRAINING REGRESSION MODEL ===")
    model = NutritionAIModel(model_type='random_forest', task='regression')
    model.build_model()
    model.train(X_train, y_train, X_test, y_test)
    
    # Evaluate
    y_pred = model.predict(X_test)
    metrics = model.evaluate(y_test, y_pred)
    
    # Plot feature importance
    if model.feature_importance is not None:
        model.plot_feature_importance(selected_features)
    
    # Plot training history
    model.plot_training_history()
    
    # Cross-validation
    cv_scores = model.cross_validate(X_selected, y, cv=5)
    
    # Save model
    model.save_model('models/nutrition_model.pkl')
    
    # Test prediction with sample user data
    print("\n=== TEST PREDICTION ===")
    sample_user = {
        'age': 35,
        'weight_kg': 85,
        'height_cm': 175,
        'daily_calories': 2800,
        'daily_protein_g': 95,
        'daily_carbs_g': 320,
        'daily_fats_g': 90,
        'bmi': 27.8,
        'activity_level': 'Moderate'
    }
    
    # Process user data
    user_processed = processor.process_new_data(sample_user)
    
    # Make prediction
    prediction = model.predict_health_risk(user_processed, selected_features)
    print(f"Health Risk Prediction: {prediction}")