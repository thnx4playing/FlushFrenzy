#!/bin/bash
# Quick iOS setup script for Flush Frenzy

echo "🍎 iOS Quick Setup"
echo "=================="

# Clean and rebuild
echo "Cleaning previous builds..."
rm -rf ios/ .expo/

echo "Running prebuild..."
if command -v expo &> /dev/null; then
    expo prebuild --platform ios --clean
else
    echo "Using npx to run expo prebuild..."
    npx @expo/cli prebuild --platform ios --clean
fi

if [ -d "ios" ]; then
    echo "Installing CocoaPods..."
    cd ios
    pod install --repo-update
    cd ..
    echo "✅ iOS setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Open ios/FlushFrenzy.xcworkspace in Xcode"
    echo "2. Select your development team"
    echo "3. Choose your target device/simulator"
    echo "4. Press Cmd+R to build and run"
else
    echo "❌ iOS directory not created. Check for errors above."
fi
