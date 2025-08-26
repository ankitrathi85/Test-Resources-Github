#!/usr/bin/env node

/**
 * Data Inspector - View current scan status and data
 */

const fs = require('fs-extra');
const path = require('path');
const categories = require('./src/config/categories');

async function inspectData() {
  const dataDir = path.join(__dirname, 'data');
  const statusFile = path.join(dataDir, 'scan-status.json');
  const reposFile = path.join(dataDir, 'repositories.json');

  console.log('🔍 SCAN DATA INSPECTION');
  console.log('=======================\n');

  try {
    // Load scan status
    const scanStatus = await fs.readJSON(statusFile).catch(() => ({
      completedCategories: [],
      currentCycle: 1
    }));

    // Load repositories
    const repositories = await fs.readJSON(reposFile).catch(() => ({}));

    const totalRepos = Object.keys(repositories).length;
    const completedCategories = scanStatus.completedCategories.length;
    const totalCategories = Object.keys(categories).length;

    console.log(`📊 OVERVIEW:`);
    console.log(`   Total repositories: ${totalRepos}`);
    console.log(`   Scan progress: ${completedCategories}/${totalCategories} categories`);
    console.log(`   Current cycle: ${scanStatus.currentCycle || 1}`);
    console.log(`   Last scan: ${scanStatus.lastScanTime || 'Never'}\n`);

    console.log(`📂 CATEGORY STATUS:`);
    Object.entries(categories).forEach(([key, category]) => {
      const isCompleted = scanStatus.completedCategories.includes(key);
      const repoCount = Object.values(repositories).filter(r => r.category === key).length;
      const status = isCompleted ? `✅ ${repoCount} repos` : '⏳ Pending';
      console.log(`   ${category.icon} ${category.name.padEnd(20)} ${status}`);
    });

    if (totalRepos > 0) {
      console.log(`\n📈 REPOSITORY BREAKDOWN:`);
      const reposByCategory = {};
      Object.values(repositories).forEach(repo => {
        if (!reposByCategory[repo.category]) {
          reposByCategory[repo.category] = [];
        }
        reposByCategory[repo.category].push(repo);
      });

      Object.entries(reposByCategory).forEach(([categoryKey, repos]) => {
        const avgScore = repos.reduce((sum, r) => sum + (r.qualityScore?.total || 0), 0) / repos.length;
        console.log(`   ${categoryKey}: ${repos.length} repos (avg score: ${Math.round(avgScore)}/100)`);
      });

      // Top repositories
      console.log(`\n🏆 TOP 5 REPOSITORIES:`);
      Object.values(repositories)
        .sort((a, b) => (b.qualityScore?.total || 0) - (a.qualityScore?.total || 0))
        .slice(0, 5)
        .forEach((repo, index) => {
          console.log(`   ${index + 1}. ${repo.full_name} (${repo.qualityScore?.total || 0}/100)`);
        });
    }

    console.log(`\n🔮 NEXT STEPS:`);
    if (completedCategories < totalCategories) {
      const remaining = Object.keys(categories).filter(k => !scanStatus.completedCategories.includes(k));
      console.log(`   Next category to scan: ${remaining[0]}`);
      console.log(`   Remaining categories: ${remaining.length}`);
    } else {
      console.log(`   🎉 All categories completed! Starting new cycle on next run.`);
    }

  } catch (error) {
    console.error('❌ Error reading data:', error.message);
  }
}

inspectData();
