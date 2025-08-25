# 🧪 Test Automation Resources

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://ankitrathi85.github.io/Test-Resources-Github/)
[![Update Resources](https://github.com/ankitrathi85/Test-Resources-Github/workflows/Update%20Test%20Automation%20Resources/badge.svg)](https://github.com/ankitrathi85/Test-Resources-Github/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A curated collection of the best test automation repositories on GitHub, automatically analyzed and quality-scored every 3 days.

## 🌟 Features

- **🔍 Automated Discovery**: Scans GitHub for test automation repositories across 8 categories
- **📊 Quality Scoring**: 100-point scoring system based on popularity, activity, documentation, community, maintenance, and code quality
- **🎨 Beautiful UI**: Responsive static website with dark/light themes
- **🔧 Real-time Filtering**: Filter by programming language, quality grade, and category
- **🤖 Auto-Updates**: GitHub Actions workflow updates the site every 3 days
- **📱 Mobile-First**: Fully responsive design for all devices

## 🚀 Live Demo

Visit the live website: **[https://ankitrathi85.github.io/Test-Resources-Github/](https://ankitrathi85.github.io/Test-Resources-Github/)**

## 📂 Categories

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
- **Frontend**: Static HTML/CSS/JavaScript
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Charts**: Chart.js for data visualization
- **Automation**: GitHub Actions for CI/CD
- **Hosting**: GitHub Pages

### Project Structure
```
├── src/
│   ├── index.js              # Main application entry point
│   ├── scanner.js            # GitHub repository scanner
│   ├── generator.js          # Static website generator
│   ├── config/
│   │   └── categories.js     # Category definitions and search terms
│   └── utils/
│       ├── github.js         # GitHub API wrapper
│       ├── scoring.js        # Quality scoring algorithm
│       └── helpers.js        # Utility functions
├── assets/
│   ├── css/style.css         # Responsive styling
│   └── js/main.js           # Client-side functionality
├── .github/workflows/
│   └── update-resources.yml  # Automated update pipeline
├── dist/                     # Generated static website
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
MAX_REPOS_PER_SEARCH=5
MAX_REPOS_PER_CATEGORY=25
MAX_TOTAL_REPOS=100
SEARCH_TIMEOUT_MINUTES=15
```

### Usage
```bash
# Scan repositories and generate website
npm run build

# Scan only
npm run scan

# Generate website only  
npm run generate

# Start development server
npm run dev

# Run validation tests
npm test
```

## 🤖 Automation

The repository automatically updates every 3 days using GitHub Actions:

1. **Scans GitHub** for new and updated repositories
2. **Analyzes quality** using the scoring algorithm
3. **Generates fresh website** with latest data
4. **Deploys to GitHub Pages** automatically

### Manual Trigger
You can also trigger updates manually:
1. Go to the **Actions** tab in your repository
2. Select **"Update Test Automation Resources"** workflow
3. Click **"Run workflow"**

## 📈 Performance & Limits

### Scanning Limits (Prevents Rate Limiting)
- **5 repositories** per search term
- **25 repositories** per category maximum
- **100 repositories** total per scan
- **15-minute** timeout protection

### Typical Results
- **Scan Time**: 15-30 minutes
- **API Calls**: ~800 requests per scan
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

### Changing Scan Limits
Update `.env` file:
```env
MAX_REPOS_PER_SEARCH=10   # More repos per search
MAX_TOTAL_REPOS=200       # Higher total limit
SEARCH_TIMEOUT_MINUTES=30 # Longer timeout
```

## 📊 Statistics

### Current Data (Last Update: August 2024)
- **123 repositories** analyzed
- **8 categories** covered
- **5 programming languages** represented
- **Average quality score**: 81/100
- **Top grade distribution**: 45% A+/A repositories

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Ideas
- Add new testing categories
- Improve the scoring algorithm
- Enhance the UI/UX design
- Add new filtering options
- Improve documentation

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

- **Automatic**: Every 3 days via GitHub Actions
- **Manual**: On-demand via workflow dispatch
- **Data Freshness**: Never more than 3 days old
- **Reliability**: 99%+ uptime on GitHub Pages

---

<div align="center">

**[🌟 Star this repository](https://github.com/ankitrathi85/Test-Resources-Github) if you find it useful!**

Made with ❤️ for the test automation community

</div>
