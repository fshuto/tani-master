#!/usr/bin/env bash
# setup_rpi.sh — たんいマスター Raspberry Pi セットアップスクリプト
# 使い方: bash setup_rpi.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_USER="${SUDO_USER:-$(whoami)}"
VENV_DIR="${APP_DIR}/.venv"
DB_DIR="${APP_DIR}/db"
SERVICE_NAME="tani-master"

echo "=== たんいマスター セットアップ ==="
echo "インストール先: ${APP_DIR}"
echo "実行ユーザー  : ${APP_USER}"
echo ""

# ---- 1. Python 仮想環境 ----
echo "[1/5] Python 仮想環境を作成しています..."
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --quiet --upgrade pip
"${VENV_DIR}/bin/pip" install --quiet -r "${APP_DIR}/requirements.txt"
echo "      完了"

# ---- 2. データベース初期化 ----
echo "[2/5] データベースを初期化しています..."
mkdir -p "${DB_DIR}"
"${VENV_DIR}/bin/python" - <<'PYEOF'
import sys
sys.path.insert(0, '.')
from app.models import init_db
from pathlib import Path
db_path = Path("db/tani_master.db")
if not db_path.exists():
    init_db(db_path)
    print("      データベースを作成しました:", db_path)
else:
    print("      データベースは既に存在します:", db_path)
PYEOF

# ---- 3. systemd サービスファイル ----
echo "[3/5] systemd サービスを設定しています..."
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
sudo tee "${SERVICE_FILE}" > /dev/null <<EOF
[Unit]
Description=たんいマスター Web アプリ
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment="FLASK_ENV=production"
Environment="DB_PATH=${APP_DIR}/db/tani_master.db"
ExecStart=${VENV_DIR}/bin/gunicorn \
    --workers 2 \
    --bind 0.0.0.0:5000 \
    --timeout 30 \
    --access-logfile ${APP_DIR}/logs/access.log \
    --error-logfile ${APP_DIR}/logs/error.log \
    "run:app"
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

mkdir -p "${APP_DIR}/logs"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/logs"
sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
echo "      完了"

# ---- 4. Avahi mDNS（tani-master.local でアクセス可能に） ----
echo "[4/5] mDNS (Avahi) を設定しています..."
if command -v avahi-daemon &> /dev/null; then
    AVAHI_SERVICE="/etc/avahi/services/${SERVICE_NAME}.service"
    sudo tee "${AVAHI_SERVICE}" > /dev/null <<EOF
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">たんいマスター (%h)</name>
  <service>
    <type>_http._tcp</type>
    <port>5000</port>
  </service>
</service-group>
EOF
    sudo systemctl restart avahi-daemon 2>/dev/null || true
    echo "      完了 — http://$(hostname).local:5000 でアクセスできます"
else
    echo "      Avahi が見つかりません。スキップします"
    echo "      インストールするには: sudo apt-get install -y avahi-daemon"
fi

# ---- 5. サービス起動 ----
echo "[5/5] サービスを起動しています..."
sudo systemctl start "${SERVICE_NAME}"
sleep 2
if sudo systemctl is-active --quiet "${SERVICE_NAME}"; then
    echo "      起動成功！"
else
    echo "      起動に失敗しました。ログを確認してください:"
    echo "        sudo journalctl -u ${SERVICE_NAME} -n 30"
    exit 1
fi

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "アクセス URL:"
echo "  http://$(hostname -I | awk '{print $1}'):5000"
if command -v avahi-daemon &> /dev/null; then
    echo "  http://$(hostname).local:5000"
fi
echo ""
echo "よく使うコマンド:"
echo "  sudo systemctl start   ${SERVICE_NAME}   # 起動"
echo "  sudo systemctl stop    ${SERVICE_NAME}   # 停止"
echo "  sudo systemctl restart ${SERVICE_NAME}   # 再起動"
echo "  sudo journalctl -u     ${SERVICE_NAME} -f  # ログを見る"
echo ""
echo "JSONデータを更新したあとは:"
echo "  cd ${APP_DIR} && git pull origin main"
echo "  sudo systemctl restart ${SERVICE_NAME}"
