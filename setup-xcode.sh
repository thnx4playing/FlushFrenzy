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

# Wipe Xcode DerivedData for this project. Xcode caches precompiled
# module headers there, and "Clean Build Folder" inside Xcode doesn't
# touch them — which is why fmt build errors can persist after a fresh
# pod install. macOS-only.
if [[ "$OSTYPE" == "darwin"* ]]; then
    DERIVED="$HOME/Library/Developer/Xcode/DerivedData"
    if [ -d "$DERIVED" ]; then
        # shellcheck disable=SC2010
        STALE=$(ls -1 "$DERIVED" 2>/dev/null | grep -i "^FlushFrenzy-" || true)
        if [ -n "$STALE" ]; then
            print_status "Wiping stale Xcode DerivedData for FlushFrenzy..."
            for d in $STALE; do rm -rf "$DERIVED/$d"; done
            print_success "DerivedData cleared"
        fi
    fi
fi

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

# Verify the fmt consteval patch from the withFmtConstevalFix config
# plugin was applied to the Podfile during prebuild. The plugin splices
# CLANG_CXX_LANGUAGE_STANDARD=gnu++20 and FMT_USE_CONSTEVAL=0 into the
# existing post_install block, fixing libfmt build errors on Xcode 16+.
if [ -f "ios/Podfile" ]; then
    if grep -q "FMT_USE_CONSTEVAL=0" ios/Podfile; then
        print_success "Podfile fmt consteval fix applied (via config plugin)"
    else
        print_warning "Podfile is missing the fmt consteval fix - the build may fail on Xcode 16+"
        print_warning "Confirm 'withFmtConstevalFix' is listed in app.config.js plugins"
    fi
fi

# Navigate to iOS directory and install pods
if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
    print_status "Installing iOS CocoaPods dependencies..."
    cd ios
    pod install --repo-update
    cd ..
    print_success "CocoaPods dependencies installed"

    # Sledgehammer: directly rewrite `consteval` -> `constexpr` in fmt
    # headers. The Podfile preprocessor defines (FMT_USE_CONSTEVAL=0 etc.)
    # turn out to be insufficient on Xcode 26+, which is stricter about
    # consteval evaluation than the macros gate. Constexpr is functionally
    # equivalent at runtime; we only lose compile-time-only guarantees in
    # fmt's format-string validation.
    #
    # Uses perl, not sed: BSD sed on macOS doesn't support \b for word
    # boundaries (silently no-ops), which is why earlier attempts of this
    # patch ran successfully but didn't actually rewrite anything.
    if [ -d "ios/Pods/fmt/include/fmt" ]; then
        PATCHED=0
        for f in ios/Pods/fmt/include/fmt/*.h; do
            if grep -qw "consteval" "$f" 2>/dev/null; then
                perl -i -pe 's/\bconsteval\b/constexpr/g' "$f"
                PATCHED=$((PATCHED + 1))
            fi
        done

        # Verify: count any remaining `consteval` keyword across all fmt
        # headers. Use perl to count so we don't have to fight grep's
        # exit-code-1-on-zero-matches behavior under set -e.
        REMAINING=$(perl -ne 'BEGIN{$c=0} $c++ while /\bconsteval\b/g; END{print $c}' ios/Pods/fmt/include/fmt/*.h)

        if [ "$REMAINING" -eq 0 ]; then
            if [ $PATCHED -gt 0 ]; then
                print_success "Rewrote consteval -> constexpr in $PATCHED fmt header(s) (0 remaining)"
            else
                print_status "No consteval keyword found in fmt headers (already patched or different fmt version)"
            fi
        else
            print_error "Patch ran on $PATCHED files but $REMAINING consteval occurrences remain in fmt headers"
            for f in ios/Pods/fmt/include/fmt/*.h; do
                n=$(perl -ne 'BEGIN{$c=0} $c++ while /\bconsteval\b/g; END{print $c}' "$f")
                [ "$n" -gt 0 ] && echo "       $f: $n remaining"
            done
        fi
    else
        print_warning "ios/Pods/fmt/include/fmt not found — skipping consteval rewrite"
    fi
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
