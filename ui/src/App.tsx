import { useEffect, useState } from "react";
import type { DesktopFile } from "./types";
import { mockFiles } from "./mockData";
import { CircularProgress } from "./components/CircularProgress";
import "./App.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function App() {
  const [files, setFiles] = useState<DesktopFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFileProtocol = window.location.protocol === "file:";

  useEffect(() => {
    if (isFileProtocol) {
      fetch("files.json")
        .then((res) => res.json())
        .then((data) => {
          setFiles(data.files as DesktopFile[]);
        })
        .catch((err) => {
          console.error("Failed to load files.json", err);
          setError("Не вдалося завантажити дані, показую моки.");
          setFiles(mockFiles);
        });
    } else {
      setFiles(mockFiles);
    }
  }, [isFileProtocol]);

  if (!files) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>DesktopCleaner</h1>
          <p>Loading...</p>
        </header>
      </div>
    );
  }

  const totalSize = files.reduce((sum, f) => sum + f.size_bytes, 0);

  const maxFilesFor100 = 50;
  const cleanlinessPercent = Math.max(
    0,
    Math.min(100, 100 - (files.length / maxFilesFor100) * 100)
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>DesktopCleaner</h1>
        <p>Prototype dashboard for desktop files</p>
        {error && <p style={{ color: "#b91c1c", marginTop: 4 }}>{error}</p>}
      </header>

      <section className="summary">
        <div className="summary-progress">
          <CircularProgress value={Math.round(cleanlinessPercent)} />

          <div className="summary-text">
            <div>
              <strong>Файлів на Desktop:</strong> {files.length}
            </div>
            <div>
              <strong>Сумарний розмір:</strong> {formatSize(totalSize)}
            </div>
            <div>
              <strong>Cleanliness score:</strong> {Math.round(cleanlinessPercent)}%
            </div>
          </div>
        </div>
      </section>

      <section className="table-wrapper">
        <h2>Список файлів</h2>
        <table>
          <thead>
            <tr>
              <th>Назва</th>
              <th>Розширення</th>
              <th>Розмір</th>
              <th>Остання зміна</th>
              <th>Останній доступ</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.path}>
                <td title={file.path}>{file.name}</td>
                <td>{file.ext}</td>
                <td>{formatSize(file.size_bytes)}</td>
                <td>{new Date(file.last_modified).toLocaleString()}</td>
                <td>{new Date(file.last_access).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
