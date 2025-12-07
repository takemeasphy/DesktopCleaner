import { useEffect, useState } from "react";
import type { DesktopFile } from "./types";
import { mockFiles } from "./mockData";
import { CircularProgress } from "./components/CircularProgress";
import { MiniBarChart, type MiniBarDatum } from "./components/MiniBarChart";
import { TEXTS, nextLang, type Lang } from "./i18n";
import "./App.css";
import SettingsIcon from "./assets/Settings.png";
import UkIcon from "./assets/UKR.png";
import RuIcon from "./assets/RUS.png";
import EnIcon from "./assets/ENG.png";

const LANG_ICONS: Record<Lang, string> = {
  uk: UkIcon,
  ru: RuIcon,
  en: EnIcon,
};

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cleanupThreshold, setCleanupThreshold] = useState(30);
  const [ignoreList] = useState<string[]>([]);

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
          setError(TEXTS.uk.errorFallback);
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

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleLangClick = () => {
    setLang((prev) => nextLang(prev));
  };

  const handleThresholdChange = (value: number) => {
    setCleanupThreshold(value);
  };

  const handleStartScan = () => {};

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-spacer" />
        <div className="topbar-buttons">
          <button
            type="button"
            className="top-btn top-btn-icon"
            onClick={openSettings}
            title={t.settingsLabel}
          >
            <img
              src={SettingsIcon}
              alt={t.settingsLabel}
              className="top-icon-img"
            />
          </button>
          <button
            type="button"
            className="top-btn top-btn-icon"
            onClick={handleLangClick}
            title={t.langLabel}
          >
            <img
              src={LANG_ICONS[lang]}
              alt={t.langLabel}
              className="top-icon-img"
            />
          </button>
        </div>
      </div>

      {!isSettingsOpen && (
        <>
          <section className="summary">
            <div className="summary-left">
              <CircularProgress
                value={Math.round(cleanlinessPercent)}
                size={260}
              />
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

          <section className="actions-section">
            <button
              type="button"
              className="primary-action-btn"
              onClick={handleStartScan}
            >
              {t.startScanButton}
            </button>
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
        </>
      )}

      {isSettingsOpen && (
        <div className="settings-page">
          <div className="settings-card">
            <div className="settings-header-row">
              <button
                type="button"
                className="settings-back-btn"
                onClick={closeSettings}
              >
                ←
              </button>
              <div className="settings-header-text">
                <div className="settings-title">{t.settingsLabel}</div>
                <div className="settings-subtitle">{t.settingsSubtitle}</div>
              </div>
            </div>

            <div className="settings-section settings-main-row">
              <div className="settings-column">
                <label className="settings-row">
                  <input type="checkbox" className="settings-checkbox" />
                  <div className="settings-row-text">
                    <div className="settings-row-title">
                      {t.settingsAutoLaunchTitle}
                    </div>
                    <div className="settings-row-desc">
                      {t.settingsAutoLaunchDesc}
                    </div>
                  </div>
                </label>

                <label className="settings-row">
                  <input type="checkbox" className="settings-checkbox" />
                  <div className="settings-row-text">
                    <div className="settings-row-title">
                      {t.settingsHiddenFilesTitle}
                    </div>
                    <div className="settings-row-desc">
                      {t.settingsHiddenFilesDesc}
                    </div>
                  </div>
                </label>

                <label className="settings-row">
                  <input type="checkbox" className="settings-checkbox" />
                  <div className="settings-row-text">
                    <div className="settings-row-title">
                      {t.settingsDryRunTitle}
                    </div>
                    <div className="settings-row-desc">
                      {t.settingsDryRunDesc}
                    </div>
                  </div>
                </label>
              </div>

              <div className="settings-ignore-card">
                <div className="settings-ignore-header">
                  <div className="settings-row-title">
                    {t.settingsIgnoreListTitle}
                  </div>
                  <div className="settings-row-desc">
                    {t.settingsIgnoreListDesc}
                  </div>
                </div>
                <button
                  type="button"
                  className="settings-btn-secondary settings-ignore-button"
                >
                  {t.settingsIgnoreListButton}
                </button>
                <div className="settings-ignore-list">
                  {ignoreList.length === 0 ? (
                    <div className="settings-ignore-item settings-ignore-empty">
                      {t.settingsIgnoreListEmpty}
                    </div>
                  ) : (
                    ignoreList.slice(0, 4).map((item) => (
                      <div key={item} className="settings-ignore-item">
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-row-text">
                <div className="settings-row-title">
                  {t.settingsThresholdTitle}
                </div>
                <div className="settings-row-desc">
                  {t.settingsThresholdDesc}
                </div>
              </div>
              <div className="settings-range-wrapper">
                <input
                  type="range"
                  min={7}
                  max={90}
                  value={cleanupThreshold}
                  onChange={(e) =>
                    handleThresholdChange(Number(e.target.value))
                  }
                />
                <div className="settings-range-value">
                  {cleanupThreshold} {t.settingsThresholdSuffix}
                </div>
              </div>
            </div>

            <div className="settings-footer">
              <button
                type="button"
                className="settings-btn-secondary"
                onClick={closeSettings}
              >
                {t.settingsCancel}
              </button>
              <button
                type="button"
                className="settings-btn-primary"
                onClick={closeSettings}
              >
                {t.settingsSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
