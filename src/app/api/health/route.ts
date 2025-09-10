import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check AI service
    const aiStatus = process.env.GEMINI_API_KEY ? 'available' : 'not_configured';
    
    // Get system info
    const dbStats = await prisma.product.count();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        ai: aiStatus,
        etl: 'operational'
      },
      stats: {
        totalProducts: dbStats,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };

    return NextResponse.json(healthData);

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}