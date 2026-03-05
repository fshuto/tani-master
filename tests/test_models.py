"""models のユニットテスト"""
import pytest
import tempfile
from pathlib import Path
from app.models import (init_db, save_record, get_records, get_achievements,
                        save_achievement, get_users, create_user, delete_user,
                        get_stats_by_category)


@pytest.fixture
def tmp_db():
    """一時DBファイルを返す"""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    init_db(db_path)
    yield db_path
    db_path.unlink(missing_ok=True)


def test_init_db_creates_tables(tmp_db):
    import sqlite3
    conn = sqlite3.connect(tmp_db)
    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()}
    conn.close()
    assert "users"        in tables
    assert "records"      in tables
    assert "achievements" in tables


def test_init_db_creates_default_user(tmp_db):
    import sqlite3
    conn = sqlite3.connect(tmp_db)
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    assert len(users) == 1
    assert users[0][1] == "ゲスト"


def test_save_and_get_records(tmp_db):
    save_record(tmp_db, 1, "length", 1, "len_1_001", True)
    save_record(tmp_db, 1, "length", 1, "len_1_002", False)
    records = get_records(tmp_db, 1)
    assert len(records) == 2


def test_get_records_empty_for_new_user(tmp_db):
    records = get_records(tmp_db, 99)
    assert records == []


def test_save_achievement_returns_true_first_time(tmp_db):
    result = save_achievement(tmp_db, 1, "length_l1_clear")
    assert result is True


def test_save_achievement_returns_false_if_duplicate(tmp_db):
    save_achievement(tmp_db, 1, "length_l1_clear")
    result = save_achievement(tmp_db, 1, "length_l1_clear")
    assert result is False


def test_get_achievements_returns_keys(tmp_db):
    save_achievement(tmp_db, 1, "length_l1_clear")
    save_achievement(tmp_db, 1, "length_l2_clear")
    keys = get_achievements(tmp_db, 1)
    assert "length_l1_clear" in keys
    assert "length_l2_clear" in keys


# ---- Phase 2: ユーザー管理 ----

def test_get_users_returns_default(tmp_db):
    users = get_users(tmp_db)
    assert len(users) == 1
    assert users[0]["name"] == "ゲスト"


def test_create_user_returns_new_id(tmp_db):
    new_id = create_user(tmp_db, "たろう", "dog")
    assert new_id > 1
    users = get_users(tmp_db)
    names = [u["name"] for u in users]
    assert "たろう" in names


def test_create_user_avatar_saved(tmp_db):
    create_user(tmp_db, "はなこ", "cat")
    users = get_users(tmp_db)
    hanako = next(u for u in users if u["name"] == "はなこ")
    assert hanako["avatar"] == "cat"


def test_delete_user_removes_user(tmp_db):
    new_id = create_user(tmp_db, "けしたい", "bear")
    result = delete_user(tmp_db, new_id)
    assert result is True
    users = get_users(tmp_db)
    ids = [u["id"] for u in users]
    assert new_id not in ids


def test_delete_default_user_returns_false(tmp_db):
    result = delete_user(tmp_db, 1)
    assert result is False
    users = get_users(tmp_db)
    assert len(users) == 1


# ---- Phase 2: カテゴリ別統計 ----

def test_get_stats_by_category_empty(tmp_db):
    stats = get_stats_by_category(tmp_db, 1)
    assert stats == []


def test_get_stats_by_category_counts(tmp_db):
    save_record(tmp_db, 1, "length", 1, "len_1_001", True)
    save_record(tmp_db, 1, "length", 1, "len_1_002", True)
    save_record(tmp_db, 1, "length", 1, "len_1_003", False)
    save_record(tmp_db, 1, "volume", 1, "vol_1_001", True)
    stats = get_stats_by_category(tmp_db, 1)
    by_cat = {s["category"]: s for s in stats}
    assert by_cat["length"]["correct"] == 2
    assert by_cat["length"]["total"]   == 3
    assert abs(by_cat["length"]["rate"] - 0.67) < 0.01
    assert by_cat["volume"]["correct"] == 1
    assert by_cat["volume"]["total"]   == 1
    assert by_cat["volume"]["rate"]    == 1.0


def test_get_stats_by_category_isolated_per_user(tmp_db):
    create_user(tmp_db, "ユーザー2", "cat")
    save_record(tmp_db, 1, "length", 1, "len_1_001", True)
    save_record(tmp_db, 2, "length", 1, "len_1_001", False)
    stats1 = get_stats_by_category(tmp_db, 1)
    stats2 = get_stats_by_category(tmp_db, 2)
    assert stats1[0]["correct"] == 1
    assert stats2[0]["correct"] == 0
