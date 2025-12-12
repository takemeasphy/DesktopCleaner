import { useEffect, useRef, useState } from "react";

import type { DesktopFile } from "./types";
import { CircularProgress } from "./components/CircularProgress";
import { MiniBarChart, type MiniBarDatum } from "./components/MiniBarChart";
import type { WeeklyPoint } from "./components/WeeklyCleanlinessChart";

import { TEXTS, type Lang } from "./i18n";

import "./App.css";
import SettingsIcon from "./assets/Settings.png";
import UkIcon from "./assets/UKR.png";
import RuIcon from "./assets/RUS.png";
import EnIcon from "./assets/ENG.png";
import StatsIcon from "./assets/Statistics.png";
import TrashCanIcon from "./assets/TrashCan.png";
import DeleteIcon from "./assets/DELETE.png";

import { SettingsPage } from "./tabs/SettingsPage";
import { StatsPage } from "./tabs/StatsPage";
import { TrashPage } from "./tabs/TrashPage";

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

type TrashEntry = {
  id: string;
  file: DesktopFile;
  addedAt: string;
};

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
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [cleanupThreshold, setCleanupThreshold] = useState(30);
  const [ignoreList] = useState<string[]>([]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanPanelVisible, setScanPanelVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFilesCount, setScanFilesCount] = useState(0);
  const [scanTotalSize, setScanTotalSize] = useState(0);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [weeklyStats, setWeeklyStats] = useState<WeeklyPoint[]>([]);
  const [trashItems, setTrashItems] = useState<TrashEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(
    () => new Set()
  );

  const scanIntervalRef = useRef<number | null>(null);

  const t = TEXTS[lang];

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
          setSelectedPaths(new Set());
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
          setSelectedPaths(new Set());
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
    setIsTrashOpen(false);
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

  const handleStatsClick = () => {
    setIsStatsOpen(true);
    setIsSettingsOpen(false);
    setIsTrashOpen(false);
    setIsLangMenuOpen(false);
  };

  const handleOpenTrashPage = () => {
    setIsTrashOpen(true);
    setIsSettingsOpen(false);
    setIsStatsOpen(false);
    setIsLangMenuOpen(false);
  };

  const toggleFileSelection = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const allSelected = files.length > 0 && selectedPaths.size === files.length;

  const toggleSelectAll = () => {
    setSelectedPaths((prev) => {
      if (files.length === 0) return new Set();
      if (prev.size === files.length) {
        return new Set();
      }
      const next = new Set<string>();
      for (const f of files) {
        next.add(f.path);
      }
      return next;
    });
  };

  const movePathsToTrash = (paths: string[]) => {
    if (paths.length === 0) return;

    const now = new Date().toISOString();

    setTrashItems((prev) => {
      const selectedFiles = files.filter((f) => paths.includes(f.path));
      const newEntries: TrashEntry[] = selectedFiles.map((file, index) => ({
        id: `${file.path}-${now}-${index}`,
        file,
        addedAt: now,
      }));
      return [...newEntries, ...prev];
    });

    setFiles((prev) => prev.filter((f) => !paths.includes(f.path)));

    setSelectedPaths((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => next.delete(p));
      return next;
    });
  };

  const handleMoveSelectedToTrash = () => {
    if (selectedPaths.size === 0) return;
    movePathsToTrash(Array.from(selectedPaths));
  };

  const handleRestoreFromTrash = (id: string) => {
    setTrashItems((prev) => {
      const entry = prev.find((i) => i.id === id);
      if (!entry) return prev;
      setFiles((filesPrev) => [entry.file, ...filesPrev]);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handlePermanentDelete = (id: string) => {
    setTrashItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearTrash = () => {
    setTrashItems([]);
  };

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
            onClick={handleStatsClick}
            title={t.statsLabel}
          >
            <img
              src={StatsIcon}
              alt={t.statsLabel}
              className="top-icon-img"
            />
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

      {!isSettingsOpen && !isStatsOpen && !isTrashOpen && (
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
              <div className="table-header-buttons">
                <button
                  type="button"
                  className="table-trash-btn"
                  onClick={handleOpenTrashPage}
                  title={t.trashTitle}
                >
                  <img
                    src={TrashCanIcon}
                    alt={t.trashTitle}
                    className="table-header-icon"
                  />
                </button>
                <button
                  type="button"
                  className="table-trash-btn table-trash-btn-secondary"
                  onClick={handleMoveSelectedToTrash}
                  disabled={selectedPaths.size === 0}
                  title={t.tableTrashLabel}
                >
                  <img
                    src={DeleteIcon}
                    alt={t.tableTrashLabel}
                    className="table-header-icon"
                  />
                </button>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
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
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPaths.has(file.path)}
                          onChange={() => toggleFileSelection(file.path)}
                        />
                      </td>
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
        <SettingsPage
          t={t}
          ignoreList={ignoreList}
          cleanupThreshold={cleanupThreshold}
          onChangeThreshold={handleThresholdChange}
          onClose={closeSettings}
        />
      )}

      {isStatsOpen && (
        <StatsPage
          t={t}
          weeklyStats={weeklyStats}
          totalDeletedFiles={totalDeletedFiles}
          totalFreedBytes={totalFreedBytes}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {isTrashOpen && (
        <TrashPage
          t={t}
          items={trashItems}
          onClose={() => setIsTrashOpen(false)}
          onRestore={handleRestoreFromTrash}
          onPermanentDelete={handlePermanentDelete}
          onClearAll={handleClearTrash}
        />
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
