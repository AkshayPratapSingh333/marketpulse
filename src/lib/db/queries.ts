import { prisma } from './prisma';
import { 
  CategoryInsight, 
  TopProduct, 
  TrendData, 
  SentimentDistribution,
  CorrelationData,
  PriceRangeDistribution 
} from '@/types';
import _ from 'lodash';

/**
 * Database query utilities for analytics and insights
 */
export class DatabaseQueries {
  
  /**
   * Get top products by category
   */
  static async getTopProductsByCategory(limit: number = 10): Promise<Record<string, TopProduct[]>> {
    const products = await prisma.product.findMany({
      select: {
        productId: true,
        productName: true,
        category: true,
        rating: true,
        ratingCount: true,
        discountedPrice: true,
        discountPercentage: true,
        img_link: true,
      },
      orderBy: [
        { rating: 'desc' },
        { ratingCount: 'desc' },
      ],
    });

    // Group by category and take top products from each
    const grouped = _.groupBy(products, 'category');
    const result: Record<string, TopProduct[]> = {};

    Object.entries(grouped).forEach(([category, categoryProducts]) => {
      result[category] = categoryProducts.slice(0, limit).map(product => ({
        productId: product.productId || '',
        productName: product.productName || '',
        category: product.category || '',
        rating: product.rating || 0,
        ratingCount: product.ratingCount || 0,
        price: product.discountedPrice || 0,
        discountPercentage: product.discountPercentage || 0,
        imgLink: product.img_link || undefined,
      }));
    });

    return result;
  }

  /**
   * Get least rated products by category
   */
  static async getLeastRatedProductsByCategory(limit: number = 5): Promise<Record<string, TopProduct[]>> {
    const products = await prisma.product.findMany({
      where: {
        ratingCount: { gte: 10 }, // Only products with at least 10 ratings
      },
      select: {
        productId: true,
        productName: true,
        category: true,
        rating: true,
        ratingCount: true,
        discountedPrice: true,
        discountPercentage: true,
        img_link: true,
      },
      orderBy: [
        { rating: 'asc' },
        { ratingCount: 'desc' },
      ],
    });

    const grouped = _.groupBy(products, 'category');
    const result: Record<string, TopProduct[]> = {};

    Object.entries(grouped).forEach(([category, categoryProducts]) => {
      result[category] = categoryProducts.slice(0, limit).map(product => ({
        productId: product.productId || '',
        productName: product.productName || '',
        category: product.category || '',
        rating: product.rating || 0,
        ratingCount: product.ratingCount || 0,
        price: product.discountedPrice || 0,
        discountPercentage: product.discountPercentage || 0,
        imgLink: product.img_link || undefined,
      }));
    });

    return result;
  }

  /**
   * Get overall top rated products
   */
  static async getTopRatedProducts(limit: number = 20): Promise<TopProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        ratingCount: { gte: 5 }, // At least 5 ratings
      },
      select: {
        productId: true,
        productName: true,
        category: true,
        rating: true,
        ratingCount: true,
        discountedPrice: true,
        discountPercentage: true,
        img_link: true,
      },
      orderBy: [
        { rating: 'desc' },
        { ratingCount: 'desc' },
      ],
      take: limit,
    });

    return products.map(product => ({
      productId: product.productId || '',
      productName: product.productName || '',
      category: product.category || '',
      rating: product.rating || 0,
      ratingCount: product.ratingCount || 0,
      price: product.discountedPrice || 0,
      discountPercentage: product.discountPercentage || 0,
      imgLink: product.img_link || undefined,
    }));
  }

  /**
   * Get least rated products overall
   */
  static async getLeastRatedProducts(limit: number = 20): Promise<TopProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        ratingCount: { gte: 10 }, // At least 10 ratings to be significant
      },
      select: {
        productId: true,
        productName: true,
        category: true,
        rating: true,
        ratingCount: true,
        discountedPrice: true,
        discountPercentage: true,
        img_link: true,
      },
      orderBy: [
        { rating: 'asc' },
        { ratingCount: 'desc' },
      ],
      take: limit,
    });

    return products.map(product => ({
      productId: product.productId || '',
      productName: product.productName || '',
      category: product.category || '',
      rating: product.rating || 0,
      ratingCount: product.ratingCount || 0,
      price: product.discountedPrice || 0,
      discountPercentage: product.discountPercentage || 0,
      imgLink: product.img_link || undefined,
    }));
  }

  /**
   * Get category insights with statistics
   */
  static async getCategoryInsights(): Promise<CategoryInsight[]> {
    const insights = await prisma.categoryInsight.findMany({
      orderBy: { totalProducts: 'desc' },
    });

    return insights.map(insight => ({
      category: insight.category,
      totalProducts: insight.totalProducts,
      averageRating: insight.averageRating,
      averagePrice: insight.averagePrice,
      averageDiscount: insight.averageDiscount,
      topRatedProduct: insight.topRatedProduct || undefined,
    }));
  }

  /**
   * Get top categories by number of products
   */
  static async getTopCategoriesByProductCount(limit: number = 10) {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      _avg: { rating: true },
      orderBy: { _count: { category: 'desc' } },
      take: limit,
    });

    return categories.map(cat => ({
      category: cat.category || 'Unknown',
      productCount: cat._count.category,
      averageRating: cat._avg.rating || 0,
    }));
  }

  /**
   * Get average ratings by category
   */
  static async getAverageRatingsByCategory() {
    const ratings = await prisma.product.groupBy({
      by: ['category'],
      _avg: { 
        rating: true,
        ratingCount: true,
      },
      _count: { category: true },
      orderBy: { _avg: { rating: 'desc' } },
    });

    return ratings.map(rating => ({
      category: rating.category || 'Unknown',
      averageRating: rating._avg.rating || 0,
      averageRatingCount: rating._avg.ratingCount || 0,
      productCount: rating._count.category,
    }));
  }

  /**
   * Get price range distribution
   */
  static async getPriceRangeDistribution(): Promise<PriceRangeDistribution[]> {
    const priceRanges = await prisma.product.groupBy({
      by: ['priceRange'],
      _count: { priceRange: true },
      _avg: { rating: true },
    });

    const total = priceRanges.reduce((sum, range) => sum + range._count.priceRange, 0);

    return priceRanges.map(range => ({
      range: range.priceRange || 'Unknown',
      count: range._count.priceRange,
      averageRating: range._avg.rating || 0,
      percentage: (range._count.priceRange / total) * 100,
    }));
  }

  /**
   * Get products with highest average rating by price range
   */
  static async getTopProductsByPriceRange() {
    const products = await prisma.product.findMany({
      select: {
        priceRange: true,
        productName: true,
        rating: true,
        discountedPrice: true,
        ratingCount: true,
      },
      orderBy: [
        { priceRange: 'asc' },
        { rating: 'desc' },
      ],
    });

    return _.groupBy(products, 'priceRange');
  }

  /**
   * Calculate average rating by actual and discounted price ranges
   */
  static async getAverageRatingByPriceRanges() {
    // Create price buckets
    const products = await prisma.product.findMany({
      select: {
        actualPrice: true,
        discountedPrice: true,
        rating: true,
      },
    });

    const actualPriceBuckets = this.createPriceBuckets(products, 'actualPrice');
    const discountedPriceBuckets = this.createPriceBuckets(products, 'discountedPrice');

    return {
      actualPrice: actualPriceBuckets,
      discountedPrice: discountedPriceBuckets,
    };
  }

  /**
   * Helper method to create price buckets
   */
  private static createPriceBuckets(products: any[], priceField: string) {
    const buckets: Record<string, number[]> = {
      '0-500': [],
      '500-1000': [],
      '1000-2000': [],
      '2000-5000': [],
      '5000+': [],
    };

    products.forEach(product => {
      const price = product[priceField] || 0;
      const rating = product.rating || 0;

      if (price < 500) buckets['0-500'].push(rating);
      else if (price < 1000) buckets['500-1000'].push(rating);
      else if (price < 2000) buckets['1000-2000'].push(rating);
      else if (price < 5000) buckets['2000-5000'].push(rating);
      else buckets['5000+'].push(rating);
    });

    return Object.entries(buckets).map(([range, ratings]) => ({
      priceRange: range,
      averageRating: ratings.length > 0 ? _.mean(ratings) : 0,
      productCount: ratings.length,
    }));
  }

  /**
   * Get correlation data between different metrics
   */
  static async getCorrelationData(): Promise<CorrelationData[]> {
    const products = await prisma.product.findMany({
      select: {
        actualPrice: true,
        discountedPrice: true,
        discountPercentage: true,
        rating: true,
        ratingCount: true,
      },
    });

    if (products.length < 2) return [];

    const correlations: CorrelationData[] = [];
    const fields = ['actualPrice', 'discountedPrice', 'discountPercentage', 'rating', 'ratingCount'];

    // Calculate Pearson correlation for each pair
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];
        
        const values1 = products.map(p => p[field1 as keyof typeof p] as number).filter(v => v != null);
        const values2 = products.map(p => p[field2 as keyof typeof p] as number).filter(v => v != null);
        
        if (values1.length > 1 && values2.length > 1) {
          const correlation = this.calculatePearsonCorrelation(values1, values2);
          
          correlations.push({
            variable1: field1,
            variable2: field2,
            correlation,
            significance: Math.abs(correlation) > 0.7 ? 'high' : Math.abs(correlation) > 0.3 ? 'medium' : 'low',
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = _.sum(x.slice(0, n));
    const sumY = _.sum(y.slice(0, n));
    const sumXY = _.sum(x.slice(0, n).map((xi, i) => xi * y[i]));
    const sumX2 = _.sum(x.slice(0, n).map(xi => xi * xi));
    const sumY2 = _.sum(y.slice(0, n).map(yi => yi * yi));

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get sentiment distribution
   */
  static async getSentimentDistribution(): Promise<SentimentDistribution> {
    const sentiments = await prisma.product.groupBy({
      by: ['sentimentLabel'],
      _count: { sentimentLabel: true },
    });

    const distribution = {
      positive: 0,
      negative: 0,
      neutral: 0,
      totalReviews: 0,
    };

    sentiments.forEach(sentiment => {
      const label = sentiment.sentimentLabel?.toLowerCase();
      const count = sentiment._count.sentimentLabel;
      
      if (label === 'positive') distribution.positive = count;
      else if (label === 'negative') distribution.negative = count;
      else if (label === 'neutral') distribution.neutral = count;
      
      distribution.totalReviews += count;
    });

    return distribution;
  }

  /**
   * Get average ratings by sentiment
   */
  static async getAverageRatingsBySentiment() {
    const ratings = await prisma.product.groupBy({
      by: ['sentimentLabel'],
      _avg: { rating: true },
      _count: { sentimentLabel: true },
    });

    return ratings.map(rating => ({
      sentiment: rating.sentimentLabel || 'unknown',
      averageRating: rating._avg.rating || 0,
      count: rating._count.sentimentLabel,
    }));
  }

  /**
   * Get descriptive statistics for prices and ratings
   */
  static async getDescriptiveStatistics() {
    const products = await prisma.product.findMany({
      select: {
        actualPrice: true,
        discountedPrice: true,
        rating: true,
        discountPercentage: true,
      },
    });

    const actualPrices = products.map(p => p.actualPrice || 0).filter(p => p > 0);
    const discountedPrices = products.map(p => p.discountedPrice || 0).filter(p => p > 0);
    const ratings = products.map(p => p.rating || 0);
    const discounts = products.map(p => p.discountPercentage || 0);

    return {
      actualPrice: this.calculateStatistics(actualPrices),
      discountedPrice: this.calculateStatistics(discountedPrices),
      rating: this.calculateStatistics(ratings),
      discountPercentage: this.calculateStatistics(discounts),
    };
  }

  /**
   * Calculate basic statistics for an array of numbers
   */
  private static calculateStatistics(values: number[]) {
    if (values.length === 0) return null;

    const sorted = values.slice().sort((a, b) => a - b);
    const mean = _.mean(values);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mode = _.chain(values)
      .countBy()
      .toPairs()
      .maxBy(1)
      .head()
      .value();

    return {
      count: values.length,
      mean: Math.round(mean * 100) / 100,
      median,
      mode: parseFloat(String(mode || 0)),
      min: _.min(values) || 0,
      max: _.max(values) || 0,
      standardDeviation: Math.round(Math.sqrt(_.mean(values.map(v => Math.pow(v - mean, 2)))) * 100) / 100,
      quartiles: {
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q2: median,
        q3: sorted[Math.floor(sorted.length * 0.75)],
      },
    };
  }

  /**
   * Get recent trend data
   */
  static async getTrendData(analysisType: string, limit: number = 30): Promise<TrendData[]> {
    const trends = await prisma.trendAnalysis.findMany({
      where: { analysisType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return trends.map(trend => ({
      period: trend.period,
      value: (trend.metrics as any)?.value || 0,
      category: trend.category || undefined,
      type: 'sales', // Default type
    }));
  }

  /**
   * Search products with filters
   */
  static async searchProducts(filters: {
    category?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
    searchTerm?: string;
  }, limit: number = 50) {
    const where: any = {};

    if (filters.category) where.category = { contains: filters.category };
    if (filters.minRating) where.rating = { gte: filters.minRating };
    if (filters.maxPrice) where.discountedPrice = { ...where.discountedPrice, lte: filters.maxPrice };
    if (filters.minPrice) where.discountedPrice = { ...where.discountedPrice, gte: filters.minPrice };
    if (filters.searchTerm) {
      where.OR = [
        { productName: { contains: filters.searchTerm } },
        { about: { contains: filters.searchTerm } },
      ];
    }

    return await prisma.product.findMany({
      where,
      select: {
        productId: true,
        productName: true,
        category: true,
        rating: true,
        ratingCount: true,
        discountedPrice: true,
        actualPrice: true,
        discountPercentage: true,
        img_link: true,
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
  }
}