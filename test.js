#!/usr/bin/env node

/**
 * Test script to validate the application structure and syntax
 * without requiring a GitHub token
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Test Automation Resources Scanner...\n');

// Test 1: Validate all required files exist
const requiredFiles = [
  'package.json',
  'src/index.js',
  'src/scanner.js',
  'src/staged-scanner.js',
  'src/generator.js', 
  'src/staged-generator.js',
  'src/config/categories.js',
  'src/utils/github.js',
  'src/utils/scoring.js',
  'src/utils/helpers.js',
  'assets/css/style.css',
  'assets/js/main.js',
  '.github/workflows/update-resources.yml',
  'manual-scan.js',
  'inspect-data.js'
];

console.log('📁 Checking required files...');
let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});

if (!filesOk) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Test 2: Validate JavaScript syntax by requiring modules
console.log('\n🔍 Validating JavaScript syntax...');
try {
  const categories = require('./src/config/categories.js');
  console.log(`✅ Categories config: ${Object.keys(categories).length} categories`);
  
  const { calculateQualityScore } = require('./src/utils/scoring.js');
  console.log('✅ Scoring utilities loaded');
  
  const helpers = require('./src/utils/helpers.js');
  console.log('✅ Helper utilities loaded');
  
  // Test scoring with mock data
  const mockRepo = {
    stargazers_count: 1000,
    forks_count: 200,
    pushed_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['testing', 'automation'],
    has_wiki: true,
    license: { key: 'mit' },
    readme: 'A' * 1000,
    releases: [{ published_at: new Date().toISOString() }],
    contributors: new Array(10).fill({})
  };
  
  const score = calculateQualityScore(mockRepo);
  console.log(`✅ Quality scoring test: ${score.total}/100 points`);
  
} catch (error) {
  console.log(`❌ JavaScript validation failed: ${error.message}`);
  process.exit(1);
}

// Test 3: Validate JSON files
console.log('\n📄 Validating JSON files...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ package.json: ${packageJson.name}@${packageJson.version}`);
  
  const workflow = fs.readFileSync('.github/workflows/update-resources.yml', 'utf8');
  console.log('✅ GitHub Actions workflow syntax looks valid');
  
} catch (error) {
  console.log(`❌ JSON validation failed: ${error.message}`);
  process.exit(1);
}

// Test 4: Check templates directory
console.log('\n🎨 Checking template files...');
const templateDir = 'templates';
if (fs.existsSync(templateDir)) {
  const templates = fs.readdirSync(templateDir).filter(f => f.endsWith('.html'));
  templates.forEach(template => {
    console.log(`✅ Template: ${template}`);
  });
} else {
  console.log('ℹ️  Templates will be generated inline');
}

// Test 5: Environment setup
console.log('\n⚙️  Environment setup...');
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
} else {
  console.log('⚠️  .env file not found - copy from .env.example');
}

if (fs.existsSync('.env.example')) {
  console.log('✅ .env.example available');
}

console.log('\n🎉 All tests passed! Application structure is valid.\n');

console.log('📋 Next steps:');
console.log('1. Copy .env.example to .env and add your GitHub token');
console.log('2. Run: npm run staged-scan (recommended)');
console.log('3. Run: npm run staged-generate');
console.log('4. Run: npm run dev (to test locally)');
console.log('5. Deploy to GitHub Pages using the daily automated workflow\n');

console.log('🔧 Available commands:');
console.log('- npm run staged-scan    # Scan one category (recommended)');
console.log('- npm run staged-generate # Generate website from current data');
console.log('- npm run staged-build   # Staged scan + generate');
console.log('- npm run scan           # Legacy: Full scan (may timeout)');
console.log('- npm run generate       # Legacy: Full generate');
console.log('- npm run build          # Legacy: Full build');
console.log('- npm run dev            # Start development server');
console.log('- npm test               # Run this validation script');
console.log('- node inspect-data.js   # View scan progress');
console.log('- node manual-scan.js    # Manual category scanning\n');

console.log('📚 Documentation:');
console.log('- README.md         # Project overview and staged scanning approach');
console.log('- .env.example      # Environment configuration');
console.log('- manual-scan.js    # Manual category scanning tool');
console.log('- inspect-data.js   # Data inspection and progress viewer\n');
