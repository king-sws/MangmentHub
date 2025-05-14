"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type WorkspaceDistributionData = {
  name: string;
  completed: number;
  total: number;
};

interface WorkspaceDistributionChartProps {
  data: WorkspaceDistributionData[];
}

export const WorkspaceDistributionChart = ({ data }: WorkspaceDistributionChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="completed" name="Completed" fill="#4ade80" />
        <Bar dataKey="total" name="Total" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  );
};