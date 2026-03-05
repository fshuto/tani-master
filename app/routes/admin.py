"""ほごしゃ向け設定・進捗確認"""
from flask import Blueprint, render_template, request, jsonify, current_app
from ..models import (get_records, get_connection, get_users,
                      get_stats_by_category, get_achievements,
                      get_correct_count, get_daily_streak)
from ..question_loader import reload_cache, load_categories, load_rewards

bp = Blueprint("admin", __name__)

# カテゴリ日本語名マッピング
_CAT_NAMES = {
    "length": "ながさ",
    "volume": "かさ",
    "weight": "おもさ",
    "time":   "じかん",
    "money":  "おかね",
}


@bp.route("/admin")
def admin():
    db_path = current_app.config["DB_PATH"]
    categories = load_categories()
    users = get_users(db_path)
    rewards_data = load_rewards()
    all_stamps = rewards_data.get("stamps", []) + rewards_data.get("secret_rewards", [])

    # ユーザーごとの詳細統計を計算
    user_stats = []
    for user in users:
        uid = user["id"]
        stats = get_stats_by_category(db_path, uid)
        for s in stats:
            s["name"] = _CAT_NAMES.get(s["category"], s["category"])
        unlocked = set(get_achievements(db_path, uid))
        user_stats.append({
            "user": user,
            "stats": stats,
            "correct_total": get_correct_count(db_path, uid),
            "streak": get_daily_streak(db_path, uid),
            "stamp_count": sum(1 for s in all_stamps if s["id"] in unlocked),
            "stamp_total": len(all_stamps),
        })

    return render_template("admin.html",
                           users=users,
                           categories=categories,
                           user_stats=user_stats)


@bp.route("/admin/reload-cache", methods=["POST"])
def admin_reload_cache():
    """キャッシュを手動クリアする"""
    reload_cache()
    return jsonify({"status": "ok", "message": "キャッシュをクリアしました"})


@bp.route("/api/records/<int:user_id>")
def api_records(user_id: int):
    db_path = current_app.config["DB_PATH"]
    records = get_records(db_path, user_id)
    return jsonify(records)
