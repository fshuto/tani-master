"""ルートのテスト（Phase 2: ユーザー選択フロー）"""
import pytest
import tempfile
from pathlib import Path
from app import create_app
from app.models import init_db


@pytest.fixture
def app(tmp_path):
    """テストごとに独立した一時DBを使うアプリ"""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    application = create_app("development")
    application.config.update({
        "TESTING": True,
        "SECRET_KEY": "test-secret",
        "DB_PATH": db_path,
    })
    yield application


@pytest.fixture
def client(app):
    return app.test_client()


def test_home_returns_200(client):
    resp = client.get("/")
    assert resp.status_code == 200


def test_home_shows_default_user(client):
    resp = client.get("/")
    assert "ゲスト" in resp.data.decode("utf-8")


def test_home_shows_create_form(client):
    resp = client.get("/")
    html = resp.data.decode("utf-8")
    assert "つくる" in html


def test_create_user_redirects(client):
    resp = client.post("/create-user", data={"name": "テスト", "avatar_id": "dog"})
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/")


def test_create_user_appears_on_home(client):
    client.post("/create-user", data={"name": "テスト", "avatar_id": "cat"})
    resp = client.get("/")
    assert "テスト" in resp.data.decode("utf-8")


def test_create_user_empty_name_redirects(client):
    resp = client.post("/create-user", data={"name": "", "avatar_id": "dog"},
                       follow_redirects=True)
    assert resp.status_code == 200
    assert "なまえを" in resp.data.decode("utf-8")


def test_select_user_sets_session(client):
    # まずユーザーを作ってIDを取得
    client.post("/create-user", data={"name": "セレクト", "avatar_id": "frog"})
    resp = client.get("/")
    html = resp.data.decode("utf-8")
    # user_id を form から探す（value="2" が存在するはず）
    assert 'value="2"' in html

    # ユーザー選択 → カテゴリ一覧へリダイレクト
    resp = client.post("/select-user", data={"user_id": "2"})
    assert resp.status_code == 302
    assert "/category" in resp.headers["Location"]


def test_delete_user_removes_from_home(client):
    client.post("/create-user", data={"name": "けす", "avatar_id": "bear"})
    resp = client.get("/")
    assert "けす" in resp.data.decode("utf-8")

    # IDを取得して削除（デフォルト=1 なので 2 番のはず）
    client.post("/delete-user", data={"user_id": "2"})
    resp = client.get("/")
    assert "けす" not in resp.data.decode("utf-8")


def test_delete_default_user_shows_error(client):
    resp = client.post("/delete-user", data={"user_id": "1"}, follow_redirects=True)
    assert resp.status_code == 200
    assert "けせない" in resp.data.decode("utf-8")


def test_category_list_returns_200(client):
    resp = client.get("/category")
    assert resp.status_code == 200


def test_records_returns_200(client):
    resp = client.get("/records")
    assert resp.status_code == 200
