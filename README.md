# 📊 MarketPulse Analytics Platform

> **Transform your sales data into actionable insights with advanced ETL pipelines, AI-driven analytics, and interactive visualizations.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.0-green)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-Latest-orange)](https://www.mysql.com/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-purple)](https://ai.google.dev/)

## 🚀 Overview

MarketPulse is a comprehensive analytics platform that transforms raw product and sales data into meaningful business insights. Built with modern web technologies, it combines ETL (Extract, Transform, Load) processes with AI-powered analytics to provide deep market understanding.

### ✨ Key Features

- **🔄 Advanced ETL Pipeline**: Automated data extraction, transformation, and loading
- **🤖 AI-Powered Analytics**: Google Gemini-powered insights and recommendations
- **📊 Interactive Dashboards**: Real-time visualizations with Recharts
- **🔐 Secure Authentication**: Multi-provider auth with NextAuth.js
- **👥 Role-Based Access**: Admin and user management system
- **📈 Sentiment Analysis**: Customer review sentiment processing
- **💼 Business Intelligence**: Category performance, pricing analysis, and market trends
- **📱 Responsive Design**: Mobile-first approach with Tailwind CSS
- **🎯 Smart Recommendations**: ML-powered product recommendations
- **📄 Export Capabilities**: PDF and CSV export functionality

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **Next.js 15.5.2** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization library
- **Framer Motion** - Animation library

**Backend:**
- **Next.js API Routes** - Server-side API endpoints
- **Prisma** - Database ORM and migrations
- **MySQL** - Primary database
- **NextAuth.js** - Authentication system
- **bcryptjs** - Password hashing

**AI & Analytics:**
- **Google Gemini AI** - Natural language processing
- **LangChain** - AI orchestration framework
- **Sentiment Analysis** - Customer review processing
- **Statistical Analysis** - Advanced data metrics

**Data Processing:**
- **CSV Parser** - File upload processing
- **Lodash** - Data manipulation utilities
- **Natural** - NLP processing library

## 📁 Project Structure

```
marketpulse/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Database seeding script
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API endpoints
│   │   │   ├── auth/         # Authentication routes
│   │   │   ├── admin/        # Admin-specific endpoints
│   │   │   ├── analytics/    # Analytics API
│   │   │   ├── dashboard/    # Dashboard data
│   │   │   ├── upload/       # File upload handling
│   │   │   └── ...
│   │   ├── auth/             # Authentication pages
│   │   ├── admin/            # Admin dashboard
│   │   ├── dashboard/        # Main analytics dashboard
│   │   ├── auth-dashboard/   # User profile dashboard
│   │   └── upload/           # File upload interface
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base UI components
│   │   ├── auth/            # Authentication components
│   │   ├── charts/          # Data visualization components
│   │   └── ...
│   ├── lib/                  # Utility libraries
│   │   ├── ai/              # AI and machine learning
│   │   ├── db/              # Database utilities
│   │   ├── etl/             # ETL pipeline
│   │   └── auth.ts          # Auth configuration
│   └── types/               # TypeScript type definitions
├── public/                   # Static assets
└── scripts/                  # Utility scripts
```

## 🔧 Installation & Setup

### Prerequisites

- **Node.js** 18+ 
- **MySQL** 8.0+
- **Google Gemini API Key**
- **GitHub/Google OAuth** credentials (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/AkshayPratapSingh333/marketpulse.git
cd marketpulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/marketpulse"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID="your-github-client-id" 
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Configuration
GEMINI_API_KEY="your-gemini-api-key"
AI_MODEL="gemini-1.5-flash"
SENTIMENT_THRESHOLD=0.6

# Admin Credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"
```

### 4. Database Setup

```bash
# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with admin user
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📊 Database Schema

### Core Models

**Product** - Main product data with analytics fields
- Basic info: name, category, price, rating
- Analytics: sentiment scores, computed metrics
- Relations: recommendations, sentiment analyses

**User** - Authentication and user management
- Roles: USER, ADMIN
- OAuth integration support
- Profile management

**Analytics Models** - Specialized data storage
- `SentimentAnalysis` - Review sentiment processing
- `CategoryInsight` - Category performance metrics  
- `TrendAnalysis` - Time-based analytics
- `AIInsight` - AI-generated insights
- `ProductRecommendation` - ML recommendations

**ETL Models** - Data pipeline tracking
- `ETLJobLog` - Processing job history
- Data validation and quality metrics

## 🔐 Authentication System

### Supported Methods

1. **Credentials** - Email/password with bcrypt hashing
2. **Google OAuth** - Social login integration
3. **GitHub OAuth** - Developer-friendly auth

### Role-Based Access Control

- **USER**: Access to personal dashboard, data upload, basic analytics
- **ADMIN**: Full system access, user management, advanced analytics

### Protected Routes

- `/dashboard/*` - Analytics dashboard (USER+)
- `/upload/*` - Data upload interface (USER+)
- `/auth-dashboard/*` - User profile management (USER+)
- `/admin/*` - Administrative interface (ADMIN only)

## 🤖 AI & Analytics Features

### Intelligent Data Processing

1. **Sentiment Analysis**
   - Customer review processing
   - Emotion classification
   - Confidence scoring

2. **Product Recommendations**
   - Similarity-based matching
   - Collaborative filtering
   - Reason explanations

3. **Market Intelligence**
   - Category performance analysis
   - Pricing optimization insights
   - Trend identification

### AI Assistant

Interactive chat interface powered by Google Gemini:
- Natural language queries
- Contextual responses
- Data-driven recommendations
- Statistical explanations

## 📈 Dashboard Features

### Analytics Tabs

1. **Overview** - Key metrics and summaries
2. **Products** - Top performers and detailed analysis
3. **Categories** - Market segment insights
4. **Pricing** - Price distribution and optimization
5. **Sentiment** - Customer satisfaction analysis
6. **Correlations** - Statistical relationships
7. **AI Assistant** - Interactive data exploration

### Interactive Visualizations

- **Charts**: Line, Bar, Pie, Scatter plots
- **Real-time Updates**: Live data refresh
- **Export Options**: PDF reports, CSV data
- **Filtering**: Category, time range, metrics
- **Responsive Design**: Mobile-optimized

## 🔄 ETL Pipeline

### Data Processing Flow

1. **Extract**
   - CSV file upload
   - Data validation
   - Schema verification

2. **Transform**
   - Data cleaning and normalization
   - Missing value handling
   - Type conversion
   - Duplicate detection

3. **Load**
   - Batch processing (100 records/batch)
   - Upsert operations
   - Error handling
   - Job logging

### Supported Data Sources

- CSV files with product data
- Required fields: productName, category, price, rating
- Optional: reviews, images, links, user data

## 🛡️ Security Features

- **Authentication**: Multi-provider support
- **Authorization**: Role-based access control
- **Data Protection**: Password hashing with bcrypt
- **Session Management**: JWT-based sessions
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **CSRF Protection**: NextAuth.js built-in security

## 🚀 Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables

Ensure all production environment variables are configured:
- Database connection strings
- API keys and secrets
- OAuth credentials
- Admin user credentials

### Database Migration

```bash
# Run production migrations
npx prisma migrate deploy
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Data Endpoints

- `GET /api/dashboard` - Dashboard analytics
- `POST /api/upload` - File upload and processing
- `GET /api/analytics` - Advanced analytics
- `GET /api/insights` - AI-generated insights

### Admin Endpoints

- `GET /api/admin/users` - User management
- `DELETE /api/admin/users` - User deletion
- `GET /api/admin/stats` - System statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Use ESLint and Prettier
- Document new features
- Follow semantic commit conventions

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL configuration
   - Check MySQL service status
   - Validate credentials and permissions

2. **Authentication Issues**
   - Confirm NEXTAUTH_SECRET is set
   - Verify OAuth provider credentials
   - Check callback URL configuration

3. **AI Features Not Working**
   - Validate GEMINI_API_KEY
   - Check API quotas and limits
   - Review error logs for details

### Getting Help

- Create an issue on GitHub
- Check existing documentation
- Review error logs in browser console

## 📊 Performance Optimization

### Database Optimization

- Indexed fields for faster queries
- Batch processing for large datasets
- Connection pooling with Prisma
- Query optimization for analytics

### Frontend Optimization

- Next.js App Router for optimal performance
- Server-side rendering for SEO
- Code splitting and lazy loading
- Optimized images and assets

## 🔮 Future Enhancements

- [ ] Real-time data streaming
- [ ] Advanced ML models
- [ ] Multi-tenant architecture
- [ ] Enhanced visualization options
- [ ] Mobile application
- [ ] API rate limiting
- [ ] Advanced caching strategies
- [ ] Webhook integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Akshay Pratap Singh**
- GitHub: [@AkshayPratapSingh333](https://github.com/AkshayPratapSingh333)
- Email: [Contact via GitHub](https://github.com/AkshayPratapSingh333)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Google for Gemini AI capabilities
- Open source community for various libraries

---

**⭐ Star this repository if you find it helpful!**

*Built with ❤️ using Next.js, TypeScript, and AI*
