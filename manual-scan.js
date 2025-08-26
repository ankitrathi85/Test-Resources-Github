#!/usr/bin/env node

/**
 * Manual Category Scanner - Scan a specific category by name
 * Usage: node manual-scan.js [category-key]
 */

require('dotenv').config();
const StagedScanner = require('./src/staged-scanner');
const categories = require('./src/config/categories');

async function scanSpecificCategory(categoryKey) {
  if (!categoryKey) {
    console.log('📂 Available categories:');
    Object.entries(categories).forEach(([key, cat]) => {
      console.log(`  ${key}: ${cat.name}`);
    });
    console.log('\nUsage: node manual-scan.js [category-key]');
    console.log('Example: node manual-scan.js web-automation');
    return;
  }

  if (!categories[categoryKey]) {
    console.error(`❌ Category "${categoryKey}" not found!`);
    console.log('Available categories:', Object.keys(categories).join(', '));
    return;
  }

  console.log(`🎯 Manually scanning category: ${categoryKey}`);
  
  const scanner = new StagedScanner();
  
  // Override the getNextCategory method to return our specific category
  scanner.getNextCategory = (scanStatus) => {
    // For manual scans, we need to temporarily remove the category from completed
    // to ensure it gets properly rescanned without affecting other categories
    if (scanStatus.completedCategories && scanStatus.completedCategories.includes(categoryKey)) {
      // Create a copy and remove this category temporarily for the scan
      const tempCompleted = scanStatus.completedCategories.filter(cat => cat !== categoryKey);
      scanStatus.completedCategories = tempCompleted;
    }
    return { category: categoryKey, isNewCycle: false };
  };
  
  try {
    const result = await scanner.run();
    console.log(`\n✅ Successfully scanned ${categoryKey}!`);
    console.log(`📊 Found ${result.repositories.length} repositories`);
    console.log(`📁 Total repositories in database: ${result.totalRepositories}`);
  } catch (error) {
    console.error(`❌ Error scanning ${categoryKey}:`, error.message);
  }
}

const categoryKey = process.argv[2];
scanSpecificCategory(categoryKey);
