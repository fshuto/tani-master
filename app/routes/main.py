"""ホーム・ユーザー選択・カテゴリ一覧・レベル選択"""
from flask import (Blueprint, render_template, abort, current_app,
                   jsonify, session, request, redirect, url_for, flash)
from ..question_loader import load_categories, load_category
from ..models import get_users, create_user, delete_user, get_cleared_levels

bp = Blueprint("main", __name__)

# 利用可能なアバター（絵文字IDと表示）
AVATARS = [
    {"id": "dog",    "emoji": "🐶"},
    {"id": "cat",    "emoji": "🐱"},
    {"id": "bear",   "emoji": "🐻"},
    {"id": "panda",  "emoji": "🐼"},
    {"id": "frog",   "emoji": "🐸"},
    {"id": "rabbit", "emoji": "🐰"},
    {"id": "fox",    "emoji": "🦊"},
    {"id": "koala",  "emoji": "🐨"},
]


@bp.route("/")
def home():
    db_path = current_app.config["DB_PATH"]
    users = get_users(db_path)
    return render_template("home.html", users=users, avatars=AVATARS)


@bp.route("/select-user", methods=["POST"])
def select_user():
    user_id = request.form.get("user_id", type=int)
    if user_id is None:
        flash("ユーザーを えらんでください", "error")
        return redirect(url_for("main.home"))
    session["user_id"] = user_id
    return redirect(url_for("main.category_list"))


@bp.route("/create-user", methods=["POST"])
def create_user_route():
    db_path = current_app.config["DB_PATH"]
    name = request.form.get("name", "").strip()
    avatar_id = request.form.get("avatar_id", "dog")
    if not name:
        flash("なまえを いれてね", "error")
        return redirect(url_for("main.home"))
    if len(name) > 10:
        flash("なまえは 10もじ いないにしてね", "error")
        return redirect(url_for("main.home"))
    users = get_users(db_path)
    if len(users) >= 5:
        flash("ユーザーは 5にん まで つくれるよ", "error")
        return redirect(url_for("main.home"))
    create_user(db_path, name, avatar_id)
    return redirect(url_for("main.home"))


@bp.route("/delete-user", methods=["POST"])
def delete_user_route():
    db_path = current_app.config["DB_PATH"]
    user_id = request.form.get("user_id", type=int)
    if user_id is None:
        return redirect(url_for("main.home"))
    deleted = delete_user(db_path, user_id)
    if not deleted:
        flash("このユーザーは けせないよ", "error")
    if session.get("user_id") == user_id:
        session.pop("user_id", None)
    return redirect(url_for("main.home"))


@bp.route("/category")
def category_list():
    db_path = current_app.config["DB_PATH"]
    user_id = session.get("user_id", 1)
    categories = load_categories()
    users = get_users(db_path)
    current_user = next((u for u in users if u["id"] == user_id), None)
    return render_template("category_list.html",
                           categories=categories,
                           current_user=current_user)


@bp.route("/category/<category_id>/levels")
def level_select(category_id: str):
    db_path = current_app.config["DB_PATH"]
    user_id = session.get("user_id", 1)
    category = load_category(category_id)
    if category is None:
        abort(404)
    cleared = get_cleared_levels(db_path, user_id, category_id)
    return render_template("level_select.html", category=category, cleared_levels=cleared)


@bp.route("/api/categories")
def api_categories():
    categories = load_categories()
    return jsonify(categories)
