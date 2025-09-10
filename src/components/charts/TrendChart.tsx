import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendChartProps {
  data: Array<{
    date: string;
    rating: number;
    price: number;
    volume: number;
  }>;
  selectedMetric: string;
  title?: string;
}

export function TrendChart({ data, selectedMetric, title = "Performance Trends" }: TrendChartProps) {
  const getMetricColor = (metric: string) => {
    const colors = {
      rating: '#3B82F6',
      price: '#EF4444', 
      volume: '#10B981'
    };
    return colors[metric as keyof typeof colors] || '#6B7280';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Historical trends for {selectedMetric}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedMetric} 
              stroke={getMetricColor(selectedMetric)}
              strokeWidth={2}
              dot={{ fill: getMetricColor(selectedMetric), strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}