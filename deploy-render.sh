#!/bin/bash

# Render deployment script for Loyverse Dashboard
# This will create a web service on Render

echo "🚀 Deploying Loyverse Dashboard to Render..."

# Create render.yaml for Render Blueprint
cat > render.yaml << 'EOF'
services:
  - type: web
    name: loyverse-dashboard-api
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: LOYVERSE_CLIENT_ID
        value: eQ7QAMonUnzNORRE8xuG
      - key: LOYVERSE_CLIENT_SECRET
        value: _b7646LxCSky-I5U6h3IfBvJ17VoKmKN0FTaz07xzwceAJmfj-giEg==
      - key: LOYVERSE_SCOPE
        value: receipts.read stores.read
      - key: NODE_ENV
        value: production
    autoDeploy: true
EOF

echo "✅ Created render.yaml configuration"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://render.com and sign up/login"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repo: kirky29/Loyverse"
echo "4. Render will automatically detect render.yaml"
echo "5. Click 'Apply' to deploy"
echo ""
echo "🔗 After deployment, your API will be available at:"
echo "   https://loyverse-dashboard-api.onrender.com"
echo ""
echo "📝 Don't forget to add this redirect URL to your Loyverse app:"
echo "   https://loyverse-dashboard-api.onrender.com/oauth/callback"
