// src/types/index.ts

export interface RawCSVData {
  product_id?: string;
  product_name?: string;
  category?: string;
  discounted_price?: string | number;
  actual_price?: string | number;
  discount_percentage?: string | number;
  rating?: string | number;
  rating_count?: string | number;
  about_product?: string;
  user_id?: string;
  user_name?: string;
  review_id?: string;
  review_title?: string;
  review_content?: string;
  img_link?: string;
  product_link?: string;
  [key: string]: any; // Allow for additional unknown fields
}

export interface CleanedProductData {
  productId?: string;
  productName: string;
  category: string;
  discountedPrice: number;
  actualPrice: number;
  discountPercentage: number;
  rating: number;
  ratingCount: number;
  about?: string;
  userId?: string;
  userName?: string;
  userReview?: string;
  reviewTitle?: string;
  imgLink?: string;
  productLink?: string;
  priceRange: string;
  meanRating: number;
  productCount: number;
  averageRatingCount: number;
}

export interface ETLResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errors: string[];
  jobId: string;
}

export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords?: string[];
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  rating: number;
  price: number;
  similarity: number;
  reason: string;
  imgLink?: string;
}

export interface CategoryInsight {
  category: string;
  totalProducts: number;
  averageRating: number;
  averagePrice: number;
  averageDiscount: number;
  topRatedProduct?: string;
  growthRate?: number;
  sentimentDistribution?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface TrendData {
  period: string;
  value: number;
  category?: string;
  type: 'sales' | 'rating' | 'price' | 'discount';
}

export interface CorrelationData {
  variable1: string;
  variable2: string;
  correlation: number;
  pValue?: number;
  significance: 'high' | 'medium' | 'low';
}

export interface PriceRangeDistribution {
  range: string;
  count: number;
  averageRating: number;
  percentage: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  category: string;
  rating: number;
  ratingCount: number;
  price: number;
  discountPercentage: number;
  imgLink?: string;
}

export interface LeastRatedProduct {
  productId: string;
  productName: string;
  category: string;
  rating: number;
  ratingCount: number;
  price: number;
  reasons: string[];
}

export interface CategoryRatingData {
  category: string;
  averageRating: number;
  productCount: number;
  ratingDistribution: {
    [rating: string]: number;
  };
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
  totalReviews: number;
}

export interface WordCloudData {
  text: string;
  value: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'sentiment' | 'correlation' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  data: any;
  createdAt: Date;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ChartData {
  name: string;
  value: number;
  category?: string;
  color?: string;
  [key: string]: any;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  min: number;
  max: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface DataQualityReport {
  totalRecords: number;
  missingValues: {
    [column: string]: number;
  };
  duplicateRecords: number;
  dataTypes: {
    [column: string]: string;
  };
  outliers: {
    [column: string]: number[];
  };
  completeness: number; // Percentage
}

export interface RecommendationEngine {
  type: 'collaborative' | 'content_based' | 'hybrid';
  algorithm: string;
  parameters: {
    [key: string]: any;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// Component Props Types
export interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  accept?: string;
}

export interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
}

export interface TableColumn {
  key: string;
  header: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface ChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  title?: string;
  showLegend?: boolean;
  responsive?: boolean;
}

export interface DashboardState {
  isLoading: boolean;
  data: {
    products: TopProduct[];
    categories: CategoryInsight[];
    trends: TrendData[];
    sentiment: SentimentDistribution;
    recommendations: ProductRecommendation[];
    insights: AIInsight[];
  };
  filters: {
    category?: string;
    priceRange?: [number, number];
    ratingRange?: [number, number];
    dateRange?: [Date, Date];
  };
  selectedMetric: 'sales' | 'rating' | 'price' | 'sentiment';
}

export interface LangChainConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AgentResponse {
  response: string;
  confidence: number;
  sources: string[];
  reasoning: string;
  actionType: 'query' | 'analysis' | 'recommendation';
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Form Types
export interface UploadFormData {
  file: File;
  delimiter?: string;
  hasHeader?: boolean;
  encoding?: string;
}

export interface FilterFormData {
  categories: string[];
  priceRange: [number, number];
  ratingRange: [number, number];
  dateRange: [Date, Date];
}