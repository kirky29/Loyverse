#!/bin/bash

echo "🚀 Deploying Loyverse Dashboard to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo ""
fi

echo "✅ Vercel CLI ready!"
echo ""
echo "📋 Next steps:"
echo "1. Run: vercel"
echo "2. Follow the prompts (use defaults for everything)"
echo "3. Your app will be deployed to: https://loyverse-dashboard.vercel.app"
echo ""
echo "🔗 After deployment, add this redirect URL to your Loyverse app:"
echo "   https://loyverse-dashboard.vercel.app/oauth/callback"
echo ""
echo "🎉 That's it! Vercel will auto-deploy on every git push."
