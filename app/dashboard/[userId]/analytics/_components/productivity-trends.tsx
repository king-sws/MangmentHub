// components/analytics/productivity-trends.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface TrendData {
  date: string;
  created: number;
  completed: number;
}

interface TrendsResponse {
  trendData: TrendData[];
  aggregated: {
    totalCreated: number;
    totalCompleted: number;
  };
}

interface ProductivityTrendsProps {
  startDate: Date;
  endDate: Date;
}

export function ProductivityTrends({ startDate, endDate }: ProductivityTrendsProps) {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        const response = await fetch(`/api/analytics/trends?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trends: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching trends:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trends');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Error loading trends</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data || !data.trendData || data.trendData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No trend data available for the selected period</p>
      </div>
    );
  }

  // Calculate weekly averages
  const weeklyData: Record<string, { created: number; completed: number; count: number }> = {};
  
  data.trendData.forEach(item => {
    const date = new Date(item.date);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { created: 0, completed: 0, count: 0 };
    }
    
    weeklyData[weekKey].created += item.created;
    weeklyData[weekKey].completed += item.completed;
    weeklyData[weekKey].count += 1;
  });

  const weeklyTrends = Object.entries(weeklyData).map(([week, data]) => ({
    week,
    avgCreated: Math.round(data.created / 7),
    avgCompleted: Math.round(data.completed / 7),
    totalCreated: data.created,
    totalCompleted: data.completed
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const completionRate = data.aggregated.totalCreated > 0 
    ? (data.aggregated.totalCompleted / data.aggregated.totalCreated) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.aggregated.totalCreated}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(data.aggregated.totalCreated / data.trendData.length)} per day average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.aggregated.totalCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(data.aggregated.totalCompleted / data.trendData.length)} per day average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value, name) => [value, name === 'created' ? 'Created' : 'Completed']}
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {weeklyTrends.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Week of ${formatDate(value as string)}`}
                  formatter={(value, name) => {
                    const label = name === 'totalCreated' ? 'Created' : 'Completed';
                    return [value, label];
                  }}
                />
                <Bar dataKey="totalCreated" fill="#8884d8" />
                <Bar dataKey="totalCompleted" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}