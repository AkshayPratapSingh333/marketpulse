import { NextRequest, NextResponse } from 'next/server';
import { DatabaseQueries } from '@/lib/db/queries';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const category = searchParams.get('category');
    const timeRange = searchParams.get('timeRange') || '30d';

    console.log(`📊 Fetching analytics: type=${type}, category=${category}`);

    let data;

    switch (type) {
      case 'overview':
        data = await getOverviewAnalytics(category ?? undefined);
        break;
      case 'products':
        data = await getProductAnalytics(category ?? undefined);
        break;
      case 'categories':
        data = await getCategoryAnalytics();
        break;
      case 'pricing':
        data = await getPricingAnalytics(category ?? undefined);
        break;
      case 'ratings':
        data = await getRatingAnalytics(category ?? undefined);
        break;
      case 'trends':
        data = await getTrendAnalytics(timeRange, category ?? undefined);
        break;
      case 'correlations':
        data = await DatabaseQueries.getCorrelationData();
        break;
      case 'statistics':
        data = await DatabaseQueries.getDescriptiveStatistics();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      type,
      category,
      timeRange,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('📊 Analytics API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Analytics helper functions
async function getOverviewAnalytics(category?: string) {
  const [
    topProducts,
    categoryInsights,
    priceDistribution,
    sentimentData
  ] = await Promise.all([
    DatabaseQueries.getTopRatedProducts(10),
    DatabaseQueries.getCategoryInsights(),
    DatabaseQueries.getPriceRangeDistribution(),
    DatabaseQueries.getSentimentDistribution()
  ]);

  // Apply category filter if specified
  const filteredData = category && category !== 'all' 
    ? {
        topProducts: topProducts.filter(p => p.category.toLowerCase().includes(category.toLowerCase())),
        categoryInsights: categoryInsights.filter(c => c.category.toLowerCase().includes(category.toLowerCase()))
      }
    : { topProducts, categoryInsights };

  return {
    ...filteredData,
    priceDistribution,
    sentimentData,
    summary: {
      totalProducts: filteredData.topProducts.length,
      avgRating: filteredData.topProducts.reduce((sum, p) => sum + p.rating, 0) / filteredData.topProducts.length,
      categoriesCount: filteredData.categoryInsights.length
    }
  };
}

async function getProductAnalytics(category?: string) {
  const [
    topProducts,
    leastRated,
    topByCategory
  ] = await Promise.all([
    DatabaseQueries.getTopRatedProducts(50),
    DatabaseQueries.getLeastRatedProducts(20),
    category ? DatabaseQueries.getTopProductsByCategory(10) : Promise.resolve({})
  ]);

  return {
    topRated: topProducts,
    leastRated,
    byCategory: topByCategory,
    analytics: {
      ratingDistribution: calculateRatingDistribution(topProducts),
      priceRanges: calculatePriceRanges(topProducts)
    }
  };
}

async function getCategoryAnalytics() {
  const [
    categoryInsights,
    topCategories,
    ratingsByCategory
  ] = await Promise.all([
    DatabaseQueries.getCategoryInsights(),
    DatabaseQueries.getTopCategoriesByProductCount(15),
    DatabaseQueries.getAverageRatingsByCategory()
  ]);

  return {
    insights: categoryInsights,
    topByProductCount: topCategories,
    ratingAnalysis: ratingsByCategory,
    performance: {
      bestPerforming: categoryInsights.reduce((best, curr) => 
        curr.averageRating > best.averageRating ? curr : best
      ),
      mostProducts: topCategories[0],
      categories: categoryInsights.length
    }
  };
}

async function getPricingAnalytics(category?: string) {
  const [
    priceDistribution,
    priceVsRating,
    descriptiveStats
  ] = await Promise.all([
    DatabaseQueries.getPriceRangeDistribution(),
    DatabaseQueries.getAverageRatingByPriceRanges(),
    DatabaseQueries.getDescriptiveStatistics()
  ]);

  return {
    distribution: priceDistribution,
    priceVsRating,
    statistics: {
      actualPrice: descriptiveStats.actualPrice,
      discountedPrice: descriptiveStats.discountedPrice,
      discountPercentage: descriptiveStats.discountPercentage
    }
  };
}

async function getRatingAnalytics(category?: string) {
  const [
    ratingsByCategory,
    topRated,
    leastRated,
    descriptiveStats
  ] = await Promise.all([
    DatabaseQueries.getAverageRatingsByCategory(),
    DatabaseQueries.getTopRatedProducts(20),
    DatabaseQueries.getLeastRatedProducts(10),
    DatabaseQueries.getDescriptiveStatistics()
  ]);

  return {
    byCategory: ratingsByCategory,
    topRated,
    leastRated,
    statistics: descriptiveStats.rating,
    distribution: calculateRatingDistribution(topRated.concat(leastRated))
  };
}

async function getTrendAnalytics(timeRange: string, category?: string) {
  // For demo purposes, generate trend data
  // In production, this would query actual time-series data
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const trends = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      avgRating: 4.0 + Math.random() * 0.8,
      avgPrice: 1200 + Math.random() * 600,
      productCount: Math.floor(50 + Math.random() * 30),
      sentiment: 0.6 + Math.random() * 0.3
    });
  }

  return {
    trends,
    timeRange,
    category,
    insights: {
      ratingTrend: trends[trends.length - 1].avgRating > trends[0].avgRating ? 'improving' : 'declining',
      priceTrend: trends[trends.length - 1].avgPrice > trends[0].avgPrice ? 'increasing' : 'decreasing'
    }
  };
}

// Helper functions
function calculateRatingDistribution(products: any[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  products.forEach(product => {
    const rating = Math.floor(product.rating || 0);
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });

  return Object.entries(distribution).map(([rating, count]) => ({
    rating: parseInt(rating),
    count,
    percentage: (count / products.length) * 100
  }));
}

function calculatePriceRanges(products: any[]) {
  const ranges = {
    'Under ₹500': 0,
    '₹500 - ₹1000': 0,
    '₹1000 - ₹2500': 0,
    '₹2500 - ₹5000': 0,
    'Above ₹5000': 0
  };

  products.forEach(product => {
    const price = product.price || 0;
    if (price < 500) ranges['Under ₹500']++;
    else if (price < 1000) ranges['₹500 - ₹1000']++;
    else if (price < 2500) ranges['₹1000 - ₹2500']++;
    else if (price < 5000) ranges['₹2500 - ₹5000']++;
    else ranges['Above ₹5000']++;
  });

  return Object.entries(ranges).map(([range, count]) => ({
    range,
    count,
    percentage: (count / products.length) * 100
  }));
}
