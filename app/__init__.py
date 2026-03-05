"""Flaskアプリファクトリ"""
from flask import Flask
from .config import config_map
from .models import init_db


def create_app(env: str = "development") -> Flask:
    """アプリインスタンスを生成して返す"""
    app = Flask(__name__)
    cfg = config_map.get(env, config_map["development"])
    app.config.from_object(cfg)

    # データベース初期化
    init_db(app.config["DB_PATH"])

    # Gzip圧縮（本番時のみ有効。RPiのI/O負荷を軽減）
    if app.config.get("COMPRESS_ENABLED", False):
        try:
            from flask_compress import Compress
            Compress(app)
        except ImportError:
            pass

    # 静的ファイルのキャッシュヘッダー（本番時）
    if not app.debug:
        @app.after_request
        def add_cache_headers(response):
            if response.content_type.startswith(("image/", "text/css", "application/javascript", "font/")):
                response.cache_control.max_age = 86400  # 1日
                response.cache_control.public = True
            return response

    # Blueprint登録
    from .routes import register_blueprints
    register_blueprints(app)

    return app
