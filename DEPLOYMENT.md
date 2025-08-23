# Carbon Hub - GitHub Pages Deployment Guide

This guide explains how to deploy your Carbon Hub application to GitHub Pages using static export.

## Prerequisites

- GitHub account
- Node.js 18+ installed
- Git configured on your machine

## Configuration Changes Made

### 1. Next.js Configuration (`next.config.ts`)

- Added `output: 'export'` for static generation
- Added `trailingSlash: true` for GitHub Pages compatibility
- Added `basePath` configuration for repository-based deployment
- Added `images: { unoptimized: true }` for static export compatibility

### 2. Package.json Updates

- Added `export` script: `npm run export`
- Added `deploy` script: `npm run deploy`
- Updated homepage URL to GitHub Pages URL

### 3. GitHub Actions Workflow

- Created `.github/workflows/deploy.yml` for automatic deployment
- Builds and deploys on every push to main branch

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Push your code to GitHub:**

   ```bash
   git add .
   git commit -m "feat: configure for GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Set Source to "GitHub Actions"
   - The workflow will automatically deploy your site

### Option 2: Manual Deployment

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**

   ```bash
   npm run deploy
   ```

3. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Set Source to "Deploy from a branch"
   - Select `gh-pages` branch and `/ (root)` folder

## Repository Settings

### GitHub Pages Configuration

- **Source**: GitHub Actions (recommended) or Deploy from a branch
- **Branch**: `gh-pages` (if using manual deployment)
- **Folder**: `/ (root)`

### Repository Settings

- Ensure your repository is public (or you have GitHub Pro for private repos)
- The site will be available at: `https://49fenixng94.github.io/carbon_hub`

## Build Output

After running `npm run build`, the static files will be generated in the `out/` directory:

- HTML files
- JavaScript bundles
- CSS files
- Static assets (images, icons, etc.)

## Troubleshooting

### Common Issues

1. **404 Errors on Refresh:**

   - This is normal for SPA applications
   - Consider implementing a 404.html redirect for better UX

2. **Assets Not Loading:**

   - Check that `basePath` is correctly set
   - Ensure all asset paths are relative

3. **Build Failures:**
   - Check Node.js version (requires 18+)
   - Clear `node_modules` and reinstall dependencies
   - Check for any server-side code that needs to be removed

### Performance Optimization

1. **Bundle Analysis:**

   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

2. **Image Optimization:**
   - Use WebP format when possible
   - Implement lazy loading for images

## Security Considerations

- All data is stored client-side in IndexedDB
- No server-side data processing
- Consider implementing CSP headers if needed

## Monitoring

- GitHub Actions will show build and deployment status
- Check the Actions tab in your repository
- Monitor deployment logs for any errors

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add your domain to the `cname` field in `.github/workflows/deploy.yml`
2. Configure DNS settings to point to GitHub Pages
3. Add your domain in GitHub Pages settings

## Support

For issues related to:

- **Next.js Static Export**: Check [Next.js documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- **GitHub Pages**: Check [GitHub Pages documentation](https://docs.github.com/en/pages)
- **GitHub Actions**: Check [GitHub Actions documentation](https://docs.github.com/en/actions)
