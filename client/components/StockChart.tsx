'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockChartProps {
  dates: string[];
  actualPrices: number[];
  predictedPrices: number[];
  futureDates?: string[];
  futurePredictions?: number[];
  symbol: string;
  className?: string;
}

const StockChart: React.FC<StockChartProps> = ({
  dates,
  actualPrices,
  predictedPrices,
  futureDates = [],
  futurePredictions = [],
  symbol,
  className = ''
}) => {
  const allDates = [...dates, ...futureDates];
  const data = {
    labels: allDates,
    datasets: [
      {
        label: 'Actual Price',
        data: [...actualPrices, ...Array(futureDates.length).fill(null)],
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        spanGaps: false
      },
      {
        label: 'Model Prediction (Historical)',
        data: [...predictedPrices, ...Array(futureDates.length).fill(null)],
        borderColor: 'rgb(34, 197, 94)', // Green
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        tension: 0.1,
        borderDash: [5, 5],
        spanGaps: false
      },
      {
        label: 'Future Prediction',
        data: [...Array(dates.length).fill(null), ...futurePredictions],
        borderColor: 'rgb(239, 68, 68)', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        borderDash: [10, 5],
        spanGaps: false
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: `${symbol} Stock Price Prediction`,
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const raw = context.parsed && typeof (context.parsed as any).y === 'number' ? (context.parsed as any).y : null;
            return `${label}: ₹${raw !== null ? raw.toFixed(2) : 'N/A'}`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          maxTicksLimit: 10,
          callback: function(value, index) {
            const date = allDates[index];
            if (date) {
              return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            }
            return '';
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price (₹)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return '₹' + (value as number).toFixed(2);
          }
        }
      }
    },
    elements: {
      point: {
        hitRadius: 10,
        hoverRadius: 8
      }
    }
  };

  return (
    <div className={`w-full bg-white rounded-lg shadow-lg p-4 ${className || 'h-96'}`}>
      <Line data={data} options={options} />
    </div>
  );
};

export default StockChart;