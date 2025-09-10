import { NextRequest, NextResponse } from 'next/server';
import { DatabaseQueries } from '@/lib/db/queries';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const timeRange = searchParams.get('timeRange') || '30d';

    console.log(`📊 Fetching dashboard data: category=${category}, timeRange=${timeRange}`);

    // Fetch all required data in parallel for better performance
    const [
      summaryData,
      topProducts,
      categoryInsights,
      priceDistribution,
      sentimentData,
      correlationData,
      trendData,
      recommendations,
      descriptiveStats
    ] = await Promise.all([
      getSummaryData(category ?? undefined),
      getTopProducts(category ?? undefined),
      getCategoryInsights(),
      getPriceDistribution(category ?? undefined),
      getSentimentData(category ?? undefined),
      DatabaseQueries.getCorrelationData(),
      getTrendData(timeRange, category ?? undefined),
      getRecommendations(category ?? undefined),
      DatabaseQueries.getDescriptiveStatistics()
    ]);

    const dashboardData = {
      summary: summaryData,
      topProducts: topProducts,
      categoryInsights: categoryInsights,
      priceDistribution: priceDistribution,
      sentimentData: sentimentData,
      correlationData: correlationData,
      trendData: trendData,
      recommendations: recommendations,
      descriptiveStats: descriptiveStats
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper functions to fetch dashboard data
async function getSummaryData(category?: string) {
  try {
    const whereClause = category ? { category: { contains: category } } : {};
    
    const [
      totalProducts,
      totalCategories,
      avgRating,
      avgPrice,
      sentimentCounts
    ] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.aggregate({
        where: whereClause,
        _count: { category: true }
      }),
      prisma.product.aggregate({
        where: { ...whereClause, rating: { not: null } },
        _avg: { rating: true }
      }),
      prisma.product.aggregate({
        where: { ...whereClause, actualPrice: { not: null } },
        _avg: { actualPrice: true }
      }),
      prisma.product.groupBy({
        by: ['sentimentLabel'],
        where: { ...whereClause, sentimentLabel: { not: null } },
        _count: true
      })
    ]);

    const positiveReviews = sentimentCounts.find(s => s.sentimentLabel === 'positive')?._count || 0;
    const negativeReviews = sentimentCounts.find(s => s.sentimentLabel === 'negative')?._count || 0;

    return {
      totalProducts: totalProducts,
      totalCategories: totalCategories._count.category || 0,
      averageRating: Number(avgRating._avg.rating?.toFixed(2)) || 0,
      averagePrice: Number(avgPrice._avg.actualPrice?.toFixed(2)) || 0,
      positiveReviews: positiveReviews,
      negativeReviews: negativeReviews
    };
  } catch (error) {
    console.error('Error fetching summary data:', error);
    return {
      totalProducts: 0,
      totalCategories: 0,
      averageRating: 0,
      averagePrice: 0,
      positiveReviews: 0,
      negativeReviews: 0
    };
  }
}

async function getTopProducts(category?: string) {
  try {
    const whereClause = category ? { category: { contains: category } } : {};
    
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        rating: { not: null },
        ratingCount: { not: null },
        productName: { not: null }
      },
      select: {
        productName: true,
        rating: true,
        actualPrice: true,
        category: true,
        ratingCount: true
      },
      orderBy: [
        { rating: 'desc' },
        { ratingCount: 'desc' }
      ],
      take: 10
    });

    return products.map(product => ({
      name: product.productName || 'Unknown Product',
      rating: product.rating || 0,
      price: product.actualPrice || 0,
      category: product.category || 'Unknown',
      ratingCount: product.ratingCount || 0
    }));
  } catch (error) {
    console.error('Error fetching top products:', error);
    return [];
  }
}

async function getCategoryInsights() {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: true,
      _avg: {
        rating: true,
        actualPrice: true
      }
    });

    return categories.map(cat => ({
      category: cat.category || 'Unknown',
      productCount: cat._count,
      averageRating: Number(cat._avg.rating?.toFixed(2)) || 0,
      averagePrice: Number(cat._avg.actualPrice?.toFixed(2)) || 0
    })).slice(0, 20); // Limit to top 20 categories
  } catch (error) {
    console.error('Error fetching category insights:', error);
    return [];
  }
}

async function getPriceDistribution(category?: string) {
  try {
    const whereClause = category ? { category: { contains: category } } : {};
    
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        actualPrice: { not: null }
      },
      select: { actualPrice: true }
    });

    const priceRanges = [
      { range: '0-50', min: 0, max: 50, count: 0 },
      { range: '51-100', min: 51, max: 100, count: 0 },
      { range: '101-250', min: 101, max: 250, count: 0 },
      { range: '251-500', min: 251, max: 500, count: 0 },
      { range: '501-1000', min: 501, max: 1000, count: 0 },
      { range: '1000+', min: 1001, max: Infinity, count: 0 }
    ];

    products.forEach(product => {
      const price = product.actualPrice || 0;
      const range = priceRanges.find(r => price >= r.min && price <= r.max);
      if (range) range.count++;
    });

    const total = products.length;
    return priceRanges.map(range => ({
      range: range.range,
      count: range.count,
      percentage: total > 0 ? Number(((range.count / total) * 100).toFixed(1)) : 0
    }));
  } catch (error) {
    console.error('Error fetching price distribution:', error);
    return [];
  }
}

async function getSentimentData(category?: string) {
  try {
    const whereClause = category ? { category: { contains: category } } : {};
    
    const sentiments = await prisma.product.groupBy({
      by: ['sentimentLabel'],
      where: {
        ...whereClause,
        sentimentLabel: { not: null }
      },
      _count: true
    });

    const total = sentiments.reduce((sum, s) => sum + s._count, 0);
    
    return sentiments.map(sentiment => ({
      sentiment: sentiment.sentimentLabel || 'unknown',
      count: sentiment._count,
      percentage: total > 0 ? Number(((sentiment._count / total) * 100).toFixed(1)) : 0
    }));
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    return [];
  }
}

async function getTrendData(timeRange: string, category?: string) {
  try {
    // For now, return mock trend data since we don't have time-based data
    // In a real application, you would query based on createdAt dates
    const mockTrendData = [
      { date: '2024-01', rating: 4.2, price: 150, volume: 120 },
      { date: '2024-02', rating: 4.3, price: 155, volume: 135 },
      { date: '2024-03', rating: 4.1, price: 148, volume: 110 },
      { date: '2024-04', rating: 4.4, price: 160, volume: 145 },
      { date: '2024-05', rating: 4.2, price: 152, volume: 125 },
      { date: '2024-06', rating: 4.5, price: 165, volume: 155 }
    ];
    
    return mockTrendData;
  } catch (error) {
    console.error('Error fetching trend data:', error);
    return [];
  }
}

async function getRecommendations(category?: string) {
  try {
    const whereClause = category ? { category: { contains: category } } : {};
    
    const topRatedProducts = await prisma.product.findMany({
      where: {
        ...whereClause,
        rating: { gte: 4.0 },
        productName: { not: null }
      },
      select: {
        productName: true,
        rating: true,
        ratingCount: true
      },
      orderBy: [
        { rating: 'desc' },
        { ratingCount: 'desc' }
      ],
      take: 5
    });

    return topRatedProducts.map(product => ({
      productName: product.productName || 'Unknown Product',
      reason: `High rating (${product.rating}/5) with ${product.ratingCount} reviews`,
      similarity: Number((product.rating! / 5 * 100).toFixed(1))
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}
