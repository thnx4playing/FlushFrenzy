#!/bin/bash

# Flush Frenzy - Xcode Setup Script
# This script prepares the project for Xcode development and building
# Updated: Apr 2026 - SDK 53 patches + fmt consteval Podfile fix

set -e  # Exit on any error

echo "🚀 Starting Flush Frenzy Xcode Setup..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "app.config.js" ]; then
    print_error "app.config.js not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Verifying project structure..."

# Check for required tools
print_status "Checking required tools..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm found: $(npm --version)"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI not found. Installing globally..."
    npm install -g @expo/cli
    hash -r
    if command -v expo &> /dev/null; then
        print_success "Expo CLI installed: $(expo --version)"
    else
        print_warning "Expo CLI installed but not in PATH. Will use npx as fallback."
    fi
else
    print_success "Expo CLI found: $(expo --version)"
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_warning "EAS CLI not found. Installing globally..."
    npm install -g eas-cli
    print_success "EAS CLI installed"
else
    print_success "EAS CLI found: $(eas --version)"
fi

# Check for Xcode (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode is not installed or not in PATH. Please install Xcode from the App Store."
        exit 1
    fi
    print_success "Xcode found: $(xcodebuild -version | head -n 1)"
    
    # Check for iOS Simulator
    if ! command -v xcrun &> /dev/null; then
        print_error "Xcode command line tools not found. Please install with: xcode-select --install"
        exit 1
    fi
    print_success "Xcode command line tools found"
else
    print_warning "Not running on macOS - Xcode checks skipped"
fi

# Install dependencies
print_status "Installing npm dependencies..."
npm install
print_success "Dependencies installed"

# Install iOS dependencies (CocoaPods)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v pod &> /dev/null; then
        print_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
        print_success "CocoaPods installed"
    else
        print_success "CocoaPods found: $(pod --version)"
    fi
fi

# Clean any existing builds
print_status "Cleaning previous iOS builds..."
rm -rf ios/ .expo/
print_success "Previous builds cleaned"

# Prebuild for iOS
print_status "Running Expo prebuild for iOS..."
print_status "This will generate the native iOS project with current app.config.js settings"
if command -v expo &> /dev/null; then
    expo prebuild --platform ios --clean
else
    print_warning "Using npx to run expo prebuild..."
    npx expo prebuild --platform ios --clean
fi
print_success "iOS prebuild completed"

# Patch Podfile with C++20 standard so fmt's consteval calls compile
# under newer Xcode versions. Without this, builds fail with errors like:
#   "Call to consteval function fmt::basic_format_string<...> is not
#    a constant expression"
# Safe to re-run — patch is idempotent.
if [ -f "ios/Podfile" ]; then
    if grep -q "CLANG_CXX_LANGUAGE_STANDARD" ios/Podfile; then
        print_status "Podfile already patched for C++20 (fmt fix) - skipping"
    else
        print_status "Patching Podfile with C++20 standard (fmt consteval fix)..."
        cat >> ios/Podfile <<'PODFILE_PATCH'

# --- Added by setup-xcode.sh ---
# Force C++20 across all pod targets so libfmt's consteval calls compile.
# CocoaPods chains post_install hooks, so this runs after Expo's own.
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++20'
    end
  end
end
PODFILE_PATCH
        print_success "Podfile patched"
    fi
fi

# Navigate to iOS directory and install pods
if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
    print_status "Installing iOS CocoaPods dependencies..."
    cd ios
    pod install --repo-update
    cd ..
    print_success "CocoaPods dependencies installed"
fi

# Final verification
print_status "Running final verification..."

# Check if iOS directory was created
if [ -d "ios" ]; then
    print_success "iOS directory created successfully"
    
    # Check for Xcode workspace
    if [ -f "ios/FlushFrenzy.xcworkspace/contents.xcworkspacedata" ]; then
        print_success "Xcode workspace created"
    else
        print_warning "Xcode workspace not found - may be created after pod install"
    fi
else
    print_error "iOS directory not created - check for errors above"
fi

# Final summary
echo ""
echo "🎉 Xcode Setup Complete!"
echo "========================="
echo ""
echo "✅ Dependencies installed"
echo "✅ iOS prebuild completed (iOS 16.0 deployment target)"
echo "✅ CocoaPods dependencies installed"
echo ""
APP_VERSION=$(node -e "console.log(require('./app.config.js').expo.version)" 2>/dev/null || echo "?")
APP_BUILD=$(node -e "console.log(require('./app.config.js').expo.ios.buildNumber)" 2>/dev/null || echo "?")
APP_PLUGINS=$(node -e "console.log(require('./app.config.js').expo.plugins.map(p=>Array.isArray(p)?p[0]:p).join(', '))" 2>/dev/null || echo "?")

echo "📋 Current Configuration:"
echo "   - Version: $APP_VERSION"
echo "   - Build: $APP_BUILD"
echo "   - Deployment Target: iOS 16.0"
echo "   - Plugins: $APP_PLUGINS"
echo ""
echo "📋 Next Steps:"
echo "1. Open Xcode: open ios/FlushFrenzy.xcworkspace"
echo "2. Configure your development team in Signing & Capabilities"
echo "3. Select target device/simulator"
echo "4. Build and run (Cmd+R)"
echo ""
echo "📖 See iOS-Development.md for detailed instructions"
echo ""
echo "🚀 Happy coding!"
