import os
from pathlib import Path


def get_app_dir() -> Path:
    """
    Папка для данных DesktopCleaner (state/model/logs).
    Windows: %APPDATA%\\DesktopCleaner
    """
    appdata = os.environ.get("APPDATA")
    if appdata:
        d = Path(appdata) / "DesktopCleaner"
        d.mkdir(parents=True, exist_ok=True)
        return d

    d = Path.home() / ".desktopcleaner"
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_state_path() -> Path:
    return get_app_dir() / "file_state.json"
