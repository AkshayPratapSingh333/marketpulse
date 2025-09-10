import { NextRequest, NextResponse } from 'next/server';
import { DatabaseQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`🔍 Searching products: query="${query}", category=${category}`);

    const filters = {
      category: category ?? undefined,
      minRating: minRating > 0 ? minRating : undefined,
      maxPrice: maxPrice < 999999 ? maxPrice : undefined,
      minPrice: minPrice > 0 ? minPrice : undefined,
      searchTerm: query || undefined,
    };

    const results = await DatabaseQueries.searchProducts(filters, limit);

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        filters,
        query,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('🔍 Search API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

// Advanced search with AI
export async function POST(request: NextRequest) {
  try {
    const { 
      naturalLanguageQuery,
      filters = {},
      limit = 20,
      includeRecommendations = false 
    } = await request.json();

    console.log(`🔍 AI-powered search: "${naturalLanguageQuery}"`);

    // For now, fall back to regular search
    // In production, you could use AI to parse the natural language query
    const results = await DatabaseQueries.searchProducts({
      searchTerm: naturalLanguageQuery,
      ...filters
    }, limit);

    let recommendations: any[] = [];
    if (includeRecommendations && results.length > 0) {
      // Get recommendations based on first result
      const firstResult = results[0];
      // This would integrate with your recommendation engine
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        recommendations,
        query: naturalLanguageQuery,
        filters,
        count: results.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('🔍 AI search error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to perform AI search' },
      { status: 500 }
    );
  }
}