# 🚀 Quick Start: Manual Deployment to GitHub Pages

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Git configured
- ✅ GitHub repository created

## Step 1: Build Your Application

### Option A: Using npm scripts (Recommended)

```bash
# For Unix/Mac/Linux
npm run deploy

# For Windows
npm run deploy:win
```

### Option B: Using deployment scripts

```bash
# For Unix/Mac/Linux
./scripts/deploy.sh

# For Windows
scripts\deploy.bat
```

### Option C: Manual build

```bash
npm ci
npm run build
```

## Step 2: Verify Build Output

After successful build, you should see:

- ✅ `out/` directory created
- ✅ Static HTML, CSS, and JS files
- ✅ `.nojekyll` file in `out/` directory
- ✅ `404.html` file in `out/` directory

## Step 3: Deploy to GitHub Pages

### Method 1: Using gh-pages branch (Recommended)

```bash
# Create and switch to gh-pages branch
git checkout --orphan gh-pages

# Remove all files except out directory
git rm -rf .

# Copy contents from out directory to root
cp -r out/* .

# Add all files
git add .

# Commit
git commit -m "Deploy to GitHub Pages"

# Push to gh-pages branch
git push origin gh-pages

# Return to main branch
git checkout main
```

### Method 2: Manual upload via GitHub

1. Go to your repository on GitHub
2. Navigate to Settings > Pages
3. Set Source to "Deploy from a branch"
4. Select `gh-pages` branch and `/ (root)` folder
5. Click Save

## Step 4: Configure GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages section
3. Set Source to "Deploy from a branch"
4. Select `gh-pages` branch
5. Set folder to `/ (root)`
6. Click Save

## Step 5: Access Your Site

Your site will be available at:

```
https://[your-username].github.io/[repository-name]
```

For example: `https://49fenixng94.github.io/carbon_hub`

## 🔧 Troubleshooting

### Build Issues

- Ensure Node.js version is 18+
- Clear `node_modules` and run `npm ci`
- Check for any server-side code

### 404 Errors

- Ensure `.nojekyll` file exists in `out/` directory
- Check that `basePath` in `next.config.ts` matches your repository name

### Assets Not Loading

- Verify `basePath` configuration
- Check that all asset paths are relative

## 📁 File Structure After Build

```
out/
├── .nojekyll
├── 404.html
├── _next/
├── carbon-hub-favicon.ico
├── carbon-hub-logo.png
├── favicon.ico
├── file.svg
├── globe.svg
├── index.html
├── manifest.json
├── next.svg
├── test-logo.png
└── vercel.svg
```

## 🎯 Next Steps

- Customize your domain (optional)
- Set up automatic deployment with GitHub Actions
- Monitor your site performance
- Add analytics tracking

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
