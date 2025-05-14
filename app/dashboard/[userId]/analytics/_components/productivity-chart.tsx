
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type ProductivityChartData = {
  date: string;
  created: number;
  completed: number;
};

interface ProductivityChartProps {
  data: ProductivityChartData[];
}

export const ProductivityChart = ({ data }: ProductivityChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="created" name="Tasks Created" fill="#38bdf8" />
        <Bar dataKey="completed" name="Tasks Completed" fill="#4ade80" />
      </BarChart>
    </ResponsiveContainer>
  );
};