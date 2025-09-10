export interface AIInsight {
  id: string
  type: 'trend' | 'recommendation' | 'sentiment' | 'correlation' | 'prediction'
  title: string
  description: string
  confidence: number
  data: any
  actionable: string[]
  priority: 'high' | 'medium' | 'low'
  category?: string
  timestamp: Date
}

export interface RecommendationRequest {
  productId?: string
  userId?: string
  algorithm: 'content' | 'collaborative' | 'hybrid'
  limit: number
  filters?: {
    categories?: string[]
    priceRange?: {
      min: number
      max: number
    }
    minRating?: number
  }
}

export interface RecommendationResponse {
  recommendations: ProductRecommendation[]
  confidence: number
  algorithm: string
  metadata: {
    totalCandidates: number
    processingTime: number
    factors: string[]
  }
}

export interface ProductRecommendation {
  productId: string
  productName: string
  category: string
  rating: number
  price: number
  similarityScore: number
  recommendationType: 'content_based' | 'collaborative' | 'hybrid'
  reasons: string[]
}

export interface SentimentAnalysisRequest {
  text?: string
  productId?: string
  category?: string
  type: 'text' | 'product' | 'category' | 'overview'
}

export interface SentimentAnalysisResponse {
  sentiment: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
    confidence: number
    positiveWords: string[]
    negativeWords: string[]
  }
  analysis?: {
    overallSentiment: any
    keywordAnalysis: any
    emotionalAnalysis: any
    topics: string[]
    recommendations: string[]
  }
}

export interface InsightsRequest {
  query: string
  type: 'trends' | 'categories' | 'sentiment' | 'custom'
  context?: {
    productId?: string
    category?: string
    timeframe?: string
  }
}

export interface InsightsResponse {
  insights: string | any
  timestamp: string
  query: string
  type: string
  confidence?: number
  sources?: string[]
}

export interface AgentTool {
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface AgentResponse {
  output: string
  intermediateSteps?: Array<{
    action: string
    observation: string
  }>
  sources?: string[]
  confidence?: number
}