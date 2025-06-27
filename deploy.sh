#!/bin/bash

# Vercel deployment script
echo "Deploying to Vercel..."

# Set environment variables
export VERCEL_ORG_ID="${VERCEL_ORG_ID}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID}"

# Build the project first
echo "Building project..."
npm run build

# Deploy to Vercel
vercel deploy --prod \
  --name la-mattress-system \
  --yes \
  --env VITE_API_URL=https://backend-mu-three-66.vercel.app/api \
  --build-env VITE_API_URL=https://backend-mu-three-66.vercel.app/api

echo "Deployment complete!"