import { NextRequest, NextResponse } from 'next/server';
import { SentimentAnalyzer } from '@/lib/ai/sentiment';
import { DatabaseQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'distribution';
    const category = searchParams.get('category');

    console.log(`😊 Fetching sentiment data: type=${type}, category=${category}`);

    const sentimentAnalyzer = new SentimentAnalyzer();
    let data;

    switch (type) {
      case 'distribution':
        data = await sentimentAnalyzer.getSentimentDistribution();
        break;
      case 'wordcloud':
        data = await sentimentAnalyzer.generateWordCloudData();
        break;
      case 'correlation':
        data = await sentimentAnalyzer.getSentimentRatingCorrelation();
        break;
      case 'by_category':
        const distribution = await sentimentAnalyzer.getSentimentDistribution();
        data = distribution.byCategory;
        break;
      default:
        data = await DatabaseQueries.getSentimentDistribution();
    }

    return NextResponse.json({
      success: true,
      data,
      type,
      category,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('😊 Sentiment API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}

// Run sentiment analysis on demand
export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json();

    console.log(`😊 Running sentiment analysis: force=${force}`);

    const sentimentAnalyzer = new SentimentAnalyzer();
    const result = await sentimentAnalyzer.analyzeProductReviews();

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        updated: result.updated,
        errors: result.errors,
        completedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('😊 Sentiment analysis error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to run sentiment analysis' },
      { status: 500 }
    );
  }
}