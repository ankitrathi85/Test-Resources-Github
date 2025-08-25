const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const Helpers = require('./utils/helpers');
const categories = require('./config/categories');

class WebsiteGenerator {
  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || 'dist';
    this.templatesDir = path.join(__dirname, 'templates');
    this.assetsDir = path.join(__dirname, '..', 'assets');
    this.dataDir = path.join(this.outputDir, 'data');
  }

  async generate() {
    console.log('🏗️  Generating static website...');
    
    try {
      // Load data
      const repositories = await this.loadRepositories();
      const stats = await this.loadStats();
      const categorizedRepos = Helpers.groupByCategory(repositories, categories);

      // Ensure output directories
      await this.createDirectories();
      
      // Copy assets
      await this.copyAssets();
      
      // Generate pages
      await this.generateHomepage(repositories, stats, categorizedRepos);
      await this.generateCategoryPages(categorizedRepos);
      await this.generateRepositoryPages(repositories);
      await this.generateSearchPage(repositories);
      await this.generateAboutPage();
      
      console.log(`✅ Website generated successfully in ${this.outputDir}/`);
      
    } catch (error) {
      console.error('❌ Generation error:', error);
      throw error;
    }
  }

  async loadRepositories() {
    const reposFile = path.join(this.dataDir, 'repositories.json');
    const repositories = await Helpers.readJsonFile(reposFile);
    if (!repositories) {
      throw new Error('No repository data found. Run scanner first.');
    }
    return repositories;
  }

  async loadStats() {
    const statsFile = path.join(this.dataDir, 'stats.json');
    return await Helpers.readJsonFile(statsFile) || {};
  }

  async createDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'categories'),
      path.join(this.outputDir, 'repositories'),
      path.join(this.outputDir, 'assets'),
      path.join(this.outputDir, 'assets', 'css'),
      path.join(this.outputDir, 'assets', 'js'),
      path.join(this.outputDir, 'assets', 'images')
    ];

    for (const dir of dirs) {
      await Helpers.ensureDirectory(dir);
    }
  }

  async copyAssets() {
    console.log('📁 Copying assets...');
    
    if (await fs.pathExists(this.assetsDir)) {
      await fs.copy(this.assetsDir, path.join(this.outputDir, 'assets'));
    } else {
      // Create default assets if they don't exist
      await this.createDefaultAssets();
    }
    
    // Ensure category.js exists for filtering functionality
    const categoryJSPath = path.join(this.outputDir, 'assets', 'js', 'category.js');
    if (!await fs.pathExists(categoryJSPath)) {
      const categoryJS = this.generateCategoryJS();
      await Helpers.writeFile(categoryJSPath, categoryJS);
    }
    
    // Ensure search.js exists for search page functionality
    const searchJSPath = path.join(this.outputDir, 'assets', 'js', 'search.js');
    if (!await fs.pathExists(searchJSPath)) {
      const searchJS = this.generateSearchJS();
      await Helpers.writeFile(searchJSPath, searchJS);
    }
  }

  async createDefaultAssets() {
    // Create default CSS
    const defaultCSS = await this.generateDefaultCSS();
    await Helpers.writeFile(
      path.join(this.outputDir, 'assets', 'css', 'style.css'),
      defaultCSS
    );

    // Create default JS
    const defaultJS = await this.generateDefaultJS();
    await Helpers.writeFile(
      path.join(this.outputDir, 'assets', 'js', 'main.js'),
      defaultJS
    );

    // Create favicon
    await this.createFavicon();
  }

  async generateHomepage(repositories, stats, categorizedRepos) {
    console.log('🏠 Generating homepage...');
    
    const topRepos = repositories.slice(0, 12);
    const categoryCards = this.generateCategoryCards(categorizedRepos);
    const topRepoCards = topRepos.map(repo => this.generateRepositoryCard(repo)).join('\n');

    const content = await this.loadTemplate('home.html');
    const layout = await this.loadTemplate('layout.html');

    const homeContent = content
      .replace('{{TOTAL_REPOS}}', Helpers.formatNumber(stats.totalRepositories || repositories.length))
      .replace('{{TOTAL_STARS}}', Helpers.formatNumber(stats.totalStars || 0))
      .replace('{{AVG_SCORE}}', stats.averageScore || 0)
      .replace('{{TOP_REPOSITORIES}}', topRepoCards)
      .replace('{{CATEGORY_CARDS}}', categoryCards);

    const html = this.renderLayout(layout, {
      title: 'Test Automation Resources - Quality-scored GitHub repositories',
      description: 'Discover the best test automation tools and frameworks with quality scoring',
      content: homeContent,
      basePath: '',
      additionalJS: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n<script src="assets/js/charts.js"></script>'
    });

    await Helpers.writeFile(path.join(this.outputDir, 'index.html'), html);
  }

  async generateCategoryPages(categorizedRepos) {
    console.log('📂 Generating category pages...');
    
    const layout = await this.loadTemplate('layout.html');
    
    for (const [categoryId, categoryData] of Object.entries(categorizedRepos)) {
      if (categoryData.repositories.length === 0) continue;
      
      const repos = Helpers.sortByScore(categoryData.repositories);
      const repoCards = repos.map(repo => this.generateRepositoryCard(repo, '../')).join('\n');
      
      const categoryStats = this.generateCategoryStats(repos);
      
      const content = `
        <section class="category-header">
          <div class="container">
            <div class="category-title">
              <span class="category-icon">${categoryData.icon}</span>
              <h1>${categoryData.name}</h1>
            </div>
            <p class="category-description">${categoryData.description}</p>
            ${categoryStats}
          </div>
        </section>
        
        <section class="repositories-section">
          <div class="container">
            <div class="section-header">
              <h2>Repositories (${repos.length})</h2>
              <div class="filters">
                <select id="languageFilter" class="filter-select">
                  <option value="">All Languages</option>
                  ${this.generateLanguageOptions(repos)}
                </select>
                <select id="gradeFilter" class="filter-select">
                  <option value="">All Grades</option>
                  <option value="A+">A+ Grade</option>
                  <option value="A">A Grade</option>
                  <option value="B">B Grade</option>
                  <option value="C">C Grade</option>
                  <option value="D">D Grade</option>
                  <option value="F">F Grade</option>
                </select>
              </div>
            </div>
            <div class="repo-grid" id="repoGrid">
              ${repoCards}
            </div>
          </div>
        </section>
      `;

      const html = this.renderLayout(layout, {
        title: `${categoryData.name} - Test Automation Resources`,
        description: `${categoryData.description} - Quality-scored repositories`,
        content,
        basePath: '../',
        additionalJS: '<script src="../assets/js/category.js"></script>'
      });

      const filename = Helpers.slugify(categoryData.name) + '.html';
      await Helpers.writeFile(path.join(this.outputDir, 'categories', filename), html);
    }
  }

  async generateRepositoryPages(repositories) {
    console.log('📄 Generating repository detail pages...');
    
    const layout = await this.loadTemplate('layout.html');
    
    for (const repo of repositories) {
      const content = this.generateRepositoryDetailContent(repo);
      
      const html = this.renderLayout(layout, {
        title: `${repo.name} - ${repo.owner.login} - Test Automation Resources`,
        description: repo.description || `${repo.name} repository by ${repo.owner.login}`,
        content,
        basePath: '../',
        additionalJS: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n<script src="../assets/js/repository.js"></script>'
      });

      const filename = Helpers.slugify(`${repo.owner.login}-${repo.name}`) + '.html';
      await Helpers.writeFile(path.join(this.outputDir, 'repositories', filename), html);
    }
  }

  async generateSearchPage(repositories) {
    console.log('🔍 Generating search page...');
    
    const layout = await this.loadTemplate('layout.html');
    
    const content = `
      <section class="search-header">
        <div class="container">
          <h1>🔍 Advanced Search</h1>
          <p>Find the perfect test automation tool for your needs</p>
        </div>
      </section>
      
      <section class="search-filters">
        <div class="container">
          <div class="search-form">
            <div class="search-input-group">
              <input type="text" id="searchInput" placeholder="Search repositories..." class="search-input">
              <button id="searchBtn" class="btn btn-primary">Search</button>
            </div>
            
            <div class="filter-grid">
              <div class="filter-group">
                <label>Category</label>
                <select id="categoryFilter">
                  <option value="">All Categories</option>
                  ${this.generateCategoryOptions()}
                </select>
              </div>
              
              <div class="filter-group">
                <label>Language</label>
                <select id="languageFilter">
                  <option value="">All Languages</option>
                  ${this.generateLanguageOptions(repositories)}
                </select>
              </div>
              
              <div class="filter-group">
                <label>Quality Grade</label>
                <select id="gradeFilter">
                  <option value="">All Grades</option>
                  <option value="A+">A+ Grade</option>
                  <option value="A">A Grade</option>
                  <option value="B">B Grade</option>
                  <option value="C">C Grade</option>
                  <option value="D">D Grade</option>
                  <option value="F">F Grade</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Sort By</label>
                <select id="sortFilter">
                  <option value="score">Quality Score</option>
                  <option value="stars">Stars</option>
                  <option value="forks">Forks</option>
                  <option value="updated">Last Updated</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="search-results">
        <div class="container">
          <div class="results-header">
            <h2 id="resultsCount">All Repositories (${repositories.length})</h2>
            <div class="view-toggle">
              <button id="gridView" class="view-btn active">Grid</button>
              <button id="listView" class="view-btn">List</button>
            </div>
          </div>
          
          <div class="repo-grid" id="searchResults">
            ${repositories.map(repo => this.generateRepositoryCard(repo)).join('\n')}
          </div>
        </div>
      </section>
      
      <script>
        window.repositoriesData = ${JSON.stringify(repositories)};
      </script>
    `;

    const html = this.renderLayout(layout, {
      title: 'Advanced Search - Test Automation Resources',
      description: 'Search and filter test automation repositories by category, language, and quality',
      content,
      basePath: '',
      additionalJS: '<script src="assets/js/search.js"></script>'
    });

    await Helpers.writeFile(path.join(this.outputDir, 'search.html'), html);
  }

  async generateAboutPage() {
    console.log('ℹ️  Generating about page...');
    
    const layout = await this.loadTemplate('layout.html');
    
    const content = `
      <section class="about-header">
        <div class="container">
          <h1>About Test Automation Resources</h1>
          <p class="lead">Learn about our methodology and quality scoring system</p>
        </div>
      </section>
      
      <section class="about-content">
        <div class="container">
          <div class="content-grid">
            <div class="content-section">
              <h2>🎯 Our Mission</h2>
              <p>We help developers and QA engineers discover high-quality test automation tools and frameworks. Our platform automatically scans GitHub repositories, analyzes their quality, and presents them in an easy-to-browse format.</p>
            </div>
            
            <div class="content-section">
              <h2>📊 Quality Scoring</h2>
              <p>Each repository is scored on a 100-point scale across six categories:</p>
              <ul class="scoring-list">
                <li><strong>Popularity (25 pts):</strong> GitHub stars and forks</li>
                <li><strong>Activity (20 pts):</strong> Recent commits and releases</li>
                <li><strong>Documentation (20 pts):</strong> README quality and examples</li>
                <li><strong>Community (15 pts):</strong> License and contributing guidelines</li>
                <li><strong>Maintenance (10 pts):</strong> Regular releases</li>
                <li><strong>Code Quality (10 pts):</strong> Topics, CI/CD, archived status</li>
              </ul>
            </div>
            
            <div class="content-section">
              <h2>🏆 Grading Scale</h2>
              <div class="grade-scale">
                <div class="grade-item">
                  <span class="grade-badge grade-a-plus">A+</span>
                  <span>90-100 points - Exceptional quality</span>
                </div>
                <div class="grade-item">
                  <span class="grade-badge grade-a">A</span>
                  <span>80-89 points - High quality</span>
                </div>
                <div class="grade-item">
                  <span class="grade-badge grade-b">B</span>
                  <span>70-79 points - Good quality</span>
                </div>
                <div class="grade-item">
                  <span class="grade-badge grade-c">C</span>
                  <span>60-69 points - Average quality</span>
                </div>
                <div class="grade-item">
                  <span class="grade-badge grade-d">D</span>
                  <span>50-59 points - Below average</span>
                </div>
                <div class="grade-item">
                  <span class="grade-badge grade-f">F</span>
                  <span>0-49 points - Poor quality</span>
                </div>
              </div>
            </div>
            
            <div class="content-section">
              <h2>🔄 Update Process</h2>
              <p>Our system automatically scans GitHub every 3 days using GitHub Actions. We respect API rate limits and use smart caching to minimize requests while keeping data fresh.</p>
            </div>
            
            <div class="content-section">
              <h2>📝 Data Sources</h2>
              <p>All data comes from the GitHub public API. We analyze repository metadata, commit history, releases, documentation, and community health metrics.</p>
            </div>
            
            <div class="content-section">
              <h2>🤝 Contributing</h2>
              <p>This project is open source. You can contribute by suggesting new categories, improving the scoring algorithm, or reporting issues on our GitHub repository.</p>
              <a href="https://github.com/your-username/test-automation-resources" class="btn btn-primary">View on GitHub</a>
            </div>
          </div>
        </div>
      </section>
    `;

    const html = this.renderLayout(layout, {
      title: 'About - Test Automation Resources',
      description: 'Learn about our methodology for scoring and categorizing test automation repositories',
      content,
      basePath: '',
      additionalJS: ''
    });

    await Helpers.writeFile(path.join(this.outputDir, 'about.html'), html);
  }

  async loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, templateName);
    try {
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.warn(`Template ${templateName} not found, using default`);
      return this.getDefaultTemplate(templateName);
    }
  }

  getDefaultTemplate(templateName) {
    // Return basic templates if files don't exist
    if (templateName === 'layout.html') {
      return `<!DOCTYPE html>
<html><head><title>{{TITLE}}</title></head>
<body>{{CONTENT}}</body></html>`;
    }
    return '{{CONTENT}}';
  }

  renderLayout(layout, data) {
    const categoryLinks = Object.entries(categories)
      .map(([id, cat]) => `<a href="${data.basePath}categories/${Helpers.slugify(cat.name)}.html" class="dropdown-link">${cat.name}</a>`)
      .join('\n');

    const footerCategoryLinks = Object.entries(categories)
      .slice(0, 4)
      .map(([id, cat]) => `<li><a href="${data.basePath}categories/${Helpers.slugify(cat.name)}.html">${cat.name}</a></li>`)
      .join('\n');

    return layout
      .replace(/{{TITLE}}/g, data.title)
      .replace(/{{DESCRIPTION}}/g, data.description)
      .replace(/{{CONTENT}}/g, data.content)
      .replace(/{{BASE_PATH}}/g, data.basePath)
      .replace(/{{CSS_PATH}}/g, `${data.basePath}assets/css/style.css`)
      .replace(/{{CATEGORY_LINKS}}/g, categoryLinks)
      .replace(/{{FOOTER_CATEGORY_LINKS}}/g, footerCategoryLinks)
      .replace(/{{LAST_UPDATED}}/g, Helpers.formatDate(new Date()))
      .replace(/{{ADDITIONAL_JS}}/g, data.additionalJS || '');
  }

  generateRepositoryCard(repo, basePath = '') {
    const repoUrl = repo.html_url;
    const detailUrl = `${basePath}repositories/${Helpers.slugify(`${repo.owner.login}-${repo.name}`)}.html`;
    const gradeClass = repo.qualityScore.grade.toLowerCase().replace('+', '-plus');
    
    const topics = repo.topics ? 
      repo.topics.slice(0, 5).map(topic => `<span class="topic-tag">${topic}</span>`).join('') : '';

    return `
      <div class="repository-card" data-language="${repo.language || ''}" data-grade="${repo.qualityScore.grade}" data-category="${repo.category || ''}">
        <div class="repo-header">
          <div class="repo-title">
            <h3><a href="${repoUrl}" target="_blank" rel="noopener">${repo.name}</a></h3>
            <div class="repo-meta">
              <span class="repo-owner">${repo.owner.login}</span>
              ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ''}
            </div>
          </div>
          <div class="quality-score">
            <div class="score-badge grade-${gradeClass}">${repo.qualityScore.grade}</div>
            <div class="score-number">${repo.qualityScore.total}/100</div>
          </div>
        </div>
        
        <p class="repo-description">${Helpers.truncateText(repo.description || 'No description available', 120)}</p>
        
        <div class="repo-stats">
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">${Helpers.formatNumber(repo.stargazers_count)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🍴</span>
            <span class="stat-value">${Helpers.formatNumber(repo.forks_count)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📅</span>
            <span class="stat-value">${Helpers.formatRelativeDate(repo.updated_at)}</span>
          </div>
          ${repo.open_issues_count ? `
          <div class="stat-item">
            <span class="stat-icon">🐛</span>
            <span class="stat-value">${Helpers.formatNumber(repo.open_issues_count)}</span>
          </div>` : ''}
        </div>
        
        ${topics ? `<div class="repo-tags">${topics}</div>` : ''}
        
        <div class="repo-actions">
          <a href="${detailUrl}" class="btn btn-sm btn-outline">View Details</a>
          <a href="${repoUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">
            View on GitHub
          </a>
        </div>
      </div>
    `;
  }

  generateCategoryCards(categorizedRepos) {
    return Object.entries(categorizedRepos)
      .filter(([_, cat]) => cat.repositories.length > 0)
      .map(([categoryId, categoryData]) => {
        const repos = categoryData.repositories;
        const avgScore = repos.length > 0 ? 
          Math.round(repos.reduce((sum, repo) => sum + repo.qualityScore.total, 0) / repos.length) : 0;
        const topGrade = repos.length > 0 ? 
          repos.reduce((best, repo) => repo.qualityScore.total > best.qualityScore.total ? repo : best).qualityScore.grade : 'N/A';
        
        const languages = categoryData.languages.slice(0, 3)
          .map(lang => `<span class="language-tag">${lang}</span>`).join('');

        return `
          <div class="category-card">
            <div class="category-header">
              <div class="category-icon">${categoryData.icon}</div>
              <h3 class="category-title">${categoryData.name}</h3>
              <div class="category-count">${repos.length} repositories</div>
            </div>
            
            <p class="category-description">${categoryData.description}</p>
            
            <div class="category-languages">${languages}</div>
            
            <div class="category-stats">
              <div class="stat">
                <span class="stat-label">Avg Score:</span>
                <span class="stat-value">${avgScore}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Top Grade:</span>
                <div class="grade-badge grade-${topGrade.toLowerCase().replace('+', '-plus')}">${topGrade}</div>
              </div>
            </div>
            
            <div class="category-actions">
              <a href="categories/${Helpers.slugify(categoryData.name)}.html" class="btn btn-primary">Explore ${categoryData.name}</a>
            </div>
          </div>
        `;
      }).join('\n');
  }

  generateRepositoryDetailContent(repo) {
    const gradeClass = repo.qualityScore.grade.toLowerCase().replace('+', '-plus');
    const breakdown = repo.qualityScore.breakdown;
    
    return `
      <section class="repo-detail-header">
        <div class="container">
          <div class="repo-title-section">
            <h1>${repo.name}</h1>
            <p class="repo-owner">by ${repo.owner.login}</p>
            <p class="repo-description">${repo.description || 'No description available'}</p>
          </div>
          
          <div class="repo-score-section">
            <div class="main-score">
              <div class="score-badge grade-${gradeClass} large">${repo.qualityScore.grade}</div>
              <div class="score-details">
                <div class="score-number">${repo.qualityScore.total}/100</div>
                <div class="score-description">${this.getScoreDescription(repo.qualityScore.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="repo-stats-section">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">${Helpers.formatNumber(repo.stargazers_count)}</div>
              <div class="stat-label">Stars</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🍴</div>
              <div class="stat-value">${Helpers.formatNumber(repo.forks_count)}</div>
              <div class="stat-label">Forks</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-value">${Helpers.formatRelativeDate(repo.updated_at)}</div>
              <div class="stat-label">Updated</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔧</div>
              <div class="stat-value">${repo.language || 'N/A'}</div>
              <div class="stat-label">Language</div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="score-breakdown">
        <div class="container">
          <h2>Quality Score Breakdown</h2>
          <div class="breakdown-chart">
            <canvas id="scoreChart" width="400" height="200"></canvas>
          </div>
          <div class="breakdown-details">
            ${this.generateScoreBreakdown(breakdown)}
          </div>
        </div>
      </section>
      
      <section class="repo-actions-section">
        <div class="container">
          <div class="action-buttons">
            <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-primary btn-large">
              View on GitHub
            </a>
            <a href="${repo.clone_url}" class="btn btn-secondary btn-large">
              Clone Repository
            </a>
            ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener" class="btn btn-outline btn-large">Visit Homepage</a>` : ''}
          </div>
        </div>
      </section>
      
      <script>
        window.repoData = ${JSON.stringify({
          name: repo.name,
          score: repo.qualityScore.total,
          breakdown: repo.qualityScore.breakdown
        })};
      </script>
    `;
  }

  generateScoreBreakdown(breakdown) {
    const categories = [
      { key: 'popularity', name: 'Popularity', max: 25, description: 'GitHub stars and forks' },
      { key: 'activity', name: 'Activity', max: 20, description: 'Recent commits and releases' },
      { key: 'documentation', name: 'Documentation', max: 20, description: 'README quality and examples' },
      { key: 'community', name: 'Community', max: 15, description: 'License and contributing guidelines' },
      { key: 'maintenance', name: 'Maintenance', max: 10, description: 'Regular releases' },
      { key: 'codeQuality', name: 'Code Quality', max: 10, description: 'Topics, CI/CD, archived status' }
    ];

    return categories.map(cat => {
      const score = Math.round(breakdown[cat.key] || 0);
      const percentage = Math.round((score / cat.max) * 100);
      
      return `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-name">${cat.name}</span>
            <span class="breakdown-score">${score}/${cat.max}</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="breakdown-description">${cat.description}</div>
        </div>
      `;
    }).join('\n');
  }

  getScoreDescription(score) {
    if (score >= 90) return 'Exceptional quality with excellent documentation and active maintenance.';
    if (score >= 80) return 'High quality repository with good practices.';
    if (score >= 70) return 'Good quality repository with decent documentation.';
    if (score >= 60) return 'Average quality repository.';
    if (score >= 50) return 'Below average quality with room for improvement.';
    return 'Poor quality repository with significant issues.';
  }

  generateLanguageOptions(repositories) {
    const languages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))].sort();
    return languages.map(lang => `<option value="${lang}">${lang}</option>`).join('\n');
  }

  generateCategoryOptions() {
    return Object.entries(categories)
      .map(([id, cat]) => `<option value="${id}">${cat.name}</option>`)
      .join('\n');
  }

  generateCategoryStats(repos) {
    const avgScore = repos.length > 0 ? 
      Math.round(repos.reduce((sum, repo) => sum + repo.qualityScore.total, 0) / repos.length) : 0;
    
    const gradeDistribution = repos.reduce((dist, repo) => {
      dist[repo.qualityScore.grade] = (dist[repo.qualityScore.grade] || 0) + 1;
      return dist;
    }, {});

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    return `
      <div class="category-stats">
        <div class="stat-item">
          <span class="stat-number">${repos.length}</span>
          <span class="stat-label">Repositories</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${avgScore}</span>
          <span class="stat-label">Avg Score</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${Helpers.formatNumber(totalStars)}</span>
          <span class="stat-label">Total Stars</span>
        </div>
      </div>
    `;
  }

  async generateDefaultCSS() {
    return `
/* Test Automation Resources - Default Styles */
:root {
  --primary-color: #667eea;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --danger-color: #EF4444;
  --dark-bg: #1a1a1a;
  --dark-surface: #2d2d2d;
  --dark-text: #ffffff;
  --light-bg: #ffffff;
  --light-surface: #f8fafc;
  --light-text: #334155;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--light-text);
  background: var(--light-bg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar {
  padding: 1rem 0;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1.2rem;
}

.brand-icon {
  margin-right: 0.5rem;
  font-size: 1.5rem;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: var(--light-text);
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover {
  color: var(--primary-color);
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary {
  background: var(--primary-color);
}

.btn-secondary {
  background: #6b7280;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--primary-color), #818cf8);
  color: white;
  padding: 4rem 0;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Repository Cards */
.repo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.repository-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.repository-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.repo-title h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.repo-title a {
  color: var(--primary-color);
  text-decoration: none;
}

.repo-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.quality-score {
  text-align: center;
}

.score-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.875rem;
  color: white;
}

.grade-a-plus { background: var(--success-color); }
.grade-a { background: #22c55e; }
.grade-b { background: var(--warning-color); }
.grade-c { background: #f97316; }
.grade-d { background: var(--danger-color); }
.grade-f { background: #7f1d1d; }

.score-number {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.repo-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.repo-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
}

.repo-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Category Cards */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.category-header {
  text-align: center;
  margin-bottom: 1rem;
}

.category-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.category-title {
  margin: 0.5rem 0;
  color: var(--primary-color);
}

.category-count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Sections */
.section-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--light-text);
}

.top-repositories,
.categories,
.quality-grades {
  padding: 4rem 0;
}

.categories {
  background: var(--light-surface);
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.footer-links {
  list-style: none;
}

.footer-links a {
  color: #d1d5db;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--primary-color);
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 1rem;
  text-align: center;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .repo-grid {
    grid-template-columns: 1fr;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .navbar-menu {
    display: none;
  }
}
    `;
  }

  async generateDefaultJS() {
    return `
// Test Automation Resources - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle
    initThemeToggle();
    
    // Mobile navigation
    initMobileNav();
    
    // Smooth scrolling
    initSmoothScrolling();
    
    // Search functionality
    if (document.getElementById('searchInput')) {
        initSearch();
    }
    
    // Charts
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
});

function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = themeToggle.querySelector('.theme-icon');
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

function initMobileNav() {
    const toggle = document.getElementById('navbar-toggle');
    const menu = document.getElementById('navbar-menu');
    
    if (!toggle || !menu) return;
    
    toggle.addEventListener('click', function() {
        menu.classList.toggle('active');
    });
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!searchInput || !resultsContainer) return;
    
    let allRepositories = window.repositoriesData || [];
    
    function filterRepositories() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const languageFilter = document.getElementById('languageFilter')?.value || '';
        const gradeFilter = document.getElementById('gradeFilter')?.value || '';
        const sortFilter = document.getElementById('sortFilter')?.value || 'score';
        
        let filtered = allRepositories.filter(repo => {
            const matchesSearch = !searchTerm || 
                repo.name.toLowerCase().includes(searchTerm) ||
                repo.description?.toLowerCase().includes(searchTerm) ||
                repo.owner.login.toLowerCase().includes(searchTerm);
                
            const matchesCategory = !categoryFilter || repo.category === categoryFilter;
            const matchesLanguage = !languageFilter || repo.language === languageFilter;
            const matchesGrade = !gradeFilter || repo.qualityScore.grade === gradeFilter;
            
            return matchesSearch && matchesCategory && matchesLanguage && matchesGrade;
        });
        
        // Sort results
        filtered.sort((a, b) => {
            switch (sortFilter) {
                case 'stars':
                    return b.stargazers_count - a.stargazers_count;
                case 'forks':
                    return b.forks_count - a.forks_count;
                case 'updated':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                default: // score
                    return b.qualityScore.total - a.qualityScore.total;
            }
        });
        
        displayResults(filtered);
        updateResultsCount(filtered.length, allRepositories.length);
    }
    
    function displayResults(repositories) {
        if (repositories.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No repositories found matching your criteria.</div>';
            return;
        }
        
        resultsContainer.innerHTML = repositories.map(repo => generateRepositoryCard(repo)).join('');
    }
    
    function updateResultsCount(filtered, total) {
        if (resultsCount) {
            resultsCount.textContent = \`Showing \${filtered} of \${total} repositories\`;
        }
    }
    
    function generateRepositoryCard(repo) {
        // This would be the same as the server-side generation
        // Simplified version for client-side
        return \`
            <div class="repository-card">
                <h3><a href="\${repo.html_url}" target="_blank">\${repo.name}</a></h3>
                <p>\${repo.description || 'No description'}</p>
                <div class="repo-stats">
                    <span>⭐ \${repo.stargazers_count}</span>
                    <span>🍴 \${repo.forks_count}</span>
                    <span>Score: \${repo.qualityScore.total}/100</span>
                </div>
            </div>
        \`;
    }
    
    // Event listeners
    searchInput.addEventListener('input', filterRepositories);
    document.getElementById('categoryFilter')?.addEventListener('change', filterRepositories);
    document.getElementById('languageFilter')?.addEventListener('change', filterRepositories);
    document.getElementById('gradeFilter')?.addEventListener('change', filterRepositories);
    document.getElementById('sortFilter')?.addEventListener('change', filterRepositories);
    
    // Initial display
    filterRepositories();
}

function initCharts() {
    // Initialize Chart.js charts if data is available
    if (window.gradeData && document.getElementById('gradeChart')) {
        createGradeChart();
    }
    
    if (window.repoData && document.getElementById('scoreChart')) {
        createScoreChart();
    }
}

function createGradeChart() {
    const ctx = document.getElementById('gradeChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(window.gradeData),
            datasets: [{
                data: Object.values(window.gradeData),
                backgroundColor: [
                    '#10B981', // A+
                    '#22c55e', // A
                    '#F59E0B', // B
                    '#f97316', // C
                    '#EF4444', // D
                    '#7f1d1d'  // F
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createScoreChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    const breakdown = window.repoData.breakdown;
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Popularity', 'Activity', 'Documentation', 'Community', 'Maintenance', 'Code Quality'],
            datasets: [{
                label: 'Score',
                data: [
                    breakdown.popularity,
                    breakdown.activity,
                    breakdown.documentation,
                    breakdown.community,
                    breakdown.maintenance,
                    breakdown.codeQuality
                ],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 25
                }
            }
        }
    });
}
    `;
  }

  async createFavicon() {
    // Create a simple favicon placeholder
    const faviconPath = path.join(this.outputDir, 'assets', 'favicon.ico');
    // This would normally be a proper favicon file
    await Helpers.writeFile(faviconPath, ''); // Placeholder
  }

  generateCategoryJS() {
    return `/**
 * Category page filtering functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    const languageFilter = document.getElementById('languageFilter');
    const gradeFilter = document.getElementById('gradeFilter');
    const repoGrid = document.getElementById('repoGrid');
    const repoCards = document.querySelectorAll('.repository-card');
    
    if (!languageFilter || !gradeFilter || !repoGrid) {
        console.log('Filter elements not found, skipping category filtering setup');
        return;
    }
    
    // Filter function
    function filterRepositories() {
        const selectedLanguage = languageFilter.value.toLowerCase();
        const selectedGrade = gradeFilter.value.toLowerCase();
        
        let visibleCount = 0;
        
        repoCards.forEach(card => {
            const cardLanguage = (card.getAttribute('data-language') || '').toLowerCase();
            const cardGrade = (card.getAttribute('data-grade') || '').toLowerCase();
            
            const languageMatch = !selectedLanguage || cardLanguage === selectedLanguage;
            const gradeMatch = !selectedGrade || cardGrade === selectedGrade;
            
            if (languageMatch && gradeMatch) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update repository count in section header
        const sectionHeader = document.querySelector('.section-header h2');
        if (sectionHeader) {
            const totalCount = repoCards.length;
            if (visibleCount === totalCount) {
                sectionHeader.textContent = 'Repositories (' + totalCount + ')';
            } else {
                sectionHeader.textContent = 'Repositories (' + visibleCount + ' of ' + totalCount + ')';
            }
        }
        
        // Show/hide "no results" message
        let noResultsMsg = document.getElementById('noResultsMessage');
        if (visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'noResultsMessage';
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.innerHTML = '<p>No repositories match the selected filters.</p><p>Try adjusting your filter criteria.</p>';
                repoGrid.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
    
    // Clear filters function
    function clearFilters() {
        languageFilter.value = '';
        gradeFilter.value = '';
        filterRepositories();
    }
    
    // Add clear filters button if it doesn't exist
    const filtersContainer = document.querySelector('.filters');
    if (filtersContainer && !document.getElementById('clearFilters')) {
        const clearButton = document.createElement('button');
        clearButton.id = 'clearFilters';
        clearButton.className = 'btn btn-secondary';
        clearButton.textContent = 'Clear Filters';
        clearButton.addEventListener('click', clearFilters);
        filtersContainer.appendChild(clearButton);
    }
    
    // Event listeners
    languageFilter.addEventListener('change', filterRepositories);
    gradeFilter.addEventListener('change', filterRepositories);
    
    // Initialize view
    filterRepositories();
    
    console.log('Category filtering initialized with ' + repoCards.length + ' repositories');
});`;
  }

  generateSearchJS() {
    return `/**
 * Search page functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initSearchPage();
});

function initSearchPage() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!searchInput || !resultsContainer) {
        console.log('Search elements not found, skipping search initialization');
        return;
    }
    
    let allRepositories = window.repositoriesData || [];
    
    function filterRepositories() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const languageFilter = document.getElementById('languageFilter')?.value || '';
        const gradeFilter = document.getElementById('gradeFilter')?.value || '';
        const sortFilter = document.getElementById('sortFilter')?.value || 'score';
        
        let filtered = allRepositories.filter(repo => {
            const matchesSearch = !searchTerm || 
                repo.name.toLowerCase().includes(searchTerm) ||
                (repo.description && repo.description.toLowerCase().includes(searchTerm)) ||
                repo.owner.login.toLowerCase().includes(searchTerm);
                
            const matchesCategory = !categoryFilter || repo.category === categoryFilter;
            const matchesLanguage = !languageFilter || repo.language === languageFilter;
            const matchesGrade = !gradeFilter || repo.qualityScore.grade === gradeFilter;
            
            return matchesSearch && matchesCategory && matchesLanguage && matchesGrade;
        });
        
        // Sort results
        filtered.sort((a, b) => {
            switch (sortFilter) {
                case 'stars':
                    return b.stargazers_count - a.stargazers_count;
                case 'forks':
                    return b.forks_count - a.forks_count;
                case 'updated':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                default: // score
                    return b.qualityScore.total - a.qualityScore.total;
            }
        });
        
        displayResults(filtered);
        updateResultsCount(filtered.length, allRepositories.length);
    }
    
    function displayResults(repositories) {
        if (repositories.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No repositories found matching your criteria.</div>';
            return;
        }
        
        resultsContainer.innerHTML = repositories.map(repo => generateRepositoryCard(repo)).join('');
    }
    
    function updateResultsCount(filtered, total) {
        if (resultsCount) {
            resultsCount.textContent = 'Showing ' + filtered + ' of ' + total + ' repositories';
        }
    }
    
    function generateRepositoryCard(repo) {
        const gradeClass = repo.qualityScore.grade.toLowerCase().replace('+', '-plus');
        // Use the same slugify logic as the server-side
        const repoSlug = (repo.owner.login + '-' + repo.name)
            .toLowerCase()
            .replace(/[^\\w\\s-]/g, '')
            .replace(/[\\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const detailUrl = 'repositories/' + repoSlug + '.html';
        
        return '<div class="repository-card" data-language="' + (repo.language || '') + '" data-grade="' + repo.qualityScore.grade + '">' +
            '<div class="repo-header">' +
                '<div class="repo-title">' +
                    '<h3><a href="' + repo.html_url + '" target="_blank" rel="noopener">' + repo.name + '</a></h3>' +
                    '<div class="repo-meta">' +
                        '<span class="repo-owner">' + repo.owner.login + '</span>' +
                        (repo.language ? '<span class="repo-language">' + repo.language + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="quality-score">' +
                    '<div class="score-badge grade-' + gradeClass + '">' + repo.qualityScore.grade + '</div>' +
                    '<div class="score-number">' + repo.qualityScore.total + '/100</div>' +
                '</div>' +
            '</div>' +
            '<p class="repo-description">' + (repo.description || 'No description available') + '</p>' +
            '<div class="repo-stats">' +
                '<div class="stat-item"><span class="stat-icon">⭐</span><span class="stat-value">' + repo.stargazers_count + '</span></div>' +
                '<div class="stat-item"><span class="stat-icon">🍴</span><span class="stat-value">' + repo.forks_count + '</span></div>' +
                '<div class="stat-item"><span class="stat-icon">📅</span><span class="stat-value">' + new Date(repo.updated_at).toLocaleDateString() + '</span></div>' +
            '</div>' +
            '<div class="repo-actions">' +
                '<a href="' + detailUrl + '" class="btn btn-sm btn-outline">View Details</a>' +
                '<a href="' + repo.html_url + '" target="_blank" rel="noopener" class="btn btn-sm btn-primary">View on GitHub</a>' +
            '</div>' +
        '</div>';
    }
    
    // Event listeners
    searchInput.addEventListener('input', filterRepositories);
    document.getElementById('categoryFilter')?.addEventListener('change', filterRepositories);
    document.getElementById('languageFilter')?.addEventListener('change', filterRepositories);
    document.getElementById('gradeFilter')?.addEventListener('change', filterRepositories);
    document.getElementById('sortFilter')?.addEventListener('change', filterRepositories);
    
    // Clear search functionality
    const clearButton = document.getElementById('clearSearch');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            document.getElementById('categoryFilter').value = '';
            document.getElementById('languageFilter').value = '';
            document.getElementById('gradeFilter').value = '';
            document.getElementById('sortFilter').value = 'score';
            filterRepositories();
        });
    }
    
    // Initial display
    filterRepositories();
    
    console.log('Search page initialized with ' + allRepositories.length + ' repositories');
}`;
  }
}

// Run generator if called directly
if (require.main === module) {
  const generator = new WebsiteGenerator();
  generator.generate().catch(console.error);
}

module.exports = WebsiteGenerator;
