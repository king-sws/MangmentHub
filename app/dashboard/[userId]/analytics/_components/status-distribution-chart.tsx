/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { 
  Archive, 
  Circle, 
  Clock, 
  Eye, 
  CheckCircle2 
} from "lucide-react";

const STATUS_COLORS = {
  BACKLOG: "#64748b",
  TODO: "#3b82f6", 
  IN_PROGRESS: "#8b5cf6",
  IN_REVIEW: "#f59e0b",
  DONE: "#10b981"
};

const STATUS_COLORS_DARK = {
  BACKLOG: "#94a3b8",
  TODO: "#60a5fa",
  IN_PROGRESS: "#a78bfa", 
  IN_REVIEW: "#fbbf24",
  DONE: "#34d399"
};

const STATUS_LABELS = {
  BACKLOG: "Backlog",
  TODO: "To Do", 
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done"
};

const STATUS_ICONS = {
  BACKLOG: Archive,
  TODO: Circle,
  IN_PROGRESS: Clock,
  IN_REVIEW: Eye,
  DONE: CheckCircle2
};

type Status = keyof typeof STATUS_LABELS;

type StatusDistributionChartProps = {
  data: Record<Status, number>;
};

export const StatusDistributionChart = ({ data }: StatusDistributionChartProps) => {
  const chartData = Object.keys(data)
    .map(statusKey => {
      const status = statusKey as Status;
      return {
        name: STATUS_LABELS[status] || status,
        value: data[status],
        status,
        color: STATUS_COLORS[status],
        darkColor: STATUS_COLORS_DARK[status]
      };
    })
    .filter(item => item.value > 0); // Only show statuses with tasks

  const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalTasks > 0 ? ((data.value / totalTasks) * 100).toFixed(1) : '0';
      const IconComponent = STATUS_ICONS[data.payload.status as Status];
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className="w-4 h-4" style={{ color: data.payload.color }} />
            <span className="font-medium text-foreground">{data.payload.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{data.value} tasks ({percentage}%)</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 px-2">
        {payload?.map((entry: any, index: number) => {
          const IconComponent = STATUS_ICONS[entry.payload.status as Status];
          const percentage = totalTasks > 0 ? ((entry.payload.value / totalTasks) * 100).toFixed(0) : '0';
          
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <IconComponent 
                className="w-3 h-3" 
                style={{ color: entry.color }}
              />
              <span className="font-medium text-foreground hidden sm:inline">
                {entry.value}
              </span>
              <span className="text-foreground sm:hidden">
                {entry.payload.name}
              </span>
              <span className="text-muted-foreground text-xs">
                ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-[250px]">
      {/* Summary Header */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total Tasks</span>
          <span className="text-lg font-bold text-foreground">{totalTasks.toLocaleString()}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="70%"
              paddingAngle={1}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity duration-200"
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};