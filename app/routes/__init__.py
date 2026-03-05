"""Blueprint登録"""
from flask import Flask


def register_blueprints(app: Flask) -> None:
    from .main import bp as main_bp
    from .quiz import bp as quiz_bp
    from .explore import bp as explore_bp
    from .progress import bp as progress_bp
    from .admin import bp as admin_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(explore_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(admin_bp)
