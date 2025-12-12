import os
import platform
from pathlib import Path

import win32com.client
import win32api


def search_with_pathlib(filename: str, search_drives: list[Path]) -> list[str]:
  """Пошук файлу filename на всіх переданих дисках."""
  found: list[str] = []

  for start_path in search_drives:
    if not start_path.exists():
      continue

    try:
      for file_path in start_path.rglob(filename):
        found.append(str(file_path))
    except Exception as e:
      print(f"Помилка при скануванні {start_path}: {e}")

  return found


def create_shortcut(target_path: str, shortcut_path: str) -> None:
  """Створення ярлика у Startup."""
  shell = win32com.client.Dispatch("WScript.Shell")
  shortcut = shell.CreateShortcut(shortcut_path)
  shortcut.TargetPath = target_path
  shortcut.WorkingDirectory = os.path.dirname(target_path)
  shortcut.IconLocation = target_path
  shortcut.save()


def manage_startup_shortcut(target_path: str, should_be_in_startup: bool) -> str:
  """Додавання / видалення ярлика з папки автозапуску."""
  startup_dir = os.path.join(
    os.environ["APPDATA"],
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup",
  )
  shortcut_name = "DesktopCleaner.lnk"
  shortcut_path = os.path.join(startup_dir, shortcut_name)

  if should_be_in_startup:
    if os.path.exists(shortcut_path):
      return "already_in_startup"

    try:
      create_shortcut(target_path, shortcut_path)
      return "added_to_startup"
    except Exception as e:
      return f"error_add_shortcut: {e}"
  else:
    if os.path.exists(shortcut_path):
      try:
        os.remove(shortcut_path)
        return "removed_from_startup"
      except Exception as e:
        return f"error_remove_shortcut: {e}"
    else:
      return "shortcut_not_found"


def setup_autorun_status(
  enable_autorun: bool,
  filename_to_find: str = "run_desktop.bat",
) -> str:
  """
  Увімкнути / вимкнути автозапуск.
  Шукає файл `filename_to_find` по доступних дисках і створює/видаляє ярлик.
  Повертає рядок-статус.
  """
  if platform.system() != "Windows":
    return "unsupported_os"

  try:
    drives_str = win32api.GetLogicalDriveStrings()
    drives = drives_str.split("\0")[:-1]
    search_paths = [Path(d) for d in drives]
  except Exception:
    # если не сработало, ищем только на C:\
    search_paths = [Path("C:\\")]

  found_files = search_with_pathlib(filename_to_find, search_paths)
  if not found_files:
    return f"file_not_found:{filename_to_find}"

  target_path = found_files[0]
  return manage_startup_shortcut(target_path, enable_autorun)
