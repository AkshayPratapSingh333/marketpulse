# MarketPulse - ETL Pipeline & AI Architecture Documentation

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [ETL Pipeline Architecture](#3-etl-pipeline-architecture)
4. [AI Module 1: Sentiment Analysis](#4-ai-module-1-sentiment-analysis)
5. [AI Module 2: Recommendation Engine](#5-ai-module-2-recommendation-engine)
6. [AI Module 3: LangChain Agent](#6-ai-module-3-langchain-agent)
7. [Database Schema](#7-database-schema)
8. [Frontend-Backend Integration](#8-frontend-backend-integration)
9. [Data Flow Diagrams](#9-data-flow-diagrams)

---

## 1. System Overview

### 1.1 What is MarketPulse?
MarketPulse is an **E-commerce Analytics Platform** that processes product data through an ETL pipeline, performs AI-powered analysis (sentiment, recommendations, insights), and presents actionable insights through a dashboard.

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MARKETPULSE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐     ┌─────────────────────────────────────────────────────┐  │
│   │   FRONTEND   │     │                    BACKEND                          │  │
│   │   (Next.js)  │     │                                                     │  │
│   │              │     │  ┌─────────────────────────────────────────────┐   │  │
│   │  ┌────────┐  │     │  │              ETL PIPELINE                   │   │  │
│   │  │Upload  │──┼─────┼──┤  Extract → Transform → Load                 │   │  │
│   │  │Page    │  │     │  │  (PapaParse) (Lodash)   (Prisma)            │   │  │
│   │  └────────┘  │     │  └─────────────────────────────────────────────┘   │  │
│   │              │     │                      │                              │  │
│   │  ┌────────┐  │     │                      ▼                              │  │
│   │  │Dash-   │  │     │  ┌─────────────────────────────────────────────┐   │  │
│   │  │board   │◄─┼─────┼──┤              AI MODULES                      │   │  │
│   │  └────────┘  │     │  │                                             │   │  │
│   │              │     │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐  │   │  │
│   │  ┌────────┐  │     │  │  │Sentiment  │ │Recommend- │ │LangChain  │  │   │  │
│   │  │Chat    │──┼─────┼──┤  │Analyzer   │ │ation      │ │Agent      │  │   │  │
│   │  │Interface│ │     │  │  │(Natural)  │ │Engine     │ │(Gemini AI)│  │   │  │
│   │  └────────┘  │     │  │  └───────────┘ └───────────┘ └───────────┘  │   │  │
│   │              │     │  └─────────────────────────────────────────────┘   │  │
│   └──────────────┘     │                      │                              │  │
│                        │                      ▼                              │  │
│                        │  ┌─────────────────────────────────────────────┐   │  │
│                        │  │              DATABASE (MySQL)                │   │  │
│                        │  │   Products | Insights | Recommendations     │   │  │
│                        │  └─────────────────────────────────────────────┘   │  │
│                        └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Why These Technologies?

| Layer | Technology | Purpose | Why Chosen |
|-------|------------|---------|------------|
| **Frontend** | Next.js 15 + React 19 | UI Framework | Server-side rendering, API routes, file-based routing |
| **UI Components** | Radix UI + Tailwind CSS | Styling | Accessible components, utility-first CSS |
| **Charts** | Recharts + Chart.js | Visualization | React-native charts, interactive visualizations |
| **Backend** | Next.js API Routes | REST APIs | Unified codebase, serverless functions |
| **Database** | MySQL + Prisma ORM | Data Storage | Relational data, type-safe queries |
| **ETL - Extract** | PapaParse | CSV Parsing | Fast, handles large files, auto-detects delimiters |
| **ETL - Transform** | Lodash | Data Manipulation | Utility functions for arrays, objects |
| **AI - Sentiment** | Natural + Sentiment.js | NLP Analysis | Tokenization, stemming, sentiment scoring |
| **AI - LLM** | Google Gemini AI | Generative AI | Fast responses, good for insights generation |
| **Auth** | NextAuth.js | Authentication | OAuth providers, session management |

### 2.2 Dependencies Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     CORE DEPENDENCIES                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ETL Layer                    AI Layer                         │
│  ┌──────────────────┐        ┌──────────────────┐             │
│  │ papaparse@5.5.3  │        │ natural@8.1.0    │             │
│  │ lodash@4.17.21   │        │ sentiment@5.0.2  │             │
│  │ csv-parser@3.2.0 │        │ @google/gen-ai   │             │
│  └──────────────────┘        │ langchain@0.3.33 │             │
│                              └──────────────────┘             │
│                                                                │
│  Database Layer              Frontend Layer                    │
│  ┌──────────────────┐        ┌──────────────────┐             │
│  │ @prisma/client   │        │ recharts@3.2.0   │             │
│  │ mysql2@3.14.5    │        │ react-chartjs-2  │             │
│  └──────────────────┘        │ lucide-react     │             │
│                              └──────────────────┘             │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. ETL Pipeline Architecture

### 3.1 What is ETL?
**E**xtract-**T**ransform-**L**oad is a data processing pattern that:
- **Extracts** raw data from source files (CSV)
- **Transforms** data by cleaning, validating, enriching
- **Loads** processed data into the database

### 3.2 ETL Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ETL PIPELINE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CSV FILE                                                                   │
│      │                                                                       │
│      ▼                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        PHASE 1: EXTRACT                               │  │
│  │                     (src/lib/etl/extract.ts)                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  DataExtractor Class                                            │  │  │
│  │  │  ├── extractFromFile(file)     → Parse CSV using PapaParse      │  │  │
│  │  │  ├── extractFromString(csv)    → Parse raw CSV string           │  │  │
│  │  │  ├── extractFromURL(url)       → Download and parse remote CSV  │  │  │
│  │  │  ├── detectColumnMapping()     → Auto-detect column names       │  │  │
│  │  │  └── getDataQualityReport()    → Analyze data quality           │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  │  Output: { data: RawCSVData[], errors: [], meta: {}, totalRecords }   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│      │                                                                       │
│      ▼                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       PHASE 2: TRANSFORM                              │  │
│  │                    (src/lib/etl/transform.ts)                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  DataTransformer Class - 6 Step Pipeline                        │  │  │
│  │  │                                                                 │  │  │
│  │  │  Step 1: mapColumns()        → Standardize column names         │  │  │
│  │  │  Step 2: cleanData()         → Validate & normalize values      │  │  │
│  │  │  Step 3: fillMissingValues() → Mean for numeric, Mode for text  │  │  │
│  │  │  Step 4: removeOutliers()    → IQR method (Q1-1.5*IQR to Q3+)   │  │  │
│  │  │  Step 5: calculateFeatures() → Derive priceRange, meanRating    │  │  │
│  │  │  Step 6: validateData()      → Final validation pass            │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  │  Output: { data: CleanedProductData[], statistics: {} }               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│      │                                                                       │
│      ▼                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         PHASE 3: LOAD                                 │  │
│  │                      (src/lib/etl/load.ts)                            │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  DataLoader Class                                               │  │  │
│  │  │  ├── load()                  → Main loading orchestrator        │  │  │
│  │  │  ├── processBatch()          → Batch insert (100 records)       │  │  │
│  │  │  ├── generateCategoryInsights() → Aggregate category stats     │  │  │
│  │  │  └── generateTrendAnalysis() → Create trend data                │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  │  Output: { success, recordsLoaded, jobId, duration }                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│      │                                                                       │
│      ▼                                                                       │
│   DATABASE (MySQL via Prisma)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Extract Phase - Internal Architecture

**File:** `src/lib/etl/extract.ts`

**Library Used:** PapaParse

**Why PapaParse?**
- Handles large files efficiently with streaming
- Auto-detects delimiters (comma, semicolon, tab, pipe)
- Dynamic typing (auto-converts strings to numbers)
- Works in both browser and Node.js

**Key Methods:**

```typescript
// Method 1: Extract from File object
static async extractFromFile(file: File): Promise<ExtractResult>
  → Uses file.text() to read content
  → Papa.parse() with dynamicTyping: true
  → Returns { data, errors, meta, totalRecords }

// Method 2: Auto-detect column mapping
static detectColumnMapping(headers: string[]): Record<string, string>
  → Maps variations like "product_id" → "productId"
  → Handles: productId, productName, category, discountedPrice, rating, etc.
  → Uses fuzzy matching for flexibility

// Method 3: Data Quality Report
static getDataQualityReport(data: RawCSVData[]): QualityReport
  → Counts missing values per column
  → Detects column types (numeric, categorical, text)
  → Identifies duplicates and empty records
  → Calculates min, max, mean for numeric columns
```

### 3.4 Transform Phase - Internal Architecture

**File:** `src/lib/etl/transform.ts`

**Library Used:** Lodash

**Why Lodash?**
- Optimized utility functions for data manipulation
- `_.chunk()` for batch processing
- `_.mean()`, `_.countBy()` for statistics
- `_.groupBy()` for aggregations

**Transformation Pipeline:**

```
Raw Data → Column Mapping → Data Cleaning → Fill Missing → Remove Outliers → Feature Engineering → Validation → Clean Data

Step-by-Step:
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Column Mapping                                          │
│ ─────────────────────                                           │
│ Input:  { "product_name": "Phone", "discounted_price": "999" }  │
│ Output: { "productName": "Phone", "discountedPrice": "999" }    │
├─────────────────────────────────────────────────────────────────┤
│ STEP 2: Data Cleaning                                           │
│ ─────────────────────                                           │
│ • cleanText()  → Remove special chars, trim whitespace          │
│ • cleanPrice() → Extract numbers, remove currency symbols       │
│ • cleanRating() → Clamp between 0-5                             │
│ • cleanUrl()   → Validate URL format                            │
├─────────────────────────────────────────────────────────────────┤
│ STEP 3: Fill Missing Values                                     │
│ ─────────────────────                                           │
│ • Numeric fields → Fill with MEAN                               │
│ • Categorical fields → Fill with MODE                           │
│ • Example: missing rating → average rating of dataset           │
├─────────────────────────────────────────────────────────────────┤
│ STEP 4: Remove Outliers (IQR Method)                            │
│ ─────────────────────                                           │
│ Formula: Valid range = [Q1 - 1.5*IQR, Q3 + 1.5*IQR]            │
│ Applied to: discountedPrice, actualPrice, rating                │
├─────────────────────────────────────────────────────────────────┤
│ STEP 5: Feature Engineering                                     │
│ ─────────────────────                                           │
│ • priceRange → "Low (<₹500)", "Medium", "High", "Premium"      │
│ • discountPercentage → ((actual - discounted) / actual) * 100   │
│ • meanRating → Same as rating (updated during aggregation)      │
├─────────────────────────────────────────────────────────────────┤
│ STEP 6: Final Validation                                        │
│ ─────────────────────                                           │
│ • productName exists                                            │
│ • prices > 0                                                    │
│ • rating between 0-5                                            │
│ • discountedPrice ≤ actualPrice                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Load Phase - Internal Architecture

**File:** `src/lib/etl/load.ts`

**Library Used:** Prisma ORM

**Why Prisma?**
- Type-safe database queries
- Auto-generated TypeScript types
- Migration support
- Connection pooling

**Loading Process:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD PHASE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE ETL JOB LOG                                          │
│     └── Record job start in ETLJobLog table                     │
│                                                                  │
│  2. BATCH PROCESSING                                            │
│     ┌──────────────────────────────────────────────────────┐    │
│     │  for each batch of 100 records:                      │    │
│     │    ├── prisma.product.upsert()                       │    │
│     │    ├── Update job progress                           │    │
│     │    └── Handle errors gracefully                      │    │
│     └──────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. POST-LOAD AGGREGATIONS                                      │
│     ├── generateCategoryInsights()                              │
│     │   └── GROUP BY category → avg rating, price, count        │
│     └── generateTrendAnalysis()                                 │
│         └── Price range distribution, category metrics          │
│                                                                  │
│  4. UPDATE JOB STATUS                                           │
│     └── Mark as completed/failed with statistics                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. AI Module 1: Sentiment Analysis

### 4.1 Overview

**File:** `src/lib/ai/sentiment.ts`

**Purpose:** Analyze customer reviews to determine emotional tone (positive/negative/neutral)

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SENTIMENT ANALYSIS ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Customer Review Text                                                       │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    PREPROCESSING PIPELINE                            │  │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │  │
│   │  │  Lowercase     │→ │  Remove        │→ │  Tokenization          │  │  │
│   │  │  Conversion    │  │  Special Chars │  │  (WordTokenizer)       │  │  │
│   │  └────────────────┘  └────────────────┘  └────────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    SENTIMENT SCORING                                 │  │
│   │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│   │  │  Sentiment.js Library                                           │ │  │
│   │  │  ├── AFINN-165 word list (3,382 words with scores -5 to +5)    │ │  │
│   │  │  ├── Negation handling ("not good" → negative)                  │ │  │
│   │  │  └── Comparative score = total / word count                     │ │  │
│   │  └─────────────────────────────────────────────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    SCORE NORMALIZATION                               │  │
│   │  Raw Score → Normalized (-1 to +1) → Label Assignment               │  │
│   │                                                                      │  │
│   │  Score > 0.1  → "positive"                                          │  │
│   │  Score < -0.1 → "negative"                                          │  │
│   │  Otherwise    → "neutral"                                           │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    KEYWORD EXTRACTION                                │  │
│   │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│   │  │  Natural.js - PorterStemmer                                     │ │  │
│   │  │  ├── Remove stop words (the, a, is, are, etc.)                 │ │  │
│   │  │  ├── Apply stemming (running → run)                            │ │  │
│   │  │  └── Return top 10 unique keywords                              │ │  │
│   │  └─────────────────────────────────────────────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   OUTPUT: { score: 0.65, label: "positive", confidence: 0.8, keywords: [] } │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Libraries Used

| Library | Version | Purpose |
|---------|---------|---------|
| **sentiment** | 5.0.2 | Lexicon-based sentiment scoring using AFINN-165 |
| **natural** | 8.1.0 | NLP toolkit - tokenization, stemming, stop words |

### 4.4 Key Methods

```typescript
class SentimentAnalyzer {
  // Core analysis method
  analyzeSentiment(text: string): SentimentResult {
    1. preprocessText() → Clean and normalize
    2. sentiment.analyze() → Get raw score
    3. normalizeScore() → Convert to -1 to +1 range
    4. getLabel() → Classify as positive/negative/neutral
    5. calculateConfidence() → Estimate reliability
    6. extractKeywords() → Get important words
  }

  // Batch processing for all reviews
  analyzeProductReviews(): Promise<{ processed, updated, errors }> {
    → Fetches products with reviews but no sentiment
    → Processes up to 1000 at a time
    → Updates Product.sentimentScore and sentimentLabel
    → Creates SentimentAnalysis records
  }

  // Aggregation methods
  getSentimentDistribution() → Overall positive/negative/neutral counts
  generateWordCloudData() → Word frequency for visualization
  getSentimentRatingCorrelation() → Pearson correlation coefficient
}
```

### 4.5 Confidence Calculation Formula

```
confidence = min(baseConfidence + comparativeBoost, 1.0)

where:
  baseConfidence = min(|score| × 2, 1.0)
  comparativeBoost = min(|comparative| × 10, 0.3)
```

---

## 5. AI Module 2: Recommendation Engine

### 5.1 Overview

**File:** `src/lib/ai/recommendations.ts`

**Purpose:** Suggest similar/relevant products based on multiple algorithms

### 5.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   RECOMMENDATION ENGINE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌─────────────────────────────────┐                       │
│                    │   RECOMMENDATION REQUEST        │                       │
│                    │   (productId, category, etc.)   │                       │
│                    └─────────────┬───────────────────┘                       │
│                                  │                                           │
│                                  ▼                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                 HYBRID RECOMMENDATION SYSTEM                         │  │
│   │                                                                      │  │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│   │  │  CONTENT-   │ │COLLABORATIVE│ │   PRICE-    │ │  TRENDING   │    │  │
│   │  │  BASED      │ │  FILTERING  │ │   BASED     │ │  PRODUCTS   │    │  │
│   │  │  (0.9x)     │ │  (0.8x)     │ │  (0.7x)     │ │  (0.6x)     │    │  │
│   │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘    │  │
│   │         │               │               │               │            │  │
│   │         └───────────────┴───────────────┴───────────────┘            │  │
│   │                                  │                                    │  │
│   │                                  ▼                                    │  │
│   │                    ┌─────────────────────────┐                        │  │
│   │                    │   MERGE & RANK          │                        │  │
│   │                    │   by similarity score   │                        │  │
│   │                    └─────────────────────────┘                        │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                  │                                           │
│                                  ▼                                           │
│                    ┌─────────────────────────────┐                           │
│                    │   ProductRecommendation[]   │                           │
│                    └─────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Recommendation Algorithms

#### Algorithm 1: Content-Based Filtering
```
Purpose: Find products similar to a given product

Similarity Score = weighted average of:
  ├── Category Match (40%)     → 0.4 if same category
  ├── Price Similarity (20%)   → 1 - |price1 - price2| / max(price1, price2)
  ├── Rating Similarity (30%)  → 1 - |rating1 - rating2| / 5
  └── Price Range Match (10%)  → 0.1 if same range

SQL Query:
  WHERE category = target.category
    AND productId != target.productId
    AND rating >= target.rating - 0.5
  ORDER BY rating DESC, ratingCount DESC
```

#### Algorithm 2: Collaborative Filtering
```
Purpose: Recommend based on user preference patterns

Process:
  1. Get categories of products user interacted with
  2. Calculate average rating and price of those products
  3. Find products in same categories with:
     - Similar rating (± 0.5)
     - Similar price (0.5x to 2x of average)
  4. Score = (ratingSimilarity × 0.6) + (priceSimilarity × 0.4)
```

#### Algorithm 3: Price-Based
```
Purpose: Find products in specific budget range

WHERE discountedPrice BETWEEN minPrice AND maxPrice
  AND rating >= 3.5
ORDER BY rating DESC, discountPercentage DESC
```

#### Algorithm 4: Trending Products
```
Purpose: Recently added highly-rated products

WHERE rating >= 4.0
  AND ratingCount >= 20
  AND createdAt >= 30 days ago
ORDER BY ratingCount DESC, rating DESC
```

### 5.4 Hybrid Approach

```typescript
generateHybridRecommendations(options) {
  const recommendations = new Map();
  
  // Layer 1: Content-based (weight: 0.9)
  if (productId) {
    similarProducts.forEach(rec => {
      rec.similarity *= 0.9;
      recommendations.set(rec.productId, rec);
    });
  }
  
  // Layer 2: Category-based (weight: 0.8)
  categoryRecs.forEach(rec => {
    existing ? max(existing, rec * 0.8) : set(rec * 0.8);
  });
  
  // Layer 3: Price-based (weight: 0.7)
  // Layer 4: Top-rated fallback (weight: 0.6)
  
  return sortBy(similarity).slice(0, limit);
}
```

---

## 6. AI Module 3: LangChain Agent

### 6.1 Overview

**File:** `src/lib/ai/langchain-agent.ts`

**Purpose:** Natural language interface for data queries and AI-powered insights generation

### 6.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LANGCHAIN AGENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Query: "What are the top products in Electronics?"                   │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    QUERY CLASSIFICATION                              │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │  classifyQuery(query)                                          │  │  │
│   │  │                                                                │  │  │
│   │  │  Keywords → Query Type:                                        │  │  │
│   │  │  "product" + "top/best"  → product_analysis                    │  │  │
│   │  │  "category/categories"   → category_insights                   │  │  │
│   │  │  "trend/growth"          → trend_analysis                      │  │  │
│   │  │  "recommend/suggest"     → recommendation                      │  │  │
│   │  │  "correlation/related"   → correlation_analysis                │  │  │
│   │  │  default                 → general                             │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    DATA RETRIEVAL                                    │  │
│   │  Based on query type, fetch relevant data from database:            │  │
│   │                                                                      │  │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │  │
│   │  │ getTopRated      │  │ getCategoryIn-   │  │ getPriceRange    │   │  │
│   │  │ Products()       │  │ sights()         │  │ Distribution()   │   │  │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │  │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │  │
│   │  │ getCorrelation   │  │ getSentiment     │  │ getDescriptive   │   │  │
│   │  │ Data()           │  │ Distribution()   │  │ Statistics()     │   │  │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    PROMPT ENGINEERING                                │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │  Construct context-rich prompt:                                │  │  │
│   │  │                                                                │  │  │
│   │  │  "Based on the following product data,                         │  │  │
│   │  │   answer the user's query: {query}                             │  │  │
│   │  │                                                                │  │  │
│   │  │   Top Rated Products:                                          │  │  │
│   │  │   - Product A (Category): Rating 4.8/5, Price ₹999             │  │  │
│   │  │   - Product B (Category): Rating 4.7/5, Price ₹1299            │  │  │
│   │  │   ...                                                          │  │  │
│   │  │                                                                │  │  │
│   │  │   Provide insights and answer analytically."                   │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    GEMINI AI MODEL                                   │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │  Model: gemini-1.5-flash                                       │  │  │
│   │  │  Temperature: 0.7 (balanced creativity)                        │  │  │
│   │  │  Max Tokens: 2048                                              │  │  │
│   │  │                                                                │  │  │
│   │  │  model.generateContent(prompt) → AI Response                   │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                   │
│          ▼                                                                   │
│   OUTPUT: { response, confidence: 0.8, sources: [], reasoning }             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Libraries Used

| Library | Purpose |
|---------|---------|
| **@google/generative-ai** | Official Google Gemini AI SDK |
| **langchain** | LLM framework (structure, not heavily used here) |

### 6.4 Insight Generation

```typescript
generateInsights(): Promise<AIInsight[]> {
  // Parallel data fetching
  const [topProducts, categoryInsights, correlationData, 
         sentimentData, descriptiveStats] = await Promise.all([...]);

  // Generate 5 types of insights:
  1. Trend Insight → Market performance patterns
  2. Correlation Insight → Variable relationships
  3. Sentiment Insight → Customer satisfaction analysis
  4. Category Insight → Category performance analysis
  5. Pricing Insight → Pricing strategy recommendations

  // Store in database for caching
  for (insight of insights) {
    await prisma.aIInsight.create({ data: insight });
  }
}
```

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA (MySQL)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐                    │
│  │      PRODUCT        │         │  SENTIMENT_ANALYSIS │                    │
│  ├─────────────────────┤         ├─────────────────────┤                    │
│  │ id (PK)             │◄────────┤ productId (FK)      │                    │
│  │ productId (unique)  │         │ reviewText          │                    │
│  │ productName         │         │ sentimentScore      │                    │
│  │ category            │         │ sentimentLabel      │                    │
│  │ discountedPrice     │         │ confidence          │                    │
│  │ actualPrice         │         │ keywords (JSON)     │                    │
│  │ rating              │         └─────────────────────┘                    │
│  │ ratingCount         │                                                    │
│  │ userReview          │         ┌─────────────────────┐                    │
│  │ sentimentScore      │◄────────┤ PRODUCT_RECOMMEND   │                    │
│  │ sentimentLabel      │         ├─────────────────────┤                    │
│  │ priceRange          │         │ sourceProductId (FK)│                    │
│  └─────────────────────┘         │ recommendedId (FK)  │                    │
│           │                      │ similarity          │                    │
│           │                      │ reason              │                    │
│           │                      └─────────────────────┘                    │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐                    │
│  │  CATEGORY_INSIGHT   │         │    AI_INSIGHT       │                    │
│  ├─────────────────────┤         ├─────────────────────┤                    │
│  │ category (unique)   │         │ insightType         │                    │
│  │ totalProducts       │         │ title               │                    │
│  │ averageRating       │         │ description         │                    │
│  │ averagePrice        │         │ data (JSON)         │                    │
│  │ averageDiscount     │         │ confidence          │                    │
│  │ topRatedProduct     │         └─────────────────────┘                    │
│  └─────────────────────┘                                                    │
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐                    │
│  │   ETL_JOB_LOG       │         │   TREND_ANALYSIS    │                    │
│  ├─────────────────────┤         ├─────────────────────┤                    │
│  │ id                  │         │ analysisType        │                    │
│  │ fileName            │         │ period              │                    │
│  │ status              │         │ metrics (JSON)      │                    │
│  │ recordsProcessed    │         └─────────────────────┘                    │
│  │ recordsSuccess      │                                                    │
│  │ recordsError        │                                                    │
│  │ startTime           │                                                    │
│  │ endTime             │                                                    │
│  │ duration            │                                                    │
│  └─────────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Frontend-Backend Integration

### 8.1 Component-API Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND-BACKEND INTEGRATION MAP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND COMPONENT              API ROUTE                BACKEND SERVICE    │
│  ──────────────────              ─────────                ───────────────    │
│                                                                              │
│  ┌──────────────────┐           ┌──────────────┐        ┌────────────────┐  │
│  │ upload/page.tsx  │──POST────▶│/api/upload   │───────▶│DataExtractor   │  │
│  │                  │           │              │        │DataTransformer │  │
│  │ File Upload Form │           │              │        │DataLoader      │  │
│  │ Progress Bar     │           │              │        │SentimentAnalyz │  │
│  │ Quality Report   │           │              │        │LangChainAgent  │  │
│  └──────────────────┘           └──────────────┘        └────────────────┘  │
│                                                                              │
│  ┌──────────────────┐           ┌──────────────┐        ┌────────────────┐  │
│  │ ChatInterface.tsx│──POST────▶│/api/insights │───────▶│LangChainAgent  │  │
│  │                  │           │              │        │.processQuery() │  │
│  │ User Messages    │           │              │        │                │  │
│  │ AI Responses     │           │              │        │                │  │
│  └──────────────────┘           └──────────────┘        └────────────────┘  │
│                                                                              │
│  ┌──────────────────┐           ┌──────────────┐        ┌────────────────┐  │
│  │ SentimentChart   │───GET────▶│/api/sentiment│───────▶│SentimentAnalyz │  │
│  │ .tsx             │           │              │        │.getDistributio │  │
│  │                  │           │              │        │                │  │
│  │ Pie Chart        │           │?type=        │        │                │  │
│  │ Distribution     │           │distribution  │        │                │  │
│  └──────────────────┘           └──────────────┘        └────────────────┘  │
│                                                                              │
│  ┌──────────────────┐           ┌──────────────┐        ┌────────────────┐  │
│  │ Product Details  │───GET────▶│/api/         │───────▶│Recommendation  │  │
│  │ (Dashboard)      │           │recommendations│       │Engine          │  │
│  │                  │           │?productId=x  │        │.generateHybrid │  │
│  └──────────────────┘           └──────────────┘        └────────────────┘  │
│                                                                              │
│  ┌──────────────────┐           ┌──────────────┐        ┌────────────────┐  │
│  │ dashboard/       │───GET────▶│/api/dashboard│───────▶│DatabaseQueries │  │
│  │ page.tsx         │           │              │        │                │  │
│  │                  │           │              │        │                │  │
│  │ Metric Cards     │           │              │        │                │  │
│  │ Charts           │           │              │        │                │  │
│  └──────────────────┘           └──────────────┘        └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Data Flow: File Upload to Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW SEQUENCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER UPLOADS CSV                                                         │
│     └── upload/page.tsx → FormData → POST /api/upload                        │
│                                                                              │
│  2. ETL PIPELINE EXECUTES                                                    │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  /api/upload/route.ts                                           │     │
│     │  ├── DataExtractor.extractFromFile(file)                        │     │
│     │  │   └── PapaParse → RawCSVData[]                               │     │
│     │  ├── DataTransformer.transform(rawData)                         │     │
│     │  │   └── Clean → Fill → Outliers → Features → CleanedData[]     │     │
│     │  ├── DataLoader.load(cleanedData)                               │     │
│     │  │   └── Batch upsert → MySQL                                   │     │
│     │  ├── SentimentAnalyzer.analyzeProductReviews()                  │     │
│     │  │   └── Update sentimentScore, sentimentLabel                  │     │
│     │  └── LangChainAgent.generateInsights()                          │     │
│     │      └── Create AIInsight records                               │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  3. RESPONSE TO FRONTEND                                                     │
│     └── { success, recordsLoaded, insights[], qualityReport }                │
│                                                                              │
│  4. DASHBOARD FETCHES DATA                                                   │
│     ├── GET /api/dashboard → Product stats, trends                          │
│     ├── GET /api/sentiment?type=distribution → Sentiment pie chart          │
│     ├── GET /api/insights?type=recent → AI-generated insights              │
│     └── GET /api/recommendations?productId=x → Product suggestions          │
│                                                                              │
│  5. CHARTS RENDER                                                            │
│     ├── SentimentChart.tsx → Recharts PieChart                              │
│     ├── TrendChart.tsx → Recharts LineChart                                 │
│     ├── CategoryChart.tsx → Recharts BarChart                               │
│     └── MetricCard.tsx → KPI display                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Data Flow Diagrams

### 9.1 Complete System DFD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LEVEL 0 - CONTEXT DIAGRAM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                 │
│     CSV File ───────────────▶│             │                                 │
│                              │  MARKETPULSE│                                 │
│     Natural Language ───────▶│   SYSTEM    │────────▶ Dashboards            │
│     Query                    │             │         Analytics               │
│                              │             │────────▶ Recommendations        │
│     User Authentication ────▶│             │         Insights                │
│                              └─────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     LEVEL 1 - SYSTEM BREAKDOWN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│        ┌────────────┐     ┌────────────┐     ┌────────────┐                 │
│        │   1.0      │     │   2.0      │     │   3.0      │                 │
│  CSV ─▶│  EXTRACT   │────▶│ TRANSFORM  │────▶│   LOAD     │────▶ Database   │
│        │            │     │            │     │            │                 │
│        └────────────┘     └────────────┘     └────────────┘                 │
│                                                    │                         │
│                                                    ▼                         │
│        ┌────────────┐     ┌────────────┐     ┌────────────┐                 │
│        │   4.0      │     │   5.0      │     │   6.0      │                 │
│        │ SENTIMENT  │◄────│    AI      │────▶│  RECOMMEND │                 │
│        │ ANALYSIS   │     │  INSIGHTS  │     │   ENGINE   │                 │
│        └────────────┘     └────────────┘     └────────────┘                 │
│              │                  │                  │                         │
│              └──────────────────┴──────────────────┘                         │
│                                │                                             │
│                                ▼                                             │
│                         ┌────────────┐                                       │
│                         │   7.0      │                                       │
│        User Query ─────▶│ DASHBOARD  │────▶ Visualizations                  │
│                         │   & UI     │      Reports                         │
│                         └────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 AI Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI MODULES INTERACTION DIAGRAM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌─────────────────┐                                  │
│                         │   RAW PRODUCT   │                                  │
│                         │      DATA       │                                  │
│                         └────────┬────────┘                                  │
│                                  │                                           │
│            ┌─────────────────────┼─────────────────────┐                    │
│            │                     │                     │                    │
│            ▼                     ▼                     ▼                    │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │   SENTIMENT     │  │   LANGCHAIN     │  │  RECOMMENDATION │            │
│   │   ANALYZER      │  │     AGENT       │  │     ENGINE      │            │
│   │                 │  │                 │  │                 │            │
│   │ • Reviews       │  │ • Query Process │  │ • Similarity    │            │
│   │ • Score -1 to 1 │  │ • Gemini AI     │  │ • Collaborative │            │
│   │ • Keywords      │  │ • Insights Gen  │  │ • Hybrid        │            │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│            │                     │                     │                    │
│            ▼                     ▼                     ▼                    │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │ SentimentChart  │  │  ChatInterface  │  │ ProductCards    │            │
│   │ WordCloud       │  │  InsightPanel   │  │ RecommendList   │            │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Summary

### Key Technologies & Their Roles

| Component | Technology | Role |
|-----------|------------|------|
| **ETL Extract** | PapaParse | CSV parsing with auto-detection |
| **ETL Transform** | Lodash | Data cleaning, outlier removal |
| **ETL Load** | Prisma + MySQL | Type-safe database operations |
| **Sentiment AI** | Natural + Sentiment.js | NLP analysis of reviews |
| **Recommendation** | Custom algorithms | Product similarity matching |
| **LLM Agent** | Google Gemini AI | Natural language insights |
| **Frontend** | Next.js + Recharts | Dashboard and visualizations |
| **Auth** | NextAuth.js | User authentication |

### File Structure Summary

```
src/
├── lib/
│   ├── etl/
│   │   ├── extract.ts    → CSV parsing
│   │   ├── transform.ts  → Data cleaning
│   │   └── load.ts       → Database loading
│   ├── ai/
│   │   ├── sentiment.ts      → Review analysis
│   │   ├── recommendations.ts → Product suggestions
│   │   └── langchain-agent.ts → AI insights
│   └── db/
│       ├── prisma.ts     → Database client
│       └── queries.ts    → Reusable queries
├── app/
│   ├── api/
│   │   ├── upload/       → ETL trigger
│   │   ├── sentiment/    → Sentiment data
│   │   ├── recommendations/ → Product recs
│   │   └── insights/     → AI insights
│   └── dashboard/        → Main UI
└── components/
    ├── charts/           → Visualizations
    └── ai/               → ChatInterface
```

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2026  
**Author:** MarketPulse Development Team
