import sys
import json
from pathlib import Path

from PySide6.QtCore import QUrl, QObject, Signal, Slot
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtGui import QGuiApplication

from scanner import scan_desktop
from autorun import setup_autorun_status, is_autorun_enabled, AutorunTarget

class DesktopBridge(QObject):
    filesUpdated = Signal(str)

    def __init__(self, autorun_target: AutorunTarget):
        super().__init__()
        self._autorun_target = autorun_target

    @Slot()
    def scanDesktop(self):
        try:
            files = scan_desktop()
            payload = json.dumps({"files": files, "error": None}, ensure_ascii=False, default=str)
        except Exception as e:
            payload = json.dumps({"files": [], "error": str(e)}, ensure_ascii=False, default=str)
        self.filesUpdated.emit(payload)
    
    @Slot(bool, result=str)
    def setAutorun(self, enabled: bool) -> str:
        return setup_autorun_status(enable_autorun=enabled)

    @Slot(bool, result=str)
    def setAutorun(self, enabled: bool) -> str:
        return setup_autorun_status(enable_autorun=enabled, target=self._autorun_target)

    @Slot(result=bool)
    def getAutorunEnabled(self) -> bool:
        return is_autorun_enabled()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("DesktopCleaner")

        screen = QGuiApplication.primaryScreen()
        if screen is not None:
            geometry = screen.availableGeometry()
            screen_width = geometry.width()
            screen_height = geometry.height()
        else:
            screen_width = 1920
            screen_height = 1080

        scale = 0.65
        max_width = 1440
        max_height = 900

        width = min(int(screen_width * scale), max_width)
        height = min(int(screen_height * scale), max_height)

        self.resize(width, height)
        self.setMinimumSize(1024, 640)

        # централ
        x = int((screen_width - width) / 2)
        y = int((screen_height - height) / 2)
        self.move(x, y)

        view = QWebEngineView(self)

        # корень
        project_root = Path(__file__).resolve().parent.parent

        # таргет автозапуска
        bat_path = project_root / "run_desktop.bat"
        if bat_path.exists():
            autorun_target = AutorunTarget(
                target_path=str(bat_path),
                working_dir=str(project_root),
            )
        else:
            # fallback: pythonw.exe main.py 
            python_exe = Path(sys.executable)
            pythonw = python_exe.with_name("pythonw.exe")
            launcher = str(pythonw if pythonw.exists() else python_exe)

            main_py = Path(__file__).resolve()
            autorun_target = AutorunTarget(
                target_path=launcher,
                arguments=f'"{main_py}"',
                working_dir=str(project_root),
            )

        # UI dist
        dist_dir = project_root / "ui" / "dist"
        index_file = dist_dir / "index.html"
        if not index_file.exists():
            raise FileNotFoundError(
                f"Не знайдено {index_file}.\nСпочатку запусти `npm run build` в папці ui."
            )

        # WebChannel
        self.channel = QWebChannel(self)
        self.bridge = DesktopBridge(autorun_target)
        self.channel.registerObject("desktopBridge", self.bridge)
        view.page().setWebChannel(self.channel)

        #  index.html
        view.load(QUrl.fromLocalFile(str(index_file)))

        self.setCentralWidget(view)


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
