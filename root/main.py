import sys
import json
from pathlib import Path

from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtCore import QUrl

from scanner import scan_desktop


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
                f"Не знайдено {index_file}. "
                "Спочатку запусти 'npm run build' в папці ui."
            )

        files = scan_desktop()

        files_json = dist_dir / "files.json"
        with files_json.open("w", encoding="utf-8") as f:
            json.dump({"files": files}, f, ensure_ascii=False, indent=2)

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