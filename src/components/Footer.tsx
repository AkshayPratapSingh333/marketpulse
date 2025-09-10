import React from 'react';
import { BarChart3, Github, Mail, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">MarketPulse</span>
            </div>
            <p className="text-gray-600 mb-4">
              Transform your sales data into actionable insights with advanced ETL pipelines, 
              AI-driven analytics, and interactive visualizations.
            </p>
            <div className="flex space-x-4">
              <Github className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Mail className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Globe className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Features
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">ETL Pipeline</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">AI Insights</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Data Visualization</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Sentiment Analysis</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Technology
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Next.js 15</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">LangChain</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Prisma ORM</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Gemini AI</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 MarketPulse Platform. Built with modern web technologies.
          </p>
        </div>
      </div>
    </footer>
  );
}