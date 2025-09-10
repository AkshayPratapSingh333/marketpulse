// src/lib/ai/sentiment.ts

import * as natural from 'natural';
import Sentiment from 'sentiment';
import { prisma } from '@/lib/db/prisma';
import { SentimentResult, WordCloudData } from '@/types';
import _ from 'lodash';

/**
 * Advanced sentiment analysis utilities
 */
export class SentimentAnalyzer {
  private sentiment: Sentiment;
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmer;

  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Analyze sentiment of a single text
   */
  analyzeSentiment(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        keywords: [],
      };
    }

    // Clean and preprocess text
    const cleanedText = this.preprocessText(text);
    
    // Get sentiment score using sentiment library
    const sentimentResult = this.sentiment.analyze(cleanedText);
    
    // Normalize score to -1 to 1 range
    const normalizedScore = this.normalizeScore(sentimentResult.score, text.length);
    
    // Determine label and confidence
    const label = this.getLabel(normalizedScore);
    const confidence = this.calculateConfidence(normalizedScore, sentimentResult.comparative);
    
    // Extract keywords
    const keywords = this.extractKeywords(cleanedText, label);

    return {
      score: Math.round(normalizedScore * 1000) / 1000, // 3 decimal places
      label,
      confidence: Math.round(confidence * 100) / 100,
      keywords,
    };
  }

  /**
   * Batch analyze sentiment for multiple texts
   */
  async batchAnalyzeSentiment(texts: { id: string; text: string; productId?: string }[]): Promise<{
    results: (SentimentResult & { id: string; productId?: string })[];
    summary: {
      positive: number;
      negative: number;
      neutral: number;
      averageScore: number;
    };
  }> {
    const results = texts.map(item => {
      const sentiment = this.analyzeSentiment(item.text);
      return {
        ...sentiment,
        id: item.id,
        productId: item.productId,
      };
    });

    // Calculate summary
    const summary = this.calculateSummary(results);

    return { results, summary };
  }

  /**
   * Analyze product reviews and update database
   */
  async analyzeProductReviews(): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    let processed = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Get products with reviews that haven't been analyzed
      const products = await prisma.product.findMany({
        where: {
          userReview: { not: null },
          sentimentScore: null, // Not yet analyzed
        },
        select: {
          id: true,
          productId: true,
          userReview: true,
          reviewTitle: true,
        },
        take: 1000, // Process in batches
      });

      for (const product of products) {
        try {
          processed++;
          
          const reviewText = `${product.reviewTitle || ''} ${product.userReview || ''}`.trim();
          
          if (reviewText.length > 0) {
            const sentimentResult = this.analyzeSentiment(reviewText);
            
            // Update product with sentiment data
            await prisma.product.update({
              where: { id: product.id },
              data: {
                sentimentScore: sentimentResult.score,
                sentimentLabel: sentimentResult.label,
              },
            });

            // Store detailed sentiment analysis
            await prisma.sentimentAnalysis.create({
              data: {
                productId: product.id,
                reviewText,
                sentimentScore: sentimentResult.score,
                sentimentLabel: sentimentResult.label,
                confidence: sentimentResult.confidence,
                keywords: sentimentResult.keywords || [],
              },
            });

            updated++;
          }
        } catch (error) {
          errors++;
          console.error(`Failed to analyze sentiment for product ${product.productId}:`, error);
        }
      }

      return { processed, updated, errors };
    } catch (error) {
      throw new Error(`Batch sentiment analysis failed: ${error}`);
    }
  }

  /**
   * Get sentiment distribution for visualization
   */
  async getSentimentDistribution(): Promise<{
    distribution: { positive: number; negative: number; neutral: number };
    byCategory: Record<string, { positive: number; negative: number; neutral: number }>;
    trends: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  }> {
    try {
      // Overall distribution
      const overall = await prisma.product.groupBy({
        by: ['sentimentLabel'],
        _count: { sentimentLabel: true },
        where: { sentimentLabel: { not: null } },
      });

      const distribution = {
        positive: 0,
        negative: 0,
        neutral: 0,
      };

      overall.forEach(item => {
        if (item.sentimentLabel) {
          distribution[item.sentimentLabel as keyof typeof distribution] = item._count.sentimentLabel;
        }
      });

      // By category
      const byCategory = await prisma.product.groupBy({
        by: ['category', 'sentimentLabel'],
        _count: { sentimentLabel: true },
        where: { 
          sentimentLabel: { not: null },
          category: { not: null },
        },
      });

      const categoryDistribution: Record<string, any> = {};
      byCategory.forEach(item => {
        const category = item.category || 'Unknown';
        const sentiment = item.sentimentLabel || 'neutral';
        
        if (!categoryDistribution[category]) {
          categoryDistribution[category] = { positive: 0, negative: 0, neutral: 0 };
        }
        
        categoryDistribution[category][sentiment] = item._count.sentimentLabel;
      });

      // Trends (by creation date)
      const trends = await prisma.product.groupBy({
        by: ['sentimentLabel'],
        _count: { sentimentLabel: true },
        where: { 
          sentimentLabel: { not: null },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      });

      const trendData = [{
        date: new Date().toISOString().split('T')[0],
        positive: trends.find(t => t.sentimentLabel === 'positive')?._count.sentimentLabel || 0,
        negative: trends.find(t => t.sentimentLabel === 'negative')?._count.sentimentLabel || 0,
        neutral: trends.find(t => t.sentimentLabel === 'neutral')?._count.sentimentLabel || 0,
      }];

      return {
        distribution,
        byCategory: categoryDistribution,
        trends: trendData,
      };
    } catch (error) {
      throw new Error(`Failed to get sentiment distribution: ${error}`);
    }
  }

  /**
   * Generate word cloud data from sentiment analysis
   */
  async generateWordCloudData(): Promise<WordCloudData[]> {
    try {
      const sentimentAnalyses = await prisma.sentimentAnalysis.findMany({
        select: {
          keywords: true,
          sentimentLabel: true,
        },
        where: {
          keywords: { not: null },
        },
      });

      // Collect all keywords with their sentiments
      const wordCounts: Record<string, { count: number; sentiments: string[] }> = {};

      sentimentAnalyses.forEach(analysis => {
        const keywords = analysis.keywords as string[] || [];
        const sentiment = analysis.sentimentLabel || 'neutral';

        keywords.forEach(keyword => {
          if (!wordCounts[keyword]) {
            wordCounts[keyword] = { count: 0, sentiments: [] };
          }
          wordCounts[keyword].count++;
          wordCounts[keyword].sentiments.push(sentiment);
        });
      });

      // Convert to word cloud format
      const wordCloudData: WordCloudData[] = Object.entries(wordCounts)
        .map(([word, data]) => {
          // Determine dominant sentiment
          const sentimentCounts = _.countBy(data.sentiments);
          const dominantSentiment = Object.keys(sentimentCounts).reduce((a, b) =>
            sentimentCounts[a] > sentimentCounts[b] ? a : b
          ) as 'positive' | 'negative' | 'neutral';

          return {
            text: word,
            value: data.count,
            sentiment: dominantSentiment,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 100); // Top 100 words

      return wordCloudData;
    } catch (error) {
      throw new Error(`Failed to generate word cloud data: ${error}`);
    }
  }

  /**
   * Get sentiment insights by product rating correlation
   */
  async getSentimentRatingCorrelation(): Promise<{
    correlation: number;
    insights: Array<{
      ratingRange: string;
      sentimentDistribution: { positive: number; negative: number; neutral: number };
      averageSentimentScore: number;
    }>;
  }> {
    try {
      const products = await prisma.product.findMany({
        where: {
          rating: { not: null },
          sentimentScore: { not: null },
        },
        select: {
          rating: true,
          sentimentScore: true,
          sentimentLabel: true,
        },
      });

      if (products.length === 0) {
        return {
          correlation: 0,
          insights: [],
        };
      }

      // Calculate correlation between rating and sentiment score
      const ratings = products.map(p => p.rating || 0);
      const sentimentScores = products.map(p => p.sentimentScore || 0);
      const correlation = this.calculateCorrelation(ratings, sentimentScores);

      // Group by rating ranges
      const ratingRanges = {
        '1-2': products.filter(p => (p.rating || 0) <= 2),
        '2-3': products.filter(p => (p.rating || 0) > 2 && (p.rating || 0) <= 3),
        '3-4': products.filter(p => (p.rating || 0) > 3 && (p.rating || 0) <= 4),
        '4-5': products.filter(p => (p.rating || 0) > 4),
      };

      const insights = Object.entries(ratingRanges).map(([range, rangeProducts]) => {
        const sentimentCounts = _.countBy(rangeProducts, 'sentimentLabel');
        const avgSentiment = rangeProducts.length > 0 
          ? _.mean(rangeProducts.map(p => p.sentimentScore || 0))
          : 0;

        return {
          ratingRange: range,
          sentimentDistribution: {
            positive: sentimentCounts.positive || 0,
            negative: sentimentCounts.negative || 0,
            neutral: sentimentCounts.neutral || 0,
          },
          averageSentimentScore: Math.round(avgSentiment * 1000) / 1000,
        };
      });

      return { correlation, insights };
    } catch (error) {
      throw new Error(`Failed to analyze sentiment-rating correlation: ${error}`);
    }
  }

  /**
   * Preprocess text for sentiment analysis
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize sentiment score
   */
  private normalizeScore(score: number, textLength: number): number {
    // Adjust score based on text length
    const lengthFactor = Math.min(textLength / 100, 1);
    const adjustedScore = score * lengthFactor;
    
    // Normalize to -1 to 1 range
    const maxScore = 10; // Estimated maximum score
    return Math.max(-1, Math.min(1, adjustedScore / maxScore));
  }

  /**
   * Get sentiment label from score
   */
  private getLabel(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(score: number, comparative: number): number {
    const absScore = Math.abs(score);
    const absComparative = Math.abs(comparative);
    
    // Higher absolute scores and comparative values indicate higher confidence
    const baseConfidence = Math.min(absScore * 2, 1);
    const comparativeBoost = Math.min(absComparative * 10, 0.3);
    
    return Math.min(baseConfidence + comparativeBoost, 1);
  }

  /**
   * Extract keywords based on sentiment
   */
  private extractKeywords(text: string, sentiment: string): string[] {
    const tokens = this.tokenizer.tokenize(text) || [];
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    ]);

    // Filter and stem tokens
    const keywords = tokens
      .filter(token => 
        token.length > 2 && 
        !stopWords.has(token.toLowerCase()) && 
        /^[a-zA-Z]+$/.test(token)
      )
      .map(token => this.stemmer.stem(token.toLowerCase()))
      .filter((token, index, array) => array.indexOf(token) === index) // Remove duplicates
      .slice(0, 10); // Top 10 keywords

    return keywords;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: SentimentResult[]): {
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
  } {
    const counts = _.countBy(results, 'label');
    const averageScore = results.length > 0 
      ? _.mean(results.map(r => r.score))
      : 0;

    return {
      positive: counts.positive || 0,
      negative: counts.negative || 0,
      neutral: counts.neutral || 0,
      averageScore: Math.round(averageScore * 1000) / 1000,
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = _.sum(x.slice(0, n));
    const sumY = _.sum(y.slice(0, n));
    const sumXY = _.sum(x.slice(0, n).map((xi, i) => xi * y[i]));
    const sumX2 = _.sum(x.slice(0, n).map(xi => xi * xi));
    const sumY2 = _.sum(y.slice(0, n).map(yi => yi * yi));

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
  }
}