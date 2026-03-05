"""question_loader のユニットテスト"""
import pytest


def test_load_categories_returns_list(app_context):
    from app.question_loader import load_categories
    cats = load_categories()
    assert isinstance(cats, list)
    assert len(cats) > 0


def test_load_categories_only_enabled(app_context):
    from app.question_loader import load_categories
    cats = load_categories()
    for cat in cats:
        assert cat["enabled"] is True


def test_load_categories_sorted_by_order(app_context):
    from app.question_loader import load_categories
    cats = load_categories()
    orders = [c["order"] for c in cats]
    assert orders == sorted(orders)


def test_load_category_returns_correct(app_context):
    from app.question_loader import load_category
    cat = load_category("length")
    assert cat is not None
    assert cat["id"] == "length"
    assert cat["name"] == "ながさ"


def test_load_category_returns_none_for_unknown(app_context):
    from app.question_loader import load_category
    cat = load_category("unknown_category")
    assert cat is None


def test_load_questions_returns_list(app_context):
    from app.question_loader import load_questions
    questions = load_questions("length", 1)
    assert isinstance(questions, list)
    assert len(questions) >= 5


def test_load_questions_have_required_fields(app_context):
    from app.question_loader import load_questions
    questions = load_questions("length", 1)
    for q in questions:
        assert "id" in q
        assert "type" in q
        assert "question" in q
        assert "options" in q
        assert "answer_index" in q


def test_load_questions_all_levels(app_context):
    from app.question_loader import load_questions
    for level in [1, 2, 3]:
        questions = load_questions("length", level)
        assert len(questions) >= 5, f"レベル{level}の問題数が5問未満です"


def test_load_questions_returns_empty_for_invalid_level(app_context):
    from app.question_loader import load_questions
    questions = load_questions("length", 99)
    assert questions == []


def test_load_question_ids_are_unique(app_context):
    from app.question_loader import load_questions
    for level in [1, 2, 3]:
        questions = load_questions("length", level)
        ids = [q["id"] for q in questions]
        assert len(ids) == len(set(ids)), f"レベル{level}に重複IDがあります"


def test_load_explore_modules(app_context):
    from app.question_loader import load_explore_modules
    modules = load_explore_modules()
    assert isinstance(modules, list)
    assert len(modules) > 0
    for m in modules:
        assert m["enabled"] is True


def test_load_rewards(app_context):
    from app.question_loader import load_rewards
    rewards = load_rewards()
    assert "stamps" in rewards
    assert "secret_rewards" in rewards
    assert len(rewards["stamps"]) > 0


def test_reload_cache(app_context):
    from app.question_loader import reload_cache, load_categories
    # キャッシュクリア後も正常に動作すること
    reload_cache()
    cats = load_categories()
    assert len(cats) > 0


def test_level_info_has_passing_score(app_context):
    from app.question_loader import load_level_info
    info = load_level_info("length", 1)
    assert "passing_score" in info
    assert info["passing_score"] >= 1
