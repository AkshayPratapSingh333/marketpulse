import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const category = searchParams.get('category');
    const format = searchParams.get('format') || 'csv';

    let data;
    let csvContent = '';

    switch (type) {
      case 'summary':
        data = await getAnalyticsData(category);
        csvContent = generateSummaryCSV(data);
        break;
      case 'products':
        data = await getProductsData(category);
        csvContent = generateProductsCSV(data);
        break;
      case 'categories':
        data = await getCategoriesData(category);
        csvContent = generateCategoriesCSV(data);
        break;
      case 'sentiment':
        data = await getSentimentData(category);
        csvContent = generateSentimentCSV(data);
        break;
      default:
        data = await getAnalyticsData(category);
        csvContent = generateSummaryCSV(data);
    }

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics_${type}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

    return response;

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(category?: string | null) {
  const whereClause = category && category !== 'all' ? { category } : {};

  const products = await prisma.product.findMany({
    where: whereClause
  });

  const totalProducts = products.length;
  const totalCategories = new Set(products.map(p => p.category).filter(Boolean)).size;
  const validRatings = products.filter(p => p.rating != null);
  const validPrices = products.filter(p => (p.discountedPrice || p.actualPrice) != null);
  
  const averageRating = validRatings.length > 0 
    ? validRatings.reduce((acc, p) => acc + (p.rating || 0), 0) / validRatings.length 
    : 0;
  const averagePrice = validPrices.length > 0
    ? validPrices.reduce((acc, p) => acc + (p.discountedPrice || p.actualPrice || 0), 0) / validPrices.length
    : 0;

  return {
    summary: {
      totalProducts,
      totalCategories,
      averageRating,
      averagePrice
    },
    products
  };
}

async function getProductsData(category?: string | null) {
  const whereClause = category && category !== 'all' ? { category } : {};

  return await prisma.product.findMany({
    where: whereClause,
    orderBy: [
      { rating: 'desc' },
      { ratingCount: 'desc' }
    ],
    take: 1000 // Limit to prevent huge exports
  });
}

async function getCategoriesData(category?: string | null) {
  const whereClause = category && category !== 'all' ? { category } : {};

  const products = await prisma.product.findMany({
    where: whereClause
  });

  const categoryStats = products.reduce((acc, product) => {
    const cat = product.category || 'Unknown';
    if (!acc[cat]) {
      acc[cat] = {
        category: cat,
        productCount: 0,
        totalRating: 0,
        totalPrice: 0,
        ratings: [],
        validRatings: 0,
        validPrices: 0
      };
    }
    acc[cat].productCount++;
    
    if (product.rating != null) {
      acc[cat].totalRating += product.rating;
      acc[cat].ratings.push(product.rating);
      acc[cat].validRatings++;
    }
    
    const price = product.discountedPrice || product.actualPrice;
    if (price != null) {
      acc[cat].totalPrice += price;
      acc[cat].validPrices++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(categoryStats).map((cat: any) => ({
    category: cat.category,
    productCount: cat.productCount,
    averageRating: cat.validRatings > 0 ? cat.totalRating / cat.validRatings : 0,
    averagePrice: cat.validPrices > 0 ? cat.totalPrice / cat.validPrices : 0
  }));
}

async function getSentimentData(category?: string | null) {
  const whereClause = category && category !== 'all' ? { category } : {};

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      sentimentLabel: true
    }
  });

  const sentimentCounts = products.reduce((acc: Record<string, number>, product) => {
    const sentiment = product.sentimentLabel || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});

  const totalProducts = products.length;

  return Object.entries(sentimentCounts).map(([sentiment, count]) => ({
    sentiment,
    count,
    percentage: totalProducts > 0 ? (count / totalProducts) * 100 : 0
  }));
}

function generateSummaryCSV(data: any): string {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Products', data.summary.totalProducts],
    ['Total Categories', data.summary.totalCategories],
    ['Average Rating', data.summary.averageRating.toFixed(2)],
    ['Average Price (₹)', data.summary.averagePrice.toFixed(2)]
  ];

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function generateProductsCSV(products: any[]): string {
  const headers = [
    'Name',
    'Category', 
    'Price (₹)',
    'Rating',
    'Rating Count',
    'Discount (%)',
    'Actual Price (₹)',
    'URL'
  ];

  const rows = products.map(product => [
    `"${(product.name || '').replace(/"/g, '""')}"`,
    `"${(product.category || '').replace(/"/g, '""')}"`,
    product.price || 0,
    product.rating || 0,
    product.ratingCount || 0,
    product.discountPercentage || 0,
    product.actualPrice || 0,
    `"${(product.url || '').replace(/"/g, '""')}"`
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function generateCategoriesCSV(categories: any[]): string {
  const headers = [
    'Category',
    'Product Count',
    'Average Rating',
    'Average Price (₹)'
  ];

  const rows = categories.map(cat => [
    `"${cat.category.replace(/"/g, '""')}"`,
    cat.productCount,
    cat.averageRating.toFixed(2),
    cat.averagePrice.toFixed(2)
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function generateSentimentCSV(sentiments: any[]): string {
  const headers = [
    'Sentiment',
    'Count',
    'Percentage'
  ];

  const rows = sentiments.map(sentiment => [
    sentiment.sentiment,
    sentiment.count,
    sentiment.percentage.toFixed(2)
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}
