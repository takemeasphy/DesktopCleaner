from __future__ import annotations

from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


def get_desktop_path() -> Path:
    desktop = Path.home() / "Desktop"
    if desktop.exists():
        return desktop
    return Path.home()


# -------------------- scoring helpers --------------------

def _coerce_float(x: Any) -> float:
    """
    Безпечне приведення до float:
    - int/float -> float
    - str -> float(str) якщо можливо
    - bool -> 0/1
    - будь-що інше (list/dict/None/...) -> 0.0
    """
    if isinstance(x, bool):
        return float(int(x))
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        try:
            return float(x)
        except Exception:
            return 0.0
    return 0.0


def _coerce_reasons(x: Any) -> List[str]:
    if isinstance(x, list):
        return [str(i) for i in x]
    return []


def _normalize_score_result(res: Any) -> Tuple[float, List[str]]:
    """
    Приводить будь-який результат score_file до (score: float, reasons: list[str]).
    Підтримує:
      - (score, reasons)
      - {"score": x, "reasons": [...]}
      - scalar score
    """
    if isinstance(res, (tuple, list)) and len(res) >= 2:
        score = _coerce_float(res[0])
        reasons = _coerce_reasons(res[1])
        return score, reasons

    if isinstance(res, dict):
        score = _coerce_float(res.get("score", 0.0))
        reasons = _coerce_reasons(res.get("reasons", []))
        return score, reasons

    return _coerce_float(res), []


def _try_score_file(file_obj: Dict[str, Any], rec: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Безпечний виклик intelligence.scoring.score_file.
    Підтримує дві сигнатури:
      - score_file(file_obj, rec)
      - score_file(file_obj)
    Якщо scoring відсутній/падає — (0.0, []).
    """
    try:
        from intelligence.scoring import score_file  # type: ignore
    except Exception:
        return 0.0, []

    try:
        res: Any = score_file(file_obj, rec)  # type: ignore[misc]
        return _normalize_score_result(res)
    except TypeError:
        try:
            res2: Any = score_file(file_obj)  # type: ignore[misc]
            return _normalize_score_result(res2)
        except Exception:
            return 0.0, []
    except Exception:
        return 0.0, []


# -------------------- main scan --------------------

def scan_desktop() -> List[Dict[str, Any]]:
    """
    Повертає список файлів з Desktop.

    Додатково:
      - оновлює intelligence state (first_seen_at/last_seen_at/seen_count)
      - підтягує user_label + user_category
      - додає trash_score + trash_reasons (якщо є scoring.py)
    """
    # intelligence state (optional)
    load_state = save_state = update_seen = None
    try:
        from intelligence.state import load_state as _ls, save_state as _ss, update_seen as _us  # type: ignore
        load_state, save_state, update_seen = _ls, _ss, _us
    except Exception:
        pass

    state: Dict[str, Any] = {"version": 1, "files": {}}
    if load_state:
        try:
            state = load_state()
        except Exception:
            state = {"version": 1, "files": {}}

    desktop = get_desktop_path()
    files: List[Dict[str, Any]] = []

    for entry in desktop.iterdir():
        if not entry.is_file():
            continue

        stat = entry.stat()

        file_obj: Dict[str, Any] = {
            "name": entry.name,
            "path": str(entry),
            "ext": entry.suffix.lower(),
            "size_bytes": stat.st_size,
            "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "last_access": datetime.fromtimestamp(stat.st_atime).isoformat(),
        }

        # state record
        rec: Dict[str, Any] = {}
        if update_seen:
            try:
                rec = update_seen(state, file_obj)
            except Exception:
                rec = {}

        user_label: Optional[str] = rec.get("label")
        user_category: Optional[str] = rec.get("category")

        # expose state -> UI
        file_obj["user_label"] = user_label
        file_obj["user_category"] = user_category
        file_obj["first_seen_at"] = rec.get("first_seen_at")
        file_obj["last_seen_at"] = rec.get("last_seen_at")
        file_obj["seen_count"] = int(rec.get("seen_count", 0) or 0)

        # scoring
        score, reasons = _try_score_file(file_obj, rec)

        # якщо користувач pinned/keep — це точно не сміття
        if user_label in ("pinned", "keep"):
            score = 0.0

        file_obj["trash_score"] = float(score)
        file_obj["trash_reasons"] = reasons

        files.append(file_obj)

    # persist state
    if save_state:
        try:
            save_state(state)
        except Exception:
            pass

    return files
