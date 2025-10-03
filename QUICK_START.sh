#!/bin/bash

# BuildCore Vendor Backend - Quick Start Script
# This script sets up and tests your Monday.com integration

echo "🚀 BuildCore Vendor Backend - Setup & Test"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the backend directory"
    echo "Please run this from: /Users/evanedge/Documents/Cursor Projects/Vendor Application/backend"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Creating .env from template..."
    cp .env.example .env
    echo "✅ .env created - please add your Monday.com credentials"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Start the server in background
echo "🌟 Starting server..."
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Server is running on port 3001"
echo ""

# Run the test
echo "🧪 Running integration test..."
echo "================================"
npm test

# Kill the server
echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "✨ Setup complete!"
echo ""
echo "To run the server manually:"
echo "  npm start"
echo ""
echo "To test again:"
echo "  npm test"
