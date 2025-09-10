// src/lib/ai/langchain-agent.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db/prisma';
import { DatabaseQueries } from '@/lib/db/queries';
import { AIInsight, AgentResponse } from '@/types';

/**
 * LangChain-powered AI agent for data insights and analysis
 */
export class LangChainAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
  }

  /**
   * Process natural language queries about the data
   */
  async processQuery(query: string, context?: any): Promise<AgentResponse> {
    try {
      // Determine query type and generate appropriate response
      const queryType = this.classifyQuery(query);
      let response = '';
      let confidence = 0.8;
      const sources: string[] = [];
      let reasoning = '';

      switch (queryType) {
        case 'product_analysis':
          response = await this.handleProductAnalysisQuery(query);
          sources.push('product_database');
          reasoning = 'Analyzed product data from database';
          break;

        case 'category_insights':
          response = await this.handleCategoryInsightsQuery(query);
          sources.push('category_insights');
          reasoning = 'Generated insights from category analysis';
          break;

        case 'trend_analysis':
          response = await this.handleTrendAnalysisQuery(query);
          sources.push('trend_data');
          reasoning = 'Analyzed historical trend patterns';
          break;

        case 'recommendation':
          response = await this.handleRecommendationQuery(query);
          sources.push('recommendation_engine');
          reasoning = 'Used collaborative filtering and content-based recommendations';
          break;

        case 'correlation_analysis':
          response = await this.handleCorrelationQuery(query);
          sources.push('statistical_analysis');
          reasoning = 'Performed statistical correlation analysis';
          break;

        default:
          response = await this.handleGeneralQuery(query, context);
          sources.push('ai_analysis');
          reasoning = 'Generated response using AI model';
          confidence = 0.6;
      }

      return {
        response,
        confidence,
        sources,
        reasoning,
        actionType: this.getActionType(queryType),
      };
    } catch (error) {
      throw new Error(`Query processing failed: ${error}`);
    }
  }

  /**
   * Generate comprehensive insights about the dataset
   */
  async generateInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Get data for analysis
      const [
        topProducts,
        categoryInsights,
        correlationData,
        sentimentData,
        descriptiveStats,
      ] = await Promise.all([
        DatabaseQueries.getTopRatedProducts(10),
        DatabaseQueries.getCategoryInsights(),
        DatabaseQueries.getCorrelationData(),
        DatabaseQueries.getSentimentDistribution(),
        DatabaseQueries.getDescriptiveStatistics(),
      ]);

      // Generate trend insights
      const trendInsight = await this.generateTrendInsight(topProducts, categoryInsights);
      insights.push(trendInsight);

      // Generate correlation insights
      const correlationInsight = await this.generateCorrelationInsight(correlationData);
      insights.push(correlationInsight);

      // Generate sentiment insights
      const sentimentInsight = await this.generateSentimentInsight(sentimentData);
      insights.push(sentimentInsight);

      // Generate category performance insights
      const categoryInsight = await this.generateCategoryInsight(categoryInsights);
      insights.push(categoryInsight);

      // Generate pricing insights
      const pricingInsight = await this.generatePricingInsight(descriptiveStats);
      insights.push(pricingInsight);

      // Store insights in database
      for (const insight of insights) {
        await prisma.aIInsight.create({
          data: {
            insightType: insight.type,
            title: insight.title,
            description: insight.description,
            data: insight.data,
            confidence: insight.confidence,
          },
        });
      }

      return insights;
    } catch (error) {
      throw new Error(`Insight generation failed: ${error}`);
    }
  }

  /**
   * Classify the type of query
   */
  private classifyQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('product') && (lowerQuery.includes('top') || lowerQuery.includes('best'))) {
      return 'product_analysis';
    }
    if (lowerQuery.includes('category') || lowerQuery.includes('categories')) {
      return 'category_insights';
    }
    if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('growth')) {
      return 'trend_analysis';
    }
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('similar')) {
      return 'recommendation';
    }
    if (lowerQuery.includes('correlation') || lowerQuery.includes('relationship') || lowerQuery.includes('related')) {
      return 'correlation_analysis';
    }
    
    return 'general';
  }

  /**
   * Handle product analysis queries
   */
  private async handleProductAnalysisQuery(query: string): Promise<string> {
    const topProducts = await DatabaseQueries.getTopRatedProducts(10);
    const leastRated = await DatabaseQueries.getLeastRatedProducts(5);

    const prompt = `
    Based on the following product data, answer the user's query: "${query}"
    
    Top Rated Products:
    ${topProducts.map(p => `- ${p.productName} (${p.category}): Rating ${p.rating}/5, Price ₹${p.price}`).join('\n')}
    
    Least Rated Products:
    ${leastRated.map(p => `- ${p.productName} (${p.category}): Rating ${p.rating}/5, Price ₹${p.price}`).join('\n')}
    
    Provide insights and answer the user's question in a helpful, analytical way.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Handle category insights queries
   */
  private async handleCategoryInsightsQuery(query: string): Promise<string> {
    const categoryInsights = await DatabaseQueries.getCategoryInsights();
    const topCategories = await DatabaseQueries.getTopCategoriesByProductCount(10);

    const prompt = `
    Based on the following category data, answer the user's query: "${query}"
    
    Category Insights:
    ${categoryInsights.map(c => `- ${c.category}: ${c.totalProducts} products, Avg Rating: ${c.averageRating.toFixed(2)}, Avg Price: ₹${c.averagePrice.toFixed(2)}`).join('\n')}
    
    Top Categories by Product Count:
    ${topCategories.map(c => `- ${c.category}: ${c.productCount} products, Avg Rating: ${c.averageRating.toFixed(2)}`).join('\n')}
    
    Analyze the category performance and provide meaningful insights.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Handle trend analysis queries
   */
  private async handleTrendAnalysisQuery(query: string): Promise<string> {
    const priceRangeDistribution = await DatabaseQueries.getPriceRangeDistribution();
    const averageRatingsByCategory = await DatabaseQueries.getAverageRatingsByCategory();

    const prompt = `
    Based on the following trend data, answer the user's query: "${query}"
    
    Price Range Distribution:
    ${priceRangeDistribution.map(p => `- ${p.range}: ${p.count} products (${p.percentage.toFixed(1)}%), Avg Rating: ${p.averageRating.toFixed(2)}`).join('\n')}
    
    Category Performance Trends:
    ${averageRatingsByCategory.slice(0, 10).map(c => `- ${c.category}: Avg Rating ${c.averageRating.toFixed(2)}, ${c.productCount} products`).join('\n')}
    
    Identify trends, patterns, and insights from this data.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Handle recommendation queries
   */
  private async handleRecommendationQuery(query: string): Promise<string> {
    const topProducts = await DatabaseQueries.getTopRatedProducts(20);
    const categoryInsights = await DatabaseQueries.getCategoryInsights();

    const prompt = `
    Based on the following product and category data, provide recommendations for: "${query}"
    
    Available High-Quality Products:
    ${topProducts.map(p => `- ${p.productName} (${p.category}): Rating ${p.rating}/5, Price ₹${p.price}, ${p.ratingCount} reviews`).join('\n')}
    
    Category Performance:
    ${categoryInsights.slice(0, 5).map(c => `- ${c.category}: Avg Rating ${c.averageRating.toFixed(2)}, ${c.totalProducts} products`).join('\n')}
    
    Provide personalized recommendations with reasoning.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Handle correlation analysis queries
   */
  private async handleCorrelationQuery(query: string): Promise<string> {
    const correlationData = await DatabaseQueries.getCorrelationData();
    const descriptiveStats = await DatabaseQueries.getDescriptiveStatistics();

    const prompt = `
    Based on the following statistical data, answer the correlation query: "${query}"
    
    Correlation Analysis:
    ${correlationData.map(c => `- ${c.variable1} vs ${c.variable2}: ${c.correlation.toFixed(3)} (${c.significance} significance)`).join('\n')}
    
    Descriptive Statistics:
    ${Object.entries(descriptiveStats).map(([key, stats]: [string, any]) => 
      stats ? `- ${key}: Mean ${stats.mean}, Median ${stats.median}, StdDev ${stats.standardDeviation}` : ''
    ).filter(Boolean).join('\n')}
    
    Explain the relationships and their business implications.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(query: string, context?: any): Promise<string> {
    const prompt = `
    You are an AI analyst for an e-commerce data analytics platform. 
    Answer the following query based on your knowledge and the provided context: "${query}"
    
    Context: ${context ? JSON.stringify(context, null, 2) : 'No specific context provided'}
    
    Provide a helpful, analytical response.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Generate trend insights
   */
  private async generateTrendInsight(topProducts: any[], categoryInsights: any[]): Promise<AIInsight> {
    const dominantCategories = categoryInsights.slice(0, 3);
    const avgRating = topProducts.reduce((sum, p) => sum + p.rating, 0) / topProducts.length;

    const prompt = `
    Analyze the following data and generate a trend insight:
    
    Top performing categories: ${dominantCategories.map(c => c.category).join(', ')}
    Average rating of top products: ${avgRating.toFixed(2)}
    Total categories analyzed: ${categoryInsights.length}
    
    Generate a concise trend insight (2-3 sentences) focusing on market patterns.
    `;

    const result = await this.model.generateContent(prompt);
    const description = result.response.text();

    return {
      id: `trend_${Date.now()}`,
      type: 'trend',
      title: 'Market Performance Trends',
      description,
      confidence: 0.85,
      data: {
        dominantCategories,
        averageRating: avgRating,
        totalCategories: categoryInsights.length,
      },
      createdAt: new Date(),
      actionable: true,
      priority: 'high',
    };
  }

  /**
   * Generate correlation insights
   */
  private async generateCorrelationInsight(correlationData: any[]): Promise<AIInsight> {
    const strongCorrelations = correlationData.filter(c => Math.abs(c.correlation) > 0.5);
    
    const prompt = `
    Analyze these correlation findings and generate an insight:
    
    Strong correlations found: ${strongCorrelations.length}
    Key correlations: ${strongCorrelations.map(c => `${c.variable1}-${c.variable2}: ${c.correlation.toFixed(3)}`).join(', ')}
    
    Generate a business insight about these correlations (2-3 sentences).
    `;

    const result = await this.model.generateContent(prompt);
    const description = result.response.text();

    return {
      id: `correlation_${Date.now()}`,
      type: 'correlation',
      title: 'Statistical Relationships',
      description,
      confidence: 0.9,
      data: {
        strongCorrelations,
        totalCorrelations: correlationData.length,
      },
      createdAt: new Date(),
      actionable: true,
      priority: 'medium',
    };
  }

  /**
   * Generate sentiment insights
   */
  private async generateSentimentInsight(sentimentData: any): Promise<AIInsight> {
    const positivePercentage = (sentimentData.positive / sentimentData.totalReviews) * 100;
    const negativePercentage = (sentimentData.negative / sentimentData.totalReviews) * 100;

    const prompt = `
    Analyze this sentiment data and generate an insight:
    
    Positive reviews: ${sentimentData.positive} (${positivePercentage.toFixed(1)}%)
    Negative reviews: ${sentimentData.negative} (${negativePercentage.toFixed(1)}%)
    Neutral reviews: ${sentimentData.neutral}
    Total reviews: ${sentimentData.totalReviews}
    
    Generate a customer satisfaction insight (2-3 sentences).
    `;

    const result = await this.model.generateContent(prompt);
    const description = result.response.text();

    return {
      id: `sentiment_${Date.now()}`,
      type: 'sentiment',
      title: 'Customer Sentiment Analysis',
      description,
      confidence: 0.8,
      data: {
        distribution: sentimentData,
        positivePercentage,
        negativePercentage,
      },
      createdAt: new Date(),
      actionable: true,
      priority: 'high',
    };
  }

  /**
   * Generate category insights
   */
  private async generateCategoryInsight(categoryInsights: any[]): Promise<AIInsight> {
    const topPerformer = categoryInsights.reduce((best, current) => 
      current.averageRating > best.averageRating ? current : best
    );

    const prompt = `
    Analyze category performance and generate an insight:
    
    Best performing category: ${topPerformer.category} (${topPerformer.averageRating.toFixed(2)} avg rating)
    Total categories: ${categoryInsights.length}
    Category with most products: ${categoryInsights[0]?.category}
    
    Generate a category performance insight (2-3 sentences).
    `;

    const result = await this.model.generateContent(prompt);
    const description = result.response.text();

    return {
      id: `category_${Date.now()}`,
      type: 'trend',
      title: 'Category Performance Analysis',
      description,
      confidence: 0.85,
      data: {
        topPerformer,
        totalCategories: categoryInsights.length,
        topByVolume: categoryInsights[0],
      },
      createdAt: new Date(),
      actionable: true,
      priority: 'medium',
    };
  }

  /**
   * Generate pricing insights
   */
  private async generatePricingInsight(descriptiveStats: any): Promise<AIInsight> {
    const priceStats = descriptiveStats.discountedPrice;
    const ratingStats = descriptiveStats.rating;

    const prompt = `
    Analyze pricing patterns and generate an insight:
    
    Average price: ₹${priceStats?.mean || 0}
    Price range: ₹${priceStats?.min || 0} - ₹${priceStats?.max || 0}
    Average rating: ${ratingStats?.mean || 0}/5
    
    Generate a pricing strategy insight (2-3 sentences).
    `;

    const result = await this.model.generateContent(prompt);
    const description = result.response.text();

    return {
      id: `pricing_${Date.now()}`,
      type: 'trend',
      title: 'Pricing Strategy Analysis',
      description,
      confidence: 0.75,
      data: {
        priceStats,
        ratingStats,
      },
      createdAt: new Date(),
      actionable: true,
      priority: 'medium',
    };
  }

  /**
   * Get action type based on query classification
   */
  private getActionType(queryType: string): 'query' | 'analysis' | 'recommendation' {
    if (queryType === 'recommendation') return 'recommendation';
    if (queryType.includes('analysis') || queryType.includes('correlation')) return 'analysis';
    return 'query';
  }

  /**
   * Get recent insights from database
   */
  async getRecentInsights(limit: number = 10): Promise<AIInsight[]> {
    const insights = await prisma.aIInsight.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return insights.map(insight => ({
      id: insight.id,
      type: insight.insightType as any,
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      data: insight.data,
      createdAt: insight.createdAt,
      actionable: true, // Default value
      priority: insight.confidence > 0.8 ? 'high' : insight.confidence > 0.6 ? 'medium' : 'low',
    }));
  }

  /**
   * Clean up old insights
   */
  async cleanupOldInsights(retainDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retainDays);

    await prisma.aIInsight.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
  }
}