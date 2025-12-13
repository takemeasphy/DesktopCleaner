import { useEffect, useMemo, useRef, useState } from "react";

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
import { ProfilePage } from "./tabs/ProfilePage";

import { loadSettings, saveSettings } from "./tabs/settingsStorage";

// -------------------- Qt WebChannel API --------------------

declare global {
  interface Window {
    desktopBridge?: {
      scanDesktop: () => void;
      filesUpdated?: {
        connect: (cb: (payload: string) => void) => void;
        disconnect?: (cb: (payload: string) => void) => void;
      };

      setAutorun?: (enabled: boolean, cb?: (status: string) => void) => void | string;
      getAutorunEnabled?: (cb?: (value: boolean) => void) => void | boolean;

      labelFile?: (path: string, label: string | null, cb?: (ok: boolean) => void) => void | boolean;
      setCategory?: (path: string, category: string | null, cb?: (ok: boolean) => void) => void | boolean;

      getProfileSummary?: (cb?: (payload: string) => void) => void | string;
    };
  }
}

// -------------------- Константи / типи --------------------

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

type ProfileSummary = {
  version?: number;
  total_records?: number;
  labeled_records?: number;
  categorized_records?: number;
  labels?: Record<string, number>;
  categories?: Record<string, number>;
  top_label?: string | null;
  top_category?: string | null;
  error?: string;
};

// -------------------- Helpers --------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getCategory(file: DesktopFile, lang: Lang): string {
  const t = TEXTS[lang];
  const ext = file.ext.toLowerCase();

  if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].includes(ext)) return t.catImages;
  if ([".txt", ".pdf", ".doc", ".docx", ".xlsx", ".pptx", ".dwg"].includes(ext)) return t.catDocs;
  if ([".zip", ".rar", ".7z"].includes(ext)) return t.catArchives;
  return t.catOther;
}

function normalizeDayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * Універсальний виклик Qt WebChannel slot'ів.
 * Підтримує:
 * - callback style: fn(...args, (res) => ...)
 * - sync return: const res = fn(...args)
 */
function callBridge<T>(fn: unknown, args: unknown[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof fn !== "function") {
        reject(new Error("Bridge function is not available"));
        return;
      }

      const f = fn as (...all: any[]) => any;

      if (f.length >= args.length + 1) {
        f(...args, (res: T) => resolve(res));
        return;
      }

      const res = f(...args);
      resolve(res as T);
    } catch (e) {
      reject(e);
    }
  });
}

function labelShort(label: string | null | undefined): string {
  if (!label) return "-";
  if (label === "trash") return "Trash";
  if (label === "pinned") return "Pinned";
  if (label === "keep") return "Keep";
  if (label === "organize") return "Organize";
  return label;
}

function categoryShort(cat: string | null | undefined): string {
  if (!cat) return "-";
  if (cat === "study") return "Study";
  if (cat === "work") return "Work";
  if (cat === "personal") return "Personal";
  if (cat === "games") return "Games";
  return cat;
}

// -------------------- App --------------------

function App() {
  const [files, setFiles] = useState<DesktopFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [lang, setLang] = useState<Lang>("uk");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [cleanupThreshold, setCleanupThreshold] = useState(30);
  const [ignoreList] = useState<string[]>([]);

  const [autorunEnabled, setAutorunEnabled] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanPanelVisible, setScanPanelVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFilesCount, setScanFilesCount] = useState(0);
  const [scanTotalSize, setScanTotalSize] = useState(0);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [weeklyStats, setWeeklyStats] = useState<WeeklyPoint[]>([]);
  const [trashItems, setTrashItems] = useState<TrashEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set());

  const scanIntervalRef = useRef<number | null>(null);

  const t = TEXTS[lang];
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = TEXTS[lang];
  }, [lang]);

  const [settingsHydrated, setSettingsHydrated] = useState(false);

  const isFilesUpdatedConnectedRef = useRef(false);
  const filesUpdatedHandlerRef = useRef<((payload: string) => void) | null>(null);

  const totalDeletedFiles = 0;
  const totalFreedBytes = 0;

  const [isLabeling, setIsLabeling] = useState(false);
  const [bulkLabel, setBulkLabel] = useState<"trash" | "pinned" | "keep" | "organize" | "none">("none");
  const [bulkCategory, setBulkCategory] = useState<"study" | "work" | "personal" | "games" | "none">("none");

  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);

  // -------------------- Settings storage --------------------

  useEffect(() => {
    const s = loadSettings();

    if (s.lang) setLang(s.lang);
    if (typeof s.cleanupThreshold === "number") setCleanupThreshold(s.cleanupThreshold);

    setSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    saveSettings({ lang, cleanupThreshold });
  }, [lang, cleanupThreshold, settingsHydrated]);

  // -------------------- Profile summary load --------------------

  const loadProfile = async () => {
    const bridge = window.desktopBridge;
    if (!bridge?.getProfileSummary) {
      setProfileSummary(null);
      return;
    }

    try {
      const payload = await callBridge<string>(bridge.getProfileSummary, []);
      const parsed = JSON.parse(payload) as ProfileSummary;
      setProfileSummary(parsed);
    } catch {
      setProfileSummary({ error: "Failed to load profile summary" });
    }
  };

  // -------------------- Autorun sync --------------------

  const syncAutorunFromOS = async () => {
    const bridge = window.desktopBridge;
    if (!bridge?.getAutorunEnabled) return;

    try {
      const actual = await callBridge<boolean>(bridge.getAutorunEnabled, []);
      setAutorunEnabled(Boolean(actual));
    } catch {
      // не критично
    }
  };

  // -------------------- Bridge init --------------------

  useEffect(() => {
    const tryInitBridge = () => {
      const bridge = window.desktopBridge;
      if (!bridge) return;

      void syncAutorunFromOS();
      void loadProfile();

      if (
        !isFilesUpdatedConnectedRef.current &&
        bridge.filesUpdated &&
        typeof bridge.filesUpdated.connect === "function"
      ) {
        const handler = (payload: string) => {
          try {
            const parsed = JSON.parse(payload) as {
              files?: DesktopFile[];
              error?: string | null;
            };

            const incomingFiles = Array.isArray(parsed.files) ? parsed.files : [];
            const backendError = typeof parsed.error === "string" && parsed.error ? parsed.error : null;

            setFiles(incomingFiles);
            setSelectedPaths(new Set());

            setScanFilesCount(incomingFiles.length);
            const total = incomingFiles.reduce((sum, f) => sum + f.size_bytes, 0);
            setScanTotalSize(total);

            setError(backendError);

            const count = incomingFiles.length;
            const cleanlinessNow = count
              ? Math.max(0, Math.min(100, 100 - (count / MAX_FILES_FOR_100) * 100))
              : 100;

            const todayIndex = normalizeDayIndex(new Date().getDay());
            setWeeklyStats((prev) => {
              const filtered = prev.filter((p) => p.dayIndex !== todayIndex);
              const next: WeeklyPoint[] = [...filtered, { dayIndex: todayIndex, value: Math.round(cleanlinessNow) }];
              return next.slice(-7);
            });

            void loadProfile();
          } catch {
            setError(tRef.current.errorFallback);
            setFiles([]);
            setSelectedPaths(new Set());
            setScanFilesCount(0);
            setScanTotalSize(0);
          }

          setScanProgress(100);
          setIsScanning(false);
        };

        filesUpdatedHandlerRef.current = handler;
        bridge.filesUpdated.connect(handler);
        isFilesUpdatedConnectedRef.current = true;
      }
    };

    const onReady = () => tryInitBridge();

    tryInitBridge();
    window.addEventListener("desktopBridgeReady", onReady);

    const retryId = window.setInterval(() => {
      if (window.desktopBridge) {
        tryInitBridge();
        window.clearInterval(retryId);
      }
    }, 250);

    return () => {
      window.removeEventListener("desktopBridgeReady", onReady);
      window.clearInterval(retryId);

      const bridge = window.desktopBridge;
      const handler = filesUpdatedHandlerRef.current;
      if (bridge?.filesUpdated?.disconnect && handler) {
        try {
          bridge.filesUpdated.disconnect(handler);
        } catch {
          // ignore
        }
      }

      isFilesUpdatedConnectedRef.current = false;
      filesUpdatedHandlerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------- Scan progress animation --------------------

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

  // -------------------- Home computed --------------------

  const totalSize = files.reduce((sum, f) => sum + f.size_bytes, 0);

  const cleanlinessPercent = files.length
    ? Math.max(0, Math.min(100, 100 - (files.length / MAX_FILES_FOR_100) * 100))
    : 100;

  const chartData: MiniBarDatum[] = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const f of files) {
      const cat = getCategory(f, lang);
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    }
    return Array.from(categoryMap.entries()).map(([label, value]) => ({ label, value }));
  }, [files, lang]);

  // -------------------- Topbar handlers --------------------

  const openSettings = () => {
    setIsSettingsOpen(true);
    setIsStatsOpen(false);
    setIsTrashOpen(false);
    setIsProfileOpen(false);
    setIsLangMenuOpen(false);
  };

  const closeSettings = () => setIsSettingsOpen(false);

  const handleStatsClick = () => {
    setIsStatsOpen(true);
    setIsSettingsOpen(false);
    setIsTrashOpen(false);
    setIsProfileOpen(false);
    setIsLangMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
    setIsSettingsOpen(false);
    setIsStatsOpen(false);
    setIsTrashOpen(false);
    setIsLangMenuOpen(false);
    void loadProfile();
  };

  const handleLangButtonClick = () => setIsLangMenuOpen((prev) => !prev);

  const handleSelectLang = (newLang: Lang) => {
    setLang(newLang);
    setIsLangMenuOpen(false);
  };

  const handleThresholdChange = (value: number) => setCleanupThreshold(value);

  const handleOpenTrashPage = () => {
    setIsTrashOpen(true);
    setIsSettingsOpen(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsLangMenuOpen(false);
  };

  // -------------------- Autorun toggle --------------------

  const handleToggleAutorun = (value: boolean) => {
    const bridge = window.desktopBridge;
    if (!bridge?.setAutorun) {
      setError("Desktop bridge is not available");
      return;
    }

    const prev = autorunEnabled;
    setAutorunEnabled(value);

    (async () => {
      try {
        const status = await callBridge<string>(bridge.setAutorun, [value]);

        if (typeof status === "string" && status.startsWith("error_autorun:")) {
          setError(status);
          setAutorunEnabled(prev);
          return;
        }

        await syncAutorunFromOS();
      } catch (e) {
        console.error("Failed to call setAutorun:", e);
        setError(tRef.current.errorFallback);
        setAutorunEnabled(prev);
      }
    })();
  };

  // -------------------- Scan --------------------

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

  const handleCloseScanPanel = () => setScanPanelVisible(false);

  // -------------------- Selection --------------------

  const toggleFileSelection = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const allSelected = files.length > 0 && selectedPaths.size === files.length;

  const toggleSelectAll = () => {
    setSelectedPaths((prev) => {
      if (files.length === 0) return new Set();
      if (prev.size === files.length) return new Set();

      const next = new Set<string>();
      for (const f of files) next.add(f.path);
      return next;
    });
  };

  // -------------------- Intelligence: bulk apply --------------------

  const applyBulk = () => {
    const bridge = window.desktopBridge;
    if (!bridge) {
      setError("Desktop bridge is not available");
      return;
    }

    const paths = Array.from(selectedPaths);
    if (paths.length === 0) return;

    setIsLabeling(true);

    const labelValue: string | null = bulkLabel === "none" ? null : bulkLabel;
    const categoryValue: string | null = bulkCategory === "none" ? null : bulkCategory;

    (async () => {
      try {
        if (bridge.labelFile) {
          for (const p of paths) {
            await callBridge<boolean>(bridge.labelFile, [p, labelValue]);
          }
        }

        if (bridge.setCategory) {
          for (const p of paths) {
            await callBridge<boolean>(bridge.setCategory, [p, categoryValue]);
          }
        }

        if (typeof bridge.scanDesktop === "function") bridge.scanDesktop();
      } catch (e) {
        console.error("applyBulk failed:", e);
        setError(tRef.current.errorFallback);
      } finally {
        setIsLabeling(false);
      }
    })();
  };

  // -------------------- Local Trash --------------------

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

  const handleClearTrash = () => setTrashItems([]);

  // -------------------- Render --------------------

  const showHome = !isSettingsOpen && !isStatsOpen && !isTrashOpen && !isProfileOpen;

  return (
    <div className="app">
      <div className="topbar">
        {/* Profile icon button in left corner */}
        <button type="button" className="top-btn top-btn-icon" onClick={handleProfileClick} title="Profile" style={{ marginLeft: 2 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.51 4.51 0 0 0 12 12Z"
              stroke="#111827"
              strokeWidth="1.7"
            />
            <path
              d="M4.5 20.5c1.6-4 13.4-4 15 0"
              stroke="#111827"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="topbar-spacer" />

        <div className="topbar-buttons">
          <button type="button" className="top-btn top-btn-icon" onClick={openSettings} title={t.settingsLabel}>
            <img src={SettingsIcon} alt={t.settingsLabel} className="top-icon-img" />
          </button>

          <button type="button" className="top-btn top-btn-icon" onClick={handleStatsClick} title={t.statsLabel}>
            <img src={StatsIcon} alt={t.statsLabel} className="top-icon-img" />
          </button>

          <div className="lang-menu-wrapper">
            <button type="button" className="top-btn top-btn-icon" onClick={handleLangButtonClick} title={t.langLabel}>
              <img src={LANG_ICONS[lang]} alt={t.langLabel} className="top-icon-img" />
            </button>

            {isLangMenuOpen && (
              <div className="lang-menu">
                <button
                  type="button"
                  className={"lang-menu-item" + (lang === "uk" ? " active" : "")}
                  onClick={() => handleSelectLang("uk")}
                >
                  Українська
                </button>
                <button
                  type="button"
                  className={"lang-menu-item" + (lang === "en" ? " active" : "")}
                  onClick={() => handleSelectLang("en")}
                >
                  English
                </button>
                <button
                  type="button"
                  className={"lang-menu-item" + (lang === "ru" ? " active" : "")}
                  onClick={() => handleSelectLang("ru")}
                >
                  Русский
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Home */}
      {showHome && (
        <>
          <section className="summary">
            <div className="summary-left">
              <CircularProgress value={Math.round(cleanlinessPercent)} size={260} />
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
                  <span className="metric-value">{Math.round(cleanlinessPercent)}%</span>
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
            <button type="button" className="primary-action-btn" onClick={handleStartScan} disabled={isScanning}>
              {isScanning ? `${t.startScanButton}...` : t.startScanButton}
            </button>
          </section>

          <section className="table-wrapper">
            <div className="table-header">
              <h2>{t.tableTitle}</h2>

              <div className="table-header-buttons">
                <button type="button" className="table-trash-btn" onClick={handleOpenTrashPage} title={t.trashTitle}>
                  <img src={TrashCanIcon} alt={t.trashTitle} className="table-header-icon" />
                </button>

                <button
                  type="button"
                  className="table-trash-btn table-trash-btn-secondary"
                  onClick={handleMoveSelectedToTrash}
                  disabled={selectedPaths.size === 0}
                  title={t.tableTrashLabel}
                >
                  <img src={DeleteIcon} alt={t.tableTrashLabel} className="table-header-icon" />
                </button>
              </div>
            </div>

            {/* compact bulk toolbar */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "10px 0 6px 0", flexWrap: "wrap" }}>
              <div style={{ opacity: 0.85, fontSize: 13 }}>
                Selected: <b>{selectedPaths.size}</b>
              </div>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ opacity: 0.8, fontSize: 12 }}>Label</span>
                <select
                  value={bulkLabel}
                  onChange={(e) => setBulkLabel(e.target.value as any)}
                  disabled={isLabeling}
                  style={{ height: 34, borderRadius: 10, padding: "0 10px" }}
                >
                  <option value="none">Clear</option>
                  <option value="trash">Trash</option>
                  <option value="keep">Keep</option>
                  <option value="pinned">Pinned</option>
                  <option value="organize">Organize</option>
                </select>
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ opacity: 0.8, fontSize: 12 }}>Category</span>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as any)}
                  disabled={isLabeling}
                  style={{ height: 34, borderRadius: 10, padding: "0 10px" }}
                >
                  <option value="none">Clear</option>
                  <option value="study">Study</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="games">Games</option>
                </select>
              </label>

              <button
                type="button"
                className="table-trash-btn table-trash-btn-secondary"
                onClick={applyBulk}
                disabled={selectedPaths.size === 0 || isLabeling}
                title="Apply label/category to selected files"
                style={{ height: 34, padding: "0 14px" }}
              >
                Apply
              </button>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    <th>{t.colName}</th>
                    <th>{t.colExt}</th>
                    <th>{t.colSize}</th>
                    <th>Score</th>
                    <th>Label</th>
                    <th>Category</th>
                    <th>{t.colModified}</th>
                    <th>{t.colAccess}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const score = typeof (file as any).trash_score === "number" ? ((file as any).trash_score as number) : null;
                    const reasons = Array.isArray((file as any).trash_reasons) ? ((file as any).trash_reasons as string[]) : [];
                    const ulabel = (file as any).user_label as string | null | undefined;
                    const ucat = (file as any).user_category as string | null | undefined;

                    return (
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
                        <td title={reasons.length ? reasons.join(", ") : ""}>{score === null ? "-" : score.toFixed(2)}</td>
                        <td>{labelShort(ulabel)}</td>
                        <td>{categoryShort(ucat)}</td>
                        <td>{new Date(file.last_modified).toLocaleString()}</td>
                        <td>{new Date(file.last_access).toLocaleString()}</td>
                      </tr>
                    );
                  })}
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
          autorunEnabled={autorunEnabled}
          onToggleAutorun={handleToggleAutorun}
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

      {isProfileOpen && (
        <ProfilePage
          t={t}
          onClose={() => setIsProfileOpen(false)}
          summary={profileSummary}
          files={files}
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
              <div className="scan-overlay-title">{isScanning ? t.scanDialogScanningTitle : t.scanDialogDoneTitle}</div>
              <div className="scan-overlay-subtitle">
                {isScanning ? t.scanDialogScanningSubtitle : `${t.scanDialogFilesLabel}: ${scanFilesCount}`}
              </div>
            </div>

            <div className="scan-overlay-progress-block">
              <div className="scan-overlay-progress-label">{Math.round(scanProgress)}%</div>
              <div className="scan-overlay-progress-track">
                <div className="scan-overlay-progress-bar" style={{ width: `${scanProgress}%` }} />
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
                <button type="button" className="scan-overlay-close-btn" onClick={handleCloseScanPanel}>
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
