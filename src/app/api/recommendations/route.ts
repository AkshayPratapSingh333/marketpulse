import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/ai/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type') || 'hybrid';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Getting recommendations: productId=${productId}, type=${type}`);

    const recommendationEngine = new RecommendationEngine();
    
    // Try to get stored recommendations first
    let recommendations = await recommendationEngine.getStoredRecommendations(productId);
    
    if (recommendations.length === 0 || type !== 'stored') {
      // Generate new recommendations
      switch (type) {
        case 'similar':
          recommendations = await recommendationEngine.generateSimilarProductRecommendations(productId, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await recommendationEngine.generateHybridRecommendations({
            productId,
            limit,
          });
          break;
      }
      
      // Store the new recommendations
      if (recommendations.length > 0) {
        await recommendationEngine.storeRecommendations(productId, recommendations);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, limit),
        productId,
        type,
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('🎯 Recommendations API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// Generate bulk recommendations
export async function POST(request: NextRequest) {
  try {
    const { 
      type = 'top_rated', 
      category, 
      priceRange, 
      limit = 20,
      filters = {}
    } = await request.json();

    console.log(`🎯 Generating bulk recommendations: type=${type}`);

    const recommendationEngine = new RecommendationEngine();
    let recommendations: any[] = [];

    switch (type) {
      case 'top_rated':
        recommendations = await recommendationEngine.generateTopRatedRecommendations(category, limit);
        break;
      case 'trending':
        recommendations = await recommendationEngine.generateTrendingRecommendations(limit);
        break;
      case 'price_based':
        if (priceRange && Array.isArray(priceRange) && priceRange.length === 2) {
          recommendations = await recommendationEngine.generatePriceBasedRecommendations(
            priceRange[0], priceRange[1], category, limit
          );
        }
        break;
      case 'category':
        if (category) {
          recommendations = await recommendationEngine.generateCategoryRecommendations([category], [], limit);
        }
        break;
      default:
        recommendations = await recommendationEngine.generateTopRatedRecommendations(undefined, limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        type,
        category,
        priceRange,
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('🎯 Bulk recommendations error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
