import sys
import json
from pathlib import Path

#Добавил импорт вебченел, зачем он нужен? Для того что бы я подвязал к кнопке сканирования функцию сканирования

from PySide6.QtCore import QUrl, QObject, Signal, Slot
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtGui import QGuiApplication

from scanner import scan_desktop


class DesktopBridge(QObject):
    filesUpdated = Signal(str)

    @Slot()
    def scanDesktop(self):
        files = scan_desktop()
        payload = json.dumps({"files": files}, ensure_ascii=False, default=str)
        self.filesUpdated.emit(payload)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("DesktopCleaner")

        # для андрейчиков ===
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
        view.setZoomFactor(1.1)

        project_root = Path(__file__).resolve().parent.parent
        dist_dir = project_root / "ui" / "dist"
        index_file = dist_dir / "index.html"
        if not index_file.exists():
            raise FileNotFoundError(
                f"Не знайдено {index_file}.\n Спочатку запусти `npm run build` в папці ui."
            )

        self.channel = QWebChannel(self)
        self.bridge = DesktopBridge()
        self.channel.registerObject("desktopBridge", self.bridge)
        view.page().setWebChannel(self.channel)

        url = index_file.as_uri()
        view.load(url)

        self.setCentralWidget(view)

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
