# Shopify Integration Guide

This document explains how to use the Shopify integration features in the application.

## Setup

1. Navigate to the **Integration** page from the sidebar (admin only)
2. Click on **Configure** under Shopify Integration
3. Enter your Shopify credentials:
   - **Shop Name**: Your Shopify store domain (e.g., `mystore.myshopify.com`)
   - **API Key**: Your private app API key
   - **Password**: Your private app password
   - **API Version**: Leave as default (2024-01)

4. Click **Save Configuration**
5. Click **Test** to verify the connection

## Features

### Products Page

The Products page now includes enhanced Shopify integration:

1. **View Shopify Products**: Click this button to see products directly from your Shopify store without importing them
2. **Sync from Shopify**: Click this button to import all products from Shopify into your local database

### How It Works

The integration uses the npm package `@shopify/shopify-api` for secure communication with Shopify's REST API. The client:

- Authenticates using Basic Auth with your API credentials
- Fetches products with full details including variants and inventory
- Transforms Shopify data to match the application's product format
- Supports pagination for large product catalogs

### Testing

To test the integration:

1. Configure your Shopify settings in the Integration page
2. Click the **Test** button to verify connectivity
3. Go to the Products page and click **View Shopify Products** to see live data
4. Use **Sync from Shopify** to import products

### Troubleshooting

If you encounter issues:

1. Verify your Shopify credentials are correct
2. Ensure your private app has the necessary permissions:
   - Read products
   - Read inventory
   - Read product listings
3. Check the browser console for detailed error messages
4. Verify your shop domain includes the full `.myshopify.com` suffix

### Security

- API credentials are stored securely
- The frontend uses Basic Auth for API requests
- Credentials are never exposed in the UI
- All API communication uses HTTPS