"""achievement_checker のユニットテスト"""
import pytest
import tempfile
from pathlib import Path

from app import create_app
from app.models import init_db, save_record, get_achievements
from app.achievement_checker import check_and_unlock, _check_condition, _is_level_cleared


@pytest.fixture
def tmp_db(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return db_path


@pytest.fixture
def app_ctx(tmp_db):
    """Flask application context を提供する"""
    application = create_app("development")
    application.config.update({"TESTING": True, "DB_PATH": tmp_db})
    with application.app_context():
        yield tmp_db


# ---- _is_level_cleared ----

def test_is_level_cleared_needs_3_correct():
    records = [
        {"category": "length", "level": 1, "is_correct": True},
        {"category": "length", "level": 1, "is_correct": True},
    ]
    assert not _is_level_cleared(records, "length", 1)

    records.append({"category": "length", "level": 1, "is_correct": True})
    assert _is_level_cleared(records, "length", 1)


def test_is_level_cleared_wrong_level():
    records = [
        {"category": "length", "level": 2, "is_correct": True},
        {"category": "length", "level": 2, "is_correct": True},
        {"category": "length", "level": 2, "is_correct": True},
    ]
    assert not _is_level_cleared(records, "length", 1)


def test_is_level_cleared_wrong_category():
    records = [
        {"category": "volume", "level": 1, "is_correct": True},
        {"category": "volume", "level": 1, "is_correct": True},
        {"category": "volume", "level": 1, "is_correct": True},
    ]
    assert not _is_level_cleared(records, "length", 1)


def test_is_level_cleared_incorrect_dont_count():
    records = [
        {"category": "length", "level": 1, "is_correct": True},
        {"category": "length", "level": 1, "is_correct": False},
        {"category": "length", "level": 1, "is_correct": False},
        {"category": "length", "level": 1, "is_correct": False},
    ]
    assert not _is_level_cleared(records, "length", 1)


# ---- _check_condition ----

def test_check_condition_level_clear():
    records = [{"category": "length", "level": 1, "is_correct": True}] * 3
    cond = {"type": "level_clear", "category": "length", "level": 1}
    assert _check_condition(cond, records, "length", 1)


def test_check_condition_total_correct():
    records = [{"category": "x", "level": 1, "is_correct": True}] * 10
    cond = {"type": "total_correct", "count": 10}
    assert _check_condition(cond, records, "x", 1)
    cond2 = {"type": "total_correct", "count": 11}
    assert not _check_condition(cond2, records, "x", 1)


def test_check_condition_daily_streak():
    cond = {"type": "daily_streak", "days": 3}
    assert _check_condition(cond, [], "x", 1, streak=3)
    assert _check_condition(cond, [], "x", 1, streak=5)
    assert not _check_condition(cond, [], "x", 1, streak=2)


def test_check_condition_unknown_returns_false():
    cond = {"type": "unknown_type"}
    assert not _check_condition(cond, [], "x", 1)


# ---- check_and_unlock（統合テスト） ----

def test_check_and_unlock_returns_empty_when_nothing_cleared(app_ctx):
    newly = check_and_unlock(app_ctx, 1, "length", 1)
    assert newly == []


def test_check_and_unlock_unlocks_level_clear_stamp(app_ctx):
    for i in range(3):
        save_record(app_ctx, 1, "length", 1, f"len_1_00{i+1}", True)
    newly = check_and_unlock(app_ctx, 1, "length", 1)
    ids = [n["id"] for n in newly]
    assert "length_l1_clear" in ids


def test_check_and_unlock_does_not_double_unlock(app_ctx):
    for i in range(5):
        save_record(app_ctx, 1, "length", 1, f"len_1_00{i+1}", True)
    first = check_and_unlock(app_ctx, 1, "length", 1)
    assert any(n["id"] == "length_l1_clear" for n in first)
    second = check_and_unlock(app_ctx, 1, "length", 1)
    assert not any(n["id"] == "length_l1_clear" for n in second)


def test_check_and_unlock_includes_image_and_message(app_ctx):
    for i in range(3):
        save_record(app_ctx, 1, "length", 1, f"len_1_00{i+1}", True)
    newly = check_and_unlock(app_ctx, 1, "length", 1)
    stamp = next(n for n in newly if n["id"] == "length_l1_clear")
    assert stamp["name"]
    assert stamp["image"]
    assert stamp["message"]


def test_check_and_unlock_unlocks_secret_total_correct(app_ctx):
    for i in range(50):
        save_record(app_ctx, 1, "length", 1, f"q_{i}", True)
    newly = check_and_unlock(app_ctx, 1, "length", 1)
    ids = [n["id"] for n in newly]
    assert "secret_dino" in ids


def test_check_and_unlock_achievement_saved_to_db(app_ctx):
    for i in range(3):
        save_record(app_ctx, 1, "length", 1, f"len_1_00{i+1}", True)
    check_and_unlock(app_ctx, 1, "length", 1)
    keys = get_achievements(app_ctx, 1)
    assert "length_l1_clear" in keys
