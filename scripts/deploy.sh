#!/bin/bash

# Test Automation Resources - Deployment Script

set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is required"
    exit 1
fi

echo "✅ Environment variables verified"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Run the scanner
echo "📡 Scanning GitHub repositories..."
npm run scan

# Generate the website
echo "🏗️  Generating static website..."
npm run generate

# Verify output
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html not generated"
    exit 1
fi

echo "✅ Website generated successfully"

# Count generated files
html_files=$(find dist -name "*.html" | wc -l)
json_files=$(find dist -name "*.json" | wc -l)

echo "📊 Generated files:"
echo "   - HTML files: $html_files"
echo "   - JSON files: $json_files"
echo "   - Total size: $(du -sh dist | cut -f1)"

echo "🎉 Deployment process completed successfully!"
echo "   Website is ready in the dist/ directory"
