# Deployment Guide for Vercel

## Manual Deployment via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Git Repository**
   - Select "Import Git Repository"
   - Choose GitHub
   - Find and select "La-Mattress-System" repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**
   Add the following environment variables:
   ```
   VITE_API_URL=https://backend-mu-three-66.vercel.app/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

## Deployment via Vercel CLI

If you prefer using the CLI:

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **First time deployment questions:**
   - Set up and deploy: Y
   - Which scope: Select your account
   - Link to existing project: N
   - Project name: la-mattress-system
   - Directory: ./
   - Override settings: N

## Post-Deployment Setup

1. **Add Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add: `VITE_API_URL` = `https://backend-mu-three-66.vercel.app/api`

2. **Configure Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain

3. **Verify Deployment**
   - Visit your Vercel URL
   - Test login functionality
   - Verify API connections

## Important Notes

- The project is configured with `vercel.json` for proper SPA routing
- Environment variables must start with `VITE_` to be accessible in the frontend
- The backend API is already deployed at https://backend-mu-three-66.vercel.app/api
- Make sure to keep your environment variables secure

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in package.json
3. Verify TypeScript has no errors: `npm run build`
4. Check that all environment variables are set correctly