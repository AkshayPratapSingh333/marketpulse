# MARKETPULSE - ETL PIPELINE & AI ARCHITECTURE
## Technical Documentation

---

# SECTION 1: SYSTEM OVERVIEW

## 1.1 What is MarketPulse?
MarketPulse is an E-commerce Analytics Platform that:
- Processes CSV product data through ETL pipeline
- Performs AI-powered sentiment analysis on customer reviews
- Generates product recommendations
- Creates actionable business insights using Gemini AI

## 1.2 High-Level Architecture

```
+-------------------+      +------------------+      +------------------+
|    FRONTEND       |      |     BACKEND      |      |    DATABASE      |
|    (Next.js)      | <--> |   (API Routes)   | <--> |     (MySQL)      |
+-------------------+      +------------------+      +------------------+
        |                          |
        v                          v
+-------------------+      +------------------+
|   COMPONENTS      |      |   AI MODULES     |
| - Upload Page     |      | - Sentiment      |
| - Dashboard       |      | - Recommendations|
| - Charts          |      | - LangChain      |
+-------------------+      +------------------+
```

---

# SECTION 2: TECHNOLOGY STACK

## 2.1 Complete Tech Stack Table

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend Framework | Next.js | 15.5.2 | React framework with SSR |
| UI Library | React | 19.1.0 | Component-based UI |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Components | Radix UI | - | Accessible UI primitives |
| Charts | Recharts | 3.2.0 | React charts library |
| Icons | Lucide React | 0.543.0 | Icon library |
| Database | MySQL | - | Relational database |
| ORM | Prisma | 6.16.0 | Type-safe database client |
| CSV Parsing | PapaParse | 5.5.3 | CSV parser |
| Data Utils | Lodash | 4.17.21 | Utility functions |
| NLP | Natural | 8.1.0 | Natural language processing |
| Sentiment | Sentiment.js | 5.0.2 | Sentiment scoring |
| LLM | Google Gemini | 0.24.1 | Generative AI |
| Auth | NextAuth.js | 4.24.11 | Authentication |

## 2.2 Why These Technologies?

### PapaParse for CSV Parsing
- **Streaming support** for large files
- **Auto-detection** of delimiters (comma, tab, semicolon)
- **Dynamic typing** converts strings to numbers automatically
- **Browser and Node.js** compatible

### Lodash for Data Transformation
- **_.chunk()** for batch processing
- **_.mean()** for calculating averages
- **_.groupBy()** for data aggregation
- **_.countBy()** for frequency analysis

### Natural.js for NLP
- **WordTokenizer** splits text into words
- **PorterStemmer** reduces words to root form
- **Stop word removal** filters common words

### Sentiment.js for Analysis
- **AFINN-165 lexicon** with 3,382 scored words
- **Negation handling** ("not good" = negative)
- **Comparative scoring** normalized by text length

### Google Gemini for AI
- **Fast inference** with gemini-1.5-flash
- **Natural language** query understanding
- **Context-aware** responses

---

# SECTION 3: ETL PIPELINE

## 3.1 What is ETL?

ETL stands for Extract-Transform-Load:
- **Extract**: Read raw data from CSV files
- **Transform**: Clean, validate, and enrich data
- **Load**: Store processed data in database

## 3.2 ETL Architecture Diagram

```
CSV FILE
    |
    v
+------------------+
|   EXTRACT        |  <- PapaParse library
|   extract.ts     |
|                  |
| - Parse CSV      |
| - Detect columns |
| - Quality report |
+------------------+
    |
    | RawCSVData[]
    v
+------------------+
|   TRANSFORM      |  <- Lodash library
|   transform.ts   |
|                  |
| - Map columns    |
| - Clean data     |
| - Fill missing   |
| - Remove outliers|
| - Add features   |
+------------------+
    |
    | CleanedProductData[]
    v
+------------------+
|   LOAD           |  <- Prisma ORM
|   load.ts        |
|                  |
| - Batch insert   |
| - Generate stats |
| - Log job status |
+------------------+
    |
    v
MySQL DATABASE
```

## 3.3 Extract Phase (extract.ts)

### File Location
`src/lib/etl/extract.ts`

### Class: DataExtractor

### Key Methods:

**1. extractFromFile(file: File)**
```
Purpose: Parse uploaded CSV file
Process:
  1. Read file as text using file.text()
  2. Pass to Papa.parse() with options
  3. Return { data, errors, meta, totalRecords }
```

**2. detectColumnMapping(headers: string[])**
```
Purpose: Auto-map CSV columns to standard names
Example Mappings:
  - "product_name" -> "productName"
  - "discounted_price" -> "discountedPrice"
  - "rating_count" -> "ratingCount"
```

**3. getDataQualityReport(data: RawCSVData[])**
```
Purpose: Analyze data quality before transformation
Returns:
  - totalRecords: count of rows
  - missingValues: { column: count }
  - duplicateRecords: count
  - columnStats: type, min, max, mean
```

## 3.4 Transform Phase (transform.ts)

### File Location
`src/lib/etl/transform.ts`

### Class: DataTransformer

### 6-Step Pipeline:

**Step 1: Column Mapping**
```
Input:  { "product_name": "Phone" }
Output: { "productName": "Phone" }
```

**Step 2: Data Cleaning**
- cleanText(): Remove special characters, trim whitespace
- cleanPrice(): Extract numeric value from "₹1,299"
- cleanRating(): Clamp value between 0-5
- cleanUrl(): Validate URL format

**Step 3: Fill Missing Values**
- Numeric fields: Fill with MEAN
- Categorical fields: Fill with MODE
- Example: Missing rating -> Dataset average

**Step 4: Remove Outliers (IQR Method)**
```
Formula:
  Q1 = 25th percentile
  Q3 = 75th percentile
  IQR = Q3 - Q1
  Valid Range = [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
  
Values outside range are removed
Applied to: price, actualPrice, rating
```

**Step 5: Feature Engineering**
```
New Features Created:
  - priceRange: "Low (<₹500)", "Medium", "High", "Premium"
  - discountPercentage: ((actual - discounted) / actual) * 100
  - meanRating: Same as rating (for aggregation)
```

**Step 6: Final Validation**
```
Validation Rules:
  - productName exists
  - prices > 0
  - rating between 0-5
  - discountedPrice <= actualPrice
```

## 3.5 Load Phase (load.ts)

### File Location
`src/lib/etl/load.ts`

### Class: DataLoader

### Process:

**1. Create ETL Job Log**
```sql
INSERT INTO etl_job_logs (id, fileName, status, startTime)
VALUES ('job_123', 'products.csv', 'started', NOW())
```

**2. Batch Processing**
```
- Split data into batches of 100 records
- For each batch:
  - Upsert each record (insert or update)
  - Update job progress
  - Handle errors gracefully
```

**3. Post-Load Aggregations**
```
generateCategoryInsights():
  - GROUP BY category
  - Calculate avg rating, price, count
  - Store in category_insights table

generateTrendAnalysis():
  - Analyze price range distribution
  - Store in trend_analyses table
```

**4. Update Job Status**
```sql
UPDATE etl_job_logs
SET status = 'completed',
    recordsSuccess = 1000,
    endTime = NOW()
WHERE id = 'job_123'
```

---

# SECTION 4: AI MODULE - SENTIMENT ANALYSIS

## 4.1 Overview

### File Location
`src/lib/ai/sentiment.ts`

### Purpose
Analyze customer review text to determine emotional tone:
- Positive (satisfied customers)
- Negative (unsatisfied customers)
- Neutral (factual reviews)

## 4.2 Architecture

```
Customer Review
      |
      v
+------------------+
| PREPROCESSING    |
| - Lowercase      |
| - Remove symbols |
| - Tokenize       |
+------------------+
      |
      v
+------------------+
| SENTIMENT.JS     |
| - AFINN-165      |
| - Score words    |
| - Handle negation|
+------------------+
      |
      v
+------------------+
| NORMALIZE        |
| - Scale to -1,+1 |
| - Assign label   |
| - Calculate conf |
+------------------+
      |
      v
+------------------+
| KEYWORD EXTRACT  |
| - Porter Stemmer |
| - Remove stops   |
| - Top 10 words   |
+------------------+
      |
      v
{ score, label, confidence, keywords }
```

## 4.3 Libraries Used

### Natural.js (natural@8.1.0)
```
Components Used:
  - WordTokenizer: Split text into words
  - PorterStemmer: Reduce words to root
    Example: "running" -> "run"
```

### Sentiment.js (sentiment@5.0.2)
```
Features:
  - AFINN-165 word list (3,382 words)
  - Each word scored from -5 to +5
  - Examples:
    "excellent" = +3
    "terrible" = -3
    "good" = +2
    "bad" = -2
```

## 4.4 Key Methods

### analyzeSentiment(text: string)
```typescript
Input: "This product is excellent! Great quality."
Process:
  1. Preprocess: "this product is excellent great quality"
  2. Sentiment.analyze() -> score: 5
  3. Normalize: 5/10 = 0.5
  4. Label: score > 0.1 -> "positive"
  5. Confidence: min(|0.5| * 2, 1) = 1.0
  6. Keywords: ["product", "excel", "great", "qualiti"]
Output: { score: 0.5, label: "positive", confidence: 1.0, keywords: [...] }
```

### analyzeProductReviews()
```typescript
Process:
  1. Fetch products WHERE sentimentScore IS NULL
  2. For each product:
     - Combine reviewTitle + userReview
     - Call analyzeSentiment()
     - Update product.sentimentScore
     - Create SentimentAnalysis record
  3. Return { processed, updated, errors }
```

### getSentimentDistribution()
```typescript
Returns:
{
  distribution: { positive: 450, negative: 120, neutral: 230 },
  byCategory: {
    "Electronics": { positive: 100, negative: 30, neutral: 50 }
  },
  trends: [{ date: "2026-01-02", positive: 15, negative: 3 }]
}
```

## 4.5 Scoring Formula

```
Raw Score = sum of word scores
Comparative = Raw Score / word count
Normalized Score = Raw Score / max expected score (10)

Label Assignment:
  if (normalized > 0.1)  -> "positive"
  if (normalized < -0.1) -> "negative"
  else                   -> "neutral"

Confidence Calculation:
  baseConfidence = min(|normalized| * 2, 1.0)
  comparativeBoost = min(|comparative| * 10, 0.3)
  confidence = min(baseConfidence + comparativeBoost, 1.0)
```

---

# SECTION 5: AI MODULE - RECOMMENDATION ENGINE

## 5.1 Overview

### File Location
`src/lib/ai/recommendations.ts`

### Purpose
Generate product suggestions using multiple algorithms:
- Content-based filtering
- Collaborative filtering
- Price-based recommendations
- Trending products

## 5.2 Architecture

```
+--------------------------------------------------+
|           HYBRID RECOMMENDATION SYSTEM            |
+--------------------------------------------------+
           |         |         |         |
           v         v         v         v
     +---------+ +---------+ +---------+ +---------+
     | CONTENT | | COLLAB  | | PRICE   | | TRENDING|
     | BASED   | | FILTER  | | BASED   | | PRODUCTS|
     | (0.9x)  | | (0.8x)  | | (0.7x)  | | (0.6x)  |
     +---------+ +---------+ +---------+ +---------+
           |         |         |         |
           +----+----+----+----+----+----+
                |
                v
         +-------------+
         | MERGE &     |
         | RANK BY     |
         | SIMILARITY  |
         +-------------+
                |
                v
         ProductRecommendation[]
```

## 5.3 Algorithm 1: Content-Based Filtering

### Purpose
Find products similar to a given product

### Similarity Calculation
```
Similarity = weighted sum of:
  - Category Match (40%): 0.4 if same category
  - Price Similarity (20%): 1 - |price1 - price2| / max(prices)
  - Rating Similarity (30%): 1 - |rating1 - rating2| / 5
  - Price Range Match (10%): 0.1 if same range
```

### Example
```
Target Product: iPhone 15 (Electronics, ₹79,999, 4.5 rating)

Candidate: Samsung Galaxy (Electronics, ₹74,999, 4.4 rating)
  Category: 0.4 (same)
  Price: 1 - |79999-74999|/79999 = 0.94 * 0.2 = 0.188
  Rating: 1 - |4.5-4.4|/5 = 0.98 * 0.3 = 0.294
  Total: 0.4 + 0.188 + 0.294 = 0.882
```

## 5.4 Algorithm 2: Collaborative Filtering

### Purpose
Recommend based on user preference patterns

### Process
```
1. Get categories of products user viewed/purchased
2. Calculate average rating and price of those products
3. Find products in same categories with:
   - Similar rating (within ±0.5)
   - Similar price (0.5x to 2x of average)
4. Score = (ratingSimilarity * 0.6) + (priceSimilarity * 0.4)
```

## 5.5 Algorithm 3: Price-Based

### Purpose
Find products in specific budget range

### Query Logic
```sql
SELECT * FROM products
WHERE discountedPrice BETWEEN :minPrice AND :maxPrice
  AND rating >= 3.5
ORDER BY rating DESC, discountPercentage DESC
LIMIT :limit
```

## 5.6 Algorithm 4: Trending Products

### Purpose
Recently added highly-rated products

### Query Logic
```sql
SELECT * FROM products
WHERE rating >= 4.0
  AND ratingCount >= 20
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY ratingCount DESC, rating DESC
LIMIT :limit
```

## 5.7 Hybrid Approach

### Process
```typescript
generateHybridRecommendations(options) {
  recommendations = new Map()
  
  // Layer 1: Content-based (weight: 0.9)
  similarProducts.forEach(rec => {
    rec.similarity *= 0.9
    recommendations.set(rec.productId, rec)
  })
  
  // Layer 2: Category-based (weight: 0.8)
  categoryRecs.forEach(rec => {
    if exists: max(existing, rec * 0.8)
    else: set(rec * 0.8)
  })
  
  // Layer 3: Price-based (weight: 0.7)
  // Layer 4: Top-rated fallback (weight: 0.6)
  
  return sortBy(similarity).slice(0, limit)
}
```

---

# SECTION 6: AI MODULE - LANGCHAIN AGENT

## 6.1 Overview

### File Location
`src/lib/ai/langchain-agent.ts`

### Purpose
- Process natural language queries about data
- Generate comprehensive business insights
- Provide conversational AI interface

## 6.2 Architecture

```
User Query: "What are the top products?"
                |
                v
       +------------------+
       | QUERY CLASSIFIER |
       | classifyQuery()  |
       +------------------+
                |
     +----------+----------+
     |          |          |
     v          v          v
 product   category    trend
 analysis  insights   analysis
     |          |          |
     v          v          v
+------------------+
| DATA RETRIEVAL   |
| DatabaseQueries  |
+------------------+
                |
                v
+------------------+
| PROMPT BUILDER   |
| Context + Query  |
+------------------+
                |
                v
+------------------+
| GEMINI AI MODEL  |
| gemini-1.5-flash |
| temp: 0.7        |
+------------------+
                |
                v
{ response, confidence, sources, reasoning }
```

## 6.3 Query Classification

### Keywords to Query Type Mapping
```
"product" + "top/best"     -> product_analysis
"category/categories"       -> category_insights
"trend/growth/over time"   -> trend_analysis
"recommend/suggest/similar" -> recommendation
"correlation/relationship"  -> correlation_analysis
default                    -> general
```

## 6.4 Insight Generation

### Types of Insights Generated

**1. Trend Insight**
```
Data Used: topProducts, categoryInsights
Output: "Electronics dominates with 45% market share..."
Confidence: 0.85
Priority: high
```

**2. Correlation Insight**
```
Data Used: correlationData (price vs rating, etc.)
Output: "Strong positive correlation between price and rating..."
Confidence: 0.90
Priority: medium
```

**3. Sentiment Insight**
```
Data Used: sentimentDistribution
Output: "75% positive customer sentiment indicates..."
Confidence: 0.80
Priority: high
```

**4. Category Insight**
```
Data Used: categoryInsights
Output: "Home & Kitchen shows highest growth..."
Confidence: 0.85
Priority: medium
```

**5. Pricing Insight**
```
Data Used: descriptiveStatistics
Output: "Products priced between ₹1000-5000 show best ratings..."
Confidence: 0.75
Priority: medium
```

## 6.5 Prompt Engineering Example

```
Prompt for Product Analysis Query:

"Based on the following product data, answer the user's query: 
 'What are the top rated products?'

 Top Rated Products:
 - iPhone 15 (Electronics): Rating 4.8/5, Price ₹79,999
 - Sony Headphones (Electronics): Rating 4.7/5, Price ₹24,999
 - Samsung TV (Electronics): Rating 4.6/5, Price ₹54,999

 Least Rated Products:
 - Generic Cable (Accessories): Rating 2.1/5, Price ₹199
 - Unknown Brand Phone (Electronics): Rating 2.3/5, Price ₹4,999

 Provide insights and answer the user's question in a helpful, 
 analytical way."
```

## 6.6 Gemini AI Configuration

```typescript
Configuration:
  model: 'gemini-1.5-flash'
  temperature: 0.7  // Balanced creativity
  maxOutputTokens: 2048

Why these settings?
  - gemini-1.5-flash: Fast inference, good for real-time responses
  - temperature 0.7: Not too random, not too deterministic
  - 2048 tokens: Sufficient for detailed insights
```

---

# SECTION 7: DATABASE SCHEMA

## 7.1 Entity Relationship Diagram

```
+------------------+     +------------------------+
|     Product      |     |   SentimentAnalysis    |
+------------------+     +------------------------+
| id (PK)          |<----| productId (FK)         |
| productId        |     | reviewText             |
| productName      |     | sentimentScore         |
| category         |     | sentimentLabel         |
| discountedPrice  |     | confidence             |
| actualPrice      |     | keywords (JSON)        |
| rating           |     +------------------------+
| ratingCount      |
| userReview       |     +------------------------+
| sentimentScore   |     | ProductRecommendation  |
| sentimentLabel   |     +------------------------+
| priceRange       |<----| sourceProductId (FK)   |
+------------------+     | recommendedProductId   |
                         | similarity             |
                         | reason                 |
                         +------------------------+

+------------------+     +------------------+
| CategoryInsight  |     |   TrendAnalysis  |
+------------------+     +------------------+
| category (unique)|     | analysisType     |
| totalProducts    |     | period           |
| averageRating    |     | metrics (JSON)   |
| averagePrice     |     +------------------+
| averageDiscount  |
| topRatedProduct  |     +------------------+
+------------------+     |    AIInsight     |
                         +------------------+
+------------------+     | insightType      |
|   ETLJobLog      |     | title            |
+------------------+     | description      |
| fileName         |     | data (JSON)      |
| status           |     | confidence       |
| recordsProcessed |     +------------------+
| recordsSuccess   |
| recordsError     |
| duration         |
+------------------+
```

## 7.2 Key Tables

### Product Table
```sql
CREATE TABLE products (
  id VARCHAR(25) PRIMARY KEY,
  productId VARCHAR(255) UNIQUE,
  productName TEXT,
  category TEXT,
  discountedPrice FLOAT,
  actualPrice FLOAT,
  discountPercentage FLOAT,
  rating FLOAT,
  ratingCount INT,
  userReview TEXT,
  sentimentScore FLOAT,
  sentimentLabel VARCHAR(20),
  priceRange VARCHAR(50),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### SentimentAnalysis Table
```sql
CREATE TABLE sentiment_analyses (
  id VARCHAR(25) PRIMARY KEY,
  productId VARCHAR(25) REFERENCES products(id),
  reviewText TEXT,
  sentimentScore FLOAT,
  sentimentLabel VARCHAR(20),
  confidence FLOAT,
  keywords JSON,
  createdAt TIMESTAMP
);
```

---

# SECTION 8: FRONTEND-BACKEND INTEGRATION

## 8.1 Component to API Mapping

```
FRONTEND COMPONENT          API ENDPOINT             BACKEND SERVICE
-----------------          ------------             ---------------

upload/page.tsx      POST   /api/upload             DataExtractor
                                                    DataTransformer
                                                    DataLoader
                                                    SentimentAnalyzer
                                                    LangChainAgent

ChatInterface.tsx    POST   /api/insights           LangChainAgent
                                                    .processQuery()

SentimentChart.tsx   GET    /api/sentiment          SentimentAnalyzer
                            ?type=distribution      .getDistribution()

dashboard/page.tsx   GET    /api/dashboard          DatabaseQueries
                                                    .getTopProducts()

ProductRecommend     GET    /api/recommendations    RecommendationEngine
                            ?productId=xxx          .generateHybrid()
```

## 8.2 API Route Examples

### POST /api/upload
```typescript
// Request
FormData with 'file' field

// Response
{
  success: true,
  data: {
    recordsProcessed: 1000,
    recordsSuccess: 985,
    recordsError: 15,
    jobId: "job_123",
    insights: [...],
    qualityReport: {...}
  }
}
```

### GET /api/sentiment?type=distribution
```typescript
// Response
{
  success: true,
  data: {
    distribution: { positive: 450, negative: 120, neutral: 230 },
    byCategory: {...},
    trends: [...]
  }
}
```

### POST /api/insights
```typescript
// Request
{ query: "What are the top selling categories?" }

// Response
{
  success: true,
  data: {
    response: "Based on the data, Electronics leads with...",
    timestamp: "2026-01-02T10:30:00Z"
  }
}
```

---

# SECTION 9: DATA FLOW SUMMARY

## Complete Flow: File Upload to Dashboard

```
1. USER UPLOADS CSV
   upload/page.tsx -> FormData -> POST /api/upload

2. ETL PIPELINE
   /api/upload/route.ts
   |-- DataExtractor.extractFromFile()
   |   |-- PapaParse -> RawCSVData[]
   |
   |-- DataTransformer.transform()
   |   |-- Clean -> Fill -> Outliers -> Features
   |
   |-- DataLoader.load()
   |   |-- Batch upsert -> MySQL
   |
   |-- SentimentAnalyzer.analyzeProductReviews()
   |   |-- Update sentimentScore, sentimentLabel
   |
   |-- LangChainAgent.generateInsights()
       |-- Create AIInsight records

3. RESPONSE TO FRONTEND
   { success, recordsLoaded, insights[], qualityReport }

4. DASHBOARD FETCHES DATA
   |-- GET /api/dashboard -> Product stats
   |-- GET /api/sentiment?type=distribution -> Pie chart data
   |-- GET /api/insights?type=recent -> AI insights
   |-- GET /api/recommendations -> Product suggestions

5. CHARTS RENDER
   |-- SentimentChart.tsx -> Recharts PieChart
   |-- TrendChart.tsx -> Recharts LineChart
   |-- CategoryChart.tsx -> Recharts BarChart
```

---

# SECTION 10: KEY TAKEAWAYS

## Libraries Summary

| Purpose | Library | Why |
|---------|---------|-----|
| CSV Parsing | PapaParse | Auto-detection, streaming |
| Data Utils | Lodash | Efficient array operations |
| Sentiment | Sentiment.js | AFINN-165 lexicon |
| NLP | Natural | Tokenization, stemming |
| AI | Google Gemini | Fast, contextual responses |
| Database | Prisma | Type-safe queries |
| Charts | Recharts | React-native components |

## File Locations

```
src/lib/etl/
  extract.ts      -> CSV parsing
  transform.ts    -> Data cleaning
  load.ts         -> Database loading

src/lib/ai/
  sentiment.ts        -> Review analysis
  recommendations.ts  -> Product suggestions
  langchain-agent.ts  -> AI insights

src/app/api/
  upload/         -> ETL trigger
  sentiment/      -> Sentiment data
  recommendations/-> Product recs
  insights/       -> AI insights

src/components/
  charts/         -> Visualizations
  ai/             -> ChatInterface
```

---

**Document Version:** 1.0
**Created:** January 2, 2026
**Project:** MarketPulse E-commerce Analytics
