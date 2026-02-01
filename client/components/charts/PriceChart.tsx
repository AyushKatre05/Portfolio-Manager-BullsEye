"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface PriceChartProps {
  labels: string[];
  prices: number[];
  ticker: string;
}

export default function PriceChart({ labels, prices, ticker }: PriceChartProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        {ticker} Price History
      </h2>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Close Price",
              data: prices,
              borderWidth: 2,
              tension: 0.3
            }
          ]
        }}
      />
    </div>
  );
}
