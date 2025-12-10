import React from "react";
import { WeeklyCleanlinessChart, type WeeklyPoint } from "../components/WeeklyCleanlinessChart";

interface StatsPageProps {
  t: any;
  weeklyStats: WeeklyPoint[];
  totalDeletedFiles: number;
  totalFreedBytes: number;
  onClose: () => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({
  t,
  weeklyStats,
  totalDeletedFiles,
  totalFreedBytes,
  onClose,
}) => {
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

  const weekdayLabels: string[] = t.statsWeekDaysShort ?? [];

  const bestDayLabel =
    bestDayPoint != null
      ? weekdayLabels[bestDayPoint.dayIndex] ?? "—"
      : "—";

  const worstDayLabel =
    worstDayPoint != null
      ? weekdayLabels[worstDayPoint.dayIndex] ?? "—"
      : "—";

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-header-row">
          <button
            type="button"
            className="settings-back-btn"
            onClick={onClose}
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
                  {t.formatSize
                    ? t.formatSize(totalFreedBytes)
                    : `${(totalFreedBytes / 1024 / 1024).toFixed(1)} MB`}
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
  );
};
