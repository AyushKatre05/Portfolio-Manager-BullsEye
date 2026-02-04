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

interface DrawdownChartProps {
  dates: string[];
  portfolioValues: number[];
  className?: string;
}

/**
 * Drawdown Chart - % decline from running peak (portfolio manager staple)
 */
export const DrawdownChart = memo(function DrawdownChart({
  dates,
  portfolioValues,
  className = '',
}: DrawdownChartProps) {
  const { drawdowns, maxDrawdown } = useMemo(() => {
    if (dates.length === 0 || portfolioValues.length === 0) {
      return { drawdowns: [] as number[], maxDrawdown: 0 };
    }
    let peak = portfolioValues[0];
    const drawdowns: number[] = [];
    let maxDd = 0;

    portfolioValues.forEach((val) => {
      if (val > peak) peak = val;
      const dd = peak > 0 ? ((peak - val) / peak) * 100 : 0;
      drawdowns.push(-dd); // show as negative for "underwater"
      if (dd > maxDd) maxDd = dd;
    });

    return { drawdowns, maxDrawdown: maxDd };
  }, [dates, portfolioValues]);

  const data = useMemo(
    () => ({
      labels: dates,
      datasets: [
        {
          label: 'Drawdown %',
          data: drawdowns,
          borderColor: '#f85149',
          backgroundColor: 'rgba(248, 81, 73, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          fill: true,
        },
      ],
    }),
    [dates, drawdowns]
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
          label: (ctx) => `Drawdown: ${(ctx.parsed.y as number).toFixed(2)}%`,
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
          callback: (v) => (v as number) + '%',
        },
      },
    },
  };

  if (drawdowns.length === 0) return null;

  return (
    <div className={`w-full ${className || 'h-64'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white">Drawdown</span>
        <span className="text-xs text-gray-500 font-mono">
          Max: {maxDrawdown.toFixed(2)}%
        </span>
      </div>
      <div className="h-[calc(100%-2rem)] min-h-[200px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
});
