"""JSONコンテンツ読み込み・キャッシュ機構"""
import json
from pathlib import Path
from flask import current_app

DATA_DIR = Path(__file__).parent / "data"

_cache: dict[str, dict] = {}


def _load_json(relative_path: str) -> dict:
    """JSONファイルを読み込む。本番時はキャッシュを利用する"""
    cache_enabled = current_app.config.get("CACHE_ENABLED", False)
    if cache_enabled and relative_path in _cache:
        return _cache[relative_path]
    filepath = DATA_DIR / relative_path
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    _cache[relative_path] = data
    return data


def load_categories() -> list[dict]:
    """有効なカテゴリ一覧を order 順に返す"""
    cats = _load_json("categories.json")["categories"]
    return sorted(
        [c for c in cats if c.get("enabled", True)],
        key=lambda c: c.get("order", 99)
    )


def load_category(category_id: str) -> dict | None:
    """指定IDのカテゴリを返す（見つからない場合は None）"""
    cats = _load_json("categories.json")["categories"]
    for cat in cats:
        if cat["id"] == category_id:
            return cat
    return None


def load_level_info(category_id: str, level: int) -> dict:
    """指定カテゴリ×レベルのメタ情報（title, instruction, passing_score）を返す"""
    data = _load_json(f"questions/{category_id}.json")
    return data["levels"].get(str(level), {})


def load_questions(category_id: str, level: int) -> list[dict]:
    """指定カテゴリ×レベルの問題リストを返す"""
    level_data = load_level_info(category_id, level)
    return level_data.get("questions", [])


def load_explore_modules() -> list[dict]:
    """有効な体験コーナーモジュール一覧を返す"""
    modules = _load_json("explore/modules.json")["modules"]
    return [m for m in modules if m.get("enabled", True)]


def load_rewards() -> dict:
    """ごほうびデータ（stamps + secret_rewards）を返す"""
    return _load_json("rewards/rewards.json")


def reload_cache() -> None:
    """保護者画面からの手動キャッシュクリア用"""
    _cache.clear()
