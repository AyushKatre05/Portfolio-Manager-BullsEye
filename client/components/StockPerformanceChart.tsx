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

interface StockPerformanceChartProps {
  symbol: string;
  dates: string[];
  prices: number[];
  purchasePrice: number;
  purchaseDate: string;
  className?: string;
}

/**
 * Stock Performance Chart Component
 * Shows stock price from purchase date to now
 */
export const StockPerformanceChart = memo(function StockPerformanceChart({
  symbol,
  dates,
  prices,
  purchasePrice,
  purchaseDate,
  className = '',
}: StockPerformanceChartProps) {
  const data = useMemo(() => {
    const purchaseIndex = dates.findIndex((d) => d >= purchaseDate);
    const purchaseLineData = dates.map((_, idx) => 
      idx >= purchaseIndex ? purchasePrice : null
    );

    return {
      labels: dates,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          fill: true,
        },
        {
          label: 'Purchase Price',
          data: purchaseLineData,
          borderColor: '#8b949e',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
        },
      ],
    };
  }, [dates, prices, purchasePrice, purchaseDate]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#c9d1d9',
          usePointStyle: true,
          padding: 12,
          font: {
            size: 11,
          },
        },
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
            if (context.datasetIndex === 0) {
              return `Price: $${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return `Purchase: $${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          maxTicksLimit: 6,
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
            return '$' + (value as number).toFixed(2);
          },
        },
      },
    },
  };

  return (
    <div className={`w-full bg-[#161b22] border border-[#30363d] rounded-lg p-4 ${className || 'h-64'}`}>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-white">{symbol}</h4>
        <p className="text-xs text-gray-500">Since purchase</p>
      </div>
      <Line data={data} options={options} />
    </div>
  );
});
