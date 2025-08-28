#!/usr/bin/env node

/**
 * Staged Website Generator - Builds website from accumulated data
 * Works with partial data and shows progress
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const categories = require('./config/categories');
const Helpers = require('./utils/helpers');

class StagedGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.repositoriesFile = path.join(this.dataDir, 'repositories.json');
    this.statusFile = path.join(this.dataDir, 'scan-status.json');
    this.distDir = path.join(__dirname, '..', 'dist');
    this.assetsDir = path.join(__dirname, '..', 'assets');
  }

  async loadData() {
    const repositories = await fs.readJSON(this.repositoriesFile).catch(() => ({}));
    const scanStatus = await fs.readJSON(this.statusFile).catch(() => ({
      completedCategories: [],
      currentCycle: 1,
      lastScanTime: null
    }));
    
    return { repositories, scanStatus };
  }

  async ensureDirectories() {
    await fs.ensureDir(this.distDir);
    await fs.ensureDir(path.join(this.distDir, 'categories'));
    await fs.ensureDir(path.join(this.distDir, 'repositories'));
    await fs.ensureDir(path.join(this.distDir, 'assets'));
  }

  async copyAssets() {
    if (await fs.pathExists(this.assetsDir)) {
      await fs.copy(this.assetsDir, path.join(this.distDir, 'assets'));
    }
  }

  getRepositoriesByCategory(repositories) {
    const byCategory = {};
    
    Object.keys(categories).forEach(categoryKey => {
      byCategory[categoryKey] = [];
    });
    
    Object.values(repositories).forEach(repo => {
      if (repo.category && byCategory[repo.category]) {
        byCategory[repo.category].push(repo);
      }
    });
    
    return byCategory;
  }

  getProgressBadge(scanStatus) {
    const completed = scanStatus.completedCategories.length;
    const total = Object.keys(categories).length;
    const percentage = Math.round((completed / total) * 100);
    
    let color = 'orange';
    if (percentage === 100) color = 'green';
    else if (percentage >= 75) color = 'yellow';
    
    return `<div class="progress-badge ${color}">
      <span class="progress-text">${completed}/${total} Categories Scanned</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <span class="progress-percent">${percentage}%</span>
    </div>`;
  }

  generateHomepage(repositories, repositoriesByCategory, scanStatus) {
    const totalRepos = Object.keys(repositories).length;
    const completedCategories = scanStatus.completedCategories.length;
    const lastScan = scanStatus.lastScanTime ? moment(scanStatus.lastScanTime).fromNow() : 'Never';
    
    // Calculate statistics
    const totalStars = Object.values(repositories).reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const avgScore = totalRepos > 0 ? 
      Object.values(repositories).reduce((sum, repo) => sum + (repo.qualityScore?.total || 0), 0) / totalRepos : 0;
    
    // Generate category cards with progress indicators
    const categoryCards = Object.entries(categories).map(([key, category]) => {
      const repos = repositoriesByCategory[key] || [];
      const isScanned = scanStatus.completedCategories.includes(key);
      const categoryTimestamp = scanStatus.categoryTimestamps?.[key];
      const hasData = repos.length > 0;
      
      // Determine status and styling
      let statusClass, statusIcon, statusText;
      if (hasData && categoryTimestamp) {
        const age = moment().diff(moment(categoryTimestamp), 'days');
        if (age <= 1) {
          statusClass = 'fresh';
          statusIcon = '✅';
          statusText = `${repos.length} repositories`;
        } else if (age <= 7) {
          statusClass = 'recent';
          statusIcon = '🔄';
          statusText = `${repos.length} repositories (${age}d old)`;
        } else {
          statusClass = 'stale';
          statusIcon = '⏰';
          statusText = `${repos.length} repositories (${age}d old)`;
        }
      } else if (hasData) {
        statusClass = 'scanned';
        statusIcon = '✅';
        statusText = `${repos.length} repositories`;
      } else {
        statusClass = 'pending';
        statusIcon = '⏳';
        statusText = 'Pending scan...';
      }
      
      return `
        <div class="category-card ${statusClass}" data-category="${key}">
          <div class="category-header">
            <span class="category-icon">${category.icon}</span>
            <h3>${category.name}</h3>
            <span class="scan-status ${statusClass}">
              ${statusIcon}
            </span>
          </div>
          <p class="category-description">${category.description}</p>
          <div class="category-stats">
            <span class="repo-count">${statusText}</span>
            ${repos.length > 0 ? `
              <span class="avg-score">Avg: ${Math.round(repos.reduce((sum, r) => sum + (r.qualityScore?.total || 0), 0) / repos.length)}/100</span>
            ` : ''}
          </div>
          ${hasData ? `<a href="categories/${Helpers.slugify(category.name)}.html" class="view-category">View Details →</a>` : ''}
        </div>
      `;
    }).join('');

    // Top repositories (from scanned categories only)
    const topRepos = Object.values(repositories)
      .filter(repo => scanStatus.completedCategories.includes(repo.category))
      .sort((a, b) => (b.qualityScore?.total || 0) - (a.qualityScore?.total || 0))
      .slice(0, 6)
      .map(repo => `
        <div class="repo-card">
          <div class="repo-header">
            <h4><a href="${repo.html_url}" target="_blank">${repo.name}</a></h4>
            <span class="quality-score grade-${Helpers.getGrade(repo.qualityScore?.total || 0)}">${repo.qualityScore?.total || 0}/100</span>
          </div>
          <p class="repo-description">${repo.description || 'No description available'}</p>
          <div class="repo-stats">
            <span>⭐ ${repo.stargazers_count || 0}</span>
            <span>🍴 ${repo.forks_count || 0}</span>
            <span>📝 ${repo.language || 'Multiple'}</span>
          </div>
          <div class="repo-category">
            <span class="category-tag">${categories[repo.category]?.name || repo.category}</span>
          </div>
        </div>
      `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Automation Resources</title>
    <meta name="description" content="Curated collection of the best test automation tools and frameworks on GitHub">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <nav class="navbar">
        <div class="container">
            <a href="index.html" class="brand-link">
                <span class="brand-icon">🧪</span>
                Test Automation Resources
            </a>
            <div class="navbar-menu">
                <a href="#categories" class="nav-link">Categories</a>
                <a href="#top-repos" class="nav-link">Top Repositories</a>
                <a href="search.html" class="nav-link">Search</a>
            </div>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-content">
            <h1 class="hero-title">Discover the Best Test Automation Tools</h1>
            <p class="hero-subtitle">Quality-scored repositories updated automatically every few days</p>
            ${this.getProgressBadge(scanStatus)}
            <div class="hero-stats">
                <div class="stat-item">
                    <span class="stat-number">${totalRepos}</span>
                    <span class="stat-label">Repositories</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${completedCategories}/8</span>
                    <span class="stat-label">Categories</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${Math.round(avgScore)}</span>
                    <span class="stat-label">Avg Score</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${Helpers.formatNumber(totalStars)}</span>
                    <span class="stat-label">Total Stars</span>
                </div>
            </div>
            <p class="last-updated">Last updated: ${lastScan}</p>
        </div>
    </header>

    <main>
        <section id="categories" class="categories-section">
            <div class="container">
                <h2>📂 Categories</h2>
                <div class="categories-grid">
                    ${categoryCards}
                </div>
            </div>
        </section>

        ${topRepos.length > 0 ? `
        <section id="top-repos" class="top-repos-section">
            <div class="container">
                <h2>🏆 Top Quality Repositories</h2>
                <div class="repos-grid">
                    ${topRepos}
                </div>
            </div>
        </section>
        ` : ''}

        <section class="about-section">
            <div class="container">
                <h2>About This Project</h2>
                <div class="about-content">
                    <div class="about-text">
                        <p>This website automatically scans GitHub for test automation repositories and scores them based on multiple quality factors including popularity, activity, documentation, and community engagement.</p>
                        <p><strong>Staged Scanning:</strong> We scan one category at a time to ensure reliable data collection, building the complete database over multiple runs.</p>
                    </div>
                    <div class="about-features">
                        <h3>Features</h3>
                        <ul>
                            <li>✅ Quality scoring algorithm (100-point scale)</li>
                            <li>🔄 Incremental data collection</li>
                            <li>📊 Comprehensive repository analysis</li>
                            <li>🎯 Curated by category</li>
                            <li>📱 Mobile-responsive design</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Test Automation Resources. Data sourced from GitHub.</p>
            <p>Updated automatically • Scan Progress: ${completedCategories}/8 categories</p>
        </div>
    </footer>

    <script src="assets/js/main.js"></script>
</body>
</html>`;
  }

  async run() {
    console.log('🎨 Starting Staged Website Generator...\n');
    
    const { repositories, scanStatus } = await this.loadData();
    const repositoriesByCategory = this.getRepositoriesByCategory(repositories);
    
    console.log(`📊 Loaded ${Object.keys(repositories).length} repositories`);
    console.log(`📈 Scan progress: ${scanStatus.completedCategories.length}/8 categories`);
    
    await this.ensureDirectories();
    await this.copyAssets();
    
    // Generate homepage
    const homepage = this.generateHomepage(repositories, repositoriesByCategory, scanStatus);
    await fs.writeFile(path.join(this.distDir, 'index.html'), homepage);
    console.log('✅ Generated homepage with progress indicators');
    
    // Generate category pages (only for scanned categories)
    for (const categoryKey of scanStatus.completedCategories) {
      const category = categories[categoryKey];
      const repos = repositoriesByCategory[categoryKey] || [];
      
      if (repos.length > 0) {
        const categoryPage = this.generateCategoryPage(category, repos, categoryKey);
        const filename = `${Helpers.slugify(category.name)}.html`;
        await fs.writeFile(path.join(this.distDir, 'categories', filename), categoryPage);
        console.log(`✅ Generated category page: ${category.name} (${repos.length} repos)`);
      }
    }
    
    // Generate search page
    const searchPage = this.generateSearchPage(repositories, scanStatus);
    await fs.writeFile(path.join(this.distDir, 'search.html'), searchPage);
    console.log('✅ Generated search page');
    
    // Generate repository detail pages (for existing repos)
    let detailCount = 0;
    for (const repo of Object.values(repositories)) {
      const detailPage = this.generateRepositoryDetail(repo);
      const filename = `${Helpers.slugify(repo.full_name)}.html`;
      await fs.writeFile(path.join(this.distDir, 'repositories', filename), detailPage);
      detailCount++;
    }
    console.log(`✅ Generated ${detailCount} repository detail pages`);
    
    // Generate progress report
    this.generateProgressReport(repositories, scanStatus);
    
    console.log('\n🎉 Staged website generation completed!');
    return {
      totalRepos: Object.keys(repositories).length,
      scannedCategories: scanStatus.completedCategories.length,
      scanStatus
    };
  }

  generateProgressReport(repositories, scanStatus) {
    const totalRepos = Object.keys(repositories).length;
    const totalCategories = Object.keys(categories).length;
    const completedCategories = scanStatus.completedCategories.length;
    const progressPercent = Math.round((completedCategories / totalCategories) * 100);
    
    console.log('\n📊 WEBSITE GENERATION SUMMARY');
    console.log('==============================');
    console.log(`🗂️  Categories scanned: ${completedCategories}/${totalCategories} (${progressPercent}%)`);
    console.log(`📚 Total repositories: ${totalRepos}`);
    console.log(`🔄 Current scan cycle: ${scanStatus.currentCycle || 1}`);
    
    if (scanStatus.lastScanTime) {
      console.log(`🕒 Last scan: ${moment(scanStatus.lastScanTime).fromNow()}`);
    }
    
    console.log('\n📂 Category Status:');
    Object.entries(categories).forEach(([key, category]) => {
      const isScanned = scanStatus.completedCategories.includes(key);
      const repoCount = Object.values(repositories).filter(r => r.category === key).length;
      const status = isScanned ? `✅ ${repoCount} repos` : '⏳ Pending';
      console.log(`  ${category.icon} ${category.name}: ${status}`);
    });
    
    if (completedCategories < totalCategories) {
      console.log(`\n⏳ Website will be complete after ${totalCategories - completedCategories} more category scans`);
    } else {
      console.log('\n🎯 Website is complete with all categories scanned!');
    }
  }

  generateCategoryPage(category, repos, categoryKey) {
    // Use the same category page generation logic from the original generator
    // but adapted for the staged data structure
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${category.name} - Test Automation Resources</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="container">
            <a href="../index.html" class="brand-link">
                <span class="brand-icon">🧪</span>
                Test Automation Resources
            </a>
            <div class="navbar-menu">
                <a href="../index.html" class="nav-link">Home</a>
                <a href="../search.html" class="nav-link">Search</a>
            </div>
        </div>
    </nav>

    <main>
        <div class="container">
            <div class="category-header">
                <span class="category-icon">${category.icon}</span>
                <h1>${category.name}</h1>
                <p>${category.description}</p>
                <div class="category-stats">
                    <span>${repos.length} repositories</span>
                    <span>Avg score: ${Math.round(repos.reduce((sum, r) => sum + (r.qualityScore?.total || 0), 0) / repos.length)}/100</span>
                </div>
            </div>

            <div class="filters">
                <select id="languageFilter">
                    <option value="">All Languages</option>
                    ${[...new Set(repos.map(r => r.language).filter(Boolean))].sort().map(lang => 
                        `<option value="${lang}">${lang}</option>`
                    ).join('')}
                </select>
                <select id="gradeFilter">
                    <option value="">All Grades</option>
                    <option value="A">A+ & A (80-100)</option>
                    <option value="B">B (70-79)</option>
                    <option value="C">C (60-69)</option>
                    <option value="D">D & F (<60)</option>
                </select>
            </div>

            <div class="repos-grid" id="reposGrid">
                ${repos.sort((a, b) => (b.qualityScore?.total || 0) - (a.qualityScore?.total || 0))
                    .map(repo => `
                    <div class="repo-card" data-language="${repo.language || ''}" data-grade="${Helpers.getGrade(repo.qualityScore?.total || 0)}">
                        <div class="repo-header">
                            <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                            <span class="quality-score grade-${Helpers.getGrade(repo.qualityScore?.total || 0)}">${repo.qualityScore?.total || 0}/100</span>
                        </div>
                        <p class="repo-description">${repo.description || 'No description available'}</p>
                        <div class="repo-stats">
                            <span>⭐ ${repo.stargazers_count || 0}</span>
                            <span>🍴 ${repo.forks_count || 0}</span>
                            <span>📝 ${repo.language || 'Multiple'}</span>
                        </div>
                        <a href="../repositories/${Helpers.slugify(repo.full_name)}.html" class="view-details">View Details →</a>
                    </div>
                `).join('')}
            </div>
        </div>
    </main>

    <script src="../assets/js/main.js"></script>
    <script>
        // Initialize filters
        document.getElementById('languageFilter').addEventListener('change', filterRepos);
        document.getElementById('gradeFilter').addEventListener('change', filterRepos);
        
        function filterRepos() {
            const languageFilter = document.getElementById('languageFilter').value;
            const gradeFilter = document.getElementById('gradeFilter').value;
            const repos = document.querySelectorAll('.repo-card');
            
            repos.forEach(repo => {
                const language = repo.dataset.language;
                const grade = repo.dataset.grade;
                
                const languageMatch = !languageFilter || language === languageFilter;
                const gradeMatch = !gradeFilter || 
                    (gradeFilter === 'A' && ['A+', 'A'].includes(grade)) ||
                    (gradeFilter === 'B' && grade === 'B') ||
                    (gradeFilter === 'C' && grade === 'C') ||
                    (gradeFilter === 'D' && ['D', 'F'].includes(grade));
                
                repo.style.display = languageMatch && gradeMatch ? 'block' : 'none';
            });
        }
    </script>
</body>
</html>`;
  }

  generateSearchPage(repositories, scanStatus) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search - Test Automation Resources</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="container">
            <a href="index.html" class="brand-link">
                <span class="brand-icon">🧪</span>
                Test Automation Resources
            </a>
            <div class="navbar-menu">
                <a href="index.html" class="nav-link">Home</a>
                <a href="#search" class="nav-link">Search</a>
            </div>
        </div>
    </nav>

    <main>
        <div class="container">
            <div class="search-header">
                <h1>🔍 Search Repositories</h1>
                <p>Search through ${Object.keys(repositories).length} quality-scored repositories</p>
                ${this.getProgressBadge(scanStatus)}
            </div>

            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search by name, description, or language..." class="search-input">
                <div class="search-filters">
                    <select id="categoryFilter">
                        <option value="">All Categories</option>
                        ${Object.entries(categories).map(([key, cat]) => {
                            const count = Object.values(repositories).filter(r => r.category === key).length;
                            return `<option value="${key}">${cat.name} (${count})</option>`;
                        }).join('')}
                    </select>
                    <select id="languageFilter">
                        <option value="">All Languages</option>
                        ${[...new Set(Object.values(repositories).map(r => r.language).filter(Boolean))].sort()
                            .map(lang => `<option value="${lang}">${lang}</option>`).join('')}
                    </select>
                    <select id="gradeFilter">
                        <option value="">All Grades</option>
                        <option value="A">A+ & A (80-100)</option>
                        <option value="B">B (70-79)</option>
                        <option value="C">C (60-69)</option>
                        <option value="D">D & F (<60)</option>
                    </select>
                </div>
            </div>

            <div id="searchResults" class="repos-grid">
                ${Object.values(repositories)
                    .sort((a, b) => (b.qualityScore?.total || 0) - (a.qualityScore?.total || 0))
                    .map(repo => `
                    <div class="repo-card" 
                         data-name="${repo.name.toLowerCase()}" 
                         data-description="${(repo.description || '').toLowerCase()}" 
                         data-language="${repo.language || ''}" 
                         data-category="${repo.category || ''}"
                         data-grade="${Helpers.getGrade(repo.qualityScore?.total || 0)}">
                        <div class="repo-header">
                            <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                            <span class="quality-score grade-${Helpers.getGrade(repo.qualityScore?.total || 0)}">${repo.qualityScore?.total || 0}/100</span>
                        </div>
                        <p class="repo-description">${repo.description || 'No description available'}</p>
                        <div class="repo-stats">
                            <span>⭐ ${repo.stargazers_count || 0}</span>
                            <span>🍴 ${repo.forks_count || 0}</span>
                            <span>📝 ${repo.language || 'Multiple'}</span>
                        </div>
                        <div class="repo-category">
                            <span class="category-tag">${categories[repo.category]?.name || repo.category}</span>
                        </div>
                        <a href="repositories/${Helpers.slugify(repo.full_name)}.html" class="view-details">View Details →</a>
                    </div>
                `).join('')}
            </div>
        </div>
    </main>

    <script src="assets/js/main.js"></script>
    <script>
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const languageFilter = document.getElementById('languageFilter');
        const gradeFilter = document.getElementById('gradeFilter');
        const repos = document.querySelectorAll('.repo-card');

        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase();
            const categoryValue = categoryFilter.value;
            const languageValue = languageFilter.value;
            const gradeValue = gradeFilter.value;

            repos.forEach(repo => {
                const name = repo.dataset.name;
                const description = repo.dataset.description;
                const language = repo.dataset.language;
                const category = repo.dataset.category;
                const grade = repo.dataset.grade;

                const matchesSearch = !searchTerm || 
                    name.includes(searchTerm) || 
                    description.includes(searchTerm) || 
                    language.toLowerCase().includes(searchTerm);

                const matchesCategory = !categoryValue || category === categoryValue;
                const matchesLanguage = !languageValue || language === languageValue;
                const matchesGrade = !gradeValue || 
                    (gradeValue === 'A' && ['A+', 'A'].includes(grade)) ||
                    (gradeValue === 'B' && grade === 'B') ||
                    (gradeValue === 'C' && grade === 'C') ||
                    (gradeValue === 'D' && ['D', 'F'].includes(grade));

                repo.style.display = matchesSearch && matchesCategory && matchesLanguage && matchesGrade ? 'block' : 'none';
            });
        }

        searchInput.addEventListener('input', performSearch);
        categoryFilter.addEventListener('change', performSearch);
        languageFilter.addEventListener('change', performSearch);
        gradeFilter.addEventListener('change', performSearch);
    </script>
</body>
</html>`;
  }

  generateRepositoryDetail(repo) {
    // Simplified repository detail page
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${repo.name} - Test Automation Resources</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="container">
            <a href="../index.html" class="brand-link">
                <span class="brand-icon">🧪</span>
                Test Automation Resources
            </a>
            <div class="navbar-menu">
                <a href="../index.html" class="nav-link">Home</a>
                <a href="../search.html" class="nav-link">Search</a>
                <a href="${repo.html_url}" target="_blank" class="nav-link">View on GitHub</a>
            </div>
        </div>
    </nav>

    <main>
        <div class="container">
            <div class="repo-detail">
                <div class="repo-header">
                    <h1>${repo.name}</h1>
                    <span class="quality-score grade-${Helpers.getGrade(repo.qualityScore?.total || 0)}">${repo.qualityScore?.total || 0}/100</span>
                </div>
                
                <p class="repo-description">${repo.description || 'No description available'}</p>
                
                <div class="repo-meta">
                    <span class="category-tag">${categories[repo.category]?.name || repo.category}</span>
                    <span>⭐ ${repo.stargazers_count || 0} stars</span>
                    <span>🍴 ${repo.forks_count || 0} forks</span>
                    <span>📝 ${repo.language || 'Multiple languages'}</span>
                </div>

                <div class="repo-actions">
                    <a href="${repo.html_url}" class="btn-primary" target="_blank">View on GitHub</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" class="btn-secondary" target="_blank">Visit Website</a>` : ''}
                </div>

                <div class="quality-breakdown">
                    <h3>Quality Score Breakdown</h3>
                    <div class="score-grid">
                        <div class="score-item">
                            <span class="score-label">Popularity</span>
                            <span class="score-value">${repo.qualityScore?.breakdown?.popularity || 0}/25</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Activity</span>
                            <span class="score-value">${repo.qualityScore?.breakdown?.activity || 0}/20</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Documentation</span>
                            <span class="score-value">${repo.qualityScore?.breakdown?.documentation || 0}/20</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Community</span>
                            <span class="score-value">${repo.qualityScore?.breakdown?.community || 0}/15</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Maintenance</span>
                            <span class="score-value">${repo.qualityScore?.breakdown?.maintenance || 0}/10</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Code Quality</span>
                            <span class="score-value">${repo.qualityScore?.breakdown?.codeQuality || 0}/10</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>`;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new StagedGenerator();
  
  generator.run()
    .then(result => {
      console.log(`\n✅ Website generated successfully!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Website generation failed:', error);
      process.exit(1);
    });
}

module.exports = StagedGenerator;
