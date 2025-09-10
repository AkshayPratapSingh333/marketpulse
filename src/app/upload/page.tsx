"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Brain,
  Download
} from 'lucide-react';

interface UploadProgress {
  phase: 'uploading' | 'extracting' | 'transforming' | 'loading' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

interface ProcessedData {
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  jobId: string;
  insights: Array<{
    title: string;
    description: string;
    type: string;
    confidence: number;
  }>;
  qualityReport: {
    completeness: number;
    accuracy: number;
    consistency: number;
    uniqueness: number;
    summary: string;
  };
  sentimentAnalysis: {
    processed: number;
    updated: number;
    errors: number;
  };
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'uploading',
    progress: 0,
    message: 'Ready to upload'
  });
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setProcessedData(null);
    setUploadProgress({ phase: 'uploading', progress: 0, message: 'File selected' });
    
    // Preview and validate file
    await previewAndValidateFile(selectedFile);
  }, []);

  const previewAndValidateFile = async (file: File) => {
    try {
      // Basic preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(0, 6);
        const preview = lines.map(line => line.split(','));
        setPreviewData(preview);
      };
      reader.readAsText(file);

      // Validate with API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result.data);
      }
    } catch (error) {
      console.warn('File validation failed:', error);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressSteps = [
        { phase: 'uploading', progress: 10, message: 'Uploading file...', delay: 500 },
        { phase: 'extracting', progress: 30, message: 'Extracting data from CSV...', delay: 1000 },
        { phase: 'transforming', progress: 50, message: 'Cleaning and transforming data...', delay: 1500 },
        { phase: 'loading', progress: 70, message: 'Loading data into database...', delay: 1000 },
        { phase: 'analyzing', progress: 90, message: 'Running AI analysis...', delay: 2000 },
      ];

      // Start progress simulation
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const step = progressSteps[stepIndex];
          setUploadProgress({
            phase: step.phase as any,
            progress: step.progress,
            message: step.message
          });
          stepIndex++;
        }
      }, 800);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();
      
      if (result.success) {
        setProcessedData(result.data);
        setUploadProgress({ phase: 'complete', progress: 100, message: 'Processing complete!' });
      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (error) {
      console.error('Upload processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(`Processing failed: ${errorMessage}`);
      setUploadProgress({ phase: 'uploading', progress: 0, message: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProcessedData(null);
    setError(null);
    setPreviewData(null);
    setValidationResult(null);
    setUploadProgress({ phase: 'uploading', progress: 0, message: 'Ready to upload' });
  };

  const exportResults = async () => {
    try {
      const response = await fetch('/api/export?type=summary&format=csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `upload_results_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Data</h1>
          <p className="text-xl text-gray-600">
            Upload CSV files to start your AI-powered analytics journey
          </p>
        </div>

        {/* File Upload Section */}
        {!processedData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Upload CSV, XLS, or XLSX files (max 50MB). Your data will be processed through our advanced ETL pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg text-gray-600 mb-2">
                    Click to select or drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV, XLS, XLSX files up to 50MB
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetUpload}>
                      Remove
                    </Button>
                  </div>

                  {/* Validation Results */}
                  {validationResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          {validationResult.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                          )}
                          File Validation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{validationResult.recordCount}</p>
                            <p className="text-sm text-gray-600">Records Found</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{validationResult.columnCount}</p>
                            <p className="text-sm text-gray-600">Columns Detected</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {Object.keys(validationResult.detectedColumns || {}).length}
                            </p>
                            <p className="text-sm text-gray-600">Mapped Columns</p>
                          </div>
                        </div>
                        
                        {validationResult.recommendations && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Recommendations:</h4>
                            {validationResult.recommendations.map((rec: string, index: number) => (
                              <p key={index} className="text-sm text-gray-600">• {rec}</p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* File Preview */}
                  {previewData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Data Preview</CardTitle>
                        <CardDescription>First few rows of your data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <tbody>
                              {previewData.map((row, index) => (
                                <tr key={index} className={index === 0 ? 'font-medium bg-gray-50' : ''}>
                                  {row.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="px-3 py-2 border-r border-gray-200 last:border-r-0">
                                      {cell?.substring(0, 30)}{cell?.length > 30 ? '...' : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upload Progress */}
                  {uploading && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin">
                              <RefreshCw className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{uploadProgress.message}</span>
                          </div>
                          <Progress value={uploadProgress.progress} className="w-full" />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>{uploadProgress.phase.charAt(0).toUpperCase() + uploadProgress.phase.slice(1)}</span>
                            <span>{uploadProgress.progress}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleUpload} 
                      disabled={uploading || (!validationResult?.isValid && validationResult !== null)}
                      className="flex-1"
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Start AI Processing
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetUpload} size="lg">
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Results */}
        {processedData && (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                🎉 Successfully processed {processedData.recordsSuccess} out of {processedData.recordsProcessed} records!
              </AlertDescription>
            </Alert>

            {/* Processing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Summary</CardTitle>
                <CardDescription>Results from the ETL pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {processedData.recordsProcessed}
                    </div>
                    <div className="text-sm text-gray-600">Records Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {processedData.recordsSuccess}
                    </div>
                    <div className="text-sm text-gray-600">Successfully Loaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {processedData.recordsError}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {processedData.sentimentAnalysis.updated}
                    </div>
                    <div className="text-sm text-gray-600">Sentiment Analyzed</div>
                  </div>
                </div>

                {/* Data Quality Report */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Data Quality Report</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{processedData.qualityReport.completeness}%</div>
                      <div className="text-xs text-gray-600">Completeness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{processedData.qualityReport.accuracy}%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{processedData.qualityReport.consistency}%</div>
                      <div className="text-xs text-gray-600">Consistency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">{processedData.qualityReport.uniqueness}%</div>
                      <div className="text-xs text-gray-600">Uniqueness</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{processedData.qualityReport.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            {processedData.insights && processedData.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>Initial insights discovered in your data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processedData.insights.map((insight, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{insight.description}</p>
                        <span className="text-xs text-gray-400 mt-2 inline-block">
                          Type: {insight.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
                <CardDescription>Explore your processed data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="font-medium">View Dashboard</span>
                    <span className="text-xs text-left opacity-80">
                      Explore interactive analytics and insights
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={exportResults}
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span className="font-medium">Export Results</span>
                    <span className="text-xs text-left opacity-80">
                      Download processing summary as CSV
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={resetUpload}
                  >
                    <Upload className="h-6 w-6 mb-2" />
                    <span className="font-medium">Upload More Data</span>
                    <span className="text-xs text-left opacity-80">
                      Add additional datasets for analysis
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}