'use client';

import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip
);

interface HoldingPnL {
  symbol: string;
  unrealizedPnL: number;
  realizedPnL?: number;
}

interface PnLContributionChartProps {
  holdings: HoldingPnL[];
  className?: string;
}

/**
 * P&L contribution by holding - bar chart (portfolio manager view)
 */
export const PnLContributionChart = memo(function PnLContributionChart({
  holdings,
  className = '',
}: PnLContributionChartProps) {
  const data = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => {
      const aTotal = a.unrealizedPnL + (a.realizedPnL ?? 0);
      const bTotal = b.unrealizedPnL + (b.realizedPnL ?? 0);
      return bTotal - aTotal;
    });
    return {
      labels: sorted.map((h) => h.symbol),
      datasets: [
        {
          label: 'Unrealized P&L',
          data: sorted.map((h) => h.unrealizedPnL),
          backgroundColor: sorted.map((h) =>
            h.unrealizedPnL >= 0 ? 'rgba(35, 134, 54, 0.7)' : 'rgba(248, 81, 73, 0.7)'
          ),
          borderColor: sorted.map((h) =>
            h.unrealizedPnL >= 0 ? '#238636' : '#f85149'
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [holdings]);

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161b22',
        borderColor: '#30363d',
        callbacks: {
          label: (ctx) =>
            `P&L: $${(ctx.parsed.x as number).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#21262d' },
        ticks: {
          color: '#8b949e',
          callback: (v) => '$' + (v as number).toLocaleString('en-US', { maximumFractionDigits: 0 }),
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#8b949e', font: { family: 'monospace' } },
      },
    },
  };

  if (holdings.length === 0) return null;

  return (
    <div className={`w-full ${className || 'h-64'}`} style={{ minHeight: '260px' }}>
      <div className="h-full min-h-[240px] w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
});
