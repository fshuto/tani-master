"""pytest設定・Flaskテストクライアント"""
import pytest
from app import create_app


@pytest.fixture
def app():
    """テスト用Flaskアプリを返す"""
    application = create_app("development")
    application.config.update({
        "TESTING": True,
        "SECRET_KEY": "test-secret",
    })
    yield application


@pytest.fixture
def client(app):
    """テストクライアントを返す"""
    return app.test_client()


@pytest.fixture
def app_context(app):
    """アプリケーションコンテキストを返す"""
    with app.app_context():
        yield app
