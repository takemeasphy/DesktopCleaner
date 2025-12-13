import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

TEMP_EXT = {".tmp", ".crdownload", ".part", ".log", ".dmp"}
ARCHIVE_EXT = {".zip", ".rar", ".7z"}
INSTALLER_EXT = {".exe", ".msi"}

DUP_PATTERNS = [
    re.compile(r"\(\d+\)"),  # file (1).txt
    re.compile(r"\bcopy\b", re.I),
    re.compile(r"\bfinal\b", re.I),
    re.compile(r"\bnew\b", re.I),
    re.compile(r"\bdownload\b", re.I),
]


def _days_between(now: datetime, iso_str: str | None) -> float | None:
    if not iso_str or not isinstance(iso_str, str):
        return None
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return (now - dt).total_seconds() / 86400.0
    except Exception:
        return None


def score_file(file_obj: Dict[str, Any], rec: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Baseline скоринг (0..1) без reliance на last_access.
    Повертає (score, reasons[]).
    """
    now = datetime.now(timezone.utc)

    name = (file_obj.get("name") or "").lower()
    ext = (file_obj.get("ext") or "").lower()
    size = int(file_obj.get("size_bytes") or 0)

    label = rec.get("label")
    if label in ("pinned", "keep"):
        return 0.0, ["user_marked_important"]

    reasons: List[str] = []
    score = 0.0

    days_mod = _days_between(now, file_obj.get("last_modified"))
    days_first_seen = _days_between(now, rec.get("first_seen_at"))

    # 1) дуже сильні сигнали
    if ext in TEMP_EXT:
        return 0.95, [f"temporary_extension:{ext}"]

    # 2) “давно не змінювався”
    if days_mod is not None and days_mod > 180:
        score += 0.35
        reasons.append(f"not_modified_{int(days_mod)}d")
    elif days_mod is not None and days_mod > 90:
        score += 0.25
        reasons.append(f"not_modified_{int(days_mod)}d")
    elif days_mod is not None and days_mod > 30:
        score += 0.12
        reasons.append(f"not_modified_{int(days_mod)}d")

    # 3) “лежить на Desktop давно” (наша власна ознака)
    if days_first_seen is not None and days_first_seen > 14:
        score += 0.10
        reasons.append(f"on_desktop_{int(days_first_seen)}d")

    # 4) інсталятори/архіви з давністю
    if ext in INSTALLER_EXT and (days_mod is not None and days_mod > 14):
        score += 0.25
        reasons.append("old_installer")

    if ext in ARCHIVE_EXT and (days_mod is not None and days_mod > 30):
        score += 0.18
        reasons.append("old_archive")

    # 5) підозріла назва (копії/версії)
    if any(p.search(name) for p in DUP_PATTERNS):
        score += 0.15
        reasons.append("name_looks_like_duplicate")

    # 6) великі payload-и (слабкий сигнал)
    if size > 500 * 1024 * 1024 and (ext in (INSTALLER_EXT | ARCHIVE_EXT)):
        score += 0.10
        reasons.append("very_large_old_payload")

    score = max(0.0, min(1.0, score))
    if not reasons:
        reasons.append("no_strong_signals")

    return score, reasons
