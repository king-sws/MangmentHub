/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Kanban, TrendingUp } from "lucide-react";

type BoardCompletionChartData = {
  boardTitle: string;
  completionRate: number;
};

interface BoardCompletionChartProps {
  data: BoardCompletionChartData[];
}

export const BoardCompletionChart = ({ data }: BoardCompletionChartProps) => {
  // Sort data by completion rate (highest first)
  const sortedData = [...data]
    .sort((a, b) => b.completionRate - a.completionRate)
    .map(item => ({
      ...item,
      // Truncate long board titles for better display
      displayTitle: item.boardTitle.length > 20 
        ? `${item.boardTitle.substring(0, 17)}...` 
        : item.boardTitle,
      // Color coding based on completion rate
      fillColor: item.completionRate >= 80 ? '#10b981' : 
                 item.completionRate >= 60 ? '#f59e0b' : 
                 item.completionRate >= 40 ? '#3b82f6' : '#ef4444'
    }));

  const averageCompletion = data.length > 0 
    ? data.reduce((sum, item) => sum + item.completionRate, 0) / data.length 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const originalItem = sortedData.find(item => item.displayTitle === label);
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Kanban className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground text-sm">
              {originalItem?.boardTitle || label}
            </span>
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: data.payload.fillColor }}
              />
              <span className="text-foreground font-medium">
                {Number(data.value).toFixed(1)}% Complete
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, ...rest } = props;
    return <Bar {...rest} fill={props.payload.fillColor} />;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Kanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No boards found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-[250px]">
      {/* Summary Header */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Average Completion</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {averageCompletion.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-muted-foreground/20"
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tickFormatter={(tick) => `${tick}%`}
              className="text-xs fill-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="displayTitle" 
              width={120}
              className="text-xs fill-muted-foreground"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="completionRate" 
              name="Completion Rate"
              radius={[0, 4, 4, 0]}
              shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">80%+ Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">60-79% Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">40-59% Fair</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">&lt;40% Needs Attention</span>
        </div>
      </div>
    </div>
  );
};