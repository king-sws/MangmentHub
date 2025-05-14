"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const STATUS_COLORS = {
  BACKLOG: "#94a3b8",
  TODO: "#38bdf8",
  IN_PROGRESS: "#a78bfa", 
  IN_REVIEW: "#fbbf24",
  DONE: "#4ade80"
};

const STATUS_LABELS = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done"
};

type Status = keyof typeof STATUS_LABELS;
type StatusDistributionChartProps = {
  data: Record<Status, number>;
};

export const StatusDistributionChart = ({ data }: StatusDistributionChartProps) => {
  const chartData = Object.keys(data).map(statusKey => {
    const status = statusKey as Status;
    return {
      name: STATUS_LABELS[status] || status,
      value: data[status],
      status
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => 
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={STATUS_COLORS[entry.status] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
            />
          ))}
        </Pie>
        <Legend />
        <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
      </PieChart>
    </ResponsiveContainer>
  );
};