// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { DataExtractor } from '@/lib/etl/extract';
import { DataTransformer } from '@/lib/etl/transform';
import { DataLoader } from '@/lib/etl/load';
import { SentimentAnalyzer } from '@/lib/ai/sentiment';
import { LangChainAgent } from '@/lib/ai/langchain-agent';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload CSV, XLS, or XLSX files.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Phase 1: Extract
    console.log('Starting data extraction...');
    const extractResult = await DataExtractor.extractFromFile(file);
    
    if (extractResult.errors.length > 0) {
      console.warn('Extraction warnings:', extractResult.errors);
    }

    if (extractResult.totalRecords === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in the uploaded file' },
        { status: 400 }
      );
    }

    // Auto-detect column mapping
    const headers = Object.keys(extractResult.data[0] || {});
    const columnMapping = DataExtractor.detectColumnMapping(headers);
    
    // Phase 2: Transform
    console.log('Starting data transformation...');
    const transformResult = await DataTransformer.transform(
      extractResult.data,
      columnMapping,
      {
        removeOutliers: true,
        fillMissingValues: true,
        normalizeText: true,
        validatePrices: true,
        calculateFeatures: true,
      }
    );

    if (transformResult.errors.length > 0) {
      console.warn('Transformation errors:', transformResult.errors);
    }

    // Remove duplicates
    const { data: deduplicatedData, duplicatesCount } = DataTransformer.removeDuplicates(transformResult.data);

    // Phase 3: Load
    console.log('Starting data loading...');
    const dataLoader = new DataLoader(prisma);
    const loadResult = await dataLoader.load(
      deduplicatedData,
      file.name,
      {
        batchSize: 100,
        upsert: true,
        skipDuplicates: true,
        generateInsights: true,
      }
    );

    console.log('Load result:', {
      success: loadResult.success,
      recordsLoaded: loadResult.recordsLoaded,
      recordsError: loadResult.recordsError,
      errors: loadResult.errors.slice(0, 5) // First 5 errors for debugging
    });

    if (!loadResult.success) {
      console.error('Database loading failed:', loadResult.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to load data into database',
          details: loadResult.errors.slice(0, 10) // First 10 errors
        },
        { status: 500 }
      );
    }

    // Phase 4: AI Analysis (async for performance)
    console.log('Starting AI analysis...');
    
    // Run sentiment analysis
    const sentimentAnalyzer = new SentimentAnalyzer();
    const sentimentResult = await sentimentAnalyzer.analyzeProductReviews();

    // Generate AI insights
    let insights: any[] = [];
    try {
      if (process.env.GEMINI_API_KEY) {
        const aiAgent = new LangChainAgent(process.env.GEMINI_API_KEY);
        insights = await aiAgent.generateInsights();
      }
    } catch (error) {
      console.warn('AI insights generation failed:', error);
    }

    // Get data quality report
    const qualityReport = DataTransformer.getQualityReport(
      extractResult.data,
      transformResult.data
    );

    // Prepare response
    const response = {
      success: true,
      data: {
        recordsProcessed: extractResult.totalRecords,
        recordsSuccess: loadResult.recordsLoaded,
        recordsError: loadResult.recordsError,
        recordsSkipped: loadResult.recordsSkipped,
        duplicatesRemoved: duplicatesCount,
        jobId: loadResult.jobId,
        duration: loadResult.duration,
        insights: insights.map(insight => ({
          title: insight.title,
          description: insight.description,
          type: insight.type,
          confidence: insight.confidence,
        })),
        qualityReport: {
          completeness: qualityReport.completeness,
          accuracy: qualityReport.accuracy,
          consistency: qualityReport.consistency,
          uniqueness: qualityReport.uniqueness,
          summary: qualityReport.summary,
        },
        sentimentAnalysis: {
          processed: sentimentResult.processed,
          updated: sentimentResult.updated,
          errors: sentimentResult.errors,
        },
        statistics: {
          extractionErrors: extractResult.errors.length,
          transformationErrors: transformResult.errors.length,
          loadingErrors: loadResult.errors.length,
          originalRecords: extractResult.totalRecords,
          cleanedRecords: transformResult.data.length,
          finalRecords: loadResult.recordsLoaded,
          processingSteps: transformResult.statistics.transformations,
        }
      }
    };

    console.log('Upload processing completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload processing failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during file processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID required' },
        { status: 400 }
      );
    }

    const dataLoader = new DataLoader(prisma);
    const jobStatus = await dataLoader.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobStatus.id,
        fileName: jobStatus.fileName,
        status: jobStatus.status,
        recordsProcessed: jobStatus.recordsProcessed,
        recordsSuccess: jobStatus.recordsSuccess,
        recordsError: jobStatus.recordsError,
        startTime: jobStatus.startTime,
        endTime: jobStatus.endTime,
        duration: jobStatus.duration,
        errors: jobStatus.errorMessages,
      }
    });

  } catch (error) {
    console.error('Failed to get job status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve job status'
      },
      { status: 500 }
    );
  }
}

// Additional utility endpoint for file validation
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided for validation' },
        { status: 400 }
      );
    }

    // Extract and validate structure
    const extractResult = await DataExtractor.extractFromFile(file);
    const headers = Object.keys(extractResult.data[0] || {});
    const columnMapping = DataExtractor.detectColumnMapping(headers);
    const qualityReport = DataExtractor.getDataQualityReport(extractResult.data);
    const preview = DataExtractor.previewData(extractResult.data, 5);

    return NextResponse.json({
      success: true,
      data: {
        isValid: extractResult.errors.length === 0,
        recordCount: extractResult.totalRecords,
        columnCount: headers.length,
        detectedColumns: columnMapping,
        qualityReport,
        preview,
        recommendations: generateUploadRecommendations(qualityReport, columnMapping),
      }
    });

  } catch (error) {
    console.error('File validation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'File validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateUploadRecommendations(
  qualityReport: any,
  columnMapping: Record<string, string>
): string[] {
  const recommendations: string[] = [];

  // Check for missing important columns
  const importantColumns = ['productName', 'category', 'discountedPrice', 'rating'];
  const missingColumns = importantColumns.filter(col => !columnMapping[col]);
  
  if (missingColumns.length > 0) {
    recommendations.push(`Consider adding these important columns: ${missingColumns.join(', ')}`);
  }

  // Check data quality issues
  if (qualityReport.duplicateRecords > 0) {
    recommendations.push(`Found ${qualityReport.duplicateRecords} duplicate records - these will be automatically handled`);
  }

  if (qualityReport.emptyRecords > 0) {
    recommendations.push(`Found ${qualityReport.emptyRecords} empty records - these will be filtered out`);
  }

  // Check missing values
  const highMissingValueColumns = Object.entries(qualityReport.missingValues)
    .filter(([_, count]) => (count as number) > qualityReport.totalRecords * 0.3)
    .map(([column, _]) => column);

  if (highMissingValueColumns.length > 0) {
    recommendations.push(`These columns have >30% missing values: ${highMissingValueColumns.join(', ')}`);
  }

  // File size recommendations
  if (qualityReport.totalRecords > 10000) {
    recommendations.push('Large dataset detected - processing may take a few minutes');
  }

  if (recommendations.length === 0) {
    recommendations.push('File looks good! Ready for processing.');
  }

  return recommendations;
}