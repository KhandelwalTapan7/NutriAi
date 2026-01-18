"""
NutriAI - Machine Learning Models
AI models for nutrition analysis and health prediction
"""

__version__ = '1.0.0'
__author__ = 'NutriAI Research Team'

from .data_processor import NutritionDataProcessor
from .nutrition_model import NutritionAIModel

__all__ = ['NutritionDataProcessor', 'NutritionAIModel']