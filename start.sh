#!/bin/bash
# Simple start script for Replit

echo "🔨 Installing dependencies..."
npm install

echo "🔨 Building application..."
npx nest build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Starting server..."
    node dist/main.js
else
    echo "❌ Build failed!"
    exit 1
fi