"""SQLiteテーブル定義と初期化"""
import sqlite3
from pathlib import Path


CREATE_USERS = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

CREATE_RECORDS = """
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    level INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
"""

CREATE_ACHIEVEMENTS = """
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
"""

INSERT_DEFAULT_USER = """
INSERT OR IGNORE INTO users (id, name, avatar) VALUES (1, 'ゲスト', 'default')
"""


def init_db(db_path: Path) -> None:
    """データベースとテーブルを初期化する"""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(CREATE_USERS)
        conn.execute(CREATE_RECORDS)
        conn.execute(CREATE_ACHIEVEMENTS)
        conn.execute(INSERT_DEFAULT_USER)
        conn.commit()
    finally:
        conn.close()


def get_connection(db_path: Path) -> sqlite3.Connection:
    """DB接続を返す（呼び出し側でclose()すること）"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def save_record(db_path: Path, user_id: int, category: str, level: int,
                question_id: str, is_correct: bool) -> None:
    """学習記録を保存する"""
    conn = get_connection(db_path)
    try:
        conn.execute(
            "INSERT INTO records (user_id, category, level, question_id, is_correct) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, category, level, question_id, is_correct)
        )
        conn.commit()
    finally:
        conn.close()


def get_records(db_path: Path, user_id: int) -> list[dict]:
    """ユーザーの学習記録を返す"""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT * FROM records WHERE user_id = ? ORDER BY answered_at DESC",
            (user_id,)
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_achievements(db_path: Path, user_id: int) -> list[str]:
    """ユーザーの取得済み実績キー一覧を返す"""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT achievement_key FROM achievements WHERE user_id = ?",
            (user_id,)
        ).fetchall()
        return [row["achievement_key"] for row in rows]
    finally:
        conn.close()


def get_users(db_path: Path) -> list[dict]:
    """全ユーザー一覧を返す"""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT * FROM users ORDER BY id"
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def create_user(db_path: Path, name: str, avatar: str = "default") -> int:
    """ユーザーを作成し、新しいIDを返す"""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            "INSERT INTO users (name, avatar) VALUES (?, ?)",
            (name, avatar)
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def delete_user(db_path: Path, user_id: int) -> bool:
    """ユーザーを削除する。デフォルトユーザー(id=1)は削除不可。成功なら True"""
    if user_id == 1:
        return False
    conn = get_connection(db_path)
    try:
        conn.execute("DELETE FROM records WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM achievements WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return True
    finally:
        conn.close()


def get_stats_by_category(db_path: Path, user_id: int) -> list[dict]:
    """カテゴリ別の正解数・回答数・正答率を返す"""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            """
            SELECT category,
                   SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct,
                   COUNT(*) AS total
            FROM records
            WHERE user_id = ?
            GROUP BY category
            """,
            (user_id,)
        ).fetchall()
        result = []
        for row in rows:
            total = row["total"]
            correct = row["correct"]
            result.append({
                "category": row["category"],
                "correct": correct,
                "total": total,
                "rate": round(correct / total, 2) if total > 0 else 0.0,
            })
        return result
    finally:
        conn.close()


def get_cleared_levels(db_path: Path, user_id: int, category: str,
                       threshold: int = 3) -> set[int]:
    """
    指定カテゴリでクリア済み（正解数 >= threshold）のレベル集合を返す。
    """
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            """
            SELECT level,
                   SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct
            FROM records
            WHERE user_id = ? AND category = ?
            GROUP BY level
            """,
            (user_id, category)
        ).fetchall()
        return {row["level"] for row in rows if row["correct"] >= threshold}
    finally:
        conn.close()


def get_correct_count(db_path: Path, user_id: int) -> int:
    """ユーザーの累計正解数を返す"""
    conn = get_connection(db_path)
    try:
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM records WHERE user_id = ? AND is_correct = 1",
            (user_id,)
        ).fetchone()
        return row["cnt"] if row else 0
    finally:
        conn.close()


def get_daily_streak(db_path: Path, user_id: int) -> int:
    """
    連続チャレンジ日数を返す。
    今日を含めて何日連続で records に記録があるかをカウントする。
    """
    from datetime import date, timedelta
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            """
            SELECT DISTINCT date(answered_at) AS day
            FROM records
            WHERE user_id = ?
            ORDER BY day DESC
            """,
            (user_id,)
        ).fetchall()
        days = {row["day"] for row in rows}
        streak = 0
        current = date.today()
        while str(current) in days:
            streak += 1
            current -= timedelta(days=1)
        return streak
    finally:
        conn.close()


def save_achievement(db_path: Path, user_id: int, achievement_key: str) -> bool:
    """実績を保存する。既存の場合は False を返す"""
    conn = get_connection(db_path)
    try:
        existing = conn.execute(
            "SELECT id FROM achievements WHERE user_id = ? AND achievement_key = ?",
            (user_id, achievement_key)
        ).fetchone()
        if existing:
            return False
        conn.execute(
            "INSERT INTO achievements (user_id, achievement_key) VALUES (?, ?)",
            (user_id, achievement_key)
        )
        conn.commit()
        return True
    finally:
        conn.close()
