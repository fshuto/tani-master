"""学習記録・ごほうび・きょうのチャレンジ"""
import random
from datetime import date
from flask import Blueprint, render_template, session, current_app, jsonify
from ..models import get_records, get_achievements, get_stats_by_category
from ..question_loader import load_rewards, load_categories, load_questions

bp = Blueprint("progress", __name__)


@bp.route("/records")
def records():
    db_path = current_app.config["DB_PATH"]
    user_id = session.get("user_id", 1)
    history = get_records(db_path, user_id)
    stats = get_stats_by_category(db_path, user_id)
    # カテゴリ日本語名マッピング
    category_names = {
        "length": "ながさ",
        "volume": "かさ",
        "weight": "おもさ",
        "time":   "じかん",
        "money":  "おかね",
    }
    for s in stats:
        s["name"] = category_names.get(s["category"], s["category"])
    return render_template("records.html", history=history, stats=stats)


@bp.route("/rewards")
def rewards():
    db_path = current_app.config["DB_PATH"]
    user_id = session.get("user_id", 1)
    unlocked = set(get_achievements(db_path, user_id))
    rewards_data = load_rewards()
    return render_template("rewards.html",
                           stamps=rewards_data.get("stamps", []),
                           secret_rewards=rewards_data.get("secret_rewards", []),
                           unlocked=unlocked)


@bp.route("/daily")
def daily():
    question, category_id, level = _get_daily_question()
    return render_template("daily.html", question=question,
                           category_id=category_id, level=level)


@bp.route("/api/daily")
def api_daily():
    question, category_id, level = _get_daily_question()
    if question is None:
        return jsonify({"error": "no questions"}), 404
    return jsonify({"question": question, "category": category_id, "level": level})


def _get_daily_question() -> tuple:
    """日付シードで今日の問題を1問選ぶ"""
    categories = load_categories()
    if not categories:
        return None, None, None
    seed = int(date.today().strftime("%Y%m%d"))
    rng = random.Random(seed)
    cat = rng.choice(categories)
    level = rng.choice(cat["levels"])
    questions = load_questions(cat["id"], level)
    if not questions:
        return None, None, None
    question = rng.choice(questions)
    return question, cat["id"], level
