@echo off
chcp 65001 >nul
echo 🚀 Starting Carbon Hub deployment...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node -v') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node -v
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node -v

REM Clean previous build
echo 🧹 Cleaning previous build...
if exist out\ rmdir /s /q out\
if exist .next\ rmdir /s /q .next\

REM Install dependencies
echo 📦 Installing dependencies...
npm ci

REM Build the project
echo 🔨 Building project...
npm run build

REM Check if build was successful
if not exist out\ (
    echo ❌ Build failed. Check the error messages above.
    pause
    exit /b 1
)

REM Create .nojekyll file in out directory
echo 📝 Creating .nojekyll file...
echo. > out\.nojekyll

REM Copy 404.html to out directory
echo 📋 Copying 404.html...
copy public\404.html out\ >nul

echo ✅ Build completed successfully!
echo.
echo 📁 Your static files are ready in the 'out' directory.
echo.
echo 📋 Next steps for manual deployment:
echo 1. Push the 'out' directory contents to a 'gh-pages' branch, or
echo 2. Upload the 'out' directory contents to your web hosting service
echo.
echo 🌐 For GitHub Pages:
echo    - Go to your repository Settings ^> Pages
echo    - Set Source to 'Deploy from a branch'
echo    - Select 'gh-pages' branch and '/ (root)' folder
echo.
echo 🎉 Ready for deployment!
pause
