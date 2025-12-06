import { useState } from "react";
import type { DesktopFile } from "./types";
import { mockFiles } from "./mockData";
import "./App.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function App() {
  const [files] = useState<DesktopFile[]>(mockFiles);

  const totalSize = files.reduce((sum, f) => sum + f.size_bytes, 0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>DesktopCleaner</h1>
        <p>Прототип інтерфейсу з мок-даними</p>
      </header>

      <section className="summary">
        <div>
          <strong>Файлів на Desktop (mock):</strong> {files.length}
        </div>
        <div>
          <strong>Сумарний розмір:</strong> {formatSize(totalSize)}
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

