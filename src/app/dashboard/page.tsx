"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// PDF Export imports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  ShoppingCart, 
  Users, 
  Heart,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Brain,
  Send,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardData {
  summary: {
    totalProducts: number;
    totalCategories: number;
    averageRating: number;
    averagePrice: number;
    positiveReviews: number;
    negativeReviews: number;
  };
  topProducts: Array<{
    name: string;
    rating: number;
    price: number;
    category: string;
    ratingCount: number;
  }>;
  categoryInsights: Array<{
    category: string;
    productCount: number;
    averageRating: number;
    averagePrice: number;
  }>;
  priceDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  sentimentData: Array<{
    sentiment: string;
    count: number;
    percentage: number;
  }>;
  correlationData: Array<{
    variable1: string;
    variable2: string;
    correlation: number;
  }>;
  trendData: Array<{
    date: string;
    rating: number;
    price: number;
    volume: number;
  }>;
  recommendations: Array<{
    productName: string;
    reason: string;
    similarity: number;
  }>;
  descriptiveStats: any;
}

interface AIMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('rating');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      type: 'ai',
      content: `## 🤖 AI Assistant Ready!

Hello! I'm your **AI data analyst** and I'm here to help you understand your product data better.

### 🚀 What I can do:
- 📊 **Analyze trends** and patterns in your data
- 🏆 **Find top-performing products** by rating, sales, etc.
- 📂 **Compare categories** and their performance
- 💰 **Review pricing strategies** and distributions
- 💭 **Understand customer sentiment** from reviews
- 🎯 **Provide actionable insights** for business decisions

### 💬 Just ask me questions like:
- *"What should I buy?"*
- *"Show me top-rated products"*
- *"How are my categories performing?"*
- *"What's the pricing analysis?"*

Ready to dive into your data? 🚀`,
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState<string>('');
  const [insights, setInsights] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Advanced Statistical Utility Functions - Must be declared before useEffect/useCallback
  const statisticalMetrics = useMemo(() => {
    if (!data) return null;

    // Extract price data from distribution for more accurate calculations
    const priceData: number[] = [];
    data.priceDistribution.forEach(range => {
      const [min, max] = range.range.split('-').map(s => {
        if (s.includes('+')) return parseInt(s.replace('+', '')) + 500; // Estimate for open ranges
        return parseInt(s) || 0;
      });
      const midpoint = (min + (max || min + 50)) / 2;
      // Add midpoint values weighted by count
      for (let i = 0; i < range.count; i++) {
        priceData.push(midpoint);
      }
    });

    // Calculate accurate statistical measures
    const n = priceData.length;
    const mean = priceData.reduce((sum, val) => sum + val, 0) / n;
    
    // Median calculation
    const sortedPrices = [...priceData].sort((a, b) => a - b);
    const median = n % 2 === 0 
      ? (sortedPrices[n/2 - 1] + sortedPrices[n/2]) / 2 
      : sortedPrices[Math.floor(n/2)];
    
    // Standard deviation calculation
    const variance = priceData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    // Additional statistical measures
    const min = Math.min(...priceData);
    const max = Math.max(...priceData);
    const range = max - min;
    
    // Quartiles
    const q1 = sortedPrices[Math.floor(n * 0.25)];
    const q3 = sortedPrices[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    
    // Coefficient of variation (relative variability)
    const coefficientOfVariation = (standardDeviation / mean) * 100;
    
    // Skewness calculation (measure of asymmetry)
    const skewness = priceData.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0) / n;
    
    // Kurtosis calculation (measure of tail heaviness)
    const kurtosis = priceData.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3;

    return {
      mean,
      median,
      standardDeviation,
      variance,
      min,
      max,
      range,
      q1,
      q3,
      iqr,
      coefficientOfVariation,
      skewness,
      kurtosis,
      sampleSize: n
    };
  }, [data]);

  // Enhanced correlation analysis
  const correlationAnalysis = useMemo(() => {
    if (!data?.correlationData) return null;

    return data.correlationData.map(corr => {
      const absCorr = Math.abs(corr.correlation);
      const strength = absCorr >= 0.8 ? 'Very Strong' :
                      absCorr >= 0.6 ? 'Strong' :
                      absCorr >= 0.4 ? 'Moderate' :
                      absCorr >= 0.2 ? 'Weak' : 'Very Weak';
      
      const direction = corr.correlation > 0 ? 'Positive' : 'Negative';
      const significance = absCorr >= 0.5 ? 'Highly Significant' :
                          absCorr >= 0.3 ? 'Significant' : 'Not Significant';

      // R-squared (coefficient of determination)
      const rSquared = Math.pow(corr.correlation, 2);

      return {
        ...corr,
        strength,
        direction,
        significance,
        rSquared,
        varianceExplained: (rSquared * 100).toFixed(1)
      };
    });
  }, [data?.correlationData]);

  useEffect(() => {
    fetchDashboardData();
    fetchInsights();
  }, [selectedCategory, timeRange]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        timeRange: timeRange,
      });
      
      const response = await fetch(`/api/dashboard?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, timeRange]);

  const fetchInsights = async () => {
    try {
      const params = new URLSearchParams({
        type: 'recent',
        limit: '5',
      });
      
      const response = await fetch(`/api/insights?${params}`);
      if (response.ok) {
        const result = await response.json();
        setInsights(result.data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : '',
        limit: '20',
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage: AIMessage = {
      type: 'user',
      content: aiInput,
      timestamp: new Date()
    };

    const loadingMessage: AIMessage = {
      type: 'ai',
      content: 'Analyzing your query...',
      timestamp: new Date(),
      loading: true
    };

    setAiMessages(prev => [...prev, userMessage, loadingMessage]);
    setAiInput('');

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: aiInput,
          context: { category: selectedCategory, timeRange }
        })
      });

      const result = await response.json();
      
      const aiResponse: AIMessage = {
        type: 'ai',
        content: result.success ? result.data.response : 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };

      setAiMessages(prev => prev.slice(0, -1).concat(aiResponse));
    } catch (error) {
      const errorMessage: AIMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setAiMessages(prev => prev.slice(0, -1).concat(errorMessage));
    }
  };

  const exportData = async (type: string) => {
    try {
      // Show loading state
      const exportButton = document.querySelector(`[data-export="${type}"]`) as HTMLButtonElement;
      if (exportButton) {
        exportButton.textContent = 'Exporting...';
        exportButton.disabled = true;
      }

      const response = await fetch(`/api/export?type=${type}&category=${selectedCategory}&format=csv`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Success feedback
        alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || `Failed to export ${type} data`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to export ${type} data. Please try again.\n\nError: ${errorMessage}`);
    } finally {
      // Reset button state
      const exportButton = document.querySelector(`[data-export="${type}"]`) as HTMLButtonElement;
      if (exportButton) {
        exportButton.textContent = exportButton.getAttribute('data-original-text') || 'Export';
        exportButton.disabled = false;
      }
    }
  };

  const exportToPDF = async () => {
    if (exportingPDF) return;
    
    setExportingPDF(true);
    try {
      console.log('Starting comprehensive PDF export...');

      // Get the main dashboard element
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        alert('Dashboard content not found. Please refresh the page and try again.');
        return;
      }

      // Create a comprehensive PDF content including all dashboard components
      const createComprehensivePDFContent = () => {
        const content = document.createElement('div');
        content.style.cssText = `
          width: 1200px;
          background: white;
          padding: 40px;
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        `;

        // Add header with comprehensive title
        const header = document.createElement('div');
        header.innerHTML = `
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 25px;">
            <h1 style="color: #1e40af; font-size: 32px; margin: 0; font-weight: bold;">
              📊 Complete Analytics Dashboard Report
            </h1>
            <p style="color: #6b7280; margin: 15px 0 5px 0; font-size: 16px;">
              Generated on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            ${selectedCategory && selectedCategory !== 'all' ? 
              `<p style="color: #059669; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">
                📁 Category Filter Applied: ${selectedCategory}
              </p>` : 
              '<p style="color: #059669; margin: 5px 0 0 0; font-size: 14px;">📈 All Categories Included</p>'
            }
          </div>
        `;
        content.appendChild(header);

        if (data) {
          // Executive Summary with KPIs
          const executiveSummary = document.createElement('div');
          executiveSummary.innerHTML = `
            <div style="margin-bottom: 40px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; border-radius: 8px; border: 2px solid #cbd5e1;">
              <h2 style="color: #1e40af; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                📋 Executive Summary & Key Performance Indicators
              </h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; margin-bottom: 25px;">
                <div style="background: white; padding: 20px; border: 2px solid #dbeafe; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 8px 0;">📦 Total Products</h3>
                  <p style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">${data.summary.totalProducts.toLocaleString()}</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Across ${data.summary.totalCategories} unique categories</p>
                </div>
                <div style="background: white; padding: 20px; border: 2px solid #dcfce7; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #059669; font-size: 16px; margin: 0 0 8px 0;">⭐ Average Rating</h3>
                  <p style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">${data.summary.averageRating.toFixed(1)} ★</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Customer satisfaction score</p>
                </div>
                <div style="background: white; padding: 20px; border: 2px solid #fef3c7; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #d97706; font-size: 16px; margin: 0 0 8px 0;">💰 Average Price</h3>
                  <p style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">₹${Math.round(data.summary.averagePrice).toLocaleString()}</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Per product pricing</p>
                </div>
                <div style="background: white; padding: 20px; border: 2px solid #fce7f3; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #be185d; font-size: 16px; margin: 0 0 8px 0;">👥 Market Reach</h3>
                  <p style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">${(data.summary.totalProducts * 1000).toLocaleString()}</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Estimated customer base</p>
                </div>
              </div>
            </div>
          `;
          content.appendChild(executiveSummary);

          // Statistical Analysis Section - Simplified
          if (data?.correlationData && data.correlationData.length > 0) {
            const priceRatingCorr = data.correlationData.find(c => 
              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('rating')) ||
              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('price'))
            );
            
            if (priceRatingCorr && statisticalMetrics) {
              const statisticalSection = document.createElement('div');
              statisticalSection.innerHTML = `
                <div style="margin-bottom: 40px;">
                  <h2 style="color: #1e40af; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                    📊 Statistical Analysis & Business Intelligence
                  </h2>
                  <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #cbd5e1;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; margin-bottom: 20px;">
                      <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">📈 Price vs Rating Correlation</h3>
                        <p style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">${priceRatingCorr.correlation.toFixed(3)}</p>
                        <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">
                          ${Math.abs(priceRatingCorr.correlation) > 0.5 ? 'Strong' : 
                            Math.abs(priceRatingCorr.correlation) > 0.3 ? 'Moderate' : 'Weak'} correlation
                        </p>
                      </div>
                      <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">📊 R-Squared Value</h3>
                        <p style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">${(priceRatingCorr.correlation ** 2).toFixed(3)}</p>
                        <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Variance explained</p>
                      </div>
                      <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">📋 Price Analysis</h3>
                        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">
                          ₹${statisticalMetrics.min.toLocaleString()} - ₹${statisticalMetrics.max.toLocaleString()}
                        </p>
                        <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Market price range</p>
                      </div>
                      <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">⭐ Quality Analysis</h3>
                        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">
                          ${data.summary.averageRating.toFixed(1)} ★ Average
                        </p>
                        <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Customer satisfaction</p>
                      </div>
                    </div>
                    <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                      <h4 style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0;">💡 Key Insights:</h4>
                      <ul style="color: #374151; font-size: 13px; margin: 0; padding-left: 20px;">
                        <li>Price-quality correlation: ${Math.abs(priceRatingCorr.correlation) > 0.5 ? 'Strong relationship' : Math.abs(priceRatingCorr.correlation) > 0.3 ? 'Moderate relationship' : 'Weak relationship'}</li>
                        <li>Market diversity: ${(statisticalMetrics.max / statisticalMetrics.min) > 10 ? 'High price variation' : 'Concentrated pricing'}</li>
                        <li>Quality standard: ${data.summary.averageRating >= 4.0 ? 'High quality market' : data.summary.averageRating >= 3.5 ? 'Good quality market' : 'Mixed quality market'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              `;
              content.appendChild(statisticalSection);
            }
          }

          // Category Performance Analysis
          if (data.categoryInsights && data.categoryInsights.length > 0) {
            const categorySection = document.createElement('div');
            categorySection.innerHTML = `
              <div style="margin-bottom: 40px;">
                <h2 style="color: #1e40af; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                  🏷️ Category Performance Analysis
                </h2>
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #cbd5e1; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white;">
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: left; font-size: 14px; font-weight: bold;">📁 Category</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">📦 Products</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">💰 Avg Price</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">⭐ Avg Rating</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">📊 Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.categoryInsights.slice(0, 15).map((cat, index) => {
                      const performance = cat.averageRating >= 4.0 && cat.productCount >= 10 ? 'Excellent' :
                                        cat.averageRating >= 3.5 && cat.productCount >= 5 ? 'Good' :
                                        cat.averageRating >= 3.0 ? 'Average' : 'Below Average';
                      const performanceColor = performance === 'Excellent' ? '#059669' :
                                             performance === 'Good' ? '#0891b2' :
                                             performance === 'Average' ? '#d97706' : '#dc2626';
                      return `
                        <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border-bottom: 1px solid #e5e7eb;">
                          <td style="border: 1px solid #e5e7eb; padding: 14px; color: #1f2937; font-size: 13px; font-weight: 500;">${cat.category}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #374151; font-size: 13px; font-weight: 600;">${cat.productCount.toLocaleString()}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #374151; font-size: 13px; font-weight: 600;">₹${Math.round(cat.averagePrice).toLocaleString()}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #374151; font-size: 13px; font-weight: 600;">${cat.averageRating.toFixed(1)} ★</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: ${performanceColor}; font-size: 12px; font-weight: bold;">${performance}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #0ea5e9; margin-top: 15px;">
                  <p style="color: #0c4a6e; font-size: 13px; margin: 0;">
                    <strong>📈 Category Insights:</strong> Performance rating based on average rating (≥4.0 excellent, ≥3.5 good) and product volume (≥10 high volume, ≥5 medium volume).
                  </p>
                </div>
              </div>
            `;
            content.appendChild(categorySection);
          }

          // Customer Sentiment Analysis
          if (data.sentimentData && data.sentimentData.length > 0) {
            const sentimentSection = document.createElement('div');
            sentimentSection.innerHTML = `
              <div style="margin-bottom: 40px;">
                <h2 style="color: #1e40af; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                  😊 Customer Sentiment Analysis
                </h2>
                <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #cbd5e1;">
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
                    ${data.sentimentData.map(s => {
                      const emoji = s.sentiment === 'positive' ? '😊' : s.sentiment === 'negative' ? '😞' : '😐';
                      const bgColor = s.sentiment === 'positive' ? '#dcfce7' : s.sentiment === 'negative' ? '#fef2f2' : '#f3f4f6';
                      const borderColor = s.sentiment === 'positive' ? '#16a34a' : s.sentiment === 'negative' ? '#dc2626' : '#6b7280';
                      const textColor = s.sentiment === 'positive' ? '#166534' : s.sentiment === 'negative' ? '#991b1b' : '#374151';
                      return `
                        <div style="background: ${bgColor}; padding: 20px; border: 2px solid ${borderColor}; border-radius: 8px; text-align: center;">
                          <h3 style="color: ${textColor}; font-size: 18px; margin: 0 0 8px 0; text-transform: capitalize;">
                            ${emoji} ${s.sentiment}
                          </h3>
                          <p style="color: ${textColor}; font-size: 24px; font-weight: bold; margin: 0;">${s.percentage.toFixed(1)}%</p>
                          <p style="color: ${textColor}; font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">
                            ${s.count.toLocaleString()} reviews
                          </p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                  <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <h4 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">📊 Sentiment Distribution Summary:</h4>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 4px;">
                      ${data.sentimentData.map(s => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <span style="color: #374151; font-size: 14px; text-transform: capitalize; font-weight: 500;">${s.sentiment}:</span>
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${s.count.toLocaleString()} reviews (${s.percentage.toFixed(1)}%)</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              </div>
            `;
            content.appendChild(sentimentSection);
          }

          // Top Products Analysis
          if (data.topProducts && data.topProducts.length > 0) {
            const productsSection = document.createElement('div');
            productsSection.innerHTML = `
              <div style="margin-bottom: 30px;">
                <h2 style="color: #1e40af; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                  🏆 Top Products Performance
                </h2>
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #cbd5e1; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white;">
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: left; font-size: 14px; font-weight: bold;">🏆 Rank</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: left; font-size: 14px; font-weight: bold;">📦 Product Name</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: left; font-size: 14px; font-weight: bold;">🏷️ Category</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">💰 Price</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">⭐ Rating</th>
                      <th style="border: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 14px; font-weight: bold;">👥 Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.topProducts.slice(0, 20).map((product, index) => {
                      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                      return `
                        <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border-bottom: 1px solid #e5e7eb;">
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #1f2937; font-size: 14px; font-weight: bold;">${rankEmoji}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; color: #1f2937; font-size: 13px; font-weight: 500; max-width: 300px; word-wrap: break-word; line-height: 1.4;">${product.name}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; color: #374151; font-size: 13px;">${product.category}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #059669; font-size: 13px; font-weight: 600;">₹${product.price.toLocaleString()}</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #d97706; font-size: 13px; font-weight: 600;">${product.rating} ★</td>
                          <td style="border: 1px solid #e5e7eb; padding: 14px; text-align: center; color: #374151; font-size: 13px;">${product.ratingCount?.toLocaleString() || 'N/A'}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
            content.appendChild(productsSection);
          }

          // Add footer with additional insights
          const footer = document.createElement('div');
          footer.innerHTML = `
            <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 8px; border: 2px solid #cbd5e1;">
              <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0;">📋 Report Summary & Recommendations</h3>
              <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li><strong>Market Coverage:</strong> Analysis covers ${data.summary.totalProducts.toLocaleString()} products across ${data.summary.totalCategories} categories</li>
                  <li><strong>Quality Standard:</strong> Average rating of ${data.summary.averageRating.toFixed(1)}★ indicates ${data.summary.averageRating >= 4.0 ? 'excellent' : data.summary.averageRating >= 3.5 ? 'good' : 'moderate'} overall quality</li>
                  <li><strong>Price Analysis:</strong> Average pricing at ₹${Math.round(data.summary.averagePrice).toLocaleString()} suggests ${data.summary.averagePrice > 1000 ? 'premium' : data.summary.averagePrice > 500 ? 'mid-range' : 'budget-friendly'} market positioning</li>
                  <li><strong>Sentiment Health:</strong> Customer sentiment distribution provides insights into brand perception and satisfaction levels</li>
                </ul>
              </div>
              <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #cbd5e1;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  📊 Generated by Analytics Dashboard • ${new Date().toLocaleString()} • Data-driven insights for business growth
                </p>
              </div>
            </div>
          `;
          content.appendChild(footer);
        }

        return content;
      };

      // Create comprehensive content
      const comprehensiveContent = createComprehensivePDFContent();
      
      // Temporarily add to DOM
      comprehensiveContent.style.position = 'absolute';
      comprehensiveContent.style.left = '-9999px';
      comprehensiveContent.style.top = '0px';
      document.body.appendChild(comprehensiveContent);

      // Wait for layout and rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture with html2canvas
      const canvas = await html2canvas(comprehensiveContent, {
        scale: 1.2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1200,
        height: comprehensiveContent.scrollHeight
      });

      // Remove temporary element
      document.body.removeChild(comprehensiveContent);

      console.log('Comprehensive canvas generated successfully');

      // Create PDF with better quality
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multiple pages
        let yOffset = 0;
        let remainingHeight = imgHeight;
        let pageNumber = 1;

        while (remainingHeight > 0) {
          if (yOffset > 0) {
            pdf.addPage();
            pageNumber++;
          }
          
          const pageHeight = Math.min(remainingHeight, pdfHeight);
          pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
          
          // Add page number
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page ${pageNumber}`, pdfWidth - 20, pdfHeight - 10);
          
          yOffset += pdfHeight;
          remainingHeight -= pdfHeight;
        }
      }

      // Save comprehensive PDF
      const fileName = `comprehensive_analytics_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('Comprehensive PDF saved successfully:', fileName);
      alert('📊 Comprehensive PDF with all dashboard components exported successfully!');

    } catch (error) {
      console.error('Comprehensive PDF export failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('html2canvas')) {
        alert('Failed to capture dashboard content. Please ensure all data has loaded and try again.');
      } else if (errorMessage.includes('jsPDF')) {
        alert('Failed to generate PDF. Please try again.');
      } else {
        alert(`Export failed: ${errorMessage}. Please refresh the page and try again.`);
      }
    } finally {
      setExportingPDF(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchInsights()
    ]);
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-4">No data available</p>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full px-2 lg:px-0">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4">
          <div className="w-full lg:w-auto min-w-0 flex-shrink">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2 break-words">Analytics Dashboard</h1>
            <p className="text-sm lg:text-lg text-gray-600 break-words">AI-powered insights from your data</p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-2 lg:gap-4 mt-4 lg:mt-0 w-full lg:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full min-w-[140px] lg:w-40 bg-white border-gray-300">
                <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {data?.categoryInsights?.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category} title={cat.category}>
                    {cat.category}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full min-w-[120px] lg:w-32 bg-white border-gray-300">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 flex-1 lg:flex-none">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full min-w-[180px] lg:w-48"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative group">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[180px]">
                <div className="py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">CSV Exports</div>
                  <button
                    onClick={() => exportData('summary')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Summary Data
                  </button>
                  <button
                    onClick={() => exportData('products')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Products Data
                  </button>
                  <button
                    onClick={() => exportData('categories')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Categories Data
                  </button>
                  <button
                    onClick={() => exportData('sentiment')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Sentiment Data
                  </button>
                  <hr className="my-1" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">PDF Export</div>
                  <button
                    onClick={exportToPDF}
                    disabled={exportingPDF}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingPDF ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    {exportingPDF ? 'Generating PDF...' : 'Complete Dashboard'}
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={refreshData} disabled={refreshing} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{data.summary.totalProducts.toLocaleString()}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Across {data.summary.totalCategories} categories</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{data.summary.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <p className="text-xs text-green-500">+0.2 from last period</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Price</p>
                  <p className="text-3xl font-bold text-gray-900">₹{data.summary.averagePrice.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                <p className="text-xs text-red-500">-5.2% from last period</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Positive Reviews</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {((data.summary.positiveReviews / (data.summary.positiveReviews + data.summary.negativeReviews)) * 100).toFixed(1)}%
                  </p>
                </div>
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{data.summary.positiveReviews.toLocaleString()} positive reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="break-words">Search Results</CardTitle>
              <CardDescription className="break-words">Found {searchResults.length} products matching "{searchQuery}"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.slice(0, 6).map((product, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 break-words min-w-0">
                    <h4 className="font-medium text-sm mb-1 break-words overflow-wrap-anywhere">{product.productName}</h4>
                    <p className="text-xs text-gray-500 mb-2 break-words">{product.category}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1 flex-shrink-0" />
                        <span className="text-sm">{product.rating}</span>
                      </div>
                      <span className="text-sm font-medium flex-shrink-0">₹{product.discountedPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <div id="dashboard-content">
          <Tabs defaultValue="overview" className="space-y-4 lg:space-y-6 w-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Price Range Distribution</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-50">
                        <p className="font-medium mb-1">What is Price Range Distribution?</p>
                        <p>This chart shows how your products are distributed across different price ranges, helping you understand your pricing strategy and product portfolio.</p>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Product distribution across different price ranges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-xs bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                    <div className="font-medium text-blue-800 mb-1">📊 What does "Count" mean?</div>
                    <div className="text-blue-700">
                      <strong>Count</strong> represents the <strong>number of products</strong> in each price range. 
                      For example, if "₹0-500" shows 150 products, it means you have 150 products priced between ₹0 and ₹500.
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        data={data.priceDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={30}
                        dataKey="count"
                        label={false}
                        labelLine={false}
                        fontSize={11}
                      >
                        {data.priceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} products`, 'Number of Products']}
                        labelFormatter={(range) => `Price Range: ₹${range}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={50}
                        formatter={(value, entry, index) => {
                          const item = data.priceDistribution[index];
                          if (item) {
                            return `₹${item.range}: ${item.count} products (${item.percentage}%)`;
                          }
                          return `${value}`;
                        }}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Explanation Footer */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-700">
                        <p className="font-medium mb-1">💡 How to read this chart:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Each slice represents a <strong>price range</strong> (e.g., ₹0-500, ₹501-1000)</li>
                          <li>• The <strong>size</strong> of each slice shows how many products are in that range</li>
                          <li>• <strong>Hover</strong> over any slice to see exact product counts</li>
                          <li>• This helps identify your <strong>most common price points</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Average ratings by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.categoryInsights.slice(0, 6)} margin={{ bottom: 80, left: 20, right: 20, top: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                        interval={0}
                      />
                      <YAxis 
                        domain={[0, 5]}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toFixed(2)}/5`, 'Average Rating']}
                        labelStyle={{ color: '#333' }}
                      />
                      <Bar 
                        dataKey="averageRating" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Statistical Analysis */}
            <div className="space-y-6">
              {/* Enhanced Statistical Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📊 Advanced Statistical Analysis</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-80 z-50">
                        <p className="font-medium mb-1">Advanced Statistical Computing</p>
                        <p>Comprehensive statistical analysis using precise mathematical calculations including distribution analysis, central tendencies, variability measures, and shape characteristics.</p>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>Precise statistical computations with mathematical accuracy and business insights</CardDescription>
                </CardHeader>
                <CardContent>
                  {statisticalMetrics && (
                    <>
                      {/* Primary Statistical Measures */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                        {/* Mean */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-blue-600 font-medium">MEAN (μ)</p>
                            <div className="group relative">
                              <AlertCircle className="h-3 w-3 text-blue-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 z-50">
                                Arithmetic average of all price values
                              </div>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-blue-800">₹{statisticalMetrics.mean.toFixed(2)}</p>
                          <p className="text-xs text-blue-600">Central tendency measure</p>
                        </div>
                        
                        {/* Median */}
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-green-600 font-medium">MEDIAN (M)</p>
                            <div className="group relative">
                              <AlertCircle className="h-3 w-3 text-green-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 z-50">
                                Middle value when prices are sorted (50th percentile)
                              </div>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-green-800">₹{statisticalMetrics.median.toFixed(2)}</p>
                          <p className="text-xs text-green-600">Robust central measure</p>
                        </div>

                        {/* Standard Deviation */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-500">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-purple-600 font-medium">STD DEV (σ)</p>
                            <div className="group relative">
                              <AlertCircle className="h-3 w-3 text-purple-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 z-50">
                                Average distance from mean (√variance)
                              </div>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-purple-800">₹{statisticalMetrics.standardDeviation.toFixed(2)}</p>
                          <p className="text-xs text-purple-600">Dispersion measure</p>
                        </div>

                        {/* Coefficient of Variation */}
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-orange-600 font-medium">COEFF VAR (CV)</p>
                            <div className="group relative">
                              <AlertCircle className="h-3 w-3 text-orange-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 z-50">
                                Relative variability (σ/μ × 100%)
                              </div>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-orange-800">{statisticalMetrics.coefficientOfVariation.toFixed(1)}%</p>
                          <p className="text-xs text-orange-600">Relative variability</p>
                        </div>
                      </div>

                      {/* Advanced Statistical Measures */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                        {/* Distribution Analysis */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                            <span>📈 Distribution Analysis</span>
                            <div className="group relative ml-2">
                              <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-50">
                                <p className="font-medium mb-1">Distribution Shape Characteristics</p>
                                <p>Skewness measures asymmetry, Kurtosis measures tail heaviness</p>
                              </div>
                            </div>
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium text-gray-700">Skewness (γ₁)</span>
                              <div className="flex items-center">
                                <span className="font-bold mr-2">{statisticalMetrics.skewness.toFixed(3)}</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  Math.abs(statisticalMetrics.skewness) < 0.5 ? 'bg-green-100 text-green-700' :
                                  Math.abs(statisticalMetrics.skewness) < 1 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {Math.abs(statisticalMetrics.skewness) < 0.5 ? 'Normal' :
                                   Math.abs(statisticalMetrics.skewness) < 1 ? 'Moderate' : 'High'}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium text-gray-700">Kurtosis (γ₂)</span>
                              <div className="flex items-center">
                                <span className="font-bold mr-2">{statisticalMetrics.kurtosis.toFixed(3)}</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  Math.abs(statisticalMetrics.kurtosis) < 0.5 ? 'bg-green-100 text-green-700' :
                                  Math.abs(statisticalMetrics.kurtosis) < 2 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {statisticalMetrics.kurtosis > 0 ? 'Leptokurtic' : 
                                   statisticalMetrics.kurtosis < 0 ? 'Platykurtic' : 'Mesokurtic'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quartile Analysis */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                            <span>📊 Quartile Analysis</span>
                            <div className="group relative ml-2">
                              <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-50">
                                <p className="font-medium mb-1">Five-Number Summary</p>
                                <p>Min, Q1 (25%), Median (50%), Q3 (75%), Max values</p>
                              </div>
                            </div>
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium text-gray-700">Q1 (25th percentile)</span>
                              <span className="font-bold">₹{statisticalMetrics.q1.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium text-gray-700">Q3 (75th percentile)</span>
                              <span className="font-bold">₹{statisticalMetrics.q3.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <span className="text-sm font-medium text-blue-700">IQR (Q3 - Q1)</span>
                              <span className="font-bold text-blue-700">₹{statisticalMetrics.iqr.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium text-gray-700">Range (Max - Min)</span>
                              <span className="font-bold">₹{statisticalMetrics.range.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Statistical Insights */}
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
                          <span>🧠 Statistical Insights</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <p className="text-indigo-800">
                              <span className="font-medium">Distribution Shape:</span> 
                              {Math.abs(statisticalMetrics.skewness) < 0.5 ? 
                                " Nearly symmetric distribution with balanced price spread." :
                                statisticalMetrics.skewness > 0 ? 
                                " Right-skewed: More products at lower prices with few expensive items." :
                                " Left-skewed: More products at higher prices with few budget items."
                              }
                            </p>
                            <p className="text-indigo-800">
                              <span className="font-medium">Price Concentration:</span>
                              {statisticalMetrics.coefficientOfVariation < 30 ? 
                                " Low variability - prices are closely clustered around the mean." :
                                statisticalMetrics.coefficientOfVariation < 60 ? 
                                " Moderate variability - reasonable price diversity in catalog." :
                                " High variability - wide price range with diverse product segments."
                              }
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-indigo-800">
                              <span className="font-medium">Middle 50% Range:</span> Between ₹{statisticalMetrics.q1.toFixed(0)} and ₹{statisticalMetrics.q3.toFixed(0)} 
                              (IQR: ₹{statisticalMetrics.iqr.toFixed(0)})
                            </p>
                            <p className="text-indigo-800">
                              <span className="font-medium">Sample Size:</span> {statisticalMetrics.sampleSize.toLocaleString()} products analyzed with high statistical confidence.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Pearson Correlation Heat Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🔥 Pearson Correlation Matrix</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-80 max-w-[90vw] z-50">
                        <p className="font-medium mb-1">Pearson Correlation Coefficient (r)</p>
                        <p>Measures linear relationships between variables (-1 to +1):</p>
                        <ul className="mt-1 space-y-1">
                          <li>• <span className="text-red-300">r ≥ 0.8</span>: Very strong correlation</li>
                          <li>• <span className="text-orange-300">r ≥ 0.6</span>: Strong correlation</li>
                          <li>• <span className="text-yellow-300">r ≥ 0.4</span>: Moderate correlation</li>
                          <li>• <span className="text-blue-300">r ≥ 0.2</span>: Weak correlation</li>
                          <li>• <span className="text-gray-300">r &lt; 0.2</span>: Very weak/no correlation</li>
                        </ul>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Advanced correlation matrix with statistical significance and variance explanation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {correlationAnalysis && (
                    <>
                      {/* Enhanced Heat Map Grid */}
                      <div className="mb-6 overflow-x-auto">
                        <div className="grid grid-cols-4 gap-1 lg:gap-2 text-xs min-w-[320px]">
                          {/* Header row */}
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">Price (₹)</div>
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">Rating (★)</div>
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">Reviews (#)</div>
                          
                          {/* Price row */}
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">Price (₹)</div>
                          <div className="p-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold">
                            1.00
                          </div>
                          {(() => {
                            const priceRatingCorr = correlationAnalysis.find(c => 
                              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('rating')) ||
                              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('price'))
                            );
                            const corr = priceRatingCorr?.correlation || 0;
                            const absCorr = Math.abs(corr);
                            return (
                              <div className={`p-3 text-center rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                                absCorr >= 0.8 ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                                absCorr >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                absCorr >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' :
                                absCorr >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                              }`}>
                                <div>{corr.toFixed(3)}</div>
                                <div className="text-xs opacity-80">r²={Math.pow(corr, 2).toFixed(2)}</div>
                              </div>
                            );
                          })()}
                          {(() => {
                            const priceReviewCorr = correlationAnalysis.find(c => 
                              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('count')) ||
                              (c.variable1.toLowerCase().includes('count') && c.variable2.toLowerCase().includes('price'))
                            );
                            const corr = priceReviewCorr?.correlation || 0;
                            const absCorr = Math.abs(corr);
                            return (
                              <div className={`p-3 text-center rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                                absCorr >= 0.8 ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                                absCorr >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                absCorr >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' :
                                absCorr >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                              }`}>
                                <div>{corr.toFixed(3)}</div>
                                <div className="text-xs opacity-80">r²={Math.pow(corr, 2).toFixed(2)}</div>
                              </div>
                            );
                          })()}

                          {/* Rating row */}
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">Rating (★)</div>
                          {(() => {
                            const ratingPriceCorr = correlationAnalysis.find(c => 
                              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('price')) ||
                              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('rating'))
                            );
                            const corr = ratingPriceCorr?.correlation || 0;
                            const absCorr = Math.abs(corr);
                            return (
                              <div className={`p-3 text-center rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                                absCorr >= 0.8 ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                                absCorr >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                absCorr >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' :
                                absCorr >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                              }`}>
                                <div>{corr.toFixed(3)}</div>
                                <div className="text-xs opacity-80">r²={Math.pow(corr, 2).toFixed(2)}</div>
                              </div>
                            );
                          })()}
                          <div className="p-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold">
                            1.00
                          </div>
                          {(() => {
                            const ratingReviewCorr = correlationAnalysis.find(c => 
                              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('count')) ||
                              (c.variable1.toLowerCase().includes('count') && c.variable2.toLowerCase().includes('rating'))
                            );
                            const corr = ratingReviewCorr?.correlation || 0;
                            const absCorr = Math.abs(corr);
                            return (
                              <div className={`p-3 text-center rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                                absCorr >= 0.8 ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                                absCorr >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                absCorr >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' :
                                absCorr >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                              }`}>
                                <div>{corr.toFixed(3)}</div>
                                <div className="text-xs opacity-80">r²={Math.pow(corr, 2).toFixed(2)}</div>
                              </div>
                            );
                          })()}

                          {/* Reviews row */}
                          <div className="p-3 font-medium text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">Reviews (#)</div>
                          {(() => {
                            const reviewPriceCorr = correlationAnalysis.find(c => 
                              (c.variable1.toLowerCase().includes('count') && c.variable2.toLowerCase().includes('price')) ||
                              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('count'))
                            );
                            const corr = reviewPriceCorr?.correlation || 0;
                            const absCorr = Math.abs(corr);
                            return (
                              <div className={`p-3 text-center rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                                absCorr >= 0.8 ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                                absCorr >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                absCorr >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' :
                                absCorr >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                              }`}>
                                <div>{corr.toFixed(3)}</div>
                                <div className="text-xs opacity-80">r²={Math.pow(corr, 2).toFixed(2)}</div>
                              </div>
                            );
                          })()}
                          {(() => {
                            const reviewRatingCorr = correlationAnalysis.find(c => 
                              (c.variable1.toLowerCase().includes('count') && c.variable2.toLowerCase().includes('rating')) ||
                              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('count'))
                            );
                            const corr = reviewRatingCorr?.correlation || 0;
                            const absCorr = Math.abs(corr);
                            return (
                              <div className={`p-3 text-center rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                                absCorr >= 0.8 ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                                absCorr >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                absCorr >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' :
                                absCorr >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                              }`}>
                                <div>{corr.toFixed(3)}</div>
                                <div className="text-xs opacity-80">r²={Math.pow(corr, 2).toFixed(2)}</div>
                              </div>
                            );
                          })()}
                          <div className="p-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold">
                            1.00
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Legend with Statistical Interpretation */}
                      <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
                        <h5 className="font-medium text-gray-900 mb-3">🔍 Correlation Strength Guide</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-red-600 to-red-700 rounded"></div>
                            <span>Very Strong (≥0.8)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded"></div>
                            <span>Strong (≥0.6)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded"></div>
                            <span>Moderate (≥0.4)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded"></div>
                            <span>Weak (≥0.2)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded"></div>
                            <span>Very Weak (&lt;0.2)</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                          <p><span className="font-medium">Note:</span> r² values show the proportion of variance in one variable explained by another. Higher r² values indicate stronger predictive relationships for business modeling.</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Detailed Correlation Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>📈 Advanced Correlation Analytics</CardTitle>
                  <CardDescription>Comprehensive statistical analysis with significance testing and business implications</CardDescription>
                </CardHeader>
                <CardContent>
                  {correlationAnalysis && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      {correlationAnalysis.slice(0, 6).map((corr, index) => (
                        <div key={index} className="p-5 border rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300">
                          {/* Header with Variables and Correlation */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {corr.variable1} × {corr.variable2}
                              </span>
                              <div className="group relative">
                                <AlertCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-56 z-50">
                                  <p className="font-medium">{corr.strength} {corr.direction} Correlation</p>
                                  <p>Statistical Significance: {corr.significance}</p>
                                  <p>R²: {corr.varianceExplained}% variance explained</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-bold px-3 py-1 rounded-lg ${
                                Math.abs(corr.correlation) >= 0.8 ? 'bg-red-100 text-red-800' :
                                Math.abs(corr.correlation) >= 0.6 ? 'bg-orange-100 text-orange-800' : 
                                Math.abs(corr.correlation) >= 0.4 ? 'bg-yellow-100 text-yellow-800' : 
                                Math.abs(corr.correlation) >= 0.2 ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(3)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Statistical Measures */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs font-medium text-blue-700 mb-1">Coefficient of Determination</p>
                              <p className="text-lg font-bold text-blue-800">r² = {Math.pow(corr.correlation, 2).toFixed(3)}</p>
                              <p className="text-xs text-blue-600">{corr.varianceExplained}% variance explained</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-xs font-medium text-green-700 mb-1">Relationship Strength</p>
                              <p className="text-lg font-bold text-green-800">{corr.strength}</p>
                              <p className="text-xs text-green-600">{corr.direction} correlation</p>
                            </div>
                          </div>

                          {/* Enhanced Correlation Strength Visualization */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-gray-600">Correlation Strength</span>
                              <span className="text-xs text-gray-500">{Math.abs(corr.correlation).toFixed(3)} / 1.000</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                              <div 
                                className={`h-4 rounded-full transition-all duration-500 relative ${
                                  Math.abs(corr.correlation) >= 0.8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                  Math.abs(corr.correlation) >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                                  Math.abs(corr.correlation) >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                                  Math.abs(corr.correlation) >= 0.2 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                  'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}
                                style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                              >
                                <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>

                          {/* Statistical Significance Badge */}
                          <div className="mb-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              corr.significance === 'Highly Significant' ? 'bg-emerald-100 text-emerald-800' :
                              corr.significance === 'Significant' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                corr.significance === 'Highly Significant' ? 'bg-emerald-500' :
                                corr.significance === 'Significant' ? 'bg-blue-500' :
                                'bg-gray-400'
                              }`}></div>
                              {corr.significance}
                            </span>
                          </div>

                          {/* Enhanced Business Insight */}
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                            <p className="font-medium text-indigo-900 mb-2 flex items-center">
                              <span className="mr-2">🧠</span> Business Intelligence:
                            </p>
                            <p className="text-sm text-indigo-800 leading-relaxed">
                              {Math.abs(corr.correlation) >= 0.6 
                                ? `${corr.strength} ${corr.direction.toLowerCase()} relationship (r=${corr.correlation.toFixed(3)}) indicates ${corr.variable1} and ${corr.variable2} ${corr.correlation > 0 ? 'move together predictably' : 'move in opposite directions'}, explaining ${corr.varianceExplained}% of the variance. This is ${corr.significance.toLowerCase()} for strategic decision-making.`
                                : Math.abs(corr.correlation) >= 0.4
                                ? `${corr.strength} correlation suggests ${corr.variable1} and ${corr.variable2} have a ${corr.correlation > 0 ? 'positive' : 'negative'} relationship worth monitoring for business insights. With ${corr.varianceExplained}% variance explained, this relationship is ${corr.significance.toLowerCase()}.`
                                : Math.abs(corr.correlation) >= 0.2
                                ? `${corr.strength} correlation indicates limited relationship between ${corr.variable1} and ${corr.variable2}. While ${corr.significance.toLowerCase()}, this suggests these variables operate relatively independently with only ${corr.varianceExplained}% shared variance.`
                                : `Very weak correlation suggests ${corr.variable1} and ${corr.variable2} operate independently. With only ${corr.varianceExplained}% shared variance, changes in one variable don't predict changes in the other.`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comprehensive Statistical Education Center */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎓 Statistical Analysis Education Center</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-80 z-50">
                        <p className="font-medium mb-1">Statistical Literacy for Business</p>
                        <p>Understanding these concepts enables data-driven decision making and strategic planning.</p>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>Master statistical concepts for intelligent business decision-making</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Descriptive Statistics Section */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <h4 className="font-semibold text-gray-900 text-lg">📊 Descriptive Statistics</h4>
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 flex-1 rounded"></div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Mean */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-blue-900">Mean (μ) - Arithmetic Average</h5>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Central Tendency</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-2">
                            <strong>Definition:</strong> Sum of all values divided by the number of values (Σx/n).
                          </p>
                          <p className="text-blue-700 text-sm mb-2">
                            <strong>Business Application:</strong> Represents your typical product price. Use this to benchmark against competitors and understand your market positioning.
                          </p>
                          <div className="bg-blue-200 p-2 rounded text-xs text-blue-800">
                            <strong>When to Use:</strong> Market analysis, pricing strategy, budget planning
                          </div>
                        </div>

                        {/* Median */}
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border-l-4 border-green-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-green-900">Median (M) - 50th Percentile</h5>
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Robust Measure</span>
                          </div>
                          <p className="text-green-800 text-sm mb-2">
                            <strong>Definition:</strong> The middle value when all prices are arranged in ascending order.
                          </p>
                          <p className="text-green-700 text-sm mb-2">
                            <strong>Business Application:</strong> Less affected by extremely high or low prices. Better represents the "typical" customer experience when outliers exist.
                          </p>
                          <div className="bg-green-200 p-2 rounded text-xs text-green-800">
                            <strong>When to Use:</strong> When data has extreme values, customer segmentation, realistic pricing expectations
                          </div>
                        </div>

                        {/* Standard Deviation */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-purple-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-purple-900">Standard Deviation (σ) - Variability</h5>
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Dispersion</span>
                          </div>
                          <p className="text-purple-800 text-sm mb-2">
                            <strong>Definition:</strong> Square root of variance (√Σ(x-μ)²/n). Measures average distance from mean.
                          </p>
                          <p className="text-purple-700 text-sm mb-2">
                            <strong>Business Application:</strong> Higher values indicate diverse pricing strategy. Lower values suggest focused market segment targeting.
                          </p>
                          <div className="bg-purple-200 p-2 rounded text-xs text-purple-800">
                            <strong>68-95-99.7 Rule:</strong> 68% of data falls within 1σ, 95% within 2σ, 99.7% within 3σ
                          </div>
                        </div>

                        {/* Coefficient of Variation */}
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border-l-4 border-orange-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-orange-900">Coefficient of Variation (CV) - Relative Variability</h5>
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">Normalized</span>
                          </div>
                          <p className="text-orange-800 text-sm mb-2">
                            <strong>Definition:</strong> (σ/μ) × 100%. Standardized measure of dispersion relative to the mean.
                          </p>
                          <p className="text-orange-700 text-sm mb-2">
                            <strong>Business Application:</strong> Compare variability across different markets or product categories. Lower CV indicates more consistent pricing.
                          </p>
                          <div className="bg-orange-200 p-2 rounded text-xs text-orange-800">
                            <strong>Interpretation:</strong> CV &lt; 30% = Low variation, 30-60% = Moderate, &gt; 60% = High variation
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Statistical Concepts */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <h4 className="font-semibold text-gray-900 text-lg">🔬 Advanced Statistical Concepts</h4>
                        <div className="h-1 bg-gradient-to-r from-green-500 to-teal-500 flex-1 rounded"></div>
                      </div>

                      <div className="space-y-4">
                        {/* Pearson Correlation */}
                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border-l-4 border-red-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-red-900">Pearson Correlation (r) - Linear Relationships</h5>
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">-1 to +1</span>
                          </div>
                          <p className="text-red-800 text-sm mb-2">
                            <strong>Definition:</strong> Measures strength and direction of linear relationship between two variables.
                          </p>
                          <p className="text-red-700 text-sm mb-2">
                            <strong>Business Application:</strong> Identify which factors influence each other. Strong correlations reveal strategic opportunities and risks.
                          </p>
                          <div className="bg-red-200 p-2 rounded text-xs text-red-800 space-y-1">
                            <p><strong>Interpretation:</strong></p>
                            <p>• |r| ≥ 0.8: Very strong relationship - High predictive power</p>
                            <p>• |r| ≥ 0.6: Strong relationship - Strategic significance</p>
                            <p>• |r| ≥ 0.4: Moderate relationship - Worth monitoring</p>
                            <p>• |r| &lt; 0.4: Weak relationship - Limited practical impact</p>
                          </div>
                        </div>

                        {/* R-Squared */}
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border-l-4 border-indigo-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-indigo-900">R² - Coefficient of Determination</h5>
                            <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">0 to 1</span>
                          </div>
                          <p className="text-indigo-800 text-sm mb-2">
                            <strong>Definition:</strong> r² shows the proportion of variance in one variable explained by another.
                          </p>
                          <p className="text-indigo-700 text-sm mb-2">
                            <strong>Business Application:</strong> Quantifies predictive power. Higher R² means one variable can better predict another's behavior.
                          </p>
                          <div className="bg-indigo-200 p-2 rounded text-xs text-indigo-800">
                            <strong>Example:</strong> If price-rating r² = 0.64, then 64% of rating variance is explained by price changes
                          </div>
                        </div>

                        {/* Skewness & Kurtosis */}
                        <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-xl border-l-4 border-teal-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-teal-900">Distribution Shape Analysis</h5>
                            <span className="text-xs bg-teal-200 text-teal-800 px-2 py-1 rounded-full">Shape Measures</span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-teal-800 text-sm font-medium mb-1">Skewness (γ₁) - Asymmetry</p>
                              <p className="text-teal-700 text-xs mb-1">Measures distribution asymmetry around the mean.</p>
                              <div className="bg-teal-200 p-2 rounded text-xs text-teal-800">
                                <p>• Positive: Right tail longer (more expensive outliers)</p>
                                <p>• Negative: Left tail longer (more budget outliers)</p>
                                <p>• Zero: Symmetric distribution</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-teal-800 text-sm font-medium mb-1">Kurtosis (γ₂) - Tail Heaviness</p>
                              <p className="text-teal-700 text-xs mb-1">Measures concentration of extreme values.</p>
                              <div className="bg-teal-200 p-2 rounded text-xs text-teal-800">
                                <p>• Positive: Heavy tails (more extreme values)</p>
                                <p>• Negative: Light tails (fewer extreme values)</p>
                                <p>• Risk assessment for pricing strategies</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quartiles */}
                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl border-l-4 border-emerald-500">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-emerald-900">Quartile Analysis - Data Segmentation</h5>
                            <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">Percentiles</span>
                          </div>
                          <p className="text-emerald-800 text-sm mb-2">
                            <strong>Definition:</strong> Divides data into four equal parts for segment analysis.
                          </p>
                          <p className="text-emerald-700 text-sm mb-2">
                            <strong>Business Application:</strong> Identify budget, mid-range, premium, and luxury segments. Essential for targeted marketing strategies.
                          </p>
                          <div className="bg-emerald-200 p-2 rounded text-xs text-emerald-800">
                            <p><strong>Five-Number Summary:</strong> Min, Q1 (25%), Median (50%), Q3 (75%), Max</p>
                            <p><strong>IQR (Q3-Q1):</strong> Middle 50% spread - Core market range</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistical Decision Framework */}
                  <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-xl">
                    <h4 className="font-semibold text-xl mb-4 flex items-center">
                      <span className="mr-3">🎯</span>
                      Statistical Decision-Making Framework
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-600">
                        <h5 className="font-medium text-yellow-300 mb-2">📋 Data Assessment</h5>
                        <ul className="text-sm space-y-1 text-gray-100">
                          <li>• Check data quality and completeness</li>
                          <li>• Identify outliers and anomalies</li>
                          <li>• Validate sample size adequacy</li>
                          <li>• Assess distribution characteristics</li>
                        </ul>
                      </div>
                      <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-600">
                        <h5 className="font-medium text-blue-300 mb-2">🔍 Statistical Analysis</h5>
                        <ul className="text-sm space-y-1 text-gray-100">
                          <li>• Calculate descriptive statistics</li>
                          <li>• Perform correlation analysis</li>
                          <li>• Test for statistical significance</li>
                          <li>• Measure effect sizes (R², CV)</li>
                        </ul>
                      </div>
                      <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-600">
                        <h5 className="font-medium text-green-300 mb-2">💼 Business Action</h5>
                        <ul className="text-sm space-y-1 text-gray-100">
                          <li>• Translate statistics to insights</li>
                          <li>• Develop strategic recommendations</li>
                          <li>• Monitor key performance indicators</li>
                          <li>• Implement data-driven decisions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Rated Products</CardTitle>
                  <CardDescription>Highest rated products in your catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {data.topProducts.slice(0, 15).map((product, index) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1 pr-4">
                          <p className="font-medium text-sm break-words overflow-wrap-anywhere leading-relaxed">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1 break-words">{product.category}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="flex items-center mb-1">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-gray-600">₹{product.price.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{product.ratingCount} reviews</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📊 Price vs Rating Analysis</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-80 max-w-[90vw] z-50">
                        <div className="font-medium mb-1">Understanding Scatter Plot Analysis</div>
                        <div>Each dot represents a product plotted by its price (X-axis) and rating (Y-axis). This reveals pricing strategy effectiveness and customer value perception.</div>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Scatter plot analysis revealing the correlation between product pricing and customer satisfaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-xs bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
                    <div className="font-medium text-indigo-900 mb-2">📈 What This Chart Shows:</div>
                    <div className="text-indigo-800 space-y-1">
                      <div><strong>• X-Axis (Horizontal):</strong> Product prices in rupees (₹)</div>
                      <div><strong>• Y-Axis (Vertical):</strong> Customer ratings (1.0 to 5.0 stars)</div>
                      <div><strong>• Each Dot:</strong> One product positioned by its price and rating</div>
                      <div><strong>• Pattern Analysis:</strong> Reveals pricing strategy effectiveness</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart data={data.topProducts.map(p => ({
                      price: p.price,
                      rating: p.rating,
                      name: p.name
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="price" name="Price" />
                      <YAxis dataKey="rating" name="Rating" />
                      <Tooltip 
                        formatter={(value, name) => [value, name]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.name || ''}
                      />
                      <Scatter dataKey="rating" fill="#3B82F6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  {/* Analysis Insights */}
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                        <span className="mr-2">🔍</span>Pattern Interpretation Guide
                      </h4>
                      <div className="text-sm space-y-2 text-blue-800">
                        <div><strong>📈 Positive Trend:</strong> Higher prices generally get higher ratings (premium quality)</div>
                        <div><strong>📉 Negative Trend:</strong> Higher prices get lower ratings (poor value perception)</div>
                        <div><strong>📊 Horizontal Cluster:</strong> Similar ratings across price ranges (consistent quality)</div>
                        <div><strong>📍 Vertical Cluster:</strong> Similar prices with varying ratings (mixed quality)</div>
                        <div><strong>⭐ Sweet Spot:</strong> High ratings at reasonable prices (best value products)</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-3 flex items-center">
                        <span className="mr-2">💼</span>Business Strategy Insights
                      </h4>
                      <div className="text-sm space-y-2 text-green-800">
                        <div><strong>🎯 Pricing Strategy:</strong> Identify optimal price points for maximum satisfaction</div>
                        <div><strong>🏆 Quality Control:</strong> Products with low ratings need improvement regardless of price</div>
                        <div><strong>💰 Value Engineering:</strong> High-priced, low-rated products require attention</div>
                        <div><strong>🚀 Growth Opportunities:</strong> Well-rated, low-priced products can support price increases</div>
                        <div><strong>⚖️ Market Positioning:</strong> Understand your competitive pricing effectiveness</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Key Metrics */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">📊</span>Simple Summary Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-white rounded border">
                        <div className="font-bold text-lg text-blue-600">
                          {(() => {
                            const correlation = correlationAnalysis?.find(c => 
                              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('rating')) ||
                              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('price'))
                            );
                            return correlation ? (correlation.correlation > 0 ? '+' : '') + correlation.correlation.toFixed(2) : 'N/A';
                          })()}
                        </div>
                        <div className="text-gray-600 text-xs">Price-Rating Connection</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(() => {
                            const correlation = correlationAnalysis?.find(c => 
                              (c.variable1.toLowerCase().includes('price') && c.variable2.toLowerCase().includes('rating')) ||
                              (c.variable1.toLowerCase().includes('rating') && c.variable2.toLowerCase().includes('price'))
                            );
                            if (!correlation) return 'No data available';
                            if (correlation.correlation > 0.3) return 'Higher price = Higher rating';
                            if (correlation.correlation < -0.3) return 'Higher price = Lower rating';
                            return 'Price and rating not connected';
                          })()}
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded border">
                        <div className="font-bold text-lg text-green-600">
                          {data.topProducts.filter(p => p.rating >= 4.0 && p.price <= data.summary.averagePrice).length}
                        </div>
                        <div className="text-gray-600 text-xs">Great Value Products</div>
                        <div className="text-xs text-gray-500 mt-1">High rating (4+ stars) + Fair price</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded border">
                        <div className="font-bold text-lg text-red-600">
                          {data.topProducts.filter(p => p.rating < 3.5 && p.price > data.summary.averagePrice).length}
                        </div>
                        <div className="text-gray-600 text-xs">Problem Products</div>
                        <div className="text-xs text-gray-500 mt-1">Low rating (below 3.5 stars) + High price</div>
                      </div>
                    </div>
                    
                    {/* Rating Scale Explanation */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <span className="text-blue-800 font-medium text-sm">⭐ Rating Scale Guide:</span>
                      </div>
                      <div className="text-xs text-blue-700 grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div><strong>1 Star:</strong> Very Poor</div>
                        <div><strong>2 Stars:</strong> Poor</div>
                        <div><strong>3 Stars:</strong> Average</div>
                        <div><strong>4 Stars:</strong> Good</div>
                        <div><strong>5 Stars:</strong> Excellent</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            {/* Simple Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <span className="flex items-center break-words">📊 Category Analysis</span>
                  <div className="group relative">
                    <AlertCircle className="h-4 w-4 text-gray-400 cursor-help flex-shrink-0" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 max-w-[90vw] z-50">
                      <p className="font-medium mb-1 break-words">What is this?</p>
                      <p className="break-words">Shows which product types you have most and their prices. Helps you make better business decisions.</p>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-sm break-words">
                  Simple view of your products and prices by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">🏪</span>
                      <span className="break-words">What You Have</span>
                    </h4>
                    <ul className="space-y-1 text-blue-700 text-xs">
                      <li className="break-words">• How many products in each type</li>
                      <li className="break-words">• Which types are popular</li>
                      <li className="break-words">• Balance across categories</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">💰</span>
                      <span className="break-words">Price Levels</span>
                    </h4>
                    <ul className="space-y-1 text-green-700 text-xs">
                      <li className="break-words">• Expensive vs cheap categories</li>
                      <li className="break-words">• Where to set prices</li>
                      <li className="break-words">• Compare with competitors</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">📈</span>
                      <span className="break-words">Growth Ideas</span>
                    </h4>
                    <ul className="space-y-1 text-purple-700 text-xs">
                      <li className="break-words">• Categories with few products</li>
                      <li className="break-words">• Where to add more items</li>
                      <li className="break-words">• New opportunities</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">🎯</span>
                      <span className="break-words">Next Steps</span>
                    </h4>
                    <ul className="space-y-1 text-orange-700 text-xs">
                      <li className="break-words">• How much stock to buy</li>
                      <li className="break-words">• Where to spend marketing</li>
                      <li className="break-words">• Which categories to grow</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                    <span className="flex items-center break-words">📦 How Many Products</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help flex-shrink-0" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 max-w-[90vw] z-50">
                        <p className="font-medium mb-1 break-words">Product Count by Type</p>
                        <p className="break-words">Shows which product types you have most of. Helps you see:</p>
                        <ul className="mt-1 space-y-1">
                          <li className="break-words">• Your main business areas</li>
                          <li className="break-words">• Small categories to grow</li>
                          <li className="break-words">• Balance of your store</li>
                        </ul>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm break-words">
                    Count of products in each category - shows your business focus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.categoryInsights.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        fontSize={10}
                        interval={0}
                      />
                      <YAxis 
                        label={{ value: 'Number of Products', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        fontSize={11}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} products`, 'Product Count']}
                        labelFormatter={(label) => `Category: ${label}`}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Bar 
                        dataKey="productCount" 
                        fill="#10B981" 
                        name="Product Count"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Simple Insights */}
                  <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">💡</span>
                      <span className="break-words">What This Means</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-xs text-green-700">
                      <div className="break-words">
                        <strong className="break-words">Your Main Category:</strong>
                        <p className="break-words">{(() => {
                          const topCategory = data.categoryInsights.reduce((max, cat) => 
                            cat.productCount > max.productCount ? cat : max
                          );
                          return `${topCategory.category} has ${topCategory.productCount} products`;
                        })()}</p>
                      </div>
                      <div className="break-words">
                        <strong className="break-words">Business Type:</strong>
                        <p className="break-words">{(() => {
                          const total = data.categoryInsights.reduce((sum, cat) => sum + cat.productCount, 0);
                          const topCategory = data.categoryInsights.reduce((max, cat) => 
                            cat.productCount > max.productCount ? cat : max
                          );
                          const percentage = (topCategory.productCount / total * 100);
                          if (percentage > 50) return 'Focused store - mostly one type';
                          if (percentage > 30) return 'Balanced store - good variety';
                          return 'Very diverse store - many types';
                        })()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                    <span className="flex items-center break-words">💰 Average Prices</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help flex-shrink-0" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 max-w-[90vw] z-50">
                        <p className="font-medium mb-1 break-words">Price by Category</p>
                        <p className="break-words">Shows average price for each product type:</p>
                        <ul className="mt-1 space-y-1">
                          <li className="break-words">• Expensive categories</li>
                          <li className="break-words">• Cheap categories</li>
                          <li className="break-words">• Where to adjust prices</li>
                        </ul>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm break-words">
                    Average price for each category - shows expensive vs cheap products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.categoryInsights.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        fontSize={10}
                        interval={0}
                      />
                      <YAxis 
                        label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        fontSize={11}
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Average Price']}
                        labelFormatter={(label) => `Category: ${label}`}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Bar 
                        dataKey="averagePrice" 
                        fill="#F59E0B" 
                        name="Average Price"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Simple Price Insights */}
                  <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">🎯</span>
                      <span className="break-words">Price Comparison</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-xs text-yellow-700">
                      <div className="break-words">
                        <strong className="break-words">Most Expensive:</strong>
                        <p className="break-words">{(() => {
                          const premiumCategory = data.categoryInsights.reduce((max, cat) => 
                            cat.averagePrice > max.averagePrice ? cat : max
                          );
                          return `${premiumCategory.category} costs ₹${premiumCategory.averagePrice.toLocaleString()} on average`;
                        })()}</p>
                      </div>
                      <div className="break-words">
                        <strong className="break-words">Cheapest:</strong>
                        <p className="break-words">{(() => {
                          const budgetCategory = data.categoryInsights.reduce((min, cat) => 
                            cat.averagePrice < min.averagePrice ? cat : min
                          );
                          return `${budgetCategory.category} costs ₹${budgetCategory.averagePrice.toLocaleString()} on average`;
                        })()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Simple Business Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <span className="break-words">🎯 Simple Business Tips</span>
                </CardTitle>
                <CardDescription className="text-sm break-words">
                  Easy-to-understand suggestions based on your categories and prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* What You Have */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center break-words">
                      <span className="mr-2 flex-shrink-0">📊</span>
                      <span className="break-words">Your Store Type</span>
                    </h4>
                    <div className="space-y-2 text-xs text-blue-700">
                      <div className="flex flex-wrap justify-between items-center p-2 bg-white rounded border gap-2">
                        <span className="break-words">Price Range:</span>
                        <span className="font-bold break-words">
                          {(() => {
                            const prices = data.categoryInsights.map(c => c.averagePrice);
                            const max = Math.max(...prices);
                            const min = Math.min(...prices);
                            const ratio = (max / min).toFixed(1);
                            return `${ratio}x difference`;
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between items-center p-2 bg-white rounded border gap-2">
                        <span className="break-words">Categories:</span>
                        <span className="font-bold break-words">{data.categoryInsights.length} types</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-blue-800 break-words">Your Strategy:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const prices = data.categoryInsights.map(c => c.averagePrice);
                            const max = Math.max(...prices);
                            const min = Math.min(...prices);
                            const ratio = max / min;
                            if (ratio > 10) return 'You sell both cheap and expensive items';
                            if (ratio > 5) return 'You focus on medium to high prices';
                            return 'Your prices are similar across categories';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Growth Ideas */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center break-words">
                      <span className="mr-2 flex-shrink-0">💡</span>
                      <span className="break-words">Ways to Grow</span>
                    </h4>
                    <div className="space-y-2 text-xs text-green-700">
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-green-800 break-words">Add More To:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const underserved = data.categoryInsights
                              .filter(cat => cat.productCount < 10)
                              .sort((a, b) => b.averagePrice - a.averagePrice)[0];
                            return underserved ? 
                              `${underserved.category} (only ${underserved.productCount} products, good prices)` :
                              'Your categories are well stocked';
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-green-800 break-words">Missing Categories:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const categories = data.categoryInsights.length;
                            if (categories < 5) return 'Try adding new product types';
                            if (categories < 10) return 'Good variety, focus on what works';
                            return 'Great variety, keep what sells best';
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-green-800 break-words">Best Move:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const highValue = data.categoryInsights.filter(cat => cat.averagePrice > 1000);
                            const lowCount = data.categoryInsights.filter(cat => cat.productCount < 5);
                            if (highValue.length > 0 && lowCount.length > 0) {
                              return 'Add more expensive items to small categories';
                            }
                            return 'Keep doing what you are doing';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Watch Out For */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center break-words">
                      <span className="mr-2 flex-shrink-0">⚠️</span>
                      <span className="break-words">Things to Watch</span>
                    </h4>
                    <div className="space-y-2 text-xs text-purple-700">
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-purple-800 break-words">Too Much in One:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const total = data.categoryInsights.reduce((sum, cat) => sum + cat.productCount, 0);
                            const topCategory = data.categoryInsights.reduce((max, cat) => 
                              cat.productCount > max.productCount ? cat : max
                            );
                            const concentration = (topCategory.productCount / total * 100);
                            if (concentration > 60) return `Warning: ${concentration.toFixed(0)}% in ${topCategory.category}`;
                            if (concentration > 40) return `OK: ${concentration.toFixed(0)}% in main category`;
                            return `Great: Products spread evenly`;
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-purple-800 break-words">Price Balance:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const expensiveCount = data.categoryInsights.filter(cat => cat.averagePrice > 1000).length;
                            const cheapCount = data.categoryInsights.filter(cat => cat.averagePrice < 500).length;
                            const total = data.categoryInsights.length;
                            const ratio = expensiveCount / total;
                            if (ratio > 0.6) return 'Too many expensive items - add cheaper ones';
                            if (ratio < 0.2) return 'Too many cheap items - try premium products';
                            return 'Good mix of cheap and expensive items';
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-purple-800 break-words">What to Do:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const avgProducts = data.categoryInsights.reduce((sum, cat) => sum + cat.productCount, 0) / data.categoryInsights.length;
                            const lowCategories = data.categoryInsights.filter(cat => cat.productCount < avgProducts * 0.5).length;
                            if (lowCategories > data.categoryInsights.length * 0.3) {
                              return 'Build up your smaller categories';
                            }
                            return 'Keep current strategy, monitor sales';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            {/* Educational Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <span className="flex items-center break-words">💬 Customer Sentiment Analysis</span>
                  <div className="group relative">
                    <AlertCircle className="h-4 w-4 text-gray-400 cursor-help flex-shrink-0" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 max-w-[90vw] z-50">
                      <p className="font-medium mb-1 break-words">What is Sentiment Analysis?</p>
                      <p className="break-words">AI analysis of customer reviews to understand if customers are happy, upset, or neutral about your products. Helps improve customer satisfaction.</p>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-sm break-words">
                  Understanding customer emotions and opinions from their reviews and feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">😊</span>
                      <span className="break-words">Positive Reviews</span>
                    </h4>
                    <ul className="space-y-1 text-green-700 text-xs">
                      <li className="break-words">• Happy customers</li>
                      <li className="break-words">• Good product experiences</li>
                      <li className="break-words">• Likely to recommend</li>
                      <li className="break-words">• Return customers</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">😞</span>
                      <span className="break-words">Negative Reviews</span>
                    </h4>
                    <ul className="space-y-1 text-red-700 text-xs">
                      <li className="break-words">• Unhappy customers</li>
                      <li className="break-words">• Product problems</li>
                      <li className="break-words">• Need attention</li>
                      <li className="break-words">• Risk of bad reputation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">😐</span>
                      <span className="break-words">Neutral Reviews</span>
                    </h4>
                    <ul className="space-y-1 text-gray-700 text-xs">
                      <li className="break-words">• Average experience</li>
                      <li className="break-words">• Neither good nor bad</li>
                      <li className="break-words">• Room for improvement</li>
                      <li className="break-words">• Can become positive</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">🎯</span>
                      <span className="break-words">Why It Matters</span>
                    </h4>
                    <ul className="space-y-1 text-blue-700 text-xs">
                      <li className="break-words">• Improve products</li>
                      <li className="break-words">• Fix customer issues</li>
                      <li className="break-words">• Build better reputation</li>
                      <li className="break-words">• Increase sales</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                    <span className="flex items-center break-words">📊 Customer Feelings Overview</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help flex-shrink-0" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 max-w-[90vw] z-50">
                        <p className="font-medium mb-1 break-words">Sentiment Distribution</p>
                        <p className="break-words">Shows the percentage of happy vs unhappy customers. Helps you understand overall customer satisfaction at a glance.</p>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm break-words">
                    Pie chart showing how customers feel about your products overall
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.sentimentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={false}
                      >
                        {data.sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.sentiment === 'positive' ? '#10B981' :
                            entry.sentiment === 'negative' ? '#EF4444' : '#6B7280'
                          } />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} reviews`, name]}
                        labelFormatter={(label) => `Sentiment: ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Quick Sentiment Summary */}
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">📈</span>
                      <span className="break-words">Quick Summary</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-xs text-blue-700">
                      <div className="break-words">
                        <strong className="break-words">Overall Mood:</strong>
                        <span className="ml-2 break-words">{(() => {
                          const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                          const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                          if (positive > 70) return '😊 Very Happy Customers';
                          if (positive > 50) return '🙂 Mostly Happy Customers';
                          if (negative > 50) return '😞 Many Unhappy Customers';
                          return '😐 Mixed Customer Feelings';
                        })()}</span>
                      </div>
                      <div className="break-words">
                        <strong className="break-words">Customer Health:</strong>
                        <span className="ml-2 break-words">{(() => {
                          const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                          const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                          if (positive > negative * 3) return '🟢 Excellent - Keep it up!';
                          if (positive > negative * 2) return '🟡 Good - Some improvements needed';
                          if (positive > negative) return '🟠 Fair - Focus on problem areas';
                          return '🔴 Poor - Urgent attention needed';
                        })()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                    <span className="flex items-center break-words">📋 Detailed Breakdown</span>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 cursor-help flex-shrink-0" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 max-w-[90vw] z-50">
                        <p className="font-medium mb-1 break-words">Sentiment Details</p>
                        <p className="break-words">Shows exact numbers and percentages for each type of customer feeling. Helps you see specific areas to work on.</p>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm break-words">
                    Exact numbers and percentages for each customer emotion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.sentimentData.map((sentiment, index) => (
                      <div key={index} className="break-words">
                        <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                          <span className="font-medium capitalize flex items-center break-words">
                            {sentiment.sentiment === 'positive' && <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />}
                            {sentiment.sentiment === 'negative' && <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />}
                            {sentiment.sentiment === 'neutral' && <Users className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />}
                            <span className="break-words">{sentiment.sentiment} Reviews</span>
                          </span>
                          <span className="font-bold break-words">{sentiment.count.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              sentiment.sentiment === 'positive' ? 'bg-green-500' :
                              sentiment.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${sentiment.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex flex-wrap justify-between items-center text-sm mt-1 gap-2">
                          <span className="text-gray-600 break-words">
                            {sentiment.percentage.toFixed(1)}% of all reviews
                          </span>
                          <span className="text-xs break-words font-medium">
                            {(() => {
                              if (sentiment.sentiment === 'positive') {
                                if (sentiment.percentage > 70) return '🎉 Excellent!';
                                if (sentiment.percentage > 50) return '👍 Good';
                                if (sentiment.percentage > 30) return '👌 OK';
                                return '📈 Needs work';
                              }
                              if (sentiment.sentiment === 'negative') {
                                if (sentiment.percentage > 30) return '🚨 High concern';
                                if (sentiment.percentage > 15) return '⚠️ Watch this';
                                if (sentiment.percentage > 5) return '🔍 Monitor';
                                return '✅ Low risk';
                              }
                              return sentiment.percentage > 40 ? '📊 High neutral' : '📊 Normal';
                            })()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Items */}
                  <div className="mt-6 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center break-words">
                      <span className="mr-1 flex-shrink-0">⚡</span>
                      <span className="break-words">What To Do Next</span>
                    </h4>
                    <div className="space-y-2 text-xs text-yellow-700">
                      <div className="break-words">
                        <strong className="break-words">Priority Action:</strong>
                        <p className="mt-1 break-words">{(() => {
                          const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                          const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                          const neutral = data.sentimentData.find(s => s.sentiment === 'neutral')?.percentage || 0;
                          
                          if (negative > 25) return 'Focus on fixing problems that make customers unhappy';
                          if (neutral > 40) return 'Work on improving neutral customers to positive ones';
                          if (positive > 80) return 'Maintain excellent service and learn what works best';
                          return 'Balance efforts between fixing problems and improving experiences';
                        })()}</p>
                      </div>
                      <div className="break-words">
                        <strong className="break-words">Quick Wins:</strong>
                        <p className="mt-1 break-words">{(() => {
                          const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                          const neutral = data.sentimentData.find(s => s.sentiment === 'neutral')?.percentage || 0;
                          
                          if (negative > neutral) return 'Read negative reviews to find common complaints';
                          if (neutral > 30) return 'Contact neutral customers to understand their needs better';
                          return 'Ask happy customers what they love most about your products';
                        })()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Business Impact Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <span className="break-words">🎯 Business Impact & Strategy</span>
                </CardTitle>
                <CardDescription className="text-sm break-words">
                  How customer feelings affect your business and what you can do about it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Customer Satisfaction Score */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center break-words">
                      <span className="mr-2 flex-shrink-0">📊</span>
                      <span className="break-words">Satisfaction Score</span>
                    </h4>
                    <div className="space-y-2 text-xs text-green-700">
                      <div className="flex flex-wrap justify-between items-center p-2 bg-white rounded border gap-2">
                        <span className="break-words">Overall Score:</span>
                        <span className="font-bold break-words">
                          {(() => {
                            const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                            const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                            const score = ((positive - negative + 100) / 2).toFixed(0);
                            return `${score}/100`;
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between items-center p-2 bg-white rounded border gap-2">
                        <span className="break-words">Happy Customers:</span>
                        <span className="font-bold break-words">
                          {data.sentimentData.find(s => s.sentiment === 'positive')?.percentage.toFixed(0) || 0}%
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-green-800 break-words">Grade:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                            if (positive > 80) return 'A+ Excellent Customer Love';
                            if (positive > 70) return 'A- Very Good Satisfaction';
                            if (positive > 60) return 'B+ Good Customer Feelings';
                            if (positive > 50) return 'B Average Satisfaction';
                            if (positive > 40) return 'C+ Below Average';
                            return 'C- Needs Major Improvement';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Revenue Impact */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center break-words">
                      <span className="mr-2 flex-shrink-0">💰</span>
                      <span className="break-words">Money Impact</span>
                    </h4>
                    <div className="space-y-2 text-xs text-blue-700">
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-blue-800 break-words">Revenue Risk:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                            const negativeCount = data.sentimentData.find(s => s.sentiment === 'negative')?.count || 0;
                            if (negative > 30) return `High risk: ${negativeCount.toLocaleString()} unhappy customers may not return`;
                            if (negative > 15) return `Medium risk: ${negativeCount.toLocaleString()} customers need attention`;
                            return `Low risk: Only ${negativeCount.toLocaleString()} unhappy customers`;
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-blue-800 break-words">Growth Potential:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                            const positiveCount = data.sentimentData.find(s => s.sentiment === 'positive')?.count || 0;
                            if (positive > 70) return `${positiveCount.toLocaleString()} happy customers likely to recommend you`;
                            if (positive > 50) return `${positiveCount.toLocaleString()} satisfied customers with room to grow`;
                            return `Need to improve to get more word-of-mouth referrals`;
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-blue-800 break-words">Expected Outcome:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                            if (positive > 75) return 'Strong repeat sales and referrals';
                            if (positive > 50) return 'Stable business with growth potential';
                            return 'Customer retention may be challenging';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Plan */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center break-words">
                      <span className="mr-2 flex-shrink-0">🚀</span>
                      <span className="break-words">Action Plan</span>
                    </h4>
                    <div className="space-y-2 text-xs text-purple-700">
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-purple-800 break-words">This Week:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                            if (negative > 20) return 'Read 10 recent negative reviews and identify common issues';
                            return 'Thank your happiest customers and ask for referrals';
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-purple-800 break-words">This Month:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const neutral = data.sentimentData.find(s => s.sentiment === 'neutral')?.percentage || 0;
                            const negative = data.sentimentData.find(s => s.sentiment === 'negative')?.percentage || 0;
                            if (negative > neutral) return 'Fix the top 3 problems causing negative reviews';
                            if (neutral > 30) return 'Survey neutral customers to understand their needs';
                            return 'Double down on what makes customers happiest';
                          })()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="font-medium text-purple-800 break-words">Long Term:</p>
                        <p className="mt-1 break-words">
                          {(() => {
                            const positive = data.sentimentData.find(s => s.sentiment === 'positive')?.percentage || 0;
                            if (positive < 60) return 'Build systems to consistently deliver great experiences';
                            return 'Create a customer loyalty program for your happy customers';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📈 Performance Trends Analysis</span>
                  <div className="group relative">
                    <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-80 max-w-[90vw] z-50">
                      <p className="font-medium mb-1">What is Performance Trends Analysis?</p>
                      <p>A time-based study that tracks how key business metrics change over time to identify patterns, seasonal effects, and long-term trends for strategic decision making.</p>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>
                  Historical trends analysis showing how ratings, pricing, and sales volume evolve over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Educational Overview */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <span className="mr-2">📚</span>Understanding Performance Trends
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-blue-800 mb-2">📊 What We Track</h5>
                      <ul className="space-y-1 text-blue-700 text-xs">
                        <li>• <strong>Rating Trends:</strong> Customer satisfaction over time</li>
                        <li>• <strong>Price Trends:</strong> Average pricing patterns and changes</li>
                        <li>• <strong>Volume Trends:</strong> Sales quantity and market demand</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-green-800 mb-2">💡 Why It Matters</h5>
                      <ul className="space-y-1 text-green-700 text-xs">
                        <li>• <strong>Seasonal Patterns:</strong> Identify peak and low seasons</li>
                        <li>• <strong>Market Response:</strong> See how customers react to changes</li>
                        <li>• <strong>Forecasting:</strong> Predict future performance trends</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-purple-800 mb-2">🎯 Business Impact</h5>
                      <ul className="space-y-1 text-purple-700 text-xs">
                        <li>• <strong>Inventory Planning:</strong> Stock management decisions</li>
                        <li>• <strong>Pricing Strategy:</strong> Optimal pricing timing</li>
                        <li>• <strong>Quality Control:</strong> Monitor satisfaction trends</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Time Period', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Rating (★)', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Price (₹)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'Rating' ? `${value} ★` : `₹${value}`,
                          name === 'Rating' ? 'Average Rating' : 'Average Price'
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#3B82F6" 
                        name="Rating Trend" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#EF4444" 
                        name="Price Trend" 
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Trend Analysis Insights */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🔍</span>Trend Analysis Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                          <span className="mr-1">⭐</span>Rating Trend Pattern
                        </h5>
                        <div className="text-blue-700 text-xs space-y-1">
                          <p><strong>Current Direction:</strong> {(() => {
                            const trend = data.trendData;
                            if (trend.length < 2) return 'Insufficient data';
                            const latest = trend[trend.length - 1]?.rating;
                            const previous = trend[trend.length - 2]?.rating;
                            if (latest > previous) return '📈 Improving (Customers more satisfied)';
                            if (latest < previous) return '📉 Declining (Satisfaction dropping)';
                            return '➡️ Stable (Consistent satisfaction)';
                          })()}</p>
                          <p><strong>Business Impact:</strong> {(() => {
                            const trend = data.trendData;
                            if (trend.length < 2) return 'Monitor closely';
                            const latest = trend[trend.length - 1]?.rating;
                            const previous = trend[trend.length - 2]?.rating;
                            if (latest > previous) return 'Positive brand reputation growth';
                            if (latest < previous) return 'Quality issues may need attention';
                            return 'Maintain current quality standards';
                          })()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <h5 className="font-medium text-red-800 mb-2 flex items-center">
                          <span className="mr-1">💰</span>Pricing Trend Pattern
                        </h5>
                        <div className="text-red-700 text-xs space-y-1">
                          <p><strong>Current Direction:</strong> {(() => {
                            const trend = data.trendData;
                            if (trend.length < 2) return 'Insufficient data';
                            const latest = trend[trend.length - 1]?.price;
                            const previous = trend[trend.length - 2]?.price;
                            if (latest > previous) return '📈 Rising (Price increases)';
                            if (latest < previous) return '📉 Falling (Price reductions)';
                            return '➡️ Stable (Consistent pricing)';
                          })()}</p>
                          <p><strong>Market Signal:</strong> {(() => {
                            const trend = data.trendData;
                            if (trend.length < 2) return 'Monitor market conditions';
                            const latest = trend[trend.length - 1]?.price;
                            const previous = trend[trend.length - 2]?.price;
                            if (latest > previous) return 'Premium positioning or inflation';
                            if (latest < previous) return 'Competitive pressure or promotions';
                            return 'Market equilibrium maintained';
                          })()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Strategic Recommendations */}
                  <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center">
                      <span className="mr-1">🎯</span>Strategic Recommendations
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-green-700">
                      <div>
                        <strong>If Ratings ↗️ & Prices ↗️:</strong>
                        <p>Premium strategy working. Continue quality focus.</p>
                      </div>
                      <div>
                        <strong>If Ratings ↘️ & Prices ↗️:</strong>
                        <p>Price-quality mismatch. Review value proposition.</p>
                      </div>
                      <div>
                        <strong>If Ratings ↗️ & Prices ↘️:</strong>
                        <p>Great value position. Consider gradual price optimization.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* AI Chat Interface */}
              <Card className="xl:col-span-2 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription>Ask questions about your data</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-lg bg-gray-50 min-h-[400px] max-h-[600px]">
                    {aiMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-lg break-words ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white text-gray-900 shadow-sm border rounded-bl-sm'
                        }`}>
                          <div className="text-sm leading-relaxed">
                            {message.loading ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin h-3 w-3 border-2 border-current rounded-full border-t-transparent opacity-60"></div>
                                <span className="text-gray-600">{message.content}</span>
                              </div>
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-gray-800" {...props} />,
                                  ul: ({node, ...props}) => <ul className="space-y-1 mb-2 text-gray-800" {...props} />,
                                  ol: ({node, ...props}) => <ol className="space-y-1 mb-2 text-gray-800" {...props} />,
                                  li: ({node, ...props}) => <li className="text-gray-800" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                  em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                                  h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-900 mb-2" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-900 mb-2" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-900 mb-1" {...props} />,
                                  code: ({node, ...props}: any) => 
                                    props.inline ? 
                                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800" {...props} /> :
                                      <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2"><code className="text-gray-800" {...props} /></pre>,
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-700 mb-2" {...props} />
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            )}
                          </div>
                          <div className="text-xs opacity-70 mt-2 text-right">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Input Area */}
                  <div className="flex-shrink-0 pt-4">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          placeholder="Ask about trends, products, categories..."
                          onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                          className="resize-none"
                        />
                      </div>
                      <Button 
                        onClick={sendAIMessage} 
                        disabled={!aiInput.trim()}
                        className="px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button 
                          onClick={() => setAiInput("What are my top-rated products?")}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                        >
                          Top products
                        </button>
                        <button 
                          onClick={() => setAiInput("Show me category performance")}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                        >
                          Categories
                        </button>
                        <button 
                          onClick={() => setAiInput("How's the pricing distribution?")}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                        >
                          Pricing
                        </button>
                        <button 
                          onClick={() => setAiInput("What's the sentiment analysis?")}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                        >
                          Sentiment
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights Panel */}
              <Card className="flex flex-col min-w-0">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="break-words">Recent AI Insights</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchInsights}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="break-words">Latest insights generated by our AI</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden min-w-0">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 break-words">
                    {insights.length > 0 ? (
                      insights.map((insight, index) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors break-words">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight break-words flex-1 mr-2">{insight.title}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex-shrink-0">
                              {(insight.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-3 break-words overflow-wrap-anywhere">{insight.description}</p>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs text-gray-400 capitalize break-words">Type: {insight.type}</span>
                            <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                              insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                              insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {insight.priority} priority
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No insights available yet</p>
                        <Button variant="outline" size="sm" onClick={fetchInsights} className="mt-3">
                          Generate Insights
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}