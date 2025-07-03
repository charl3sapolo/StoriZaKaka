#!/usr/bin/env python3
"""
Setup script for Movie Recommender project.
Automates initial configuration and database setup.
"""

import os
import sys
import subprocess
import secrets
from pathlib import Path


def run_command(command, description):
    """Run a shell command and handle errors."""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False


def create_env_file():
    """Create .env file from template."""
    env_example = Path("env.example")
    env_file = Path(".env")
    
    if env_file.exists():
        print("⚠️  .env file already exists, skipping...")
        return True
    
    if not env_example.exists():
        print("❌ env.example file not found")
        return False
    
    # Generate a secure secret key
    secret_key = secrets.token_urlsafe(50)
    
    # Read template and replace placeholder
    content = env_example.read_text()
    content = content.replace('your-secret-key-here', secret_key)
    
    # Write new .env file
    env_file.write_text(content)
    print("✅ .env file created with secure secret key")
    return True


def check_dependencies():
    """Check if required dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    # Check Python version
    if sys.version_info < (3, 9):
        print("❌ Python 3.9+ is required")
        return False
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Check if pip is available
    if not run_command("pip --version", "Checking pip"):
        return False
    
    return True


def install_dependencies():
    """Install Python dependencies."""
    return run_command("pip install -r requirements/development.txt", "Installing dependencies")


def setup_database():
    """Set up database and run migrations."""
    print("🗄️  Setting up database...")
    
    # Create migrations
    if not run_command("python manage.py makemigrations", "Creating migrations"):
        return False
    
    # Run migrations
    if not run_command("python manage.py migrate", "Running migrations"):
        return False
    
    return True


def create_superuser():
    """Create a superuser account."""
    print("👤 Creating superuser account...")
    
    # Check if superuser already exists
    try:
        result = subprocess.run(
            "python manage.py shell -c \"from apps.core.models import User; print(User.objects.filter(is_superuser=True).count())\"",
            shell=True, capture_output=True, text=True
        )
        if result.stdout.strip() == "0":
            print("Please create a superuser account:")
            run_command("python manage.py createsuperuser", "Creating superuser")
        else:
            print("✅ Superuser already exists")
    except:
        print("⚠️  Could not check for existing superuser")


def load_sample_data():
    """Load sample data for development."""
    print("📊 Loading sample data...")
    
    # Check if sample data script exists
    sample_data_script = Path("scripts/populate_db.py")
    if sample_data_script.exists():
        run_command("python scripts/populate_db.py", "Loading sample data")
    else:
        print("⚠️  Sample data script not found, skipping...")


def setup_static_files():
    """Collect static files."""
    return run_command("python manage.py collectstatic --noinput", "Collecting static files")


def create_directories():
    """Create necessary directories."""
    directories = [
        "logs",
        "media",
        "media/movie_posters",
        "media/profile_pictures",
        "staticfiles",
        "locale/en/LC_MESSAGES",
        "locale/sw/LC_MESSAGES"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    print("✅ Created necessary directories")


def main():
    """Main setup function."""
    print("🎬 Movie Recommender Setup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("manage.py").exists():
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Step 1: Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed")
        sys.exit(1)
    
    # Step 2: Create .env file
    if not create_env_file():
        print("❌ Failed to create .env file")
        sys.exit(1)
    
    # Step 3: Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Step 4: Create directories
    create_directories()
    
    # Step 5: Setup database
    if not setup_database():
        print("❌ Database setup failed")
        sys.exit(1)
    
    # Step 6: Create superuser
    create_superuser()
    
    # Step 7: Load sample data
    load_sample_data()
    
    # Step 8: Setup static files
    setup_static_files()
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Edit .env file with your configuration")
    print("2. Start MongoDB service")
    print("3. Run: python manage.py runserver")
    print("4. Visit: http://localhost:8000")
    print("\nFor more information, see README.md")


if __name__ == "__main__":
    main() 