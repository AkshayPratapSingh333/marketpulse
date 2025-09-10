import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryChartProps {
  data: Array<{
    category: string;
    productCount: number;
    averageRating: number;
    averagePrice: number;
  }>;
  metric: 'productCount' | 'averageRating' | 'averagePrice';
  title?: string;
}

export function CategoryChart({ data, metric, title = "Category Analysis" }: CategoryChartProps) {
  const getBarColor = () => {
    const colors = {
      productCount: '#10B981',
      averageRating: '#F59E0B',
      averagePrice: '#8B5CF6'
    };
    return colors[metric];
  };

  const formatValue = (value: number) => {
    if (metric === 'averagePrice') return `₹${value.toLocaleString()}`;
    if (metric === 'averageRating') return value.toFixed(2);
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {metric === 'productCount' && 'Number of products per category'}
          {metric === 'averageRating' && 'Average ratings by category'}  
          {metric === 'averagePrice' && 'Average pricing by category'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [formatValue(value), metric]}
            />
            <Bar dataKey={metric} fill={getBarColor()} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}