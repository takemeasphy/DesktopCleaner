import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from collections import Counter

from intelligence.storage.paths import get_state_path

STATE_VERSION = 1


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_state() -> Dict[str, Any]:
    path = get_state_path()
    if not path.exists():
        return {"version": STATE_VERSION, "files": {}}

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return {"version": STATE_VERSION, "files": {}}

        files = data.get("files")
        if not isinstance(files, dict):
            data["files"] = {}

        data["version"] = STATE_VERSION
        return data
    except Exception:
        return {"version": STATE_VERSION, "files": {}}


def save_state(state: Dict[str, Any]) -> None:
    path = get_state_path()
    path.parent.mkdir(parents=True, exist_ok=True)  # важливо, щоб директорія існувала
    path.write_text(
        json.dumps(state, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_record(state: Dict[str, Any], file_path: str) -> Dict[str, Any]:
    files = state.setdefault("files", {})
    rec = files.get(file_path)
    if not isinstance(rec, dict):
        rec = {}
        files[file_path] = rec
    return rec


def update_seen(state: Dict[str, Any], file_obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    first_seen/last_seen/seen_count + label + category.
    file_obj ожидает: path, last_modified, size_bytes
    """
    now = utc_now_iso()
    rec = get_record(state, file_obj["path"])

    if "first_seen_at" not in rec:
        rec["first_seen_at"] = now

    rec["last_seen_at"] = now
    rec["seen_count"] = int(rec.get("seen_count", 0)) + 1

    rec["last_modified"] = file_obj.get("last_modified")
    rec["size_bytes"] = file_obj.get("size_bytes")

    # label: "trash" | "keep" | "pinned" | "organize" | None
    if "label" not in rec:
        rec["label"] = None

    # category: "study" | "work" | "personal" | "games" | None
    if "category" not in rec:
        rec["category"] = None

    return rec


def set_label(state: Dict[str, Any], file_path: str, label: Optional[str]) -> Dict[str, Any]:
    """
    label: "trash" | "keep" | "pinned" | "organize" | None
    """
    rec = get_record(state, file_path)
    rec["label"] = label
    return rec


def label_file(file_path: str, label: Optional[str]) -> bool:
    """
    Завантажує state -> ставить label -> зберігає.
    """
    state = load_state()
    set_label(state, file_path, label)
    save_state(state)
    return True


def set_category(state: Dict[str, Any], file_path: str, category: Optional[str]) -> Dict[str, Any]:
    """
    category: "study" | "work" | "personal" | "games" | None
    """
    rec = get_record(state, file_path)
    rec["category"] = category
    return rec


def category_file(file_path: str, category: Optional[str]) -> bool:
    """
    Завантажує state -> ставить category -> зберігає.
    """
    state = load_state()
    set_category(state, file_path, category)
    save_state(state)
    return True

def build_profile_summary(state: Dict[str, Any]) -> Dict[str, Any]:
    files = state.get("files", {})
    if not isinstance(files, dict):
        files = {}

    labels = Counter()
    categories = Counter()

    total_records = 0
    labeled_records = 0
    categorized_records = 0

    for _path, rec in files.items():
        if not isinstance(rec, dict):
            continue

        total_records += 1

        label = rec.get("label")
        category = rec.get("category")

        if label:
            labels[str(label)] += 1
            labeled_records += 1
        if category:
            categories[str(category)] += 1
            categorized_records += 1

    top_label = labels.most_common(1)[0][0] if labels else None
    top_category = categories.most_common(1)[0][0] if categories else None

    return {
        "version": state.get("version", STATE_VERSION),
        "total_records": total_records,
        "labeled_records": labeled_records,
        "categorized_records": categorized_records,
        "labels": dict(labels),
        "categories": dict(categories),
        "top_label": top_label,
        "top_category": top_category,
    }


def get_profile_summary() -> Dict[str, Any]:
    state = load_state()
    return build_profile_summary(state)