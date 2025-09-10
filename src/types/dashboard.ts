export interface ChartDataPoint {
  name: string
  value: number
  category?: string
  rating?: number
  price?: number
  count?: number
}

export interface TrendData {
  category: string
  data: Array<{
    date: string
    value: number
    rating: number
    count: number
  }>
}

export interface SentimentDistribution {
  positive: number
  negative: number
  neutral: number
}

export interface CorrelationMatrix {
  variables: string[]
  values: number[][]
}

export interface InsightCard {
  id: string
  title: string
  value: string | number
  change?: number
  trend: 'up' | 'down' | 'stable'
  description: string
  actionable?: string
}

export interface DashboardData {
  overview: {
    totalProducts: number
    averageRating: number
    averagePrice: number
    topCategory: string
  }
  trends: TrendData[]
  sentiments: {
    distribution: SentimentDistribution
    byCategory: Array<{
      category: string
      sentiment: SentimentDistribution
    }>
  }
  insights: InsightCard[]
  recommendations: Array<{
    id: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    category: string
  }>
}

export interface FilterOptions {
  categories: string[]
  priceRange: {
    min: number
    max: number
  }
  ratingRange: {
    min: number
    max: number
  }
  dateRange: {
    start: Date
    end: Date
  }
}