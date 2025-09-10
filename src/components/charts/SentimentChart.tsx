import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SentimentChartProps {
  data: Array<{
    sentiment: string;
    count: number;
    percentage: number;
  }>;
}

export function SentimentChart({ data }: SentimentChartProps) {
  const COLORS = {
    positive: '#10B981',
    negative: '#EF4444', 
    neutral: '#6B7280'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-medium capitalize">{data.sentiment}</p>
          <p className="text-sm">Count: {data.count.toLocaleString()}</p>
          <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
        <CardDescription>Customer review sentiment distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="count"
              label={({sentiment, percentage}) => `${sentiment}: ${percentage.toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.sentiment as keyof typeof COLORS]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Sentiment Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {data.map((item) => (
            <div key={item.sentiment} className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: COLORS[item.sentiment as keyof typeof COLORS] }}
              ></div>
              <p className="text-sm font-medium capitalize">{item.sentiment}</p>
              <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}