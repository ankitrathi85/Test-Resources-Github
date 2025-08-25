# Test Automation Resources - Quick Start Guide

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 18+ installed
- GitHub Personal Access Token
- Git repository (for GitHub Pages deployment)

### 2. Installation
```bash
# Clone or create your repository
git clone <your-repo-url>
cd test-automation-resources

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configuration
Edit `.env` file:
```env
GITHUB_TOKEN=your_github_token_here
RATE_LIMIT_DELAY=2000
MIN_STARS=10
MAX_AGE_MONTHS=18
OUTPUT_DIR=dist
```

### 4. First Run
```bash
# Test the scanner
npm run scan

# Generate website
npm run generate

# Start development server
npm run dev
```

## 🤖 GitHub Actions Setup

### 1. Repository Settings
1. Go to your repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Save the settings

### 2. Required Permissions
The workflow needs these permissions (already configured):
- `contents: read` - Read repository contents
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - OIDC token for deployment

### 3. Automatic Deployment
The GitHub Actions workflow will:
- ✅ Run every 3 days at 2 AM UTC
- ✅ Can be triggered manually from Actions tab
- ✅ Automatically deploy to GitHub Pages
- ✅ Handle rate limiting and errors gracefully

### 4. Manual Trigger
Go to Actions tab > "Update Test Automation Resources" > "Run workflow"

## 📊 How It Works

### Repository Scanning
1. **Search**: Uses GitHub API to find repositories with test automation keywords
2. **Filter**: Applies minimum stars, activity, and quality criteria
3. **Enrich**: Fetches additional data (README, releases, contributors, etc.)
4. **Score**: Calculates quality score based on 6 categories
5. **Categorize**: Groups repositories by testing type

### Quality Scoring (100 points total)
- **Popularity (25 pts)**: Stars and forks with logarithmic scaling
- **Activity (20 pts)**: Recent commits, releases, and updates
- **Documentation (20 pts)**: README quality, length, and structure
- **Community (15 pts)**: License, contributing guidelines, issues
- **Maintenance (10 pts)**: Regular releases and maintenance patterns
- **Code Quality (10 pts)**: Topics, CI/CD presence, not archived

### Website Generation
1. **Multi-page structure**: Homepage, categories, repository details, search
2. **Responsive design**: Mobile-first with dark/light themes
3. **Interactive features**: Real-time search, filtering, sorting
4. **Performance optimized**: Minified assets, lazy loading, caching

## 🔧 Customization

### Adding New Categories
Edit `src/config/categories.js`:
```javascript
'new-category': {
  name: 'New Category',
  description: 'Description of the category',
  icon: '🆕',
  searchTerms: [
    'search term 1',
    'search term 2'
  ],
  languages: ['JavaScript', 'Python'],
  primaryColor: '#007bff'
}
```

### Adjusting Filters
Edit `.env` file:
```env
MIN_STARS=50          # Minimum stars required
MAX_AGE_MONTHS=12     # Maximum months since last update
RATE_LIMIT_DELAY=3000 # Delay between API calls (ms)
```

### Modifying Scoring
Edit `src/utils/scoring.js` to adjust the quality scoring algorithm.

## 📈 Monitoring

### GitHub Actions Logs
- Go to Actions tab to see workflow runs
- Check logs for any errors or rate limiting issues
- Monitor API usage and remaining rate limits

### Rate Limiting
- **Authenticated requests**: 5,000 per hour
- **Search API**: 30 requests per minute
- **Smart caching**: Avoids redundant API calls
- **Automatic retry**: Handles rate limit exceeded

### Performance Metrics
- **Scan time**: Typically 10-15 minutes for full scan
- **Generated files**: ~100-500 HTML files depending on results
- **Website size**: Usually 5-20MB total
- **Load time**: <3 seconds for most pages

## 🐛 Troubleshooting

### Common Issues

#### 1. GitHub Token Issues
```bash
# Test your token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

#### 2. Rate Limiting
- Increase `RATE_LIMIT_DELAY` in `.env`
- Use a GitHub App token (higher limits)
- Run during off-peak hours

#### 3. Build Failures
```bash
# Check logs
npm run scan 2>&1 | tee scan.log
npm run generate 2>&1 | tee generate.log

# Test locally
npm run dev
```

#### 4. Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Error Codes
- **401**: Invalid GitHub token
- **403**: Rate limit exceeded
- **404**: Repository not found
- **422**: Invalid search query

## 🔒 Security

### Environment Variables
- Never commit `.env` file to repository
- Use GitHub Secrets for sensitive data
- Rotate GitHub tokens regularly

### API Usage
- Respects GitHub API rate limits
- Uses minimal required permissions
- No data is stored permanently

## 📝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

### Code Style
- Use ESLint configuration
- Follow existing naming conventions
- Add comments for complex logic
- Update documentation

## 📞 Support

### Getting Help
- Check GitHub Issues for common problems
- Review GitHub Actions logs for deployment issues
- Test locally before pushing changes

### Reporting Issues
Include:
- Node.js version
- Operating system
- Error messages
- Steps to reproduce

---

**Last Updated**: August 2024  
**Version**: 1.0.0
