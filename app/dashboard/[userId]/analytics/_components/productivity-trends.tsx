"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { Loader2 } from "lucide-react";

interface ProductivityTrendsProps {
  startDate: Date;
  endDate: Date;
}

interface DailyProductivity {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
}

export const ProductivityTrends = ({ startDate, endDate }: ProductivityTrendsProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyProductivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductivityData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate.toISOString());
        if (endDate) params.append('endDate', endDate.toISOString());
        
        const url = `/api/analytics/productivity?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch productivity data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.dailyProductivity && Array.isArray(result.dailyProductivity)) {
          // Sort data by date
          const sortedData = [...result.dailyProductivity].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setData(sortedData);
        } else {
          // If the API doesn't yet return real data, create sample data
          // You can remove this once your API is implemented
          const sampleData = generateSampleData(startDate, endDate);
          setData(sampleData);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to fetch productivity data");
        console.error("Failed to fetch productivity data:", error);
        
        // Generate sample data on error for development
        const sampleData = generateSampleData(startDate, endDate);
        setData(sampleData);
      } finally {
        setLoading(false);
      }
    };

    fetchProductivityData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 animate-spin" />
        <span>Loading productivity trends...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
        <p className="text-sm mt-2 text-muted-foreground">Please try again later or contact support</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="tasksCompleted"
                name="Tasks Completed"
                stroke="#4ade80"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="tasksCreated"
                name="Tasks Created"
                stroke="#38bdf8"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Productivity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold text-green-500">
                {data.reduce((sum, day) => sum + day.tasksCompleted, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Tasks Completed
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold text-blue-500">
                {data.reduce((sum, day) => sum + day.tasksCreated, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Tasks Created
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold text-purple-500">
                {Math.round(
                  data.reduce((sum, day) => sum + day.tasksCompleted, 0) / 
                  Math.max(1, data.length)
                * 10) / 10}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Average Tasks Completed Per Day
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Function to generate sample data for development/demo purposes
function generateSampleData(startDate: Date, endDate: Date): DailyProductivity[] {
  const data: DailyProductivity[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate random but realistic data
    const tasksCreated = Math.floor(Math.random() * 10) + 1;
    const tasksCompleted = Math.floor(Math.random() * tasksCreated) + 1;
    
    data.push({
      date: new Date(currentDate).toISOString().split('T')[0],
      tasksCreated,
      tasksCompleted,
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}