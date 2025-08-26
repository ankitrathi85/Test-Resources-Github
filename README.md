# 🧪 Test Automation Resources

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://ankitrathi85.github.io/Test-Resources-Github/)
[![Update Resources](https://github.com/ankitrathi85/Test-Resources-Github/workflows/Update%20Test%20Automation%20Resources%20(Staged)/badge.svg)](https://github.com/ankitrathi85/Test-Resources-Github/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A curated collection of the best test automation repositories on GitHub, automatically analyzed and quality-scored using **staged scanning** for reliable data collection.

## 🌟 Features

- **� Staged Scanning**: One category per day for reliable, timeout-free data collection
- **📊 Quality Scoring**: 100-point scoring system based on popularity, activity, documentation, community, maintenance, and code quality
- **📈 Progressive Building**: Website builds incrementally as categories are scanned
- **🎨 Beautiful UI**: Responsive static website with dark/light themes and progress indicators
- **🔧 Real-time Filtering**: Filter by programming language, quality grade, and category
- **🤖 Daily Updates**: GitHub Actions workflow scans one category daily (complete cycle every 8 days)
- **📱 Mobile-First**: Fully responsive design for all devices

## 🚀 **Staged Scanning Approach**

### **Why Staged Scanning?**
Our original approach tried to scan all categories at once, leading to timeouts and unreliable data collection. The new staged approach solves this by:

- **⏰ One Category Per Day**: Scans just one category per run (12-15 minutes max)
- **🔄 Daily Automation**: Runs every day at 2 AM UTC
- **📈 Progressive Building**: Website grows incrementally with each scan
- **💾 Persistent Data**: Stores results between runs for cumulative building
- **🎯 Complete Cycle**: Full website refresh every 8 days (8 categories)

### **How It Works**
1. **Day 1**: Scans Web Automation → Generates website with 1 category
2. **Day 2**: Scans Mobile Automation → Updates website with 2 categories  
3. **Day 3**: Scans API Testing → Updates website with 3 categories
4. **...and so on until all 8 categories are complete**
5. **Day 9**: Starts new cycle with fresh Web Automation scan

### **Progress Tracking**
The website shows real-time progress indicators:
- ✅ **Completed categories** with repository counts
- ⏳ **Pending categories** waiting to be scanned
- 📊 **Progress bars** showing scan completion percentage
- 🔄 **Cycle information** for transparency

## � Live Demo

Visit the live website: **[https://ankitrathi85.github.io/Test-Resources-Github/](https://ankitrathi85.github.io/Test-Resources-Github/)**

## �📂 Categories

| Category | Description | Example Tools |
|----------|-------------|---------------|
| 🌐 **Web Automation** | Browser automation frameworks | Selenium, Playwright, Cypress |
| 📱 **Mobile Automation** | Mobile app testing tools | Appium, Detox, Espresso |
| 🔌 **API Testing** | REST API testing frameworks | REST Assured, Postman, SuperTest |
| 🧪 **Unit Testing** | Unit testing frameworks | JUnit, Jest, Pytest |
| ⚡ **Performance Testing** | Load and performance testing | JMeter, Locust, K6 |
| 🏗️ **Test Frameworks** | Comprehensive testing frameworks | TestNG, Cucumber, RSpec |
| 🛠️ **Testing Utilities** | Helper tools and utilities | Test data generators, Mock libraries |
| 🔄 **CI/CD Testing** | Continuous integration tools | GitHub Actions, Jenkins pipelines |

## 📊 Quality Scoring System

Our 100-point scoring algorithm evaluates repositories across 6 dimensions:

### 🏆 Scoring Breakdown
- **Popularity (25 pts)**: GitHub stars and forks with logarithmic scaling
- **Activity (20 pts)**: Recent commits, releases, and maintenance frequency  
- **Documentation (20 pts)**: README quality, wiki presence, and documentation depth
- **Community (15 pts)**: License, contributing guidelines, issue management
- **Maintenance (10 pts)**: Regular release patterns and update consistency
- **Code Quality (10 pts)**: Topics, CI/CD presence, repository status

### 🎯 Grade Scale
- **A+ (90-100)**: Exceptional quality with excellent documentation and active maintenance
- **A (80-89)**: High quality with good practices and regular updates
- **B (70-79)**: Good quality meeting most standards
- **C (60-69)**: Average quality with room for improvement
- **D (50-59)**: Below average, needs significant improvements
- **F (<50)**: Poor quality with major issues

## 🛠️ Technical Architecture

### Tech Stack
- **Backend**: Node.js with GitHub REST API
- **Frontend**: Static HTML/CSS/JavaScript with progress indicators
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Charts**: Chart.js for data visualization
- **Automation**: GitHub Actions for daily staged scanning
- **Hosting**: GitHub Pages with incremental updates
- **Data Storage**: JSON files committed to repository

### Project Structure
```
├── src/
│   ├── staged-scanner.js     # New: One-category-at-a-time scanner
│   ├── staged-generator.js   # New: Progressive website generator
│   ├── scanner.js           # Legacy: Full scan (kept for local testing)
│   ├── generator.js         # Legacy: Full generation (kept for local testing)
│   ├── config/
│   │   └── categories.js     # Category definitions and search terms
│   └── utils/
│       ├── github.js         # GitHub API wrapper
│       ├── scoring.js        # Quality scoring algorithm
│       └── helpers.js        # Utility functions
├── data/                     # New: Persistent data storage
│   ├── repositories.json     # All scanned repositories
│   └── scan-status.json     # Scan progress tracking
├── assets/
│   ├── css/style.css         # Enhanced with progress indicators
│   └── js/main.js           # Client-side functionality
├── .github/workflows/
│   └── update-resources.yml  # Updated: Daily staged scanning
├── dist/                     # Generated static website
├── manual-scan.js           # New: Manual category testing
├── inspect-data.js          # New: Data inspection tool
├── test.js                  # Validation script
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- GitHub Personal Access Token
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/ankitrathi85/Test-Resources-Github.git
cd Test-Resources-Github

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GitHub token
```

### Configuration
Edit `.env` file:
```env
GITHUB_TOKEN=your_github_token_here
RATE_LIMIT_DELAY=2000
MIN_STARS=10
MAX_AGE_MONTHS=18
MAX_REPOS_PER_SEARCH=3        # Reduced for staged scanning
MAX_REPOS_PER_CATEGORY=15     # Reduced for staged scanning  
CATEGORY_TIMEOUT_MINUTES=12   # Per-category timeout
```

### Usage

#### **Staged Approach (Recommended):**
```bash
# Scan one category (picks next in queue)
npm run staged-scan

# Generate website from current data
npm run staged-generate

# Combined: scan + generate
npm run staged-build

# Inspect current scan progress
node inspect-data.js

# Manual category scan
node manual-scan.js web-automation
```

#### **Legacy Full Scan (Local Testing Only):**
```bash
# Full scan (may timeout in CI/CD)
npm run scan

# Full generation
npm run generate

# Combined full build
npm run build
```

#### **Development:**
```bash
# Start development server
npm run dev

# Run validation tests
npm test

# View scan progress
node inspect-data.js
```

## 🤖 Automation

The repository automatically updates daily using GitHub Actions with staged scanning:

### **Daily Workflow:**
1. **Picks Next Category**: Determines which category to scan next
2. **Scans GitHub**: Searches for repositories in that category (12-15 minutes)
3. **Analyzes Quality**: Calculates scores using the 100-point algorithm
4. **Updates Data**: Merges new data with existing repository database
5. **Generates Website**: Creates fresh website with all available data
6. **Commits Data**: Saves updated data back to repository
7. **Deploys**: Publishes to GitHub Pages automatically

### **Scanning Schedule:**
- **🕐 Daily at 2 AM UTC** (one category per day)
- **📅 8-day complete cycle** (all categories refreshed)
- **🔄 Continuous updates** (never more than 8 days old)
- **⚡ Manual trigger** available anytime

### Manual Trigger
You can trigger updates manually:
1. Go to the **Actions** tab in your repository
2. Select **"Update Test Automation Resources (Staged)"** workflow
3. Click **"Run workflow"**

## � Manual Tools & Testing

### Data Inspection
```bash
# View current scan status and progress
node inspect-data.js

# Example output:
# 📊 OVERVIEW:
#    Total repositories: 45
#    Scan progress: 3/8 categories
#    Current cycle: 1
# 📂 CATEGORY STATUS:
#    ✅ Web Automation: 15 repos
#    ✅ API Testing: 12 repos  
#    ✅ Unit Testing: 18 repos
#    ⏳ Mobile Automation: Pending
```

### Manual Category Scanning
```bash
# List available categories
node manual-scan.js

# Scan a specific category
node manual-scan.js web-automation
node manual-scan.js api-testing
node manual-scan.js mobile-automation
```

### Development Workflow
```bash
# 1. Check current state
node inspect-data.js

# 2. Scan next category
npm run staged-scan

# 3. Generate updated website  
npm run staged-generate

# 4. Test locally
npm run dev

# 5. Check progress
node inspect-data.js
```

### Data Management
```bash
# Reset all data (start fresh)
rm data/*.json
echo '{}' > data/repositories.json
echo '{"completedCategories":[],"currentCycle":1}' > data/scan-status.json

# View raw data
cat data/repositories.json | jq keys
cat data/scan-status.json | jq .
```

## �📈 Performance & Limits

### Staged Scanning Limits (Prevents Timeouts)
- **3 repositories** per search term (reduced from 5)
- **15 repositories** per category maximum (reduced from 25)
- **12-minute** timeout per category (reduced from 15)
- **Daily runs** instead of every 3 days

### Typical Results Per Category
- **Scan Time**: 5-12 minutes per category
- **API Calls**: ~100 requests per category
- **Data Growth**: 10-20 repositories per category
- **Website Update**: <2 minutes generation

### Complete Cycle Results
- **Total Scan Time**: 8 days for full refresh
- **Total Repositories**: 80-120 repositories
- **Generated Files**: 100-200 HTML pages
- **Website Size**: 5-20MB total
- **Load Time**: <3 seconds

## 🛡️ Security & Rate Limiting

- **GitHub API Limits**: 5,000 requests/hour (authenticated)
- **Smart Caching**: Avoids redundant API calls
- **Rate Limiting**: 2-second delays between requests
- **Token Security**: Uses GitHub Secrets for automation
- **No Data Storage**: Stateless, regenerates from source

## 🔧 Customization

### Adding New Categories
Edit `src/config/categories.js`:
```javascript
'new-category': {
  name: 'New Category',
  description: 'Description of the category',
  icon: '🆕',
  searchTerms: ['term1', 'term2'],
  languages: ['JavaScript', 'Python'],
  primaryColor: '#007bff'
}
```

### Adjusting Quality Scoring
Modify weights in `src/utils/scoring.js`:
```javascript
// Current scoring weights
popularityScore: 25,    // GitHub stars/forks
activityScore: 20,      // Recent activity
documentationScore: 20, // README quality
communityScore: 15,     // License/contributing
maintenanceScore: 10,   // Release patterns
codeQualityScore: 10    // CI/CD/topics
```

### Adjusting Scan Limits
Update `.env` file:
```env
MAX_REPOS_PER_SEARCH=5        # More repos per search term
MAX_REPOS_PER_CATEGORY=20     # Higher category limit
CATEGORY_TIMEOUT_MINUTES=15   # Longer category timeout
```

### Adding Staged Scanning Categories
The staged scanner automatically cycles through all categories in `src/config/categories.js`. To modify the scanning order, update the object key order in the categories file.

## 📊 Statistics

### Current Data (Staged Scanning Approach)
- **Progressive data collection** - one category per day
- **8-day refresh cycle** for complete data freshness
- **Reduced timeout risk** with per-category limits
- **Improved reliability** with persistent data storage
- **Enhanced progress tracking** with visual indicators

### Data Quality
- **Conservative scanning** ensures high-quality repository selection
- **Persistent storage** prevents data loss between scans
- **Incremental updates** maintain website availability during builds
- **Quality scoring** remains consistent across all scanning approaches

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Ideas
- Add new testing categories to `src/config/categories.js`
- Improve the staged scanning algorithm
- Enhance the UI/UX design with better progress indicators
- Add new filtering options for the progressive data
- Optimize the data storage and retrieval system
- Improve documentation and setup guides

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub API** for providing repository data
- **Open Source Community** for the amazing test automation tools
- **Chart.js** for beautiful data visualizations
- **Contributors** who help improve this project

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ankitrathi85/Test-Resources-Github/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ankitrathi85/Test-Resources-Github/discussions)
- **Website**: [Live Demo](https://ankitrathi85.github.io/Test-Resources-Github/)

## 🔄 Update Frequency

- **Automatic**: Daily at 2 AM UTC (one category per day)
- **Manual**: On-demand via workflow dispatch
- **Complete Cycle**: Every 8 days for full data refresh
- **Data Freshness**: Individual categories never more than 8 days old
- **Reliability**: 99%+ uptime with staged approach
- **Progressive Building**: Website always available, grows incrementally

---

<div align="center">

**[🌟 Star this repository](https://github.com/ankitrathi85/Test-Resources-Github) if you find it useful!**

Made with ❤️ for the test automation community

</div>
