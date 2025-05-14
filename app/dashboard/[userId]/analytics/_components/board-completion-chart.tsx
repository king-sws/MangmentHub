"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type BoardCompletionChartData = {
  boardTitle: string;
  completionRate: number;
};

interface BoardCompletionChartProps {
  data: BoardCompletionChartData[];
}

export const BoardCompletionChart = ({ data }: BoardCompletionChartProps) => {
  // Sort data by completion rate
  const sortedData = [...data].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{
          top: 5,
          right: 30,
          left: 50,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
        <YAxis type="category" dataKey="boardTitle" width={150} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
        <Bar dataKey="completionRate" name="Completion Rate" fill="#4ade80" />
      </BarChart>
    </ResponsiveContainer>
  );
};