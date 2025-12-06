import { useEffect, useState } from "react";
import type { DesktopFile } from "./types";
import { mockFiles } from "./mockData";
import { CircularProgress } from "./components/CircularProgress";
import { MiniBarChart, type MiniBarDatum } from "./components/MiniBarChart";
import { TEXTS, nextLang, type Lang } from "./i18n";
import "./App.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getCategory(file: DesktopFile, lang: Lang): string {
  const t = TEXTS[lang];
  const ext = file.ext.toLowerCase();

  if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].includes(ext)) {
    return t.catImages;
  }
  if ([".txt", ".pdf", ".doc", ".docx", ".xlsx", ".pptx"].includes(ext)) {
    return t.catDocs;
  }
  if ([".zip", ".rar", ".7z"].includes(ext)) {
    return t.catArchives;
  }
  return t.catOther;
}

function App() {
  const [files, setFiles] = useState<DesktopFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("uk");

  const isFileProtocol = window.location.protocol === "file:";
  const t = TEXTS[lang];

  useEffect(() => {
    if (isFileProtocol) {
      fetch("files.json")
        .then((res) => res.json())
        .then((data) => {
          setFiles(data.files as DesktopFile[]);
        })
        .catch((err) => {
          console.error("Failed to load files.json", err);
          setError(t.errorFallback);
          setFiles(mockFiles);
        });
    } else {
      setFiles(mockFiles);
    }
  }, [isFileProtocol]); 

  if (!files) {
    return <div className="app">{t.loading}</div>;
  }

  const totalSize = files.reduce((sum, f) => sum + f.size_bytes, 0);

  const maxFilesFor100 = 50;
  const cleanlinessPercent = Math.max(
    0,
    Math.min(100, 100 - (files.length / maxFilesFor100) * 100)
  );

  const categoryMap = new Map<string, number>();
  for (const f of files) {
    const cat = getCategory(f, lang);
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }

  const chartData: MiniBarDatum[] = Array.from(categoryMap.entries()).map(
    ([label, value]) => ({ label, value })
  );

  const handleSettingsClick = () => {
    alert("Settings will be here later ✨");
  };

  const handleLangClick = () => {
    setLang((prev) => nextLang(prev));
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-spacer" />
        <div className="topbar-buttons">
          <button
            type="button"
            className="top-btn"
            onClick={handleSettingsClick}
          >
            ⚙ {t.settingsLabel}
          </button>
          <button
            type="button"
            className="top-btn"
            onClick={handleLangClick}
          >
            🌐 {t.langLabel}
          </button>
        </div>
      </div>

      <section className="summary">
        <div className="summary-left">
          <CircularProgress value={Math.round(cleanlinessPercent)} />
        </div>

        <div className="summary-right">
          <div className="summary-metrics">
            <div className="metric">
              <span className="metric-label">{t.filesOnDesktop}</span>
              <span className="metric-value">{files.length}</span>
            </div>
            <div className="metric">
              <span className="metric-label">{t.totalSize}</span>
              <span className="metric-value">{formatSize(totalSize)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">{t.cleanlinessScore}</span>
              <span className="metric-value">
                {Math.round(cleanlinessPercent)}%
              </span>
            </div>
            {error && <div className="metric-error">{error}</div>}
          </div>

          <div className="summary-chart-block">
            <div className="summary-chart-title">{t.chartTitle}</div>
            <MiniBarChart data={chartData} />
          </div>
        </div>
      </section>

      <section className="table-wrapper">
        <h2>{t.tableTitle}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t.colName}</th>
                <th>{t.colExt}</th>
                <th>{t.colSize}</th>
                <th>{t.colModified}</th>
                <th>{t.colAccess}</th>
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
        </div>
      </section>
    </div>
  );
}

export default App;
