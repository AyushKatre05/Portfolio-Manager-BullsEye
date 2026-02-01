"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

interface VolumeChartProps {
  labels: string[];
  volumes: number[];
}

export default function VolumeChart({ labels, volumes }: VolumeChartProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Trading Volume</h2>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Volume",
              data: volumes
            }
          ]
        }}
      />
    </div>
  );
}
