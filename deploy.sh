#!/bin/bash

# BuildCore Vendor Application - Backend Deployment Script
echo "🚀 Deploying BuildCore Vendor Backend to Heroku..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Error: Heroku CLI not found. Please install it first:"
    echo "   brew tap heroku/brew && brew install heroku"
    exit 1
fi

# Check if logged into Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Error: Not logged into Heroku. Please run: heroku login"
    exit 1
fi

# Check if app exists, create if not
if ! heroku apps:info buildcore-vendor-api &> /dev/null; then
    echo "📱 Creating Heroku app: buildcore-vendor-api"
    heroku create buildcore-vendor-api
else
    echo "✅ Heroku app already exists: buildcore-vendor-api"
fi

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set MONDAY_API_KEY="eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM4MzYwODYwMSwiYWFpIjoxMSwidWlkIjo2MTI4ODE2MCwiaWFkIjoiMjAyNC0wNy0xMlQxMTozMzozOS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MjM1OTg1MDYsInJnbiI6InVzZTEifQ.uRhOrpfIAKrsTQ6-chvpTJMNun1mdB6gVNMbFvgJD7c"
heroku config:set MONDAY_BOARD_ID="8584274720"
heroku config:set NODE_ENV="production"
heroku config:set CORS_ORIGIN="https://buildcore-vendor-application.netlify.app,https://mybuildcore.com"
heroku config:set ENABLE_DUPLICATE_CHECK="true"

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial backend deployment"
fi

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy backend $(date)"
git push heroku main

# Test deployment
echo "🧪 Testing deployment..."
sleep 5
if curl -s https://buildcore-vendor-api.herokuapp.com/health > /dev/null; then
    echo "✅ Backend deployed successfully!"
    echo "🌐 Backend URL: https://buildcore-vendor-api.herokuapp.com"
    echo "🔍 Health check: https://buildcore-vendor-api.herokuapp.com/health"
    echo "🔗 Test connection: https://buildcore-vendor-api.herokuapp.com/api/test-connection"
else
    echo "❌ Deployment may have failed. Check logs:"
    echo "   heroku logs --tail --app buildcore-vendor-api"
fi

echo ""
echo "🎉 Deployment complete!"
echo "📋 Next steps:"
echo "   1. Deploy frontend to Netlify (drag netlify-deploy folder)"
echo "   2. Test the full integration"
echo "   3. Share the Netlify URL with your team"
