// src/lib/etl/load.ts

import { PrismaClient } from '@prisma/client';
import { CleanedProductData } from '@/types';
import _ from 'lodash';

export interface LoadOptions {
  batchSize?: number;
  upsert?: boolean;
  skipDuplicates?: boolean;
  generateInsights?: boolean;
}

export interface LoadResult {
  success: boolean;
  recordsLoaded: number;
  recordsSkipped: number;
  recordsError: number;
  errors: string[];
  jobId: string;
  duration: number;
}

/**
 * Data loading utilities for database operations
 */
export class DataLoader {
  private prisma: PrismaClient;
  private static readonly DEFAULT_OPTIONS: LoadOptions = {
    batchSize: 100,
    upsert: true,
    skipDuplicates: true,
    generateInsights: true,
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Load cleaned data into database
   */
  async load(
    data: CleanedProductData[],
    fileName: string,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const config = { ...DataLoader.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let recordsLoaded = 0;
    let recordsSkipped = 0;
    let recordsError = 0;
    const errors: string[] = [];

    try {
      // Create ETL job log
      console.log(`Creating ETL job log with ID: ${jobId}`);
      await this.prisma.eTLJobLog.create({
        data: {
          id: jobId,
          fileName,
          status: 'started',
          recordsProcessed: 0,
          recordsSuccess: 0,
          recordsError: 0,
          startTime: new Date(),
        },
      });

      // Process data in batches
      const batches = _.chunk(data, config.batchSize);
      console.log(`Processing ${batches.length} batches with ${data.length} total records`);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} records`);
        
        try {
          const batchResult = await this.processBatch(batch, config);
          recordsLoaded += batchResult.loaded;
          recordsSkipped += batchResult.skipped;
          recordsError += batchResult.errors;
          errors.push(...batchResult.errorMessages);

          // Update progress
          await this.prisma.eTLJobLog.update({
            where: { id: jobId },
            data: {
              status: 'processing',
              recordsProcessed: (i + 1) * (config.batchSize || 100),
              recordsSuccess: recordsLoaded,
              recordsError: recordsError,
            },
          });
        } catch (error) {
          errors.push(`Batch ${i + 1} failed: ${error}`);
          recordsError += batch.length;
        }
      }

      // Generate insights if requested
      if (config.generateInsights) {
        await this.generateCategoryInsights();
        await this.generateTrendAnalysis();
      }

      // Update final job status
      const endTime = new Date();
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      await this.prisma.eTLJobLog.update({
        where: { id: jobId },
        data: {
          status: recordsError === 0 ? 'completed' : 'completed_with_errors',
          recordsSuccess: recordsLoaded,
          recordsError: recordsError,
          endTime,
          duration,
          errorMessages: errors.length > 0 ? errors : undefined,
        },
      });

      return {
        success: recordsError < data.length / 2, // Success if less than 50% errors
        recordsLoaded,
        recordsSkipped,
        recordsError,
        errors,
        jobId,
        duration,
      };

    } catch (error) {
      // Update job status to failed
      await this.prisma.eTLJobLog.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          endTime: new Date(),
          duration: Math.round((Date.now() - startTime) / 1000),
          errorMessages: [String(error)],
        },
      });

      throw new Error(`Data loading failed: ${error}`);
    }
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    batch: CleanedProductData[],
    options: LoadOptions
  ): Promise<{
    loaded: number;
    skipped: number;
    errors: number;
    errorMessages: string[];
  }> {
    let loaded = 0;
    let skipped = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const record of batch) {
      try {
        console.log(`Processing record: ${record.productId}`, {
          productName: record.productName,
          category: record.category,
          hasDiscountedPrice: typeof record.discountedPrice,
          hasRating: typeof record.rating
        });

        if (options.upsert) {
          // Ensure we have a valid productId
          const safeProductId = record.productId || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Upsert record
          await this.prisma.product.upsert({
            where: {
              productId: safeProductId,
            },
            create: {
              productId: safeProductId,
              productName: record.productName,
              category: record.category,
              discountedPrice: record.discountedPrice,
              actualPrice: record.actualPrice,
              discountPercentage: record.discountPercentage,
              rating: record.rating,
              ratingCount: record.ratingCount,
              about: record.about,
              userId: record.userId,
              userName: record.userName,
              userReview: record.userReview,
              reviewTitle: record.reviewTitle,
              img_link: record.imgLink,
              product_link: record.productLink,
              priceRange: record.priceRange,
              meanRating: record.meanRating,
              productCount: record.productCount,
              averageRatingCount: record.averageRatingCount,
            },
            update: {
              productName: record.productName,
              category: record.category,
              discountedPrice: record.discountedPrice,
              actualPrice: record.actualPrice,
              discountPercentage: record.discountPercentage,
              rating: record.rating,
              ratingCount: record.ratingCount,
              about: record.about,
              userId: record.userId,
              userName: record.userName,
              userReview: record.userReview,
              reviewTitle: record.reviewTitle,
              img_link: record.imgLink,
              product_link: record.productLink,
              priceRange: record.priceRange,
              meanRating: record.meanRating,
              productCount: record.productCount,
              averageRatingCount: record.averageRatingCount,
              updatedAt: new Date(),
            },
          });
          loaded++;
        } else {
          // Create new record
          await this.prisma.product.create({
            data: {
              productId: record.productId,
              productName: record.productName,
              category: record.category,
              discountedPrice: record.discountedPrice,
              actualPrice: record.actualPrice,
              discountPercentage: record.discountPercentage,
              rating: record.rating,
              ratingCount: record.ratingCount,
              about: record.about,
              userId: record.userId,
              userName: record.userName,
              userReview: record.userReview,
              reviewTitle: record.reviewTitle,
              img_link: record.imgLink,
              product_link: record.productLink,
              priceRange: record.priceRange,
              meanRating: record.meanRating,
              productCount: record.productCount,
              averageRatingCount: record.averageRatingCount,
            },
          });
          loaded++;
        }
      } catch (error) {
        console.error(`Database error for product ${record.productId}:`, error);
        if (options.skipDuplicates && String(error).includes('Unique constraint')) {
          skipped++;
        } else {
          errors++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          errorMessages.push(`Failed to load product ${record.productId}: ${errorMsg}`);
        }
      }
    }

    return { loaded, skipped, errors, errorMessages };
  }

  /**
   * Generate category insights after loading data
   */
  private async generateCategoryInsights(): Promise<void> {
    try {
      // Get category statistics
      const categoryStats = await this.prisma.product.groupBy({
        by: ['category'],
        _count: { category: true },
        _avg: {
          rating: true,
          discountedPrice: true,
          discountPercentage: true,
        },
      });

      // Upsert category insights
      for (const stat of categoryStats) {
        if (stat.category) {
          // Find top rated product in category
          const topProduct = await this.prisma.product.findFirst({
            where: { category: stat.category },
            orderBy: { rating: 'desc' },
            select: { productName: true },
          });

          await this.prisma.categoryInsight.upsert({
            where: { category: stat.category },
            create: {
              category: stat.category,
              totalProducts: stat._count.category,
              averageRating: stat._avg.rating || 0,
              averagePrice: stat._avg.discountedPrice || 0,
              averageDiscount: stat._avg.discountPercentage || 0,
              topRatedProduct: topProduct?.productName,
            },
            update: {
              totalProducts: stat._count.category,
              averageRating: stat._avg.rating || 0,
              averagePrice: stat._avg.discountedPrice || 0,
              averageDiscount: stat._avg.discountPercentage || 0,
              topRatedProduct: topProduct?.productName,
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate category insights:', error);
    }
  }

  /**
   * Generate trend analysis data
   */
  private async generateTrendAnalysis(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Price range analysis
      const priceRangeData = await this.prisma.product.groupBy({
        by: ['priceRange'],
        _count: { priceRange: true },
        _avg: { rating: true },
      });

      const priceMetrics = priceRangeData.map(range => ({
        range: range.priceRange || 'Unknown',
        count: range._count.priceRange,
        averageRating: range._avg.rating || 0,
      }));

      await this.prisma.trendAnalysis.create({
        data: {
          analysisType: 'price_range',
          period: today,
          metrics: {
            priceRanges: priceMetrics,
            totalProducts: priceRangeData.reduce((sum, range) => sum + range._count.priceRange, 0),
          },
        },
      });

      // Category analysis
      const categoryData = await this.prisma.product.groupBy({
        by: ['category'],
        _count: { category: true },
        _avg: { rating: true, discountedPrice: true },
      });

      const categoryMetrics = categoryData.map(cat => ({
        category: cat.category || 'Unknown',
        productCount: cat._count.category,
        averageRating: cat._avg.rating || 0,
        averagePrice: cat._avg.discountedPrice || 0,
      }));

      await this.prisma.trendAnalysis.create({
        data: {
          analysisType: 'category',
          period: today,
          metrics: {
            categories: categoryMetrics,
            topCategories: categoryMetrics
              .sort((a, b) => b.productCount - a.productCount)
              .slice(0, 10),
          },
        },
      });

    } catch (error) {
      console.error('Failed to generate trend analysis:', error);
    }
  }

  /**
   * Get loading statistics
   */
  async getJobStatus(jobId: string) {
    return await this.prisma.eTLJobLog.findUnique({
      where: { id: jobId },
    });
  }

  /**
   * Get recent ETL jobs
   */
  async getRecentJobs(limit: number = 10) {
    return await this.prisma.eTLJobLog.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
    });
  }

  /**
   * Clean up old data before loading new
   */
  async cleanupOldData(retainDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retainDays);

    try {
      // Delete old products (if needed)
      // await this.prisma.product.deleteMany({
      //   where: {
      //     createdAt: { lt: cutoffDate },
      //   },
      // });

      // Delete old ETL job logs
      await this.prisma.eTLJobLog.deleteMany({
        where: {
          startTime: { lt: cutoffDate },
        },
      });

      // Delete old trend analyses
      await this.prisma.trendAnalysis.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Validate loaded data integrity
   */
  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: {
      totalProducts: number;
      validPrices: number;
      validRatings: number;
      duplicateProducts: number;
    };
  }> {
    const issues: string[] = [];
    
    try {
      // Get basic statistics
      const totalProducts = await this.prisma.product.count();
      
      // Check for invalid prices
      const invalidPrices = await this.prisma.product.count({
        where: {
          OR: [
            { discountedPrice: { lte: 0 } },
            { actualPrice: { lte: 0 } },
            { discountedPrice: { gt: this.prisma.product.fields.actualPrice } },
          ],
        },
      });

      if (invalidPrices > 0) {
        issues.push(`Found ${invalidPrices} products with invalid prices`);
      }

      // Check for invalid ratings
      const invalidRatings = await this.prisma.product.count({
        where: {
          OR: [
            { rating: { lt: 0 } },
            { rating: { gt: 5 } },
          ],
        },
      });

      if (invalidRatings > 0) {
        issues.push(`Found ${invalidRatings} products with invalid ratings`);
      }

      // Check for duplicates
      const duplicates = await this.prisma.product.groupBy({
        by: ['productId'],
        _count: { productId: true },
        having: {
          productId: {
            _count: { gt: 1 },
          },
        },
      });

      if (duplicates.length > 0) {
        issues.push(`Found ${duplicates.length} duplicate product IDs`);
      }

      return {
        isValid: issues.length === 0,
        issues,
        statistics: {
          totalProducts,
          validPrices: totalProducts - invalidPrices,
          validRatings: totalProducts - invalidRatings,
          duplicateProducts: duplicates.length,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Data integrity check failed: ${error}`],
        statistics: {
          totalProducts: 0,
          validPrices: 0,
          validRatings: 0,
          duplicateProducts: 0,
        },
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const [
        totalProducts,
        categories,
        avgRating,
        avgPrice,
        recentUploads,
      ] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.findMany({ distinct: ['category'], select: { category: true } }),
        this.prisma.product.aggregate({ _avg: { rating: true } }),
        this.prisma.product.aggregate({ _avg: { discountedPrice: true } }),
        this.prisma.eTLJobLog.count({
          where: {
            startTime: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      return {
        totalProducts,
        totalCategories: categories.filter(c => c.category).length,
        averageRating: avgRating._avg.rating || 0,
        averagePrice: avgPrice._avg.discountedPrice || 0,
        recentUploads,
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }
}