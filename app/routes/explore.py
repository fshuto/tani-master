"""たいけんコーナー"""
from flask import Blueprint, render_template, abort
from ..question_loader import load_explore_modules

bp = Blueprint("explore", __name__)


@bp.route("/explore")
def explore_list():
    modules = load_explore_modules()
    return render_template("explore_list.html", modules=modules)


@bp.route("/explore/<module_id>")
def explore_module(module_id: str):
    modules = load_explore_modules()
    module = next((m for m in modules if m["id"] == module_id), None)
    if module is None:
        abort(404)
    return render_template("explore_module.html", module=module)
