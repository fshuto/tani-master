"""アプリ設定（開発 / 本番）"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "tani-master-dev-secret")
    DB_PATH = BASE_DIR / "db" / "tani_master.db"
    DATA_DIR = BASE_DIR / "app" / "data"
    CACHE_ENABLED = False


class DevelopmentConfig(Config):
    DEBUG = True
    CACHE_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False
    CACHE_ENABLED = True
    COMPRESS_ENABLED = True
    COMPRESS_MIMETYPES = [
        "text/html", "text/css", "text/javascript",
        "application/javascript", "application/json",
        "image/svg+xml",
    ]
    COMPRESS_LEVEL = 6
    COMPRESS_MIN_SIZE = 500


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
