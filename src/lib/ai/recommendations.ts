// src/lib/ai/recommendations.ts

import { prisma } from '@/lib/db/prisma';
import { ProductRecommendation } from '@/types';
import _ from 'lodash';

/**
 * Advanced product recommendation system
 */
export class RecommendationEngine {
  
  /**
   * Generate recommendations based on product similarity
   */
  async generateSimilarProductRecommendations(
    productId: string, 
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      const targetProduct = await prisma.product.findUnique({
        where: { productId },
      });

      if (!targetProduct) {
        throw new Error('Product not found');
      }

      // Find similar products in the same category
      const similarProducts = await prisma.product.findMany({
        where: {
          category: targetProduct.category,
          productId: { not: productId },
          rating: { gte: (targetProduct.rating || 0) - 0.5 }, // Similar or better rating
        },
        orderBy: [
          { rating: 'desc' },
          { ratingCount: 'desc' },
        ],
        take: limit * 2, // Get more to filter
      });

      // Calculate similarity scores
      const recommendations = similarProducts
        .map(product => {
          const similarity = this.calculateSimilarity(targetProduct, product);
          return {
            productId: product.productId || '',
            productName: product.productName || '',
            category: product.category || '',
            rating: product.rating || 0,
            price: product.discountedPrice || 0,
            similarity,
            reason: this.generateReasonForSimilarity(targetProduct, product, similarity),
            imgLink: product.imgLink || undefined,
          };
        })
        .filter(rec => rec.similarity > 0.3) // Filter low similarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      throw new Error(`Failed to generate similar product recommendations: ${error}`);
    }
  }

  /**
   * Generate recommendations based on highest ratings in category
   */
  async generateTopRatedRecommendations(
    category?: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const whereClause = category 
        ? { category: { contains: category } }
        : {};

      const topProducts = await prisma.product.findMany({
        where: {
          ...whereClause,
          rating: { gte: 4.0 }, // Only high-rated products
          ratingCount: { gte: 10 }, // Minimum reviews for reliability
        },
        orderBy: [
          { rating: 'desc' },
          { ratingCount: 'desc' },
        ],
        take: limit,
      });

      return topProducts.map(product => ({
        productId: product.productId || '',
        productName: product.productName || '',
        category: product.category || '',
        rating: product.rating || 0,
        price: product.discountedPrice || 0,
        similarity: 1.0, // Top rated = high relevance
        reason: `Highly rated product (${product.rating}/5) with ${product.ratingCount} reviews`,
        imgLink: product.imgLink || undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to generate top-rated recommendations: ${error}`);
    }
  }

  /**
   * Generate recommendations based on price range and category
   */
  async generatePriceBasedRecommendations(
    minPrice: number,
    maxPrice: number,
    category?: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const whereClause: any = {
        discountedPrice: {
          gte: minPrice,
          lte: maxPrice,
        },
        rating: { gte: 3.5 }, // Good rating threshold
      };

      if (category) {
        whereClause.category = { contains: category };
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: [
          { rating: 'desc' },
          { discountPercentage: 'desc' }, // Better discounts first
        ],
        take: limit,
      });

      return products.map(product => {
        const discountText = product.discountPercentage > 0 
          ? ` with ${product.discountPercentage.toFixed(0)}% discount`
          : '';
        
        return {
          productId: product.productId || '',
          productName: product.productName || '',
          category: product.category || '',
          rating: product.rating || 0,
          price: product.discountedPrice || 0,
          similarity: 0.8, // Price match = good relevance
          reason: `Great value in your budget (₹${minPrice}-₹${maxPrice})${discountText}`,
          imgLink: product.imgLink || undefined,
        };
      });
    } catch (error) {
      throw new Error(`Failed to generate price-based recommendations: ${error}`);
    }
  }

  /**
   * Generate collaborative filtering recommendations
   */
  async generateCollaborativeRecommendations(
    targetProductIds: string[],
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      if (targetProductIds.length === 0) {
        return this.generateTopRatedRecommendations(undefined, limit);
      }

      // Get categories of target products
      const targetProducts = await prisma.product.findMany({
        where: {
          productId: { in: targetProductIds },
        },
        select: {
          category: true,
          rating: true,
          discountedPrice: true,
        },
      });

      const categories = [...new Set(targetProducts.map(p => p.category))];
      const avgRating = _.mean(targetProducts.map(p => p.rating || 0));
      const avgPrice = _.mean(targetProducts.map(p => p.discountedPrice || 0));

      // Find products that users with similar preferences might like
      const recommendations = await prisma.product.findMany({
        where: {
          category: { in: categories },
          productId: { notIn: targetProductIds },
          rating: { gte: Math.max(avgRating - 0.5, 3.0) },
          discountedPrice: {
            gte: avgPrice * 0.5,
            lte: avgPrice * 2.0,
          },
        },
        orderBy: [
          { rating: 'desc' },
          { ratingCount: 'desc' },
        ],
        take: limit,
      });

      return recommendations.map(product => ({
        productId: product.productId || '',
        productName: product.productName || '',
        category: product.category || '',
        rating: product.rating || 0,
        price: product.discountedPrice || 0,
        similarity: this.calculateCollaborativeSimilarity(product, targetProducts),
        reason: `Users with similar preferences also liked this product`,
        imgLink: product.imgLink || undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to generate collaborative recommendations: ${error}`);
    }
  }

  /**
   * Generate trending product recommendations
   */
  async generateTrendingRecommendations(limit: number = 10): Promise<ProductRecommendation[]> {
    try {
      // Get products with high recent activity (assuming recent additions have more relevance)
      const trendingProducts = await prisma.product.findMany({
        where: {
          rating: { gte: 4.0 },
          ratingCount: { gte: 20 },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: [
          { ratingCount: 'desc' }, // Most reviewed recently
          { rating: 'desc' },
        ],
        take: limit,
      });

      return trendingProducts.map(product => ({
        productId: product.productId || '',
        productName: product.productName || '',
        category: product.category || '',
        rating: product.rating || 0,
        price: product.discountedPrice || 0,
        similarity: 0.9, // Trending = high relevance
        reason: `Trending product with ${product.ratingCount} recent reviews`,
        imgLink: product.imgLink || undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to generate trending recommendations: ${error}`);
    }
  }

  /**
   * Generate category-based recommendations
   */
  async generateCategoryRecommendations(
    categories: string[],
    excludeProductIds: string[] = [],
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations = await prisma.product.findMany({
        where: {
          category: { in: categories },
          productId: { notIn: excludeProductIds },
          rating: { gte: 3.5 },
        },
        orderBy: [
          { rating: 'desc' },
          { ratingCount: 'desc' },
        ],
        take: limit,
      });

      return recommendations.map(product => ({
        productId: product.productId || '',
        productName: product.productName || '',
        category: product.category || '',
        rating: product.rating || 0,
        price: product.discountedPrice || 0,
        similarity: 0.7,
        reason: `Top product in ${product.category} category`,
        imgLink: product.imgLink || undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to generate category recommendations: ${error}`);
    }
  }

  /**
   * Store recommendations in database
   */
  async storeRecommendations(
    sourceProductId: string,
    recommendations: ProductRecommendation[]
  ): Promise<void> {
    try {
      // Clear existing recommendations for this product
      await prisma.productRecommendation.deleteMany({
        where: { sourceProductId },
      });

      // Store new recommendations
      const recommendationData = recommendations.map(rec => ({
        sourceProductId,
        recommendedProductId: rec.productId,
        similarity: rec.similarity,
        reason: rec.reason,
      }));

      await prisma.productRecommendation.createMany({
        data: recommendationData,
      });
    } catch (error) {
      throw new Error(`Failed to store recommendations: ${error}`);
    }
  }

  /**
   * Get stored recommendations for a product
   */
  async getStoredRecommendations(productId: string): Promise<ProductRecommendation[]> {
    try {
      const recommendations = await prisma.productRecommendation.findMany({
        where: { sourceProductId: productId },
        include: {
          recommendedProduct: {
            select: {
              productId: true,
              productName: true,
              category: true,
              rating: true,
              discountedPrice: true,
              imgLink: true,
            },
          },
        },
        orderBy: { similarity: 'desc' },
      });

      return recommendations.map(rec => ({
        productId: rec.recommendedProduct.productId || '',
        productName: rec.recommendedProduct.productName || '',
        category: rec.recommendedProduct.category || '',
        rating: rec.recommendedProduct.rating || 0,
        price: rec.recommendedProduct.discountedPrice || 0,
        similarity: rec.similarity,
        reason: rec.reason || 'Similar product',
        imgLink: rec.recommendedProduct.imgLink || undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to get stored recommendations: ${error}`);
    }
  }

  /**
   * Calculate similarity between two products
   */
  private calculateSimilarity(product1: any, product2: any): number {
    let similarity = 0;
    let factors = 0;

    // Category similarity (most important)
    if (product1.category === product2.category) {
      similarity += 0.4;
    }
    factors++;

    // Price similarity
    const price1 = product1.discountedPrice || 0;
    const price2 = product2.discountedPrice || 0;
    if (price1 > 0 && price2 > 0) {
      const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2);
      const priceSimilarity = 1 - Math.min(priceDiff, 1);
      similarity += priceSimilarity * 0.2;
    }
    factors++;

    // Rating similarity
    const rating1 = product1.rating || 0;
    const rating2 = product2.rating || 0;
    const ratingDiff = Math.abs(rating1 - rating2) / 5;
    const ratingSimilarity = 1 - ratingDiff;
    similarity += ratingSimilarity * 0.3;
    factors++;

    // Price range similarity
    const range1 = product1.priceRange || '';
    const range2 = product2.priceRange || '';
    if (range1 === range2 && range1 !== '') {
      similarity += 0.1;
    }
    factors++;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate collaborative filtering similarity
   */
  private calculateCollaborativeSimilarity(product: any, targetProducts: any[]): number {
    const productRating = product.rating || 0;
    const productPrice = product.discountedPrice || 0;
    
    const avgTargetRating = _.mean(targetProducts.map(p => p.rating || 0));
    const avgTargetPrice = _.mean(targetProducts.map(p => p.discountedPrice || 0));

    // Rating similarity
    const ratingSimilarity = 1 - Math.abs(productRating - avgTargetRating) / 5;
    
    // Price similarity
    const priceSimilarity = avgTargetPrice > 0 
      ? 1 - Math.abs(productPrice - avgTargetPrice) / avgTargetPrice
      : 0.5;

    return (ratingSimilarity * 0.6) + (priceSimilarity * 0.4);
  }

  /**
   * Generate reason for recommendation
   */
  private generateReasonForSimilarity(product1: any, product2: any, similarity: number): string {
    const reasons = [];

    if (product1.category === product2.category) {
      reasons.push(`same category (${product1.category})`);
    }

    const rating2 = product2.rating || 0;
    if (rating2 >= 4.0) {
      reasons.push(`high rating (${rating2}/5)`);
    }

    const discount2 = product2.discountPercentage || 0;
    if (discount2 > 20) {
      reasons.push(`good discount (${discount2.toFixed(0)}% off)`);
    }

    if (product1.priceRange === product2.priceRange && product1.priceRange) {
      reasons.push(`similar price range`);
    }

    if (similarity > 0.8) {
      reasons.push(`very similar product`);
    }

    return reasons.length > 0 
      ? `Recommended for ${reasons.slice(0, 2).join(' and ')}`
      : `Similar product with good ratings`;
  }

  /**
   * Generate hybrid recommendations (combines multiple approaches)
   */
  async generateHybridRecommendations(
    options: {
      productId?: string;
      category?: string;
      priceRange?: [number, number];
      minRating?: number;
      limit?: number;
    }
  ): Promise<ProductRecommendation[]> {
    const { productId, category, priceRange, minRating = 3.5, limit = 10 } = options;

    try {
      const recommendations = new Map<string, ProductRecommendation>();

      // Content-based recommendations (if productId provided)
      if (productId) {
        const similarProducts = await this.generateSimilarProductRecommendations(productId, 5);
        similarProducts.forEach(rec => {
          rec.similarity *= 0.9; // Slight weight adjustment
          recommendations.set(rec.productId, rec);
        });
      }

      // Category-based recommendations
      if (category) {
        const categoryRecs = await this.generateCategoryRecommendations([category], 
          productId ? [productId] : [], 5);
        categoryRecs.forEach(rec => {
          const existing = recommendations.get(rec.productId);
          if (existing) {
            existing.similarity = Math.max(existing.similarity, rec.similarity * 0.8);
          } else {
            rec.similarity *= 0.8;
            recommendations.set(rec.productId, rec);
          }
        });
      }

      // Price-based recommendations
      if (priceRange) {
        const priceRecs = await this.generatePriceBasedRecommendations(
          priceRange[0], priceRange[1], category, 5);
        priceRecs.forEach(rec => {
          const existing = recommendations.get(rec.productId);
          if (existing) {
            existing.similarity = Math.max(existing.similarity, rec.similarity * 0.7);
          } else {
            rec.similarity *= 0.7;
            recommendations.set(rec.productId, rec);
          }
        });
      }

      // Top-rated recommendations (fallback)
      const topRated = await this.generateTopRatedRecommendations(category, 5);
      topRated.forEach(rec => {
        if (!recommendations.has(rec.productId)) {
          rec.similarity *= 0.6;
          recommendations.set(rec.productId, rec);
        }
      });

      // Sort by similarity and return top results
      return Array.from(recommendations.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
        
    } catch (error) {
      throw new Error(`Failed to generate hybrid recommendations: ${error}`);
    }
  }

  /**
   * Get recommendation performance metrics
   */
  async getRecommendationMetrics(): Promise<{
    totalRecommendations: number;
    averageSimilarity: number;
    topCategories: Array<{ category: string; count: number }>;
    recentActivity: number;
  }> {
    try {
      const [total, avgSimilarity, categoryStats, recentCount] = await Promise.all([
        prisma.productRecommendation.count(),
        prisma.productRecommendation.aggregate({
          _avg: { similarity: true },
        }),
        prisma.productRecommendation.groupBy({
          by: ['recommendedProduct'],
          _count: { recommendedProduct: true },
          take: 10,
        }),
        prisma.productRecommendation.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      return {
        totalRecommendations: total,
        averageSimilarity: avgSimilarity._avg.similarity || 0,
        topCategories: [], // Would need to join with products to get actual categories
        recentActivity: recentCount,
      };
    } catch (error) {
      throw new Error(`Failed to get recommendation metrics: ${error}`);
    }
  }
}