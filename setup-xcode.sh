#!/bin/bash

# Flush Frenzy - Xcode Setup Script
# This script prepares the project for Xcode development and building
# Updated: Feb 2026 - Touchless Mode V2

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
echo "📋 Current Configuration:"
echo "   - Version: 1.3.1"
echo "   - Build: 10"
echo "   - Deployment Target: iOS 16.0"
echo "   - Plugins: expo-build-properties, expo-camera, react-native-vision-camera, expo-av, expo-audio"
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
