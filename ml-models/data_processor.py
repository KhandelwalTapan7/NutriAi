import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
import joblib
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class NutritionDataProcessor:
    """Data processing pipeline for nutrition and health data"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.label_encoders = {}
        self.feature_selector = None
        self.pca = None
        self.feature_names = None
        self.processed_data = None
        
    def load_and_clean_data(self, filepath=None):
        """
        Load and clean nutrition data
        If no filepath provided, generates synthetic data
        """
        if filepath:
            print(f"Loading data from {filepath}")
            df = pd.read_csv(filepath)
        else:
            print("Generating synthetic nutrition data...")
            df = self._generate_synthetic_data()
        
        # Store original column names
        self.feature_names = df.columns.tolist()
        
        # Clean data
        df_clean = self._clean_data(df)
        
        print(f"Data loaded: {df_clean.shape[0]} samples, {df_clean.shape[1]} features")
        return df_clean
    
    def _generate_synthetic_data(self):
        """Generate synthetic nutrition data for research"""
        np.random.seed(42)
        n_samples = 5000
        
        # Generate realistic nutrition data
        data = {
            'age': np.random.randint(18, 70, n_samples),
            'gender': np.random.choice(['Male', 'Female'], n_samples, p=[0.48, 0.52]),
            'weight_kg': np.random.uniform(45, 120, n_samples),
            'height_cm': np.random.uniform(150, 195, n_samples),
            'daily_calories': np.random.uniform(1200, 3500, n_samples),
            'daily_protein_g': np.random.uniform(40, 120, n_samples),
            'daily_carbs_g': np.random.uniform(100, 400, n_samples),
            'daily_fats_g': np.random.uniform(30, 120, n_samples),
            'fiber_g': np.random.uniform(15, 45, n_samples),
            'sugar_g': np.random.uniform(20, 150, n_samples),
            'sodium_mg': np.random.uniform(1000, 4000, n_samples),
            'water_ml': np.random.uniform(1000, 3000, n_samples),
            'activity_level': np.random.choice(['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'], 
                                              n_samples, p=[0.2, 0.3, 0.3, 0.15, 0.05]),
            'sleep_hours': np.random.uniform(4, 10, n_samples),
            'stress_level': np.random.choice(['Low', 'Medium', 'High'], n_samples, p=[0.3, 0.5, 0.2]),
            'region': np.random.choice(['Urban', 'Suburban', 'Rural'], n_samples),
            'income_level': np.random.choice(['Low', 'Middle', 'High'], n_samples, p=[0.3, 0.5, 0.2]),
            'education_level': np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], 
                                               n_samples, p=[0.3, 0.4, 0.2, 0.1])
        }
        
        df = pd.DataFrame(data)
        
        # Calculate derived features
        df['bmi'] = df['weight_kg'] / ((df['height_cm'] / 100) ** 2)
        df['protein_ratio'] = df['daily_protein_g'] * 4 / df['daily_calories']
        df['carb_ratio'] = df['daily_carbs_g'] * 4 / df['daily_calories']
        df['fat_ratio'] = df['daily_fats_g'] * 9 / df['daily_calories']
        df['fiber_per_1000cal'] = df['fiber_g'] / (df['daily_calories'] / 1000)
        
        # Generate health outcomes based on nutrition patterns
        df['has_obesity'] = ((df['bmi'] > 30) & 
                            (df['daily_calories'] > 2500) & 
                            (df['fat_ratio'] > 0.35)).astype(int)
        
        df['has_diabetes_risk'] = ((df['sugar_g'] > 50) & 
                                  (df['bmi'] > 25) & 
                                  (df['activity_level'].isin(['Sedentary', 'Light']))).astype(int)
        
        df['has_hypertension_risk'] = ((df['sodium_mg'] > 2300) & 
                                      (df['stress_level'] == 'High') & 
                                      (df['bmi'] > 27)).astype(int)
        
        # Create composite health score
        df['health_score'] = 100 - (
            (df['bmi'] - 22).abs() * 0.5 +
            (df['daily_calories'] - 2200).abs() * 0.01 +
            (df['sugar_g'] - 30).clip(lower=0) * 0.2 +
            (df['sodium_mg'] - 1500).clip(lower=0) * 0.001 +
            (8 - df['sleep_hours']).clip(lower=0) * 2
        )
        
        # Clip health score
        df['health_score'] = df['health_score'].clip(0, 100)
        
        # Add some noise
        for col in ['daily_calories', 'daily_protein_g', 'daily_carbs_g', 'daily_fats_g']:
            df[col] = df[col] * np.random.normal(1, 0.1, n_samples)
        
        return df
    
    def _clean_data(self, df):
        """Clean and prepare data"""
        df_clean = df.copy()
        
        # Handle missing values
        print("Handling missing values...")
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        categorical_cols = df_clean.select_dtypes(include=['object']).columns
        
        # Fill numeric missing values
        if numeric_cols.any():
            df_clean[numeric_cols] = self.imputer.fit_transform(df_clean[numeric_cols])
        
        # Fill categorical missing values
        for col in categorical_cols:
            if df_clean[col].isnull().any():
                df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
        
        # Remove outliers using IQR method for key features
        outlier_features = ['daily_calories', 'daily_protein_g', 'daily_carbs_g', 'daily_fats_g', 'bmi']
        for feature in outlier_features:
            if feature in df_clean.columns:
                Q1 = df_clean[feature].quantile(0.25)
                Q3 = df_clean[feature].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df_clean = df_clean[(df_clean[feature] >= lower_bound) & 
                                   (df_clean[feature] <= upper_bound)]
        
        print(f"Data after cleaning: {df_clean.shape[0]} samples")
        return df_clean
    
    def preprocess_features(self, df, target_column='health_score'):
        """
        Preprocess features for machine learning
        Returns: X (features), y (target), feature_names
        """
        df_processed = df.copy()
        
        # Separate features and target
        if target_column in df_processed.columns:
            y = df_processed[target_column]
            X = df_processed.drop(columns=[target_column])
        else:
            y = None
            X = df_processed
        
        # Encode categorical variables
        X_encoded = self._encode_categorical(X)
        
        # Scale numerical features
        X_scaled = self._scale_features(X_encoded)
        
        # Store processed data
        self.processed_data = {
            'X': X_scaled,
            'y': y,
            'feature_names': X.columns.tolist(),
            'categorical_mapping': self.label_encoders
        }
        
        return X_scaled, y, X.columns.tolist()
    
    def _encode_categorical(self, X):
        """Encode categorical variables"""
        X_encoded = X.copy()
        
        # Identify categorical columns
        categorical_cols = X_encoded.select_dtypes(include=['object']).columns
        
        # Apply label encoding
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                X_encoded[col] = self.label_encoders[col].fit_transform(X_encoded[col])
            else:
                # Handle unseen categories
                X_encoded[col] = X_encoded[col].apply(
                    lambda x: x if x in self.label_encoders[col].classes_ else -1
                )
                X_encoded[col] = self.label_encoders[col].transform(X_encoded[col])
        
        return X_encoded
    
    def _scale_features(self, X):
        """Scale numerical features"""
        X_scaled = X.copy()
        
        # Identify numerical columns (excluding encoded categorical)
        numerical_cols = X_scaled.select_dtypes(include=[np.number]).columns
        
        if len(numerical_cols) > 0:
            X_scaled[numerical_cols] = self.scaler.fit_transform(X_scaled[numerical_cols])
        
        return X_scaled
    
    def feature_selection(self, X, y, k=20, method='mutual_info'):
        """
        Select top k features using statistical methods
        """
        if method == 'mutual_info':
            selector = SelectKBest(score_func=mutual_info_classif, k=min(k, X.shape[1]))
        else:
            selector = SelectKBest(score_func=f_classif, k=min(k, X.shape[1]))
        
        X_selected = selector.fit_transform(X, y)
        
        # Get selected feature indices
        selected_indices = selector.get_support(indices=True)
        selected_features = [self.processed_data['feature_names'][i] for i in selected_indices]
        
        # Get feature scores
        feature_scores = selector.scores_
        
        # Create feature importance DataFrame
        importance_df = pd.DataFrame({
            'feature': self.processed_data['feature_names'],
            'score': feature_scores
        }).sort_values('score', ascending=False)
        
        print(f"\nTop {k} selected features:")
        for idx, row in importance_df.head(k).iterrows():
            print(f"  {row['feature']}: {row['score']:.4f}")
        
        self.feature_selector = selector
        
        return X_selected, selected_features, importance_df
    
    def apply_pca(self, X, n_components=10):
        """
        Apply PCA for dimensionality reduction
        """
        self.pca = PCA(n_components=min(n_components, X.shape[1]))
        X_pca = self.pca.fit_transform(X)
        
        # Print explained variance
        explained_variance = self.pca.explained_variance_ratio_
        cumulative_variance = np.cumsum(explained_variance)
        
        print("\nPCA Results:")
        print(f"Original features: {X.shape[1]}")
        print(f"Reduced features: {n_components}")
        print(f"Total variance explained: {cumulative_variance[-1]:.3f}")
        
        # Plot explained variance
        self._plot_explained_variance(explained_variance, cumulative_variance)
        
        return X_pca
    
    def _plot_explained_variance(self, explained_variance, cumulative_variance):
        """Plot PCA explained variance"""
        import matplotlib.pyplot as plt
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Individual explained variance
        ax1.bar(range(1, len(explained_variance) + 1), explained_variance)
        ax1.set_xlabel('Principal Component')
        ax1.set_ylabel('Explained Variance Ratio')
        ax1.set_title('Individual Explained Variance')
        
        # Cumulative explained variance
        ax2.plot(range(1, len(cumulative_variance) + 1), cumulative_variance, marker='o')
        ax2.axhline(y=0.95, color='r', linestyle='--', alpha=0.5, label='95% Variance')
        ax2.set_xlabel('Number of Components')
        ax2.set_ylabel('Cumulative Explained Variance')
        ax2.set_title('Cumulative Explained Variance')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('pca_variance.png', dpi=150, bbox_inches='tight')
        plt.show()
    
    def create_train_test_split(self, X, y, test_size=0.2, random_state=42):
        """
        Create train-test split
        """
        from sklearn.model_selection import train_test_split
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y if len(np.unique(y)) < 10 else None
        )
        
        print(f"\nTrain-Test Split:")
        print(f"  Training samples: {X_train.shape[0]}")
        print(f"  Test samples: {X_test.shape[0]}")
        print(f"  Features: {X_train.shape[1]}")
        
        return X_train, X_test, y_train, y_test
    
    def save_processor(self, filepath='nutrition_processor.pkl'):
        """Save the data processor"""
        processor_data = {
            'scaler': self.scaler,
            'imputer': self.imputer,
            'label_encoders': self.label_encoders,
            'feature_selector': self.feature_selector,
            'pca': self.pca,
            'feature_names': self.feature_names,
            'saved_at': datetime.now().isoformat()
        }
        
        joblib.dump(processor_data, filepath)
        print(f"Processor saved to {filepath}")
    
    def load_processor(self, filepath='nutrition_processor.pkl'):
        """Load a saved data processor"""
        processor_data = joblib.load(filepath)
        
        self.scaler = processor_data['scaler']
        self.imputer = processor_data['imputer']
        self.label_encoders = processor_data['label_encoders']
        self.feature_selector = processor_data['feature_selector']
        self.pca = processor_data['pca']
        self.feature_names = processor_data['feature_names']
        
        print(f"Processor loaded from {filepath}")
        print(f"Saved at: {processor_data['saved_at']}")
        
        return self
    
    def process_new_data(self, new_data):
        """
        Process new data using trained processor
        """
        if isinstance(new_data, dict):
            new_df = pd.DataFrame([new_data])
        elif isinstance(new_data, pd.DataFrame):
            new_df = new_data.copy()
        else:
            raise ValueError("new_data must be a dictionary or DataFrame")
        
        # Clean data
        new_df_clean = self._clean_data(new_df)
        
        # Encode categorical variables
        new_encoded = self._encode_categorical(new_df_clean)
        
        # Scale features
        new_scaled = self._scale_features(new_encoded)
        
        # Apply feature selection if available
        if self.feature_selector is not None:
            new_scaled = self.feature_selector.transform(new_scaled)
        
        # Apply PCA if available
        if self.pca is not None:
            new_scaled = self.pca.transform(new_scaled)
        
        return new_scaled


# Example usage
if __name__ == "__main__":
    # Create data processor
    processor = NutritionDataProcessor()
    
    # Load and clean data
    df = processor.load_and_clean_data()
    
    # Preprocess features
    X, y, feature_names = processor.preprocess_features(df, target_column='health_score')
    
    # Feature selection
    X_selected, selected_features, importance_df = processor.feature_selection(X, y, k=15)
    
    # Create train-test split
    X_train, X_test, y_train, y_test = processor.create_train_test_split(X_selected, y)
    
    # Save processor
    processor.save_processor('models/nutrition_processor.pkl')
    
    print("\n=== PROCESSING COMPLETE ===")
    print(f"Final training data shape: {X_train.shape}")
    print(f"Selected features: {len(selected_features)}")