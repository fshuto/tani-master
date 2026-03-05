"""実績解除ロジック"""
from pathlib import Path
from .models import get_records, get_achievements, save_achievement, get_daily_streak
from .question_loader import load_rewards


def check_and_unlock(db_path: Path, user_id: int,
                     category: str, level: int) -> list[dict]:
    # noqa: Signature is intentionally broad (db_path passed down to streak check)
    """
    回答後に実績解除条件をチェックし、新たに解除されたものを返す。
    戻り値: 新解除された実績の辞書リスト（name, image, message を含む）
    """
    rewards = load_rewards()
    records = get_records(db_path, user_id)
    already_unlocked = set(get_achievements(db_path, user_id))
    streak = get_daily_streak(db_path, user_id)
    newly_unlocked = []

    for stamp in rewards.get("stamps", []):
        if stamp["id"] in already_unlocked:
            continue
        if _check_condition(stamp["condition"], records, category, level, streak):
            if save_achievement(db_path, user_id, stamp["id"]):
                newly_unlocked.append({
                    "id": stamp["id"],
                    "name": stamp["name"],
                    "image": stamp.get("image", ""),
                    "message": f"{stamp['name']} を かくとく！",
                })

    for reward in rewards.get("secret_rewards", []):
        if reward["id"] in already_unlocked:
            continue
        if _check_condition(reward["condition"], records, category, level, streak):
            if save_achievement(db_path, user_id, reward["id"]):
                newly_unlocked.append({
                    "id": reward["id"],
                    "name": reward["name"],
                    "image": reward.get("image", ""),
                    "message": reward.get("message", f"{reward['name']} を かくとく！"),
                })

    return newly_unlocked


def _check_condition(condition: dict, records: list[dict],
                     current_category: str, current_level: int,
                     streak: int = 0) -> bool:
    """条件タイプ別に解除条件を判定する"""
    ctype = condition.get("type")

    if ctype == "level_clear":
        cat = condition.get("category")
        lvl = condition.get("level")
        return _is_level_cleared(records, cat, lvl)

    if ctype == "total_correct":
        count = condition.get("count", 0)
        correct = sum(1 for r in records if r["is_correct"])
        return correct >= count

    if ctype == "all_categories_clear":
        lvl = condition.get("level", 1)
        from .question_loader import load_categories
        cats = load_categories()
        return all(_is_level_cleared(records, c["id"], lvl) for c in cats)

    if ctype == "daily_streak":
        required = condition.get("days", 3)
        return streak >= required

    return False


def _is_level_cleared(records: list[dict], category: str, level: int) -> bool:
    """指定カテゴリ×レベルで3問以上正解しているかを確認する（簡易判定）"""
    correct = sum(
        1 for r in records
        if r["category"] == category
        and r["level"] == level
        and r["is_correct"]
    )
    return correct >= 3
