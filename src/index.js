require('dotenv').config();
const RepositoryScanner = require('./scanner');
const WebsiteGenerator = require('./generator');

class TestAutomationResourcesApp {
  constructor() {
    this.scanner = new RepositoryScanner();
    this.generator = new WebsiteGenerator();
  }

  async run() {
    console.log('🚀 Starting Test Automation Resources Scanner...');
    console.log('=====================================');
    
    try {
      // Validate environment
      this.validateEnvironment();
      
      // Run scanner
      console.log('\n📡 Phase 1: Scanning GitHub repositories...');
      const repositories = await this.scanner.scan();
      
      // Generate website
      console.log('\n🏗️  Phase 2: Generating static website...');
      await this.generator.generate();
      
      console.log('\n✅ Process completed successfully!');
      console.log(`📊 Processed ${repositories.length} repositories`);
      console.log(`🌐 Website generated in dist/ directory`);
      console.log('=====================================');
      
    } catch (error) {
      console.error('\n❌ Application error:', error);
      process.exit(1);
    }
  }

  validateEnvironment() {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    
    console.log('✅ Environment validation passed');
  }
}

// Run application if called directly
if (require.main === module) {
  const app = new TestAutomationResourcesApp();
  app.run();
}

module.exports = TestAutomationResourcesApp;
