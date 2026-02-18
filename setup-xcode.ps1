# Flush Frenzy - Xcode Setup Script (PowerShell)
# This script prepares the project for Xcode development and building
# Updated: Feb 2026 - Touchless Mode V2

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

function Write-ErrorMsg {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "app.config.js")) {
    Write-ErrorMsg "app.config.js not found. Please run this script from the project root directory."
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
    Write-ErrorMsg "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
} catch {
    Write-ErrorMsg "npm is not installed. Please install npm first."
    exit 1
}

# Check if Expo CLI is installed
try {
    $expoVersion = npx expo --version 2>$null
    Write-Success "Expo CLI available via npx"
} catch {
    Write-Warning "Will use npx to run expo commands"
}

# Check if EAS CLI is installed
try {
    $easVersion = eas --version 2>$null
    Write-Success "EAS CLI found: $easVersion"
} catch {
    if (-not $SkipInstall) {
        Write-Warning "EAS CLI not found. Installing globally..."
        npm install -g eas-cli
        Write-Success "EAS CLI installed"
    } else {
        Write-Warning "EAS CLI not found. Install with: npm install -g eas-cli"
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
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" }
Write-Success "Previous builds cleaned"

# Run prebuild
Write-Status "Running Expo prebuild for iOS..."
Write-Status "This will generate the native iOS project with current app.config.js settings"
npx expo prebuild --platform ios --clean
Write-Success "iOS prebuild completed"

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Current Configuration:" -ForegroundColor Cyan
Write-Host "   - Version: 1.3.1"
Write-Host "   - Build: 10"
Write-Host "   - Deployment Target: iOS 16.0"
Write-Host "   - Plugins: expo-build-properties, expo-camera, react-native-vision-camera, expo-av, expo-audio"
Write-Host ""
Write-Host "📋 Next Steps (on macOS):" -ForegroundColor Yellow
Write-Host "1. Copy the project to your Mac"
Write-Host "2. Navigate to ios/ directory and run: pod install --repo-update"
Write-Host "3. Open ios/FlushFrenzy.xcworkspace in Xcode"
Write-Host "4. Configure your development team in Signing & Capabilities"
Write-Host "5. Select target device/simulator"
Write-Host "6. Build and run (Cmd+R)"
Write-Host ""
Write-Host "📖 See iOS-Development.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Happy coding!" -ForegroundColor Green
