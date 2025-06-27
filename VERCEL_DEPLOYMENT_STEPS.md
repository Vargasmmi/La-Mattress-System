# Vercel Deployment Steps

Since the CLI is having issues, please follow these steps to deploy via Vercel's web interface:

## Step 1: Go to Vercel Import Page
Visit: https://vercel.com/import/git

## Step 2: Import Repository
1. Click on "Import Git Repository"
2. If not connected, connect your GitHub account
3. Search for "La-Mattress-System"
4. Click "Import" next to the repository

## Step 3: Configure Project
Use these exact settings:

**Project Name**: la-mattress-system

**Framework Preset**: Vite

**Root Directory**: ./

**Build & Output Settings**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Step 4: Environment Variables
Add this environment variable:
- **Key**: `VITE_API_URL`
- **Value**: `https://backend-mu-three-66.vercel.app/api`

## Step 5: Deploy
Click "Deploy" and wait for the build to complete.

## Alternative: Using Existing Project ID

If you already have a Vercel project with ID `prj_bznGj5hZqF4vAGUy3AlwFWP6JE08`:

1. Go to: https://vercel.com/dashboard
2. Find your project
3. Go to Settings → Git
4. Connect to GitHub repository: Vargasmmi/La-Mattress-System
5. It will automatically deploy

## Post-Deployment

Your app will be available at:
- https://la-mattress-system.vercel.app
- Or your custom domain if configured

## Verify Deployment

1. Visit your Vercel URL
2. Try logging in with:
   - Email: admin@lamattress.com
   - Password: admin123
3. Check that all pages load correctly
4. Verify API connection works

The repository is fully configured and ready. All necessary files are in place for automatic deployment.