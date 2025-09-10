import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '5');

    console.log(`🧠 Fetching insights: type=${type}, limit=${limit}`);

    let insights;

    switch (type) {
      case 'recent':
        insights = await getRecentInsights(limit);
        break;
      case 'trending':
        insights = await getTrendingInsights(limit);
        break;
      case 'top_products':
        insights = await getTopProductInsights(limit);
        break;
      case 'category':
        insights = await getCategoryInsights(limit);
        break;
      default:
        insights = await getRecentInsights(limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        insights: insights,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Insights API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate insights',
        data: { insights: [] }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🤖 Processing AI query: ${query}`);

    // Process the natural language query and generate response
    const response = await processAIQuery(query);

    return NextResponse.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI Query Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process query',
        data: { response: 'Sorry, I encountered an error processing your request.' }
      },
      { status: 500 }
    );
  }
}

// Helper functions to generate different types of insights
async function getRecentInsights(limit: number) {
  try {
    const insights = [];
    
    // Check if there's any data in the database first
    const productCount = await prisma.product.count();
    
    if (productCount === 0) {
      return [{
        id: '1',
        title: 'No Data Available',
        description: 'Upload some product data to start generating AI insights.',
        type: 'info',
        timestamp: new Date().toISOString(),
        priority: 'low',
        confidence: 1.0
      }];
    }

    // Insight 1: Overall product statistics
    const [totalProducts, avgRating, avgPrice, topCategory] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({
        where: { rating: { not: null } },
        _avg: { rating: true }
      }),
      prisma.product.aggregate({
        where: { actualPrice: { not: null } },
        _avg: { actualPrice: true }
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: true,
        orderBy: { _count: { category: 'desc' } },
        take: 1
      })
    ]);

    insights.push({
      id: '1',
      title: 'Product Overview',
      description: `Your dataset contains ${totalProducts} products with an average rating of ${(avgRating._avg.rating || 0).toFixed(1)}/5 and average price of ₹${(avgPrice._avg.actualPrice || 0).toFixed(2)}.`,
      type: 'overview',
      timestamp: new Date().toISOString(),
      priority: 'high',
      confidence: 0.95
    });

    // Insight 2: Top performing category
    if (topCategory.length > 0) {
      insights.push({
        id: '2',
        title: 'Top Category',
        description: `The "${topCategory[0].category}" category has the most products (${topCategory[0]._count} items) in your dataset.`,
        type: 'category',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        confidence: 0.90
      });
    }

    // Insight 3: Sentiment analysis overview
    const sentimentStats = await prisma.product.groupBy({
      by: ['sentimentLabel'],
      where: { sentimentLabel: { not: null } },
      _count: true
    });

    if (sentimentStats.length > 0) {
      const positive = sentimentStats.find(s => s.sentimentLabel === 'positive')?._count || 0;
      const negative = sentimentStats.find(s => s.sentimentLabel === 'negative')?._count || 0;
      const total = sentimentStats.reduce((sum, s) => sum + s._count, 0);
      
      if (total > 0) {
        const positivePercentage = ((positive / total) * 100).toFixed(1);
        insights.push({
          id: '3',
          title: 'Sentiment Analysis',
          description: `${positivePercentage}% of products have positive reviews, indicating strong customer satisfaction overall.`,
          type: 'sentiment',
          timestamp: new Date().toISOString(),
          priority: 'medium',
          confidence: total > 100 ? 0.85 : 0.70
        });
      }
    }

    // Insight 4: Price range analysis
    const priceStats = await prisma.product.findMany({
      where: { actualPrice: { not: null } },
      select: { actualPrice: true }
    });

    if (priceStats.length > 0) {
      const prices = priceStats.map(p => p.actualPrice!);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      insights.push({
        id: '4',
        title: 'Price Range Analysis',
        description: `Product prices range from ₹${minPrice.toFixed(2)} to ₹${maxPrice.toFixed(2)}, showing ${maxPrice > minPrice * 10 ? 'significant' : 'moderate'} price diversity.`,
        type: 'pricing',
        timestamp: new Date().toISOString(),
        priority: 'low',
        confidence: 0.80
      });
    }

    // Insight 5: Top rated products
    const topRatedProducts = await prisma.product.findMany({
      where: { 
        rating: { gte: 4.5 },
        productName: { not: null }
      },
      select: { productName: true, rating: true },
      orderBy: { rating: 'desc' },
      take: 1
    });

    if (topRatedProducts.length > 0) {
      insights.push({
        id: '5',
        title: 'Top Performer',
        description: `"${topRatedProducts[0].productName}" leads with a ${topRatedProducts[0].rating}/5 rating - consider featuring similar high-quality products.`,
        type: 'recommendation',
        timestamp: new Date().toISOString(),
        priority: 'high',
        confidence: 0.92
      });
    }

    return insights.slice(0, limit);

  } catch (error) {
    console.error('Error generating recent insights:', error);
    return [{
      id: 'error',
      title: 'Error',
      description: 'Unable to generate insights at this time. Please try again later.',
      type: 'error',
      timestamp: new Date().toISOString(),
      priority: 'high',
      confidence: 0.0
    }];
  }
}

async function getTrendingInsights(limit: number) {
  // Implementation for trending insights
  return await getRecentInsights(limit); // Fallback for now
}

async function getTopProductInsights(limit: number) {
  // Implementation for top product insights
  return await getRecentInsights(limit); // Fallback for now
}

async function getCategoryInsights(limit: number) {
  // Implementation for category-specific insights
  return await getRecentInsights(limit); // Fallback for now
}

async function processAIQuery(query: string) {
  try {
    const lowerQuery = query.toLowerCase().trim();
    
    // Enhanced pattern matching for more comprehensive responses
    
    // Buying recommendations queries
    if (lowerQuery.includes('buy') || lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || 
        lowerQuery.includes('what should i') || lowerQuery.includes('should i buy') ||
        lowerQuery.includes('best product') || lowerQuery.includes('purchase')) {
      return await getBuyingRecommendationsResponse();
    }
    
    // Top products queries
    if ((lowerQuery.includes('top') && (lowerQuery.includes('product') || lowerQuery.includes('item'))) ||
        lowerQuery.includes('best rated') || lowerQuery.includes('highest rated') ||
        lowerQuery.includes('top-rated') || lowerQuery.includes('best performing')) {
      return await getTopProductsResponse();
    }
    
    // Category analysis queries
    if (lowerQuery.includes('category') || lowerQuery.includes('categories') ||
        lowerQuery.includes('category performance') || lowerQuery.includes('compare categories') ||
        (lowerQuery.includes('how') && lowerQuery.includes('categories')) ||
        lowerQuery.includes('category analysis')) {
      return await getCategoriesResponse();
    }
    
    // Pricing queries
    if (lowerQuery.includes('price') || lowerQuery.includes('pricing') || lowerQuery.includes('cost') ||
        lowerQuery.includes('pricing distribution') || lowerQuery.includes('price range') ||
        lowerQuery.includes('pricing analysis') || lowerQuery.includes('pricing strategies') ||
        lowerQuery.includes('review pricing') || lowerQuery.includes('pricing distribution')) {
      return await getPricingResponse();
    }
    
    // Rating analysis queries
    if (lowerQuery.includes('rating') || lowerQuery.includes('review') || lowerQuery.includes('rated') ||
        lowerQuery.includes('customer satisfaction') || lowerQuery.includes('rating analysis') ||
        lowerQuery.includes('review analysis')) {
      return await getRatingResponse();
    }
    
    // Sentiment analysis queries
    if (lowerQuery.includes('sentiment') || lowerQuery.includes('feeling') || lowerQuery.includes('mood') ||
        lowerQuery.includes('customer sentiment') || lowerQuery.includes('sentiment analysis') ||
        lowerQuery.includes('positive') || lowerQuery.includes('negative')) {
      return await getSentimentResponse();
    }
    
    // Insights and trends queries
    if (lowerQuery.includes('insight') || lowerQuery.includes('trend') || lowerQuery.includes('pattern') ||
        lowerQuery.includes('actionable') || lowerQuery.includes('business decision') ||
        lowerQuery.includes('focus on') || lowerQuery.includes('should focus') ||
        lowerQuery.includes('trending') || lowerQuery.includes('what should i focus')) {
      return await getActionableInsightsResponse();
    }
    
    // General help or overview queries
    if (lowerQuery.includes('overview') || lowerQuery.includes('summary') || lowerQuery.includes('general') ||
        lowerQuery.includes('dataset') || lowerQuery.includes('data') || lowerQuery.includes('help') ||
        lowerQuery.length < 10) {
      return await getGeneralStatsResponse();
    }
    
    // Default response with general statistics for unmatched queries
    return await getGeneralStatsResponse();
    
  } catch (error) {
    console.error('Error processing AI query:', error);
    return 'I apologize, but I encountered an error while analyzing your data. Please try asking a different question or check if your data has been uploaded successfully.';
  }
}

async function getTopProductsResponse() {
  const topProducts = await prisma.product.findMany({
    where: { 
      rating: { not: null },
      productName: { not: null }
    },
    select: { productName: true, rating: true, actualPrice: true },
    orderBy: [
      { rating: 'desc' },
      { ratingCount: 'desc' }
    ],
    take: 5
  });
  
  if (topProducts.length === 0) {
    return "I don't see any product data yet. Please upload your product dataset first to get insights about top-performing products.";
  }
  
  let response = "## 📊 Top-Rated Products\n\n";
  topProducts.forEach((product, index) => {
    response += `**${index + 1}.** **${product.productName}**\n`;
    response += `   ⭐ ${product.rating}/5 rating`;
    if (product.actualPrice) {
      response += ` • 💰 ₹${product.actualPrice.toFixed(2)}`;
    }
    response += "\n\n";
  });
  
  return response;
}

async function getBuyingRecommendationsResponse() {
  // Get products with high ratings and good value
  const recommendations = await prisma.product.findMany({
    where: { 
      rating: { gte: 4.0 },
      actualPrice: { not: null },
      ratingCount: { gte: 10 } // Ensure sufficient reviews
    },
    select: { 
      productName: true, 
      rating: true, 
      actualPrice: true, 
      ratingCount: true,
      category: true,
      discountPercentage: true
    },
    orderBy: [
      { rating: 'desc' },
      { ratingCount: 'desc' },
      { discountPercentage: 'desc' }
    ],
    take: 5
  });
  
  if (recommendations.length === 0) {
    return "## 🛍️ No Recommendations Available\n\nI couldn't find products with sufficient ratings to make solid recommendations. Please ensure your dataset has products with ratings and review counts.";
  }
  
  let response = "## 🛍️ My Top Buying Recommendations\n\n";
  response += "*Based on high ratings, customer feedback, and value analysis:*\n\n";
  
  recommendations.forEach((product, index) => {
    response += `### ${index + 1}. ${product.productName}\n`;
    response += `- ⭐ **${product.rating}/5** rating (${product.ratingCount} reviews)\n`;
    response += `- 💰 **₹${product.actualPrice!.toFixed(2)}**`;
    if (product.discountPercentage && product.discountPercentage > 0) {
      response += ` *(${product.discountPercentage}% off!)*`;
    }
    response += `\n- 📂 Category: **${product.category}**\n\n`;
  });
  
  response += "### 🎯 Why These Recommendations?\n";
  response += "- ✅ **High customer satisfaction** (4+ star ratings)\n";
  response += "- ✅ **Proven track record** (10+ customer reviews)\n";
  response += "- ✅ **Great value** for the quality offered\n";
  
  return response;
}

async function getActionableInsightsResponse() {
  // Get comprehensive data for actionable insights
  const [totalProducts, categories, topProducts, priceStats, ratingStats] = await Promise.all([
    prisma.product.count(),
    prisma.product.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: true,
      _avg: { rating: true, actualPrice: true },
      orderBy: { _count: { category: 'desc' } },
      take: 3
    }),
    prisma.product.findMany({
      where: { rating: { gte: 4.5 } },
      select: { productName: true, rating: true, category: true },
      orderBy: { rating: 'desc' },
      take: 3
    }),
    prisma.product.aggregate({
      where: { actualPrice: { not: null } },
      _avg: { actualPrice: true },
      _min: { actualPrice: true },
      _max: { actualPrice: true }
    }),
    prisma.product.aggregate({
      where: { rating: { not: null } },
      _avg: { rating: true }
    })
  ]);

  if (totalProducts === 0) {
    return "I don't have enough data to provide actionable insights. Please upload your dataset first!";
  }

  let response = "## 🎯 Actionable Business Insights\n\n";
  response += "*Here are key insights and recommendations based on your data:*\n\n";

  // Category insights
  if (categories.length > 0) {
    const topCategory = categories[0];
    response += `### 📂 **Focus on "${topCategory.category}" Category**\n`;
    response += `- Your **largest category** with ${topCategory._count} products\n`;
    if (topCategory._avg.rating) {
      response += `- Average rating: **${topCategory._avg.rating.toFixed(1)}/5**\n`;
    }
    if (topCategory._avg.actualPrice) {
      response += `- Average price: **₹${topCategory._avg.actualPrice.toFixed(2)}**\n`;
    }
    response += `- **Action**: Expand inventory in this category as it's your core market\n\n`;
  }

  // Top performers insights
  if (topProducts.length > 0) {
    response += `### 🏆 **Promote Top Performers**\n`;
    topProducts.forEach((product, index) => {
      response += `${index + 1}. **${product.productName}** (${product.rating}/5) - ${product.category}\n`;
    });
    response += `- **Action**: Feature these products prominently in marketing\n`;
    response += `- **Action**: Use their success patterns for similar products\n\n`;
  }

  // Pricing insights
  if (priceStats._avg.actualPrice) {
    const avgPrice = priceStats._avg.actualPrice;
    const minPrice = priceStats._min.actualPrice || 0;
    const maxPrice = priceStats._max.actualPrice || 0;
    const priceRange = maxPrice - minPrice;
    
    response += `### 💰 **Pricing Strategy Recommendations**\n`;
    response += `- Current average: **₹${avgPrice.toFixed(2)}**\n`;
    response += `- Price spread: ₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}\n`;
    
    if (priceRange > avgPrice * 10) {
      response += `- **Action**: Consider creating distinct price tiers (Budget/Premium/Luxury)\n`;
      response += `- **Action**: Focus marketing on value proposition for each tier\n\n`;
    } else {
      response += `- **Action**: Your pricing is consistent - good for brand positioning\n`;
      response += `- **Action**: Consider premium variants for higher margins\n\n`;
    }
  }

  // Overall rating insights
  if (ratingStats._avg.rating) {
    const avgRating = ratingStats._avg.rating;
    response += `### ⭐ **Customer Satisfaction Actions**\n`;
    response += `- Overall rating: **${avgRating.toFixed(1)}/5**\n`;
    
    if (avgRating >= 4.5) {
      response += `- **Excellent!** Use high ratings in marketing campaigns\n`;
      response += `- **Action**: Implement referral programs to leverage satisfaction\n\n`;
    } else if (avgRating >= 4.0) {
      response += `- **Good performance** with room for improvement\n`;
      response += `- **Action**: Focus on improving lower-rated products\n`;
      response += `- **Action**: Gather feedback to understand pain points\n\n`;
    } else {
      response += `- **Priority**: Investigate and address quality issues\n`;
      response += `- **Action**: Review customer feedback for improvement areas\n\n`;
    }
  }

  response += `### 🚀 **Next Steps Priority List**\n`;
  response += `1. **Immediate**: Feature top-rated products in marketing\n`;
  response += `2. **Short-term**: Expand inventory in your strongest category\n`;
  response += `3. **Medium-term**: Develop pricing strategy based on data insights\n`;
  response += `4. **Ongoing**: Monitor ratings and address customer concerns\n\n`;
  
  response += `💡 **Pro Tip**: Review these insights monthly to track progress and adjust strategies!`;

  return response;
}

async function getCategoriesResponse() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: { category: { not: null } },
    _count: true,
    _avg: { rating: true, actualPrice: true },
    orderBy: { _count: { category: 'desc' } },
    take: 5
  });
  
  if (categories.length === 0) {
    return "No category data found. Please upload your product dataset to analyze categories.";
  }
  
  let response = "## 📂 Top Product Categories\n\n";
  categories.forEach((cat, index) => {
    response += `**${index + 1}.** **${cat.category}**\n`;
    response += `   📦 ${cat._count} products`;
    if (cat._avg.rating) {
      response += ` • ⭐ ${cat._avg.rating.toFixed(1)}/5`;
    }
    if (cat._avg.actualPrice) {
      response += ` • 💰 ₹${cat._avg.actualPrice.toFixed(2)} avg`;
    }
    response += "\n";
  });
  
  return response;
}

async function getPricingResponse() {
  const priceStats = await prisma.product.aggregate({
    where: { actualPrice: { not: null } },
    _avg: { actualPrice: true },
    _min: { actualPrice: true },
    _max: { actualPrice: true },
    _count: true
  });
  
  if (priceStats._count === 0) {
    return "No pricing data found. Please upload your product dataset to analyze pricing trends.";
  }
  
  return `## 💰 Pricing Analysis

**Average Price**: ₹${(priceStats._avg.actualPrice || 0).toFixed(2)}  
**Price Range**: ₹${(priceStats._min.actualPrice || 0).toFixed(2)} - ₹${(priceStats._max.actualPrice || 0).toFixed(2)}  
**Products Analyzed**: ${priceStats._count}

### 📈 Insights
${(priceStats._max.actualPrice || 0) > (priceStats._avg.actualPrice || 0) * 3 
  ? '🎯 You have a **wide price range**, suggesting diverse product tiers.' 
  : '📊 Your products have **relatively consistent pricing**.'}`;
}

async function getRatingResponse() {
  const ratingStats = await prisma.product.aggregate({
    where: { rating: { not: null } },
    _avg: { rating: true, ratingCount: true },
    _count: true
  });
  
  const highRatedCount = await prisma.product.count({
    where: { rating: { gte: 4.0 } }
  });
  
  if (ratingStats._count === 0) {
    return "No rating data found. Please upload your product dataset to analyze customer ratings.";
  }
  
  const highRatedPercentage = ((highRatedCount / ratingStats._count) * 100).toFixed(1);
  
  return `## ⭐ Rating Analysis

**Average Rating**: ${(ratingStats._avg.rating || 0).toFixed(1)}/5  
**Average Review Count**: ${Math.round(ratingStats._avg.ratingCount || 0)} per product  
**High-Rated Products** (4+ stars): **${highRatedPercentage}%** of your products

### 🎯 Recommendation
${highRatedCount > ratingStats._count * 0.7 
  ? '🌟 **Great news!** Most of your products have high customer satisfaction.' 
  : '📈 Consider focusing on improving products with lower ratings.'}`;
}

async function getSentimentResponse() {
  const sentimentStats = await prisma.product.groupBy({
    by: ['sentimentLabel'],
    where: { sentimentLabel: { not: null } },
    _count: true
  });
  
  if (sentimentStats.length === 0) {
    return "No sentiment analysis data found. The sentiment analysis might not have been run yet, or there's no review data available.";
  }
  
  const total = sentimentStats.reduce((sum, s) => sum + s._count, 0);
  let response = "## 💭 Sentiment Analysis Breakdown\n\n";
  
  sentimentStats.forEach(sentiment => {
    const percentage = ((sentiment._count / total) * 100).toFixed(1);
    const emoji = sentiment.sentimentLabel === 'positive' ? '😊' : 
                 sentiment.sentimentLabel === 'negative' ? '😞' : '😐';
    response += `${emoji} **${sentiment.sentimentLabel!.charAt(0).toUpperCase() + sentiment.sentimentLabel!.slice(1)}**: **${percentage}%** (${sentiment._count} products)\n\n`;
  });
  
  const positive = sentimentStats.find(s => s.sentimentLabel === 'positive')?._count || 0;
  const positivePercentage = (positive / total) * 100;
  
  response += `### 🎯 Insights\n${positivePercentage > 60 
    ? '🌟 **Excellent!** Your customers are generally satisfied with your products.' 
    : positivePercentage > 40 
      ? '⚖️ **Mixed sentiment** - there might be room for improvement in some areas.' 
      : '⚠️ Consider investigating why customers are expressing negative sentiment.'}`;
  
  return response;
}

async function getGeneralStatsResponse() {
  const stats = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({
      where: { rating: { not: null } },
      _avg: { rating: true }
    }),
    prisma.product.aggregate({
      where: { actualPrice: { not: null } },
      _avg: { actualPrice: true }
    })
  ]);
  
  const [totalProducts, avgRating, avgPrice] = stats;
  
  if (totalProducts === 0) {
    return "I don't see any data yet. Please upload your product dataset first, and I'll be happy to provide insights about your products, categories, pricing, ratings, and customer sentiment!";
  }
  
  return `## 📊 Dataset Overview

**Total Products**: ${totalProducts}  
**Average Rating**: ${(avgRating._avg.rating || 0).toFixed(1)}/5  
**Average Price**: ₹${(avgPrice._avg.actualPrice || 0).toFixed(2)}

### 🤔 What can I help you analyze?
- 🏆 **"What are my top-rated products?"**
- 📂 **"Show me category performance"**
- 💰 **"How's the pricing distribution?"**
- 💭 **"What's the sentiment analysis?"**
- 📈 **"Any trending insights?"**
- 🎯 **"What should I focus on?"**`;
}
