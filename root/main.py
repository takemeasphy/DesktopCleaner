import sys
import json
from pathlib import Path

#Добавил импорт вебченел, зачем он нужен? Для того что бы я подвязал к кнопке сканирования функцию сканирования

from PySide6.QtCore import QUrl, QObject, Signal, Slot
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel

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
        self.resize(1400, 900)

        view = QWebEngineView(self)
        view.setZoomFactor(1.1)

        project_root = Path(__file__).resolve().parent.parent
        dist_dir = project_root / "ui" / "dist"
        index_file = dist_dir / "index.html"
        if not index_file.exists():
            raise FileNotFoundError(
                f"Не знайдено {index_file}.\n Спочатку запусти 'npm run build' в папці ui."
            )

        self.channel = QWebChannel(self)
        self.bridge = DesktopBridge()
        self.channel.registerObject("desktopBridge", self.bridge)
        view.page().setWebChannel(self.channel)

        url = QUrl.fromLocalFile(str(index_file))
        view.load(url)

        self.setCentralWidget(view)


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
