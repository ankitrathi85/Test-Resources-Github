# 🧪 Test Automation Resources

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://ankitrathi85.github.io/Test-Resources-Github/)
[![Update Resources](https://github.com/ankitrathi85/Test-Resources-Github/workflows/Update%20Test%20Automation%20Resources/badge.svg)](https://github.com/ankitrathi85/Test-Resources-Github/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A curated collection of the best test automation repositories on GitHub, automatically analyzed and quality-scored every 3 days.

## � Features

- **🔍 Automated Discovery**: Scans GitHub for test automation repositories across 8 categories
- **📊 Quality Scoring**: 100-point scoring system based on popularity, activity, documentation, community, maintenance, and code quality
- **🎨 Beautiful UI**: Responsive static website with dark/light themes
- **🔧 Real-time Filtering**: Filter by programming language, quality grade, and category
- **🤖 Auto-Updates**: GitHub Actions workflow updates the site every 3 days
- **📱 Mobile-First**: Fully responsive design for all devices

## 🚀 Live Demo

Visit the live website: **[https://ankitrathi85.github.io/Test-Resources-Github/](https://ankitrathi85.github.io/Test-Resources-Github/)**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- GitHub Personal Access Token

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd test-automation-resources
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your GitHub token to `.env`:
```
GITHUB_TOKEN=your_github_token_here
```

### Usage

#### Scan and Generate Website

```bash
# Full build (scan + generate)
npm run build

# Individual commands
npm run scan      # Scan GitHub repositories
npm run generate  # Generate static website
```

#### Development Server

```bash
npm run dev       # Build and serve on http://localhost:8080
```

## 📊 Quality Scoring System

The application uses a 100-point scoring system:

- **Popularity** (25 pts): GitHub stars and forks
- **Activity** (20 pts): Recent commits and releases
- **Documentation** (20 pts): README quality and examples
- **Community** (15 pts): License and contributing guidelines
- **Maintenance** (10 pts): Regular releases
- **Code Quality** (10 pts): Topics, CI/CD, archived status

### Grading Scale
- A+ (90-100): Exceptional quality
- A (80-89): High quality
- B (70-79): Good quality
- C (60-69): Average quality
- D (50-59): Below average
- F (0-49): Poor quality

## 🏗️ Project Structure

```
├── src/
│   ├── index.js          # Main application entry
│   ├── scanner.js        # GitHub repository scanner
│   ├── generator.js      # Static website generator
│   ├── config/
│   │   └── categories.js # Repository categories definition
│   ├── utils/
│   │   ├── github.js     # GitHub API utilities
│   │   ├── scoring.js    # Quality scoring logic
│   │   └── helpers.js    # General utilities
│   └── templates/        # HTML templates
├── dist/                 # Generated website
├── .github/workflows/    # GitHub Actions
└── docs/                 # Documentation
```

## 🔧 Configuration

### Environment Variables

- `GITHUB_TOKEN`: GitHub Personal Access Token (required)
- `RATE_LIMIT_DELAY`: Delay between API calls in ms (default: 1000)
- `MIN_STARS`: Minimum stars for repositories (default: 10)
- `MAX_AGE_MONTHS`: Maximum repository age in months (default: 18)

### Categories

Edit `src/config/categories.js` to modify repository categories and search terms.

## 🚀 GitHub Actions Deployment

The project includes automated GitHub Actions workflows:

### Setup GitHub Pages

1. Go to your repository Settings > Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy updates

### Workflow Features

- **Scheduled Updates**: Runs every 3 days at 2 AM UTC
- **Manual Trigger**: Can be triggered manually from Actions tab
- **Rate Limit Management**: Respects GitHub API limits
- **Caching**: Optimizes API usage with smart caching

## 📝 API Rate Limits

- **Authenticated requests**: 5,000 per hour
- **Search API**: 30 requests per minute
- **Smart caching**: Reduces redundant API calls
- **Automatic retry**: Handles rate limit exceeded scenarios

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Adding New Categories

1. Edit `src/config/categories.js`
2. Add new category with search terms
3. Run `npm run build` to regenerate

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please open a GitHub issue.
