#!/bin/bash

# Script para configurar variables de entorno en Vercel

echo "🔧 Configurando variables de entorno en Vercel..."

# Variable de entorno principal
vercel env add VITE_API_URL production <<< "https://backend-mu-three-66.vercel.app/api"

# Variables opcionales de Shopify (vacías por defecto, se configuran en la app)
vercel env add VITE_SHOPIFY_SHOP_NAME production <<< ""
vercel env add VITE_SHOPIFY_API_KEY production <<< ""
vercel env add VITE_SHOPIFY_PASSWORD production <<< ""
vercel env add VITE_SHOPIFY_API_VERSION production <<< "2024-01"

# Variable opcional de Stripe
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production <<< ""

echo "✅ Variables de entorno configuradas"
echo ""
echo "📋 Variables configuradas:"
echo "  - VITE_API_URL: https://backend-mu-three-66.vercel.app/api"
echo "  - VITE_SHOPIFY_SHOP_NAME: (vacío - configurar en la app)"
echo "  - VITE_SHOPIFY_API_KEY: (vacío - configurar en la app)"
echo "  - VITE_SHOPIFY_PASSWORD: (vacío - configurar en la app)"
echo "  - VITE_SHOPIFY_API_VERSION: 2024-01"
echo "  - VITE_STRIPE_PUBLISHABLE_KEY: (vacío - configurar en la app)"
echo ""
echo "🚀 Re-desplegando para aplicar cambios..."
vercel --prod --yes