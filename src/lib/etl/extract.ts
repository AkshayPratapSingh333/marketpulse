// src/lib/etl/extract.ts

import Papa from 'papaparse';
import { RawCSVData } from '@/types';

export interface ExtractOptions {
  delimiter?: string;
  encoding?: string;
  skipEmptyLines?: boolean;
  header?: boolean;
}

export interface ExtractResult {
  data: RawCSVData[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
  totalRecords: number;
}

/**
 * Extract data from CSV file
 */
export class DataExtractor {
  private static readonly DEFAULT_OPTIONS: ExtractOptions = {
    delimiter: ',',
    encoding: 'utf-8',
    skipEmptyLines: true,
    header: true,
  };

  /**
   * Extract data from a File object
   */
  static async extractFromFile(
    file: File,
    options: ExtractOptions = {}
  ): Promise<ExtractResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Convert File to text first (works in both browser and Node.js)
      const text = await file.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse<RawCSVData>(text, {
          ...config,
          dynamicTyping: true,
          skipEmptyLines: true,
          header: config.header,
          delimitersToGuess: [',', ';', '\t', '|'],
          complete: (results) => {
            resolve({
              data: results.data,
              errors: results.errors,
              meta: results.meta,
              totalRecords: results.data.length,
            });
          },
          error: (error: any) => {
            reject(new Error(`CSV parsing failed: ${error.message}`));
          },
        });
      });
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract data from raw CSV string
   */
  static async extractFromString(
    csvString: string,
    options: ExtractOptions = {}
  ): Promise<ExtractResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      try {
        const results = Papa.parse<RawCSVData>(csvString, {
          ...config,
          dynamicTyping: true,
          skipEmptyLines: true,
          header: config.header,
          delimitersToGuess: [',', ';', '\t', '|'],
        });

        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta,
          totalRecords: results.data.length,
        });
      } catch (error) {
        reject(new Error(`CSV parsing failed: ${error}`));
      }
    });
  }

  /**
   * Extract data from URL (for remote CSV files)
   */
  static async extractFromURL(
    url: string,
    options: ExtractOptions = {}
  ): Promise<ExtractResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      Papa.parse<RawCSVData>(url, {
        ...config,
        dynamicTyping: true,
        skipEmptyLines: true,
        header: config.header,
        download: true,
        delimitersToGuess: [',', ';', '\t', '|'],
        complete: (results) => {
          resolve({
            data: results.data,
            errors: results.errors,
            meta: results.meta,
            totalRecords: results.data.length,
          });
        },
        error: (error) => {
          reject(new Error(`CSV download/parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Validate CSV structure and detect column mappings
   */
  static detectColumnMapping(headers: string[]): Record<string, string> {
    const commonMappings: Record<string, string[]> = {
      productId: ['product_id', 'productid', 'id', 'pid'],
      productName: ['product_name', 'name', 'title', 'product'],
      category: ['category', 'cat', 'category_name'],
      discountedPrice: ['discounted_price', 'discount_price', 'sale_price', 'price'],
      actualPrice: ['actual_price', 'original_price', 'mrp', 'list_price'],
      discountPercentage: ['discount_percentage', 'discount', 'discount_percent'],
      rating: ['rating', 'avg_rating', 'rate', 'score'],
      ratingCount: ['rating_count', 'num_ratings', 'reviews_count', 'total_reviews'],
      about: ['about_product', 'description', 'about', 'product_description'],
      userId: ['user_id', 'userid', 'customer_id'],
      userName: ['user_name', 'username', 'customer_name', 'reviewer'],
      userReview: ['review_content', 'review', 'comment', 'user_review'],
      reviewTitle: ['review_title', 'title', 'review_header'],
      imgLink: ['img_link', 'image_url', 'image', 'photo'],
      productLink: ['product_link', 'url', 'link', 'product_url'],
    };

    const mapping: Record<string, string> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    Object.entries(commonMappings).forEach(([standardField, variants]) => {
      for (const variant of variants) {
        const matchIndex = normalizedHeaders.findIndex(h => 
          h === variant || h.includes(variant) || variant.includes(h)
        );
        if (matchIndex !== -1) {
          mapping[standardField] = headers[matchIndex];
          break;
        }
      }
    });

    return mapping;
  }

  /**
   * Get data quality report for extracted data
   */
  static getDataQualityReport(data: RawCSVData[]): {
    totalRecords: number;
    missingValues: Record<string, number>;
    duplicateRecords: number;
    emptyRecords: number;
    columnStats: Record<string, any>;
  } {
    if (!data.length) {
      return {
        totalRecords: 0,
        missingValues: {},
        duplicateRecords: 0,
        emptyRecords: 0,
        columnStats: {},
      };
    }

    const columns = Object.keys(data[0]);
    const missingValues: Record<string, number> = {};
    const columnStats: Record<string, any> = {};

    // Initialize missing values counter
    columns.forEach(col => {
      missingValues[col] = 0;
      columnStats[col] = {
        type: 'unknown',
        uniqueValues: new Set(),
        numericValues: [],
      };
    });

    // Analyze each record
    data.forEach(record => {
      columns.forEach(col => {
        const value = record[col];
        
        // Count missing values
        if (value === null || value === undefined || value === '' || value === 'N/A') {
          missingValues[col]++;
        } else {
          // Collect unique values
          columnStats[col].uniqueValues.add(value);
          
          // Collect numeric values
          const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
          if (!isNaN(numericValue)) {
            columnStats[col].numericValues.push(numericValue);
          }
        }
      });
    });

    // Determine column types and calculate stats
    Object.keys(columnStats).forEach(col => {
      const stats = columnStats[col];
      const uniqueCount = stats.uniqueValues.size;
      const numericCount = stats.numericValues.length;
      
      // Determine type
      if (numericCount > data.length * 0.8) {
        stats.type = 'numeric';
        if (stats.numericValues.length > 0) {
          stats.min = Math.min(...stats.numericValues);
          stats.max = Math.max(...stats.numericValues);
          stats.mean = stats.numericValues.reduce((a: number, b: number) => a + b, 0) / stats.numericValues.length;
        }
      } else if (uniqueCount < data.length * 0.1) {
        stats.type = 'categorical';
      } else {
        stats.type = 'text';
      }
      
      stats.uniqueCount = uniqueCount;
      delete stats.uniqueValues; // Remove Set for JSON serialization
    });

    // Count duplicates (simplified check based on product_id if available)
    let duplicateRecords = 0;
    if (data[0].product_id || data[0].productId) {
      const idField = data[0].product_id ? 'product_id' : 'productId';
      const ids = new Set();
      data.forEach(record => {
        const id = record[idField];
        if (id && ids.has(id)) {
          duplicateRecords++;
        } else if (id) {
          ids.add(id);
        }
      });
    }

    // Count empty records
    const emptyRecords = data.filter(record => 
      Object.values(record).every(value => 
        value === null || value === undefined || value === ''
      )
    ).length;

    return {
      totalRecords: data.length,
      missingValues,
      duplicateRecords,
      emptyRecords,
      columnStats,
    };
  }

  /**
   * Preview first few rows of data
   */
  static previewData(data: RawCSVData[], rows: number = 5): RawCSVData[] {
    return data.slice(0, rows);
  }

  /**
   * Get column information
   */
  static getColumnInfo(data: RawCSVData[]): Array<{
    name: string;
    type: string;
    sampleValues: any[];
    missingCount: number;
  }> {
    if (!data.length) return [];

    const columns = Object.keys(data[0]);
    const qualityReport = this.getDataQualityReport(data);

    return columns.map(col => ({
      name: col,
      type: qualityReport.columnStats[col]?.type || 'unknown',
      sampleValues: data.slice(0, 3).map(row => row[col]).filter(val => val !== null && val !== undefined),
      missingCount: qualityReport.missingValues[col] || 0,
    }));
  }
}