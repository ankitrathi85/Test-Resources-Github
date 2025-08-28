#!/usr/bin/env node

/**
 * Staged Repository Scanner - Scans one category at a time
 * Stores data persistently and builds website incrementally
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const GitHubAPI = require('./utils/github');
const { calculateQualityScore } = require('./utils/scoring');
const categories = require('./config/categories');

class StagedScanner {
  constructor() {
    this.github = new GitHubAPI(process.env.GITHUB_TOKEN);
    this.dataDir = path.join(__dirname, '..', 'data');
    this.categoriesFile = path.join(this.dataDir, 'categories.json');
    this.repositoriesFile = path.join(this.dataDir, 'repositories.json');
    this.statusFile = path.join(this.dataDir, 'scan-status.json');
    
    // Scanning limits per category
    this.maxReposPerSearch = parseInt(process.env.MAX_REPOS_PER_SEARCH) || 3;
    this.maxReposPerCategory = parseInt(process.env.MAX_REPOS_PER_CATEGORY) || 15;
    this.timeoutMinutes = parseInt(process.env.CATEGORY_TIMEOUT_MINUTES) || 12;
  }

  async ensureDataDirectory() {
    await fs.ensureDir(this.dataDir);
  }

  async loadExistingData() {
    const repositories = await fs.readJSON(this.repositoriesFile).catch(() => ({}));
    const scanStatus = await fs.readJSON(this.statusFile).catch(() => ({
      lastScannedCategory: null,
      completedCategories: [],
      currentCycle: 1,
      lastFullScan: null
    }));
    
    return { repositories, scanStatus };
  }

  async saveData(repositories, scanStatus) {
    await fs.writeJSON(this.repositoriesFile, repositories, { spaces: 2 });
    await fs.writeJSON(this.statusFile, scanStatus, { spaces: 2 });
  }

  getNextCategory(scanStatus) {
    const allCategories = Object.keys(categories);
    
    // Initialize category timestamps if not present
    if (!scanStatus.categoryTimestamps) {
      scanStatus.categoryTimestamps = {};
    }
    
    // Find the category that was updated longest ago (or never updated)
    const oldestCategory = allCategories.reduce((oldest, cat) => {
      const catTime = scanStatus.categoryTimestamps[cat] || 0;
      const oldestTime = scanStatus.categoryTimestamps[oldest] || 0;
      return catTime < oldestTime ? cat : oldest;
    }, allCategories[0]);
    
    // Determine if this starts a new cycle
    // New cycle = all categories have been scanned at least once in current cycle
    const allCategoriesHaveTimestamps = allCategories.every(cat => 
      scanStatus.categoryTimestamps[cat] && 
      new Date(scanStatus.categoryTimestamps[cat]) > new Date(scanStatus.lastFullScan || 0)
    );
    
    return {
      category: oldestCategory,
      isNewCycle: allCategoriesHaveTimestamps
    };
  }

  async scanCategory(categoryKey) {
    const category = categories[categoryKey];
    console.log(`🔍 Scanning category: ${category.name}`);
    console.log(`📝 Search terms: ${category.searchTerms.join(', ')}`);
    
    const repositories = [];
    const startTime = Date.now();
    
    for (const searchTerm of category.searchTerms) {
      // Check timeout
      const elapsed = (Date.now() - startTime) / (1000 * 60);
      if (elapsed > this.timeoutMinutes) {
        console.log(`⏰ Timeout reached for ${categoryKey}, stopping search`);
        break;
      }
      
      console.log(`  🔎 Searching: "${searchTerm}"`);
      
      try {
        // Build search query like the original scanner
        const query = this.github.buildSearchQuery([searchTerm], {
          language: category.languages ? category.languages.join(',') : null,
          minStars: parseInt(process.env.MIN_STARS) || 10,
          pushed: moment().subtract(parseInt(process.env.MAX_AGE_MONTHS) || 18, 'months').format('YYYY-MM-DD'),
          archived: false,
          fork: false
        });

        const searchResults = await this.github.searchRepositories(query, {
          perPage: this.maxReposPerSearch,
          sort: 'stars', 
          order: 'desc'
        });
        
        // Handle the response correctly - use .items array
        const repos = searchResults.items || [];
        
        for (const repo of repos) {
          if (repositories.length >= this.maxReposPerCategory) {
            console.log(`  📊 Reached category limit (${this.maxReposPerCategory})`);
            break;
          }
          
          // Check for duplicates
          if (!repositories.find(r => r.full_name === repo.full_name)) {
            // Enrich repository data
            const enrichedRepo = await this.enrichRepository(repo, categoryKey);
            if (enrichedRepo) {
              repositories.push(enrichedRepo);
              console.log(`    ✅ ${repo.full_name} (${enrichedRepo.qualityScore.total}/100)`);
            }
          }
        }
        
        if (repositories.length >= this.maxReposPerCategory) break;
        
      } catch (error) {
        console.error(`    ❌ Error searching "${searchTerm}":`, error.message);
      }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`⏱️  Category scan completed in ${elapsed} minutes`);
    console.log(`📊 Found ${repositories.length} repositories for ${category.name}`);
    
    return repositories;
  }

  async enrichRepository(repo, categoryKey) {
    try {
      console.log('    📝 Enriching: ' + repo.full_name);
      
      const repoInfo = this.extractRepoInfo(repo.html_url);
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
        category: categoryKey,
        categoryName: categories[categoryKey]?.name || categoryKey,
        scannedAt: new Date().toISOString(),
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
        }
      };

      return enrichedRepo;
    } catch (error) {
      console.error(`    ❌ Error enriching ${repo.full_name}:`, error.message);
      return null;
    }
  }

  extractRepoInfo(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  }

  async checkForFile(owner, repo, filename) {
    try {
      const content = await this.github.getRepositoryContents(owner, repo, filename);
      return !!content;
    } catch (error) {
      return false;
    }
  }

  async checkForCI(owner, repo) {
    try {
      // Check for common CI files
      const ciFiles = [
        '.github/workflows',
        '.travis.yml',
        '.circleci/config.yml',
        'azure-pipelines.yml',
        '.gitlab-ci.yml'
      ];

      for (const file of ciFiles) {
        const exists = await this.checkForFile(owner, repo, file);
        if (exists) return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting Staged Scanner...\n');
    
    await this.ensureDataDirectory();
    const { repositories: existingRepos, scanStatus } = await this.loadExistingData();
    
    // Determine next category to scan
    const { category: nextCategory, isNewCycle } = this.getNextCategory(scanStatus);
    
    if (isNewCycle) {
      console.log(`🔄 Starting new scan cycle ${scanStatus.currentCycle + 1}`);
      scanStatus.currentCycle = (scanStatus.currentCycle || 0) + 1;
      // NOTE: We deliberately DON'T clear completedCategories to preserve stale data
      // Each category will be marked as completed when it gets refreshed in this cycle
      console.log(`📚 Preserving existing data from ${scanStatus.completedCategories?.length || 0} categories`);
    }
    
    console.log(`📂 Current category: ${nextCategory}`);
    console.log(`📈 Progress: ${scanStatus.completedCategories.length}/8 categories completed`);
    
    // Scan the category
    const categoryRepos = await this.scanCategory(nextCategory);
    
    // Merge with existing data (replace category data)
    const allCategories = Object.keys(categories);
    const updatedRepos = { ...existingRepos };
    
    // Remove old data for this category
    Object.keys(updatedRepos).forEach(repoKey => {
      if (updatedRepos[repoKey].category === nextCategory) {
        delete updatedRepos[repoKey];
      }
    });
    
    // Add new data for this category
    categoryRepos.forEach(repo => {
      updatedRepos[repo.full_name] = repo;
    });
    
    // Update scan status
    if (!scanStatus.completedCategories.includes(nextCategory)) {
      scanStatus.completedCategories.push(nextCategory);
    }
    
    // Track when this category was last updated
    if (!scanStatus.categoryTimestamps) {
      scanStatus.categoryTimestamps = {};
    }
    scanStatus.categoryTimestamps[nextCategory] = new Date().toISOString();
    
    scanStatus.lastScannedCategory = nextCategory;
    scanStatus.lastScanTime = new Date().toISOString();
    
    // Check if cycle is complete
    if (scanStatus.completedCategories.length === allCategories.length) {
      scanStatus.lastFullScan = new Date().toISOString();
      console.log(`🎉 Full scan cycle ${scanStatus.currentCycle} completed!`);
    }
    
    // Save data
    await this.saveData(updatedRepos, scanStatus);
    
    // Generate summary
    this.generateSummary(updatedRepos, scanStatus);
    
    return {
      category: nextCategory,
      repositories: categoryRepos,
      totalRepositories: Object.keys(updatedRepos).length,
      scanStatus
    };
  }

  generateSummary(repositories, scanStatus) {
    const totalRepos = Object.keys(repositories).length;
    const completedCategories = scanStatus.completedCategories.length;
    const totalCategories = Object.keys(categories).length;
    
    console.log('\n📊 SCAN SUMMARY');
    console.log('================');
    console.log(`📂 Category: ${scanStatus.lastScannedCategory}`);
    console.log(`🗂️  Progress: ${completedCategories}/${totalCategories} categories`);
    console.log(`📚 Total repositories: ${totalRepos}`);
    console.log(`🔄 Scan cycle: ${scanStatus.currentCycle}`);
    
    if (scanStatus.lastFullScan) {
      console.log(`✅ Last full scan: ${moment(scanStatus.lastFullScan).fromNow()}`);
    }
    
    console.log('\n📈 Next Steps:');
    if (completedCategories < totalCategories) {
      const remaining = totalCategories - completedCategories;
      console.log(`⏳ ${remaining} categories remaining in this cycle`);
      console.log(`🔜 Next run will scan: ${this.getNextCategory(scanStatus).category}`);
    } else {
      console.log(`🎯 Cycle complete! Website can be generated with ${totalRepos} repositories`);
      console.log(`🔄 Next run will start a new cycle`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scanner = new StagedScanner();
  
  scanner.run()
    .then(result => {
      console.log(`\n✅ Staged scan completed successfully!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Staged scan failed:', error);
      process.exit(1);
    });
}

module.exports = StagedScanner;
