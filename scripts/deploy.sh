#!/bin/bash

# Carbon Hub Deployment Script for GitHub Pages
# This script builds the project and prepares it for manual deployment

echo "🚀 Starting Carbon Hub deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf out/
rm -rf .next/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -d "out" ]; then
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi

# Create .nojekyll file in out directory
echo "📝 Creating .nojekyll file..."
touch out/.nojekyll

# Copy 404.html to out directory
echo "📋 Copying 404.html..."
cp public/404.html out/

echo "✅ Build completed successfully!"
echo ""
echo "📁 Your static files are ready in the 'out' directory."
echo ""
echo "📋 Next steps for manual deployment:"
echo "1. Push the 'out' directory contents to a 'gh-pages' branch, or"
echo "2. Upload the 'out' directory contents to your web hosting service"
echo ""
echo "🌐 For GitHub Pages:"
echo "   - Go to your repository Settings > Pages"
echo "   - Set Source to 'Deploy from a branch'"
echo "   - Select 'gh-pages' branch and '/ (root)' folder"
echo ""
echo "📊 Build size:"
du -sh out/
echo ""
echo "🎉 Ready for deployment!"
