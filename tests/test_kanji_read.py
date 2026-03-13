"""かんじよみ機能のテスト（TDD: 実装前に書くテスト）"""
import json
import pytest
import tempfile
from pathlib import Path
from app import create_app
from app.models import init_db


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

@pytest.fixture
def app_ctx(app_context):
    """app_context fixture（conftest.py で定義済み）を再利用"""
    yield app_context


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


# ─────────────────────────────────────────────
# カテゴリ定義のテスト
# ─────────────────────────────────────────────

def test_kanji_category_exists(app_ctx):
    """かんじカテゴリが categories.json に存在すること"""
    from app.question_loader import load_categories
    cats = load_categories()
    ids = [c["id"] for c in cats]
    assert "kanji" in ids


def test_kanji_category_enabled(app_ctx):
    """かんじカテゴリが enabled であること"""
    from app.question_loader import load_category
    cat = load_category("kanji")
    assert cat is not None
    assert cat["enabled"] is True


def test_kanji_category_has_two_levels(app_ctx):
    """かんじカテゴリがレベル1・2の2レベルを持つこと"""
    from app.question_loader import load_category
    cat = load_category("kanji")
    assert cat["levels"] == [1, 2]


def test_kanji_category_has_required_fields(app_ctx):
    """かんじカテゴリに必須フィールドが揃っていること"""
    from app.question_loader import load_category
    cat = load_category("kanji")
    for field in ["id", "name", "icon", "color", "description", "order", "levels", "enabled"]:
        assert field in cat, f"フィールド '{field}' がありません"


# ─────────────────────────────────────────────
# 問題データのテスト
# ─────────────────────────────────────────────

def test_kanji_level1_has_enough_questions(app_ctx):
    """かんじレベル1に10問以上あること"""
    from app.question_loader import load_questions
    questions = load_questions("kanji", 1)
    assert len(questions) >= 10, f"レベル1の問題数が {len(questions)} 問（10問以上必要）"


def test_kanji_level2_has_enough_questions(app_ctx):
    """かんじレベル2に10問以上あること"""
    from app.question_loader import load_questions
    questions = load_questions("kanji", 2)
    assert len(questions) >= 10, f"レベル2の問題数が {len(questions)} 問（10問以上必要）"


def test_kanji_questions_have_required_fields(app_ctx):
    """すべての問題に必須フィールドがあること（display, reading, example, explanation）"""
    from app.question_loader import load_questions
    for level in [1, 2]:
        questions = load_questions("kanji", level)
        for q in questions:
            for field in ["id", "type", "display", "reading", "example", "explanation"]:
                assert field in q, f"レベル{level} 問題 {q.get('id', '?')} に '{field}' がありません"


def test_kanji_questions_type_is_kanji_read(app_ctx):
    """すべての問題の type が 'kanji_read' であること"""
    from app.question_loader import load_questions
    for level in [1, 2]:
        questions = load_questions("kanji", level)
        for q in questions:
            assert q["type"] == "kanji_read", \
                f"レベル{level} 問題 {q['id']} の type が '{q['type']}' です（'kanji_read' が必要）"


def test_kanji_question_ids_are_unique(app_ctx):
    """各レベル内で問題IDが重複していないこと"""
    from app.question_loader import load_questions
    for level in [1, 2]:
        questions = load_questions("kanji", level)
        ids = [q["id"] for q in questions]
        assert len(ids) == len(set(ids)), f"レベル{level}に重複IDがあります"


def test_kanji_question_ids_follow_naming_convention(app_ctx):
    """問題IDが命名規則 kan_{level}_{3桁連番} に従っていること"""
    import re
    from app.question_loader import load_questions
    for level in [1, 2]:
        questions = load_questions("kanji", level)
        pattern = re.compile(rf"^kan_{level}_\d{{3}}$")
        for q in questions:
            assert pattern.match(q["id"]), \
                f"ID '{q['id']}' が命名規則 kan_{level}_NNN に合いません"


def test_kanji_reading_is_hiragana(app_ctx):
    """reading フィールドがひらがなのみであること"""
    import re
    from app.question_loader import load_questions
    hiragana_pattern = re.compile(r'^[\u3041-\u3096・\s]+$')
    for level in [1, 2]:
        questions = load_questions("kanji", level)
        for q in questions:
            assert hiragana_pattern.match(q["reading"]), \
                f"問題 {q['id']} の reading '{q['reading']}' にひらがな以外が含まれています"


def test_kanji_level_info_passing_score(app_ctx):
    """レベル情報の passing_score が 8 であること"""
    from app.question_loader import load_level_info
    for level in [1, 2]:
        info = load_level_info("kanji", level)
        assert "passing_score" in info
        assert info["passing_score"] == 8, \
            f"レベル{level}の passing_score が {info['passing_score']}（8が必要）"


def test_kanji_level_info_session_size(app_ctx):
    """レベル情報の session_size が 10 であること"""
    from app.question_loader import load_level_info
    for level in [1, 2]:
        info = load_level_info("kanji", level)
        assert "session_size" in info, \
            f"レベル{level}に session_size フィールドがありません"
        assert info["session_size"] == 10


# ─────────────────────────────────────────────
# ルート・APIのテスト
# ─────────────────────────────────────────────

def test_kanji_quiz_page_returns_200(client):
    """GET /quiz/kanji/1 が 200 を返すこと"""
    resp = client.get("/quiz/kanji/1")
    assert resp.status_code == 200


def test_kanji_quiz_page_level2_returns_200(client):
    """GET /quiz/kanji/2 が 200 を返すこと"""
    resp = client.get("/quiz/kanji/2")
    assert resp.status_code == 200


def test_api_quiz_returns_10_questions_for_kanji(client):
    """GET /api/quiz/kanji/1 が 10 問を返すこと"""
    resp = client.get("/api/quiz/kanji/1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total"] == 10
    assert len(data["questions"]) == 10


def test_api_answer_accepts_parent_judgment_for_kanji_read(client):
    """POST /api/quiz/answer で kanji_read 問題に is_correct を直接送れること（正解）"""
    # まず問題セットを取得してセッションを確立
    client.get("/api/quiz/kanji/1")

    resp = client.post("/api/quiz/answer",
        json={
            "question_id": "kan_1_001",
            "is_correct": True,
            "category": "kanji",
            "level": 1,
        },
        content_type="application/json",
    )
    assert resp.status_code == 200
    result = resp.get_json()
    assert result["is_correct"] is True


def test_api_answer_parent_judgment_incorrect(client):
    """POST /api/quiz/answer で kanji_read 問題に is_correct=False を送れること（不正解）"""
    client.get("/api/quiz/kanji/1")

    resp = client.post("/api/quiz/answer",
        json={
            "question_id": "kan_1_001",
            "is_correct": False,
            "category": "kanji",
            "level": 1,
        },
        content_type="application/json",
    )
    assert resp.status_code == 200
    result = resp.get_json()
    assert result["is_correct"] is False


def test_api_answer_kanji_read_returns_reading(client):
    """kanji_read の回答APIがレスポンスに reading を含むこと"""
    client.get("/api/quiz/kanji/1")

    resp = client.post("/api/quiz/answer",
        json={
            "question_id": "kan_1_001",
            "is_correct": True,
            "category": "kanji",
            "level": 1,
        },
        content_type="application/json",
    )
    result = resp.get_json()
    assert "reading" in result
    assert len(result["reading"]) > 0


# ─────────────────────────────────────────────
# スタンプ・実績のテスト
# ─────────────────────────────────────────────

def test_kanji_stamps_in_rewards(app_ctx):
    """rewards.json にかんじスタンプ2種が定義されていること"""
    from app.question_loader import load_rewards
    rewards = load_rewards()
    stamp_ids = [s["id"] for s in rewards["stamps"]]
    assert "kanji_l1_clear" in stamp_ids, "kanji_l1_clear スタンプがありません"
    assert "kanji_l2_clear" in stamp_ids, "kanji_l2_clear スタンプがありません"


def test_kanji_stamp_has_correct_condition(app_ctx):
    """かんじスタンプの condition が正しく設定されていること"""
    from app.question_loader import load_rewards
    rewards = load_rewards()
    stamps = {s["id"]: s for s in rewards["stamps"]}

    s1 = stamps["kanji_l1_clear"]
    assert s1["condition"]["type"] == "level_clear"
    assert s1["condition"]["category"] == "kanji"
    assert s1["condition"]["level"] == 1

    s2 = stamps["kanji_l2_clear"]
    assert s2["condition"]["type"] == "level_clear"
    assert s2["condition"]["category"] == "kanji"
    assert s2["condition"]["level"] == 2
