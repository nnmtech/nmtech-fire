#!/bin/bash

# Video Creator UI - Quick Start Script
# This script helps set up and run the Next.js application

set -e

echo "🎬 Video Creator UI - Setup & Start"
echo "===================================="
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    echo "   Using --no-bin-links for mounted drive compatibility"
    npm install --no-bin-links
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    echo "   Please create .env.local with Supabase credentials"
    exit 1
fi

# Verify remotion-renderer is running
echo "🔍 Checking Remotion renderer service..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Remotion renderer is running on port 3001"
else
    echo "⚠️  Warning: Remotion renderer not responding on port 3001"
    echo "   Make sure Docker service is running:"
    echo "   docker compose up -d remotion-renderer"
fi
echo ""

# Start development server using direct node command
echo "🚀 Starting Next.js development server..."
echo "   Access the app at: http://localhost:3000"
echo ""
echo "   📝 Create videos: http://localhost:3000/create"
echo "   📚 Video library: http://localhost:3000/library"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run Next.js directly since --no-bin-links doesn't create symlinks
node node_modules/next/dist/bin/next dev
