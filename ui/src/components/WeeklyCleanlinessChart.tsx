import type { FC } from "react";

export interface WeeklyPoint {
  dayIndex: number; 
  value: number;    
}

interface WeeklyCleanlinessChartProps {
  data: WeeklyPoint[];
  dayLabels: string[]; 
  emptyText: string;   
}

export const WeeklyCleanlinessChart: FC<WeeklyCleanlinessChartProps> = ({
  data,
  dayLabels,
  emptyText,
}) => {
  if (!data.length) {
    return (
      <div className="weekly-chart weekly-chart-empty">
        <div className="weekly-chart-placeholder">
          <div className="weekly-chart-placeholder-text">{emptyText}</div>
        </div>
      </div>
    );
  }

  const maxValue = 100;

  return (
    <div className="weekly-chart">
      <div className="weekly-chart-y-axis">
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>
      <div className="weekly-chart-main">
        <div className="weekly-chart-bars">
          {data.map((point) => {
            const clamped = Math.max(0, Math.min(point.value, maxValue));
            const label = dayLabels[point.dayIndex] ?? "";
            return (
              <div key={point.dayIndex} className="weekly-chart-column">
                <div className="weekly-chart-bar-wrapper">
                  <div
                    className="weekly-chart-bar"
                    style={{ height: `${clamped}%` }}
                  />
                </div>
                <div className="weekly-chart-day">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
