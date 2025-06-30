/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface CompletionRateChartProps {
  completed: number;
  total: number;
}

export const CompletionRateChart = ({ completed, total }: CompletionRateChartProps) => {
  const incomplete = total - completed;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const data = [
    { 
      name: "Completed", 
      value: completed,
      color: "#10b981",
      gradient: "url(#completedGradient)"
    },
    { 
      name: "In Progress", 
      value: incomplete,
      color: "#6366f1",
      gradient: "url(#incompleteGradient)"
    }
  ];

  const COLORS = {
    completed: "#10b981",
    incomplete: "#6366f1",
    completedLight: "#34d399",
    incompleteLight: "#818cf8"
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            {data.payload.name === "Completed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Clock className="w-4 h-4 text-indigo-500" />
            )}
            <span className="font-medium text-gray-900">{data.payload.name}</span>
          </div>
          <div className="text-sm text-gray-600">
            <div>{data.value} tasks ({percentage}%)</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-gray-700">{entry.value}</span>
            <span className="text-xs text-gray-500">
              ({entry.payload.name === "Completed" ? completed : incomplete})
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header Stats */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{completionPercentage}%</div>
              <div className="text-xs text-gray-500">{completed} of {total} completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 mt-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={COLORS.completedLight} />
                <stop offset="100%" stopColor={COLORS.completed} />
              </linearGradient>
              <linearGradient id="incompleteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={COLORS.incompleteLight} />
                <stop offset="100%" stopColor={COLORS.incomplete} />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.gradient}
                  className="drop-shadow-sm hover:drop-shadow-md transition-all duration-200"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {completionPercentage}%
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Complete
          </div>
        </div>
      </div>
    </div>
  );
};