'use client';

import { memo, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

interface CumulativeReturnChartProps {
  dates: string[];
  portfolioValues: number[];
  className?: string;
}

/**
 * Cumulative return chart - normalized to 100 at start (growth index)
 */
export const CumulativeReturnChart = memo(function CumulativeReturnChart({
  dates,
  portfolioValues,
  className = '',
}: CumulativeReturnChartProps) {
  const { indexValues, periodReturn } = useMemo(() => {
    if (dates.length === 0 || portfolioValues.length === 0) {
      return { indexValues: [] as number[], periodReturn: 0 };
    }
    const start = portfolioValues[0];
    if (start <= 0) return { indexValues: [], periodReturn: 0 };
    const indexValues = portfolioValues.map((v) => (v / start) * 100);
    const end = portfolioValues[portfolioValues.length - 1];
    const periodReturn = ((end - start) / start) * 100;
    return { indexValues, periodReturn };
  }, [dates, portfolioValues]);

  const data = useMemo(
    () => ({
      labels: dates,
      datasets: [
        {
          label: 'Growth (Base 100)',
          data: indexValues,
          borderColor: '#238636',
          backgroundColor: 'rgba(35, 134, 54, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          fill: true,
        },
      ],
    }),
    [dates, indexValues]
  );

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#161b22',
        borderColor: '#30363d',
        callbacks: {
          label: (ctx) =>
            `Index: ${(ctx.parsed.y as number).toFixed(1)} (${((ctx.parsed.y as number) - 100).toFixed(1)}% from start)`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#21262d' },
        ticks: { color: '#8b949e', maxTicksLimit: 8 },
      },
      y: {
        grid: { color: '#21262d' },
        ticks: {
          color: '#8b949e',
          callback: (v) => (v as number) + '',
        },
      },
    },
  };

  if (indexValues.length === 0) return null;

  return (
    <div className={`w-full ${className || 'h-64'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white">Cumulative Return (Base 100)</span>
        <span
          className={`text-xs font-mono font-semibold ${
            periodReturn >= 0 ? 'text-[#238636]' : 'text-[#f85149]'
          }`}
        >
          Period: {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}%
        </span>
      </div>
      <div className="h-[calc(100%-2rem)] min-h-[200px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
});
