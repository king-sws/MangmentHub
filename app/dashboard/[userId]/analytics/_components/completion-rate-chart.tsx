"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CompletionRateChartProps {
  completed: number;
  total: number;
}

export const CompletionRateChart = ({ completed, total }: CompletionRateChartProps) => {
  const incomplete = total - completed;
  
  const data = [
    { name: "Completed", value: completed },
    { name: "Incomplete", value: incomplete }
  ];
  
  const COLORS = ["#4ade80", "#94a3b8"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => 
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
        <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
      </PieChart>
    </ResponsiveContainer>
  );
};