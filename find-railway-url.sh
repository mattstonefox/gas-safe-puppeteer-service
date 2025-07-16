#!/bin/bash

echo "🔍 Finding Railway deployment URL..."
echo "=================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "   Install with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway!"
    echo "   Run: railway login"
    exit 1
fi

# Check project status
echo "📁 Project Status:"
railway status 2>/dev/null || echo "   Not linked to a project. Run: railway link"
echo ""

# Try to get the domain
echo "🌐 Deployment URL:"
DOMAIN=$(railway domain 2>/dev/null | tr -d '\n')

if [ -z "$DOMAIN" ]; then
    echo "   ❌ No domain found. Possible reasons:"
    echo "      - Service not deployed yet (run: railway up)"
    echo "      - Service name mismatch"
    echo "      - Deployment failed"
    echo ""
    
    # Try to get service info
    echo "🔧 Checking services..."
    railway service 2>/dev/null || echo "   No service information available"
    
else
    echo "   ✅ Found: https://$DOMAIN"
    echo ""
    echo "📋 Test commands:"
    echo "   curl https://$DOMAIN/health"
    echo "   RAILWAY_URL=$DOMAIN node test-railway-endpoint.js"
fi

echo ""
echo "📜 Recent logs (last 20 lines):"
railway logs --last 20 2>/dev/null || echo "   No logs available"

echo ""
echo "🛠️  Helpful commands:"
echo "   railway up              - Deploy current directory"
echo "   railway logs           - View deployment logs"
echo "   railway restart        - Restart the service"
echo "   railway variables      - List environment variables"
echo "   railway domain         - Get deployment URL"