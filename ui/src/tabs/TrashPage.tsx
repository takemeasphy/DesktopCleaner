import React, { useMemo, useState } from "react";
import type { DesktopFile } from "../types";
import type { AppTexts } from "../i18n";
import { MiniBarChart, type MiniBarDatum } from "../components/MiniBarChart";
import "./css-styles/TrashPage.css";

export type TrashItem = {
  id: string;
  file: DesktopFile;
  addedAt: string;
};

type TrashPageProps = {
  t: AppTexts;
  items: TrashItem[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onClearAll: () => void;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export const TrashPage: React.FC<TrashPageProps> = ({
  t,
  items,
  onClose,
  onRestore,
  onPermanentDelete,
  onClearAll,
}) => {
  const hasItems = items.length > 0;

  const totalSize = useMemo(
    () => items.reduce((sum, entry) => sum + entry.file.size_bytes, 0),
    [items]
  );

  const chartData: MiniBarDatum[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of items) {
      const ext = (entry.file.ext || "").toLowerCase() || "—";
      map.set(ext, (map.get(ext) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items]);

  const [sortKey, setSortKey] = useState<"name" | "size" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      if (sortKey === "name") {
        return a.file.name.localeCompare(b.file.name);
      }
      if (sortKey === "size") {
        return a.file.size_bytes - b.file.size_bytes;
      }
      const da = new Date(a.addedAt).getTime();
      const db = new Date(b.addedAt).getTime();
      return da - db;
    });
    if (sortDir === "desc") arr.reverse();
    return arr;
  }, [items, sortKey, sortDir]);

  const handleSortClick = (key: "name" | "size" | "date") => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir("asc");
      return key;
    });
  };

  const sortArrow = (key: "name" | "size" | "date") =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="trash-header">
          <button
            type="button"
            className="trash-back-btn"
            onClick={onClose}
            aria-label={t.backButtonLabel}
          >
            ←
          </button>
          <div className="trash-header-text">
            <h2>{t.trashTitle}</h2>
            <p className="settings-subtitle">{t.trashSubtitle}</p>
          </div>
        </div>

        {!hasItems ? (
          <div className="settings-empty-state">
            {t.trashEmptyMessage}
          </div>
        ) : (
          <>
            <div className="trash-summary-row">
              <div className="trash-metrics">
                <div className="trash-metric">
                  <div className="trash-metric-label">
                    {t.filesOnDesktop}
                  </div>
                  <div className="trash-metric-value">{items.length}</div>
                </div>
                <div className="trash-metric">
                  <div className="trash-metric-label">{t.totalSize}</div>
                  <div className="trash-metric-value">
                    {formatSize(totalSize)}
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="trash-chart-block">
                  <div className="trash-chart-title">{t.chartTitle}</div>
                  <MiniBarChart data={chartData} />
                </div>
              )}
            </div>

            <div className="trash-controls">
              <div className="trash-count">
                {items.length} {t.tableTitle.toLowerCase()}
              </div>
              <div className="trash-sort-group">
                <button
                  type="button"
                  className={
                    "trash-sort-btn" +
                    (sortKey === "name" ? " trash-sort-btn-active" : "")
                  }
                  onClick={() => handleSortClick("name")}
                >
                  {t.colName}
                  {sortArrow("name")}
                </button>
                <button
                  type="button"
                  className={
                    "trash-sort-btn" +
                    (sortKey === "size" ? " trash-sort-btn-active" : "")
                  }
                  onClick={() => handleSortClick("size")}
                >
                  {t.colSize}
                  {sortArrow("size")}
                </button>
                <button
                  type="button"
                  className={
                    "trash-sort-btn" +
                    (sortKey === "date" ? " trash-sort-btn-active" : "")
                  }
                  onClick={() => handleSortClick("date")}
                >
                  {t.colModified}
                  {sortArrow("date")}
                </button>
              </div>
            </div>

            <div className="trash-table-wrapper">
              <table className="trash-table">
                <thead>
                  <tr>
                    <th>{t.colName}</th>
                    <th>{t.colExt}</th>
                    <th>{t.colSize}</th>
                    <th>{t.trashAddedAt}</th>
                    <th>{t.trashActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((entry) => (
                    <tr key={entry.id}>
                      <td title={entry.file.path}>{entry.file.name}</td>
                      <td>{entry.file.ext}</td>
                      <td>{formatSize(entry.file.size_bytes)}</td>
                      <td>{new Date(entry.addedAt).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="trash-btn restore"
                          onClick={() => onRestore(entry.id)}
                        >
                          {t.trashRestore}
                        </button>
                        <button
                          type="button"
                          className="trash-btn delete"
                          onClick={() => onPermanentDelete(entry.id)}
                        >
                          {t.trashDelete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="settings-footer">
              <button
                type="button"
                className="settings-secondary-btn"
                onClick={onClearAll}
              >
                {t.trashClearAll}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
