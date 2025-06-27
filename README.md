# La Mattress System

A comprehensive business management system for La Mattress, built with React, TypeScript, and Refine framework. This system integrates with Shopify and Stripe to provide a complete e-commerce management solution.

## Features

- 📊 **Dashboard Analytics** - Real-time business metrics and performance indicators
- 📦 **Product Management** - Sync and manage products from Shopify
- 🛍️ **Order Processing** - Track and manage customer orders
- 👥 **Customer Management** - Comprehensive customer database
- 📞 **Call Center Module** - Manage call clients and track calls
- 💳 **Payment Integration** - Stripe integration for payment processing
- 🎟️ **Coupon System** - Create and manage discount coupons
- 👨‍💼 **Employee Management** - Track employee performance and goals
- 🔐 **Role-based Access** - Admin and employee roles with different permissions
- 🔗 **Platform Integration** - Seamless Shopify and Stripe integration

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Ant Design 5
- **State Management**: Refine Framework
- **Charts**: Recharts
- **API Integration**: Axios
- **Shopify Integration**: @shopify/shopify-api

## Prerequisites

- Node.js 16+ and npm
- A Shopify store with API access
- Stripe account (optional)
- Backend API running (see backend repository)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Vargasmmi/La-Mattress-System.git
cd La-Mattress-System
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file includes necessary rewrites for client-side routing.

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

## Configuration

### Shopify Integration

1. Navigate to the Integration page (admin only)
2. Configure your Shopify credentials
3. Test the connection
4. Sync products from the Products page

### Environment Variables

- `VITE_API_URL`: Backend API URL
- `VITE_SHOPIFY_SHOP_NAME`: Your Shopify store domain
- `VITE_SHOPIFY_API_KEY`: Shopify private app API key
- `VITE_SHOPIFY_PASSWORD`: Shopify private app password

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── services/        # API services and utilities
├── types/           # TypeScript type definitions
├── App.tsx          # Main application component
├── dataProvider.ts  # API data provider
└── authProvider.ts  # Authentication provider
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software for La Mattress.

## Support

For support, please contact the development team.