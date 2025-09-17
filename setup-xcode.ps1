# Flush Frenzy - Xcode Setup Script (PowerShell)
# This script prepares the project for Xcode development and building

param(
    [switch]$SkipInstall = $false
)

Write-Host "🚀 Starting Flush Frenzy Xcode Setup..." -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "app.config.js")) {
    Write-Error "app.config.js not found. Please run this script from the project root directory."
    exit 1
}

Write-Status "Verifying project structure..."

# Check for required tools
Write-Status "Checking required tools..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Check if Expo CLI is installed
try {
    $expoVersion = expo --version
    Write-Success "Expo CLI found: $expoVersion"
} catch {
    if (-not $SkipInstall) {
        Write-Warning "Expo CLI not found. Installing globally..."
        npm install -g @expo/cli
        Write-Success "Expo CLI installed"
    } else {
        Write-Error "Expo CLI not found. Please install with: npm install -g @expo/cli"
    }
}

# Check if EAS CLI is installed
try {
    $easVersion = eas --version
    Write-Success "EAS CLI found: $easVersion"
} catch {
    if (-not $SkipInstall) {
        Write-Warning "EAS CLI not found. Installing globally..."
        npm install -g @expo/eas-cli
        Write-Success "EAS CLI installed"
    } else {
        Write-Error "EAS CLI not found. Please install with: npm install -g @expo/eas-cli"
    }
}

# Install dependencies
if (-not $SkipInstall) {
    Write-Status "Installing npm dependencies..."
    npm install
    Write-Success "Dependencies installed"
}

# Clean any existing builds
Write-Status "Cleaning previous builds..."
if (Test-Path "ios") { Remove-Item -Recurse -Force "ios" }
if (Test-Path "android") { Remove-Item -Recurse -Force "android" }
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" }
Write-Success "Previous builds cleaned"

# Create .env file for development
Write-Status "Configuring development environment..."
@"
# Development Environment Configuration
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_BUG_REPORT_KEY=your_bug_report_key_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
Write-Success "Development environment configured"

Write-Status "Project prepared for iOS development!"
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. On macOS: Run ./setup-xcode.sh for full iOS setup"
Write-Host "2. Or manually run: expo prebuild --platform ios --clean"
Write-Host "3. Navigate to ios/ directory and run: pod install"
Write-Host "4. Open ios/FlushFrenzy.xcworkspace in Xcode"
Write-Host ""
Write-Host "📖 See iOS-Development.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Happy coding!" -ForegroundColor Green
