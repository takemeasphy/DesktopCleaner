import { useEffect, useRef, useState } from "react";
import type { DesktopFile } from "./types";
import { CircularProgress } from "./components/CircularProgress";
import { MiniBarChart, type MiniBarDatum } from "./components/MiniBarChart";
import {
  WeeklyCleanlinessChart,
  type WeeklyPoint,
} from "./components/WeeklyCleanlinessChart";
import { TEXTS, type Lang } from "./i18n";
import "./App.css";
import SettingsIcon from "./assets/Settings.png";
import UkIcon from "./assets/UKR.png";
import RuIcon from "./assets/RUS.png";
import EnIcon from "./assets/ENG.png";

declare global {
  interface Window {
    desktopBridge?: {
      scanDesktop: () => void;
      filesUpdated?: {
        connect: (cb: (payload: string) => void) => void;
      };
    };
  }
}

const LANG_ICONS: Record<Lang, string> = {
  uk: UkIcon,
  ru: RuIcon,
  en: EnIcon,
};

const MAX_FILES_FOR_100 = 50;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
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

function normalizeDayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function App() {
  const [files, setFiles] = useState<DesktopFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("uk");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [cleanupThreshold, setCleanupThreshold] = useState(30);
  const [ignoreList] = useState<string[]>([]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanPanelVisible, setScanPanelVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFilesCount, setScanFilesCount] = useState(0);
  const [scanTotalSize, setScanTotalSize] = useState(0);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [weeklyStats, setWeeklyStats] = useState<WeeklyPoint[]>([]);

  const scanIntervalRef = useRef<number | null>(null);

  const t = TEXTS[lang];

  const weeklyValues = weeklyStats.map((p) => p.value);
  const averageScore = weeklyValues.length
    ? Math.round(
        weeklyValues.reduce((sum, v) => sum + v, 0) / weeklyValues.length
      )
    : 0;

  const bestDayPoint =
    weeklyStats.length > 0
      ? weeklyStats.reduce((best, current) =>
          current.value > best.value ? current : best
        )
      : null;

  const worstDayPoint =
    weeklyStats.length > 0
      ? weeklyStats.reduce((worst, current) =>
          current.value < worst.value ? current : worst
        )
      : null;

  const totalDeletedFiles = 0;
  const totalFreedBytes = 0;

  useEffect(() => {
    const bridge = window.desktopBridge;
    if (
      bridge &&
      bridge.filesUpdated &&
      typeof bridge.filesUpdated.connect === "function"
    ) {
      const handler = (payload: string) => {
        try {
          const parsed = JSON.parse(payload) as { files: DesktopFile[] };
          setFiles(parsed.files);
          setScanFilesCount(parsed.files.length);
          const total = parsed.files.reduce(
            (sum, f) => sum + f.size_bytes,
            0
          );
          setScanTotalSize(total);
          setError(null);

          const count = parsed.files.length;
          const cleanlinessNow = count
            ? Math.max(
                0,
                Math.min(
                  100,
                  100 - (count / MAX_FILES_FOR_100) * 100
                )
              )
            : 100;

          const todayIndex = normalizeDayIndex(new Date().getDay());

          setWeeklyStats((prev) => {
            const filtered = prev.filter(
              (p) => p.dayIndex !== todayIndex
            );
            const next: WeeklyPoint[] = [
              ...filtered,
              { dayIndex: todayIndex, value: Math.round(cleanlinessNow) },
            ];
            return next.slice(-7);
          });
        } catch {
          setError(t.errorFallback);
          setFiles([]);
          setScanFilesCount(0);
          setScanTotalSize(0);
        }
        setScanProgress(100);
        setIsScanning(false);
      };
      bridge.filesUpdated.connect(handler);
    } else {
      setError("Desktop bridge is not available");
    }
  }, [t.errorFallback]);

  useEffect(() => {
    if (isScanning) {
      if (scanIntervalRef.current !== null) return;
      const id = window.setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 2;
        });
      }, 150);
      scanIntervalRef.current = id;
    } else {
      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }

    return () => {
      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isScanning]);

  const totalSize = files.reduce((sum, f) => sum + f.size_bytes, 0);

  const cleanlinessPercent = files.length
    ? Math.max(
        0,
        Math.min(
          100,
          100 - (files.length / MAX_FILES_FOR_100) * 100
        )
      )
    : 100;

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
    setIsStatsOpen(false);
    setIsLangMenuOpen(false);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleLangButtonClick = () => {
    setIsLangMenuOpen((prev) => !prev);
  };

  const handleSelectLang = (newLang: Lang) => {
    setLang(newLang);
    setIsLangMenuOpen(false);
  };

  const handleThresholdChange = (value: number) => {
    setCleanupThreshold(value);
  };

  const handleStartScan = () => {
    const bridge = window.desktopBridge;
    if (bridge && typeof bridge.scanDesktop === "function") {
      setError(null);
      setScanFilesCount(0);
      setScanTotalSize(0);
      setScanProgress(0);
      setScanPanelVisible(true);
      setIsScanning(true);
      setIsLangMenuOpen(false);
      bridge.scanDesktop();
    } else {
      setError("Desktop bridge is not available");
    }
  };

  const handleCloseScanPanel = () => {
    setScanPanelVisible(false);
  };

  const handleHistoryClick = () => {
    alert("History screen will be here later ✨");
  };

  const handleStatsClick = () => {
    setIsStatsOpen(true);
    setIsSettingsOpen(false);
    setIsLangMenuOpen(false);
  };

  const handleTrashClick = () => {
    alert("Trash action will be implemented later ✨");
  };

  const weekdayLabels = t.statsWeekDaysShort;
  const bestDayLabel =
    bestDayPoint != null ? weekdayLabels[bestDayPoint.dayIndex] : "—";
  const worstDayLabel =
    worstDayPoint != null ? weekdayLabels[worstDayPoint.dayIndex] : "—";

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
            className="top-btn top-btn-text"
            onClick={handleHistoryClick}
          >
            {t.historyLabel}
          </button>

          <button
            type="button"
            className="top-btn top-btn-text"
            onClick={handleStatsClick}
          >
            {t.statsLabel}
          </button>

          <div className="lang-menu-wrapper">
            <button
              type="button"
              className="top-btn top-btn-icon"
              onClick={handleLangButtonClick}
              title={t.langLabel}
            >
              <img
                src={LANG_ICONS[lang]}
                alt={t.langLabel}
                className="top-icon-img"
              />
            </button>

            {isLangMenuOpen && (
              <div className="lang-menu">
                <button
                  type="button"
                  className={
                    "lang-menu-item" + (lang === "uk" ? " active" : "")
                  }
                  onClick={() => handleSelectLang("uk")}
                >
                  Українська
                </button>
                <button
                  type="button"
                  className={
                    "lang-menu-item" + (lang === "en" ? " active" : "")
                  }
                  onClick={() => handleSelectLang("en")}
                >
                  English
                </button>
                <button
                  type="button"
                  className={
                    "lang-menu-item" + (lang === "ru" ? " active" : "")
                  }
                  onClick={() => handleSelectLang("ru")}
                >
                  Русский
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isSettingsOpen && !isStatsOpen && (
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
              disabled={isScanning}
            >
              {isScanning ? `${t.startScanButton}...` : t.startScanButton}
            </button>
          </section>

          <section className="table-wrapper">
            <div className="table-header">
              <h2>{t.tableTitle}</h2>
              <button
                type="button"
                className="table-trash-btn"
                onClick={handleTrashClick}
              >
                🗑 {t.tableTrashLabel}
              </button>
            </div>
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

      {isStatsOpen && (
        <div className="settings-page">
          <div className="settings-card">
            <div className="settings-header-row">
              <button
                type="button"
                className="settings-back-btn"
                onClick={() => setIsStatsOpen(false)}
              >
                ←
              </button>
              <div className="settings-header-text">
                <div className="settings-title">{t.statsLabel}</div>
                <div className="settings-subtitle">{t.statsSubtitle}</div>
              </div>
            </div>

            <div className="stats-main-row">
              <div className="stats-chart-column">
                <div className="summary-chart-title stats-chart-title">
                  {t.statsChartTitle}
                </div>
                <div className="stats-chart-wrapper">
                  <WeeklyCleanlinessChart
                    data={weeklyStats}
                    dayLabels={t.statsWeekDaysShort}
                    emptyText={t.statsWeekEmpty}
                  />
                </div>
              </div>

              <div className="stats-metrics-column">
                <div className="stats-metrics-grid">
                  <div className="stats-metric-card">
                    <div className="stats-metric-label">
                      {t.statsMetricFilesDeleted}
                    </div>
                    <div className="stats-metric-value">
                      {totalDeletedFiles}
                    </div>
                    <div className="stats-metric-sub">
                      {t.statsMetricLifetimeSub}
                    </div>
                  </div>

                  <div className="stats-metric-card">
                    <div className="stats-metric-label">
                      {t.statsMetricSpaceFreed}
                    </div>
                    <div className="stats-metric-value">
                      {formatSize(totalFreedBytes)}
                    </div>
                    <div className="stats-metric-sub">
                      {t.statsMetricSpaceSub}
                    </div>
                  </div>

                  <div className="stats-metric-card">
                    <div className="stats-metric-label">
                      {t.statsMetricAvgScore}
                    </div>
                    <div className="stats-metric-value">
                      {averageScore}%
                    </div>
                    <div className="stats-metric-sub">
                      {t.statsMetricWeeklySub}
                    </div>
                  </div>

                  <div className="stats-metric-card">
                    <div className="stats-metric-label">
                      {t.statsMetricBestDay}
                    </div>
                    <div className="stats-metric-value">
                      {bestDayLabel}
                    </div>
                    <div className="stats-metric-sub">
                      {bestDayPoint ? `${bestDayPoint.value}%` : ""}
                    </div>
                  </div>

                  <div className="stats-metric-card">
                    <div className="stats-metric-label">
                      {t.statsMetricWorstDay}
                    </div>
                    <div className="stats-metric-value">
                      {worstDayLabel}
                    </div>
                    <div className="stats-metric-sub">
                      {worstDayPoint ? `${worstDayPoint.value}%` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scanPanelVisible && (
        <div className="scan-overlay-backdrop">
          <div className="scan-overlay">
            <div className="scan-overlay-header">
              <div className="scan-overlay-title">
                {isScanning
                  ? t.scanDialogScanningTitle
                  : t.scanDialogDoneTitle}
              </div>
              <div className="scan-overlay-subtitle">
                {isScanning
                  ? t.scanDialogScanningSubtitle
                  : `${t.scanDialogFilesLabel}: ${scanFilesCount}`}
              </div>
            </div>

            <div className="scan-overlay-progress-block">
              <div className="scan-overlay-progress-label">
                {Math.round(scanProgress)}%
              </div>
              <div className="scan-overlay-progress-track">
                <div
                  className="scan-overlay-progress-bar"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            {!isScanning && (
              <div className="scan-overlay-stats">
                <div className="scan-overlay-stat-row">
                  <span>{t.scanDialogFilesLabel}</span>
                  <span>{scanFilesCount}</span>
                </div>
                <div className="scan-overlay-stat-row">
                  <span>{t.totalSize}</span>
                  <span>{formatSize(scanTotalSize)}</span>
                </div>
              </div>
            )}

            <div className="scan-overlay-footer">
              {!isScanning && (
                <button
                  type="button"
                  className="scan-overlay-close-btn"
                  onClick={handleCloseScanPanel}
                >
                  {t.scanDialogClose}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
