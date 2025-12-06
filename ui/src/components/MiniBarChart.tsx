import React from "react";

export interface MiniBarDatum {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: MiniBarDatum[];
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="mini-chart">
      {data.map((d) => (
        <div key={d.label} className="mini-chart-row">
          <span className="mini-chart-label">{d.label}</span>
          <div className="mini-chart-bar-wrapper">
            <div
              className="mini-chart-bar"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="mini-chart-value">{d.value}</span>
        </div>
      ))}
    </div>
  );
};