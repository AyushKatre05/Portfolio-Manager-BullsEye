'use client';

import { memo, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PortfolioPerformanceChartProps {
  dates: string[];
  portfolioValues: number[];
  className?: string;
}

/**
 * Portfolio Performance Chart Component
 * Shows portfolio value over time
 */
export const PortfolioPerformanceChart = memo(function PortfolioPerformanceChart({
  dates,
  portfolioValues,
  className = '',
}: PortfolioPerformanceChartProps) {
  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioValues,
        borderColor: '#58a6ff',
        backgroundColor: 'rgba(88, 166, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#161b22',
        borderColor: '#30363d',
        borderWidth: 1,
        padding: 12,
        titleColor: '#c9d1d9',
        bodyColor: '#c9d1d9',
        callbacks: {
          label: function (context) {
            const y = context.parsed && typeof (context.parsed as any).y === 'number' ? (context.parsed as any).y : null;
            return y !== null ? `$${y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: '#21262d',
        },
        ticks: {
          color: '#8b949e',
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        grid: {
          color: '#21262d',
        },
        ticks: {
          color: '#8b949e',
          callback: function (value) {
            return '$' + (value as number).toLocaleString('en-US', { maximumFractionDigits: 0 });
          },
        },
      },
    },
  };

  return (
    <div className={`w-full bg-[#161b22] border border-[#30363d] rounded-lg p-4 ${className || 'h-80'}`}>
      <Line data={data} options={options} />
    </div>
  );
});
