"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Brain, Database, TrendingUp, Users, Star, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface StatsData {
  totalProducts: number;
  totalCategories: number;
  averageRating: number;
  recentUploads: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Upload,
      title: "CSV Data Upload",
      description: "Upload your sales data in CSV format with automated validation and preprocessing",
      color: "bg-blue-500"
    },
    {
      icon: Database,
      title: "ETL Pipeline",
      description: "Automated Extract, Transform, Load pipeline with data cleaning and normalization",
      color: "bg-green-500"
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "LangChain-powered AI agent generates intelligent insights and recommendations",
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      title: "Interactive Analytics",
      description: "Rich visualizations with Recharts, D3.js and correlation analysis",
      color: "bg-orange-500"
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Track sales trends, seasonal patterns, and market performance over time",
      color: "bg-red-500"
    },
    {
      icon: Users,
      title: "Sentiment Analysis",
      description: "Natural language processing for customer review sentiment and word clouds",
      color: "bg-cyan-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              ETL-Powered AI Analytics
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Transform your sales data into actionable insights with advanced ETL pipelines, 
              AI-driven analytics, and interactive visualizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Data
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </CardContent>
            </Card>
            
            <Card className="text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalCategories}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </CardContent>
            </Card>
            
            <Card className="text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </CardContent>
            </Card>
            
            <Card className="text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.recentUploads}</div>
                <div className="text-sm text-gray-600">Recent Uploads</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Features Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to transform raw data into actionable business insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tech Stack Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-50 py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-gray-600">Powered by the latest in web development and AI</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-center">
            {[
              { name: "Next.js 15", logo: "⚡" },
              { name: "TypeScript", logo: "📘" },
              { name: "Prisma ORM", logo: "🔺" },
              { name: "LangChain", logo: "🔗" },
              { name: "Gemini AI", logo: "🤖" },
              { name: "Tailwind CSS", logo: "🎨" }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">{tech.logo}</div>
                <div className="text-sm font-medium text-gray-700">{tech.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 py-20"
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start analyzing your sales data with our advanced ETL and AI-powered platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3">
                <Upload className="mr-2 h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
                <Brain className="mr-2 h-5 w-5" />
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Start Guide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">Get insights from your data in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Upload Your Data",
              description: "Upload CSV files containing your sales data. Our system automatically validates and processes the data.",
              icon: Upload
            },
            {
              step: "2", 
              title: "AI Processing",
              description: "Our ETL pipeline cleans your data while AI analyzes patterns, sentiment, and generates insights.",
              icon: Brain
            },
            {
              step: "3",
              title: "Get Insights",
              description: "View interactive dashboards, get recommendations, and export detailed analytics reports.",
              icon: BarChart3
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="text-center"
            >
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}