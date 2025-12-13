import os
import platform
from dataclasses import dataclass
from typing import Optional

import win32com.client

SHORTCUT_NAME = "DesktopCleaner.lnk"


@dataclass(frozen=True)
class AutorunTarget:
    # (bat/exe/cmd.exe)
    target_path: str
    # Аргументы для target_path
    arguments: str = ""
    # рабочая директория
    working_dir: Optional[str] = None
    # иконка
    icon_path: Optional[str] = None


def _startup_dir() -> str:
    return os.path.join(
        os.environ["APPDATA"],
        "Microsoft",
        "Windows",
        "Start Menu",
        "Programs",
        "Startup",
    )


def _shortcut_path() -> str:
    return os.path.join(_startup_dir(), SHORTCUT_NAME)


def is_autorun_enabled() -> bool:
    if platform.system() != "Windows":
        return False
    return os.path.exists(_shortcut_path())


def create_shortcut(target: AutorunTarget) -> None:
    shortcut_path = _shortcut_path()
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(shortcut_path)

    shortcut.TargetPath = target.target_path
    shortcut.Arguments = target.arguments or ""
    shortcut.WorkingDirectory = target.working_dir or os.path.dirname(target.target_path)

    if target.icon_path:
        shortcut.IconLocation = target.icon_path

    shortcut.Save()


def remove_shortcut() -> None:
    sp = _shortcut_path()
    if os.path.exists(sp):
        os.remove(sp)


def setup_autorun_status(enable_autorun: bool, target: AutorunTarget) -> str:
    """
    Включить или выключить автозапуск батника(приложения) при старте Windows
    Возвращает статус операции:
    - "added_to_startup" - добавлено в автозапуск
    """
    if platform.system() != "Windows":
        return "unsupported_os"

    try:
        if enable_autorun:
            if is_autorun_enabled():
                return "already_in_startup"
            create_shortcut(target)
            return "added_to_startup"
        else:
            if not is_autorun_enabled():
                return "shortcut_not_found"
            remove_shortcut()
            return "removed_from_startup"
    except Exception as e:
        return f"error_autorun:{e}"
