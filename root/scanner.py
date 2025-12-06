from pathlib import Path
from datetime import datetime


def get_desktop_path() -> Path:
    desktop = Path.home() / "Desktop"
    if desktop.exists():
        return desktop
    return Path.home()


def scan_desktop():
    desktop = get_desktop_path()
    files = []

    for entry in desktop.iterdir():
        if not entry.is_file():
            continue

        stat = entry.stat()
        files.append({
            "name": entry.name,
            "path": str(entry),
            "ext": entry.suffix.lower(),
            "size_bytes": stat.st_size,
            "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "last_access": datetime.fromtimestamp(stat.st_atime).isoformat(),
        })

    return files
