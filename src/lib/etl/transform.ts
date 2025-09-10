// src/lib/etl/transform.ts

import { RawCSVData, CleanedProductData } from '@/types';
import _ from 'lodash';

export interface TransformOptions {
  removeOutliers?: boolean;
  fillMissingValues?: boolean;
  normalizeText?: boolean;
  validatePrices?: boolean;
  calculateFeatures?: boolean;
}

export interface TransformResult {
  data: CleanedProductData[];
  errors: string[];
  warnings: string[];
  statistics: {
    originalCount: number;
    cleanedCount: number;
    removedCount: number;
    transformations: string[];
  };
}

/**
 * Data transformation and cleaning utilities
 */
export class DataTransformer {
  private static readonly DEFAULT_OPTIONS: TransformOptions = {
    removeOutliers: true,
    fillMissingValues: true,
    normalizeText: true,
    validatePrices: true,
    calculateFeatures: true,
  };

  /**
   * Main transformation pipeline
   */
  static async transform(
    rawData: RawCSVData[],
    columnMapping: Record<string, string> = {},
    options: TransformOptions = {}
  ): Promise<TransformResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];
    const transformations: string[] = [];

    try {
      // Step 1: Map columns to standard format
      let mappedData = this.mapColumns(rawData, columnMapping);
      transformations.push('Column mapping applied');

      // Step 2: Clean and validate data
      const { data: cleanedData, errors: cleanErrors } = this.cleanData(mappedData, config);
      errors.push(...cleanErrors);
      transformations.push('Data cleaning completed');

      // Step 3: Handle missing values
      if (config.fillMissingValues) {
        const filledData = this.fillMissingValues(cleanedData);
        mappedData = filledData;
        transformations.push('Missing values filled');
      }

      // Step 4: Remove outliers
      let finalData = cleanedData;
      if (config.removeOutliers) {
        const { data: outlierFreeData, removedCount } = this.removeOutliers(cleanedData);
        finalData = outlierFreeData;
        transformations.push(`Outliers removed: ${removedCount} records`);
      }

      // Step 5: Calculate derived features
      if (config.calculateFeatures) {
        finalData = this.calculateFeatures(finalData);
        transformations.push('Feature engineering completed');
      }

      // Step 6: Validate final data
      const validatedData = this.validateData(finalData);
      transformations.push('Data validation completed');

      return {
        data: validatedData,
        errors,
        warnings,
        statistics: {
          originalCount: rawData.length,
          cleanedCount: validatedData.length,
          removedCount: rawData.length - validatedData.length,
          transformations,
        },
      };
    } catch (error) {
      throw new Error(`Transformation failed: ${error}`);
    }
  }

  /**
   * Map raw CSV columns to standard format
   */
  private static mapColumns(
    rawData: RawCSVData[],
    mapping: Record<string, string>
  ): Partial<CleanedProductData>[] {
    return rawData.map(row => {
      const mapped: any = {};
      
      // Apply column mapping
      Object.entries(mapping).forEach(([standardField, originalField]) => {
        if (row[originalField] !== undefined) {
          mapped[standardField] = row[originalField];
        }
      });

      // Direct mapping for unmapped fields
      Object.keys(row).forEach(key => {
        if (!Object.values(mapping).includes(key)) {
          mapped[key] = row[key];
        }
      });

      return mapped;
    });
  }

  /**
   * Clean and normalize data
   */
  private static cleanData(
    data: Partial<CleanedProductData>[],
    options: TransformOptions
  ): { data: CleanedProductData[]; errors: string[] } {
    const cleanedData: CleanedProductData[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        const cleaned: Partial<CleanedProductData> = {};

        // Clean product name
        cleaned.productName = this.cleanText(row.productName || '');
        if (!cleaned.productName) {
          throw new Error(`Missing product name at row ${index + 1}`);
        }

        // Clean category
        cleaned.category = this.cleanText(row.category || 'Unknown');

        // Clean and validate prices
        cleaned.discountedPrice = this.cleanPrice(row.discountedPrice);
        cleaned.actualPrice = this.cleanPrice(row.actualPrice);
        
        if (options.validatePrices) {
          if (cleaned.discountedPrice <= 0 || cleaned.actualPrice <= 0) {
            throw new Error(`Invalid prices at row ${index + 1}`);
          }
          if (cleaned.discountedPrice > cleaned.actualPrice) {
            // Swap if discounted price is higher than actual price
            [cleaned.discountedPrice, cleaned.actualPrice] = [cleaned.actualPrice, cleaned.discountedPrice];
          }
        }

        // Calculate discount percentage
        cleaned.discountPercentage = cleaned.actualPrice > 0 
          ? ((cleaned.actualPrice - cleaned.discountedPrice) / cleaned.actualPrice) * 100
          : 0;

        // Clean rating
        cleaned.rating = this.cleanRating(row.rating);
        cleaned.ratingCount = this.cleanNumber(row.ratingCount) || 0;

        // Clean optional fields
        cleaned.about = this.cleanText(row.about || '');
        cleaned.userId = String(row.userId || '').trim();
        cleaned.userName = this.cleanText(row.userName || '');
        cleaned.userReview = this.cleanText(row.userReview || '');
        cleaned.reviewTitle = this.cleanText(row.reviewTitle || '');
        cleaned.imgLink = this.cleanUrl(row.imgLink);
        cleaned.productLink = this.cleanUrl(row.productLink);
        cleaned.productId = String(row.productId || `product_${index + 1}`);

        // Initialize computed fields
        cleaned.priceRange = '';
        cleaned.meanRating = cleaned.rating;
        cleaned.productCount = 1;
        cleaned.averageRatingCount = cleaned.ratingCount;

        cleanedData.push(cleaned as CleanedProductData);
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error}`);
      }
    });

    return { data: cleanedData, errors };
  }

  /**
   * Fill missing values using various strategies
   */
  private static fillMissingValues(data: Partial<CleanedProductData>[]): Partial<CleanedProductData>[] {
    // Calculate means for numeric fields
    const numericFields = ['discountedPrice', 'actualPrice', 'rating', 'ratingCount', 'discountPercentage'];
    const means: Record<string, number> = {};
    
    numericFields.forEach(field => {
      const values = data
        .map(row => row[field as keyof CleanedProductData])
        .filter(val => typeof val === 'number' && !isNaN(val)) as number[];
      means[field] = values.length > 0 ? _.mean(values) : 0;
    });

    // Calculate mode for categorical fields
    const categoricalFields = ['category'];
    const modes: Record<string, string> = {};
    
    categoricalFields.forEach(field => {
      const values = data
        .map(row => row[field as keyof CleanedProductData])
        .filter(val => val && typeof val === 'string') as string[];
      const frequency = _.countBy(values);
      modes[field] = Object.keys(frequency).reduce((a, b) => 
        frequency[a] > frequency[b] ? a : b
      ) || 'Unknown';
    });

    // Fill missing values
    return data.map(row => {
      const filled = { ...row };
      
      // Fill numeric fields with mean
      numericFields.forEach(field => {
        if (filled[field as keyof CleanedProductData] == null || 
            isNaN(filled[field as keyof CleanedProductData] as number)) {
          (filled as any)[field] = means[field];
        }
      });

      // Fill categorical fields with mode
      categoricalFields.forEach(field => {
        if (!filled[field as keyof CleanedProductData]) {
          (filled as any)[field] = modes[field];
        }
      });

      return filled;
    });
  }

  /**
   * Remove outliers using IQR method
   */
  private static removeOutliers(data: CleanedProductData[]): { 
    data: CleanedProductData[]; 
    removedCount: number 
  } {
    const numericFields = ['discountedPrice', 'actualPrice', 'rating'];
    const outlierIndices = new Set<number>();

    numericFields.forEach(field => {
      const values = data.map(row => row[field as keyof CleanedProductData] as number);
      const sorted = values.slice().sort((a, b) => a - b);
      
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      values.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
          outlierIndices.add(index);
        }
      });
    });

    const filteredData = data.filter((_, index) => !outlierIndices.has(index));
    
    return {
      data: filteredData,
      removedCount: outlierIndices.size,
    };
  }

  /**
   * Calculate derived features
   */
  private static calculateFeatures(data: CleanedProductData[]): CleanedProductData[] {
    return data.map(row => {
      // Calculate price range
      row.priceRange = this.getPriceRange(row.discountedPrice);
      
      // For now, mean rating is same as rating (will be updated during aggregation)
      row.meanRating = row.rating;
      
      // Product count for this specific product (will be aggregated later)
      row.productCount = 1;
      
      // Average rating count
      row.averageRatingCount = row.ratingCount;

      return row;
    });
  }

  /**
   * Validate cleaned data
   */
  private static validateData(data: CleanedProductData[]): CleanedProductData[] {
    return data.filter(row => {
      // Basic validation rules
      return (
        row.productName &&
        row.category &&
        row.discountedPrice > 0 &&
        row.actualPrice > 0 &&
        row.rating >= 0 && row.rating <= 5 &&
        row.ratingCount >= 0
      );
    });
  }

  // Utility methods
  private static cleanText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,!?()]/g, '')
      .substring(0, 1000); // Limit length
  }

  private static cleanPrice(price: any): number {
    if (typeof price === 'number') return Math.max(0, price);
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return 0;
  }

  private static cleanRating(rating: any): number {
    const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(5, num)); // Clamp between 0 and 5
  }

  private static cleanNumber(value: any): number {
    if (typeof value === 'number') return Math.max(0, value);
    const parsed = parseInt(String(value).replace(/[^0-9]/g, ''));
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  private static cleanUrl(url: any): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const cleaned = url.trim();
    try {
      new URL(cleaned);
      return cleaned;
    } catch {
      // If not a valid URL, return undefined
      return cleaned.startsWith('http') ? cleaned : undefined;
    }
  }

  private static getPriceRange(price: number): string {
    if (price < 500) return 'Low (< ₹500)';
    if (price < 1000) return 'Medium (₹500-1000)';
    if (price < 5000) return 'High (₹1000-5000)';
    return 'Premium (> ₹5000)';
  }

  /**
   * Remove duplicate records based on product ID
   */
  static removeDuplicates(data: CleanedProductData[]): {
    data: CleanedProductData[];
    duplicatesCount: number;
  } {
    const seen = new Map<string, CleanedProductData>();
    let duplicatesCount = 0;

    data.forEach(row => {
      const key = row.productId || `${row.productName}_${row.category}`;
      if (seen.has(key)) {
        duplicatesCount++;
        // Keep the one with higher rating or more recent data
        const existing = seen.get(key)!;
        if (row.rating > existing.rating || row.ratingCount > existing.ratingCount) {
          seen.set(key, row);
        }
      } else {
        seen.set(key, row);
      }
    });

    return {
      data: Array.from(seen.values()),
      duplicatesCount,
    };
  }

  /**
   * Generate data quality report for cleaned data
   */
  static getQualityReport(original: RawCSVData[], cleaned: CleanedProductData[]): {
    completeness: number;
    accuracy: number;
    consistency: number;
    uniqueness: number;
    summary: string;
  } {
    const completeness = (cleaned.length / original.length) * 100;
    
    // Check accuracy by validating constraints
    const accurateRecords = cleaned.filter(row => 
      row.rating >= 0 && row.rating <= 5 &&
      row.discountedPrice <= row.actualPrice &&
      row.discountPercentage >= 0 && row.discountPercentage <= 100
    ).length;
    const accuracy = (accurateRecords / cleaned.length) * 100;
    
    // Check consistency (standardized formats)
    const consistentRecords = cleaned.filter(row =>
      row.productName && row.productName.trim() !== '' &&
      row.category && row.category.trim() !== ''
    ).length;
    const consistency = (consistentRecords / cleaned.length) * 100;
    
    // Check uniqueness
    const uniqueProducts = new Set(cleaned.map(row => row.productId)).size;
    const uniqueness = (uniqueProducts / cleaned.length) * 100;

    const summary = `Data quality: ${Math.round((completeness + accuracy + consistency + uniqueness) / 4)}% overall. ` +
      `${cleaned.length} records processed from ${original.length} original records.`;

    return {
      completeness: Math.round(completeness),
      accuracy: Math.round(accuracy),
      consistency: Math.round(consistency),
      uniqueness: Math.round(uniqueness),
      summary,
    };
  }
}