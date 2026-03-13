"""クイズAPI（出題・回答受付）"""
import random
from flask import (Blueprint, render_template, request, jsonify,
                   session, abort, current_app)
from ..question_loader import load_questions, load_category, load_level_info
from ..models import save_record
from ..achievement_checker import check_and_unlock

bp = Blueprint("quiz", __name__)

# クイズセッションのキー
SESSION_KEY = "quiz_state"


@bp.route("/quiz/<category_id>/<int:level>")
def quiz(category_id: str, level: int):
    """クイズ画面を返す"""
    category = load_category(category_id)
    if category is None:
        abort(404)
    level_info = load_level_info(category_id, level)
    if not level_info:
        abort(404)
    return render_template("quiz.html", category=category,
                           level=level, level_info=level_info)


@bp.route("/quiz/<category_id>/<int:level>/result")
def result(category_id: str, level: int):
    """結果画面を返す"""
    category = load_category(category_id)
    if category is None:
        abort(404)
    state = session.get(SESSION_KEY, {})
    score = state.get("score", 0)
    total = state.get("total", 0)
    new_achievements = state.get("new_achievements", [])
    # セッションのクイズ状態をクリア
    session.pop(SESSION_KEY, None)
    return render_template("result.html", category=category, level=level,
                           score=score, total=total,
                           new_achievements=new_achievements)


@bp.route("/api/quiz/<category_id>/<int:level>")
def api_quiz(category_id: str, level: int):
    """問題セットを返す"""
    questions = load_questions(category_id, level)
    if not questions:
        abort(404)
    level_info = load_level_info(category_id, level)
    session_size = level_info.get("session_size", 5)
    selected = random.sample(questions, min(len(questions), session_size))
    # セッションに問題セットを記録
    session[SESSION_KEY] = {
        "category": category_id,
        "level": level,
        "question_ids": [q["id"] for q in selected],
        "score": 0,
        "total": len(selected),
        "answered": [],
        "new_achievements": [],
    }
    return jsonify({"questions": selected, "total": len(selected)})


@bp.route("/api/quiz/answer", methods=["POST"])
def api_answer():
    """回答を受け取り、正誤判定・記録保存・実績チェックを行う"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "invalid request"}), 400

    question_id: str = data.get("question_id", "")
    answer_index: int = data.get("answer_index", -1)
    category: str = data.get("category", "")
    level: int = int(data.get("level", 0))

    # 問題データから正解を取得
    questions = load_questions(category, level)
    question = next((q for q in questions if q["id"] == question_id), None)
    if question is None:
        return jsonify({"error": "question not found"}), 404

    # kanji_read 型は親が正誤を判定して is_correct を直接送信する
    if question.get("type") == "kanji_read":
        is_correct = bool(data.get("is_correct", False))
    else:
        is_correct = question["answer_index"] == answer_index

    # DB保存
    db_path = current_app.config["DB_PATH"]
    user_id = session.get("user_id", 1)
    save_record(db_path, user_id, category, level, question_id, is_correct)

    # セッションのスコア更新
    state = session.get(SESSION_KEY, {})
    if is_correct:
        state["score"] = state.get("score", 0) + 1
    state.setdefault("answered", []).append(question_id)
    session[SESSION_KEY] = state

    # 実績チェック
    new_achievements = check_and_unlock(db_path, user_id, category, level)
    if new_achievements:
        state["new_achievements"] = (
            state.get("new_achievements", []) + new_achievements
        )
        session[SESSION_KEY] = state

    return jsonify({
        "is_correct": is_correct,
        "correct_index": question.get("answer_index"),
        "explanation": question.get("explanation", ""),
        "reading": question.get("reading", ""),
        "score_so_far": state.get("score", 0),
        "new_achievements": new_achievements,
    })
