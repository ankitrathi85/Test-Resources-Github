require('dotenv').config();
const GitHubAPI = require('./utils/github');
const { calculateQualityScore } = require('./utils/scoring');
const Helpers = require('./utils/helpers');
const categories = require('./config/categories');
const path = require('path');
const moment = require('moment');

class RepositoryScanner {
  constructor() {
    this.github = new GitHubAPI(process.env.GITHUB_TOKEN);
    this.minStars = parseInt(process.env.MIN_STARS) || 10;
    this.maxAgeMonths = parseInt(process.env.MAX_AGE_MONTHS) || 18;
    this.outputDir = process.env.OUTPUT_DIR || 'dist';
    
    // Scanning limits to prevent infinite loops
    this.maxReposPerSearch = parseInt(process.env.MAX_REPOS_PER_SEARCH) || 10;
    this.maxReposPerCategory = parseInt(process.env.MAX_REPOS_PER_CATEGORY) || 50;
    this.maxTotalRepos = parseInt(process.env.MAX_TOTAL_REPOS) || 300;
    this.searchTimeoutMinutes = parseInt(process.env.SEARCH_TIMEOUT_MINUTES) || 30;
    
    this.repositories = [];
    this.startTime = Date.now();
  }

  async scanCategories() {
    console.log('🚀 Starting repository scan...');
    console.log('📊 Limits: ' + this.maxReposPerSearch + ' per search, ' + this.maxReposPerCategory + ' per category, ' + this.maxTotalRepos + ' total');
    
    // Check rate limit
    const rateLimit = await this.github.getRateLimit();
    console.log('⏱️  Rate limit: ' + rateLimit.rate.remaining + '/' + rateLimit.rate.limit + ' remaining');

    for (const [categoryId, category] of Object.entries(categories)) {
      // Check timeout
      if (this.isTimeoutReached()) {
        console.log('⏰ Timeout reached (' + this.searchTimeoutMinutes + ' minutes), stopping scan');
        break;
      }
      
      // Check total repository limit
      if (this.repositories.length >= this.maxTotalRepos) {
        console.log('📊 Total repository limit reached (' + this.maxTotalRepos + '), stopping scan');
        break;
      }
      
      await this.scanCategory(categoryId, category);
    }

    console.log('✅ Scan complete! Found ' + this.repositories.length + ' repositories in ' + ((Date.now() - this.startTime) / 1000 / 60).toFixed(1) + ' minutes');
    return this.repositories;
  }

  isTimeoutReached() {
    const elapsedMinutes = (Date.now() - this.startTime) / 1000 / 60;
    return elapsedMinutes >= this.searchTimeoutMinutes;
  }

  async scanCategory(categoryId, category) {
    console.log('📁 Scanning category: ' + category.name);
    const repositories = [];
    
    // Search with different term combinations
    for (const searchTerm of category.searchTerms) {
      // Check timeout and limits
      if (this.isTimeoutReached()) {
        console.log('  ⏰ Timeout reached, stopping category scan');
        break;
      }
      
      if (repositories.length >= this.maxReposPerCategory) {
        console.log('  📊 Category limit reached (' + this.maxReposPerCategory + '), stopping category scan');
        break;
      }
      
      if (this.repositories.length >= this.maxTotalRepos) {
        console.log('  📊 Total limit reached (' + this.maxTotalRepos + '), stopping category scan');
        break;
      }

      try {
        const query = this.github.buildSearchQuery([searchTerm], {
          minStars: this.minStars,
          pushed: moment().subtract(this.maxAgeMonths, 'months').format('YYYY-MM-DD'),
          archived: false,
          fork: false
        });

        console.log('  🔍 Searching: "' + searchTerm + '"');
        
        const results = await this.github.searchRepositories(query, {
          perPage: this.maxReposPerSearch,
          sort: 'stars',
          order: 'desc'
        });

        for (const repo of results.items) {
          if (repositories.length >= this.maxReposPerCategory) break;
          if (this.repositories.length >= this.maxTotalRepos) break;
          
          if (this.isValidRepository(repo)) {
            const enrichedRepo = await this.enrichRepository(repo, categoryId);
            if (enrichedRepo) {
              repositories.push(enrichedRepo);
            }
          }
        }

        // Rate limiting
        await Helpers.wait(parseInt(process.env.RATE_LIMIT_DELAY) || 2000);
        
      } catch (error) {
        console.error('  ❌ Error searching "' + searchTerm + '":', error.message);
        continue;
      }
    }

    console.log('  📊 Found ' + repositories.length + ' repositories in ' + category.name);
    this.repositories.push(...repositories);
  }

  async enrichRepository(repo, categoryId) {
    try {
      console.log('    📝 Enriching: ' + repo.full_name);
      
      const repoInfo = Helpers.extractRepoInfo(repo.html_url);
      if (!repoInfo) return null;

      // Get additional data for scoring
      const [readme, releases, commits, contributors] = await Promise.all([
        this.github.getRepositoryContents(repoInfo.owner, repoInfo.repo, 'README.md'),
        this.github.getRepositoryReleases(repoInfo.owner, repoInfo.repo),
        this.github.getRepositoryCommits(repoInfo.owner, repoInfo.repo, moment().subtract(3, 'months').toISOString()),
        this.github.getRepositoryContributors(repoInfo.owner, repoInfo.repo)
      ]);

      // Check for additional files
      const [license, contributing, hasCI] = await Promise.all([
        this.checkForFile(repoInfo.owner, repoInfo.repo, 'LICENSE'),
        this.checkForFile(repoInfo.owner, repoInfo.repo, 'CONTRIBUTING.md'),
        this.checkForCI(repoInfo.owner, repoInfo.repo)
      ]);

      // Calculate quality score
      const additionalData = {
        readme,
        releases,
        commits,
        contributors,
        hasLicense: !!license,
        hasContributing: !!contributing,
        hasWiki: repo.has_wiki,
        hasCI
      };

      const qualityScore = calculateQualityScore(repo, additionalData);

      // Enrich repository data
      const enrichedRepo = {
        ...repo,
        category: categoryId,
        qualityScore,
        additionalData: {
          recentCommits: commits ? commits.length : 0,
          totalReleases: releases ? releases.length : 0,
          contributors: contributors ? contributors.length : 0,
          hasLicense: !!license,
          hasContributing: !!contributing,
          hasCI,
          lastRelease: releases && releases.length > 0 ? releases[0] : null,
          readmeLength: readme ? Buffer.from(readme.content, 'base64').toString().length : 0
        },
        scannedAt: moment().toISOString()
      };

      return enrichedRepo;
      
    } catch (error) {
      console.error('    ❌ Error enriching ' + repo.full_name + ':', error.message);
      return null;
    }
  }

  async checkForFile(owner, repo, filename) {
    try {
      const content = await this.github.getRepositoryContents(owner, repo, filename);
      return content;
    } catch (error) {
      return null;
    }
  }

  async checkForCI(owner, repo) {
    try {
      // Check for common CI/CD files
      const ciFiles = [
        '.github/workflows',
        '.travis.yml',
        'circle.yml',
        '.circleci/config.yml',
        'Jenkinsfile',
        '.gitlab-ci.yml'
      ];

      for (const file of ciFiles) {
        const exists = await this.github.getRepositoryContents(owner, repo, file);
        if (exists) return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  isValidRepository(repo) {
    // Filter criteria
    if (repo.archived) return false;
    if (repo.fork && repo.stargazers_count < this.minStars * 2) return false;
    if (repo.stargazers_count < this.minStars) return false;
    if (!this.github.isRepositoryActive(repo, this.maxAgeMonths)) return false;
    
    return true;
  }

  removeDuplicates(repositories) {
    const seen = new Set();
    return repositories.filter(repo => {
      if (seen.has(repo.id)) {
        return false;
      }
      seen.add(repo.id);
      return true;
    });
  }

  async saveResults() {
    const dataDir = path.join(this.outputDir, 'data');
    await Helpers.ensureDirectory(dataDir);

    // Save full repository data
    const reposFile = path.join(dataDir, 'repositories.json');
    await Helpers.writeJsonFile(reposFile, this.repositories);

    // Save summary statistics
    const stats = Helpers.generateStats(this.repositories);
    const statsFile = path.join(dataDir, 'stats.json');
    await Helpers.writeJsonFile(statsFile, stats);

    // Save categorized data
    const categorized = Helpers.groupByCategory(this.repositories, categories);
    const categoriesFile = path.join(dataDir, 'categories.json');
    await Helpers.writeJsonFile(categoriesFile, categorized);

    console.log('💾 Results saved to ' + dataDir + '/');
  }
}

// Run scanner if called directly
if (require.main === module) {
  const scanner = new RepositoryScanner();
  scanner.scanCategories().then(() => {
    return scanner.saveResults();
  }).catch(console.error);
}

module.exports = RepositoryScanner;
