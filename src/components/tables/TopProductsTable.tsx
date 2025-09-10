import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp } from 'lucide-react';

interface TopProductsTableProps {
  products: Array<{
    name: string;
    category: string;
    rating: number;
    price: number;
    ratingCount?: number;
  }>;
  title?: string;
  limit?: number;
}

export function TopProductsTable({ products, title = "Top Products", limit = 10 }: TopProductsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription>Highest rated products in your catalog</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.slice(0, limit).map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-center mb-1">
                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-600">₹{product.price.toLocaleString()}</p>
                {product.ratingCount && (
                  <p className="text-xs text-gray-400">{product.ratingCount} reviews</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}