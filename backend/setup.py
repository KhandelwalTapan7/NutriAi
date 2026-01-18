from setuptools import setup, find_packages

setup(
    name="nutriai-backend",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "Flask-CORS==4.0.0",
        "gunicorn==20.1.0",
        "python-dotenv==1.0.0",
        "numpy==1.24.3",
        "pandas==2.0.3",
        "scikit-learn==1.3.0",
        "Pillow==9.5.0",
        "Werkzeug==2.3.7"
    ],
    python_requires=">=3.7",
)