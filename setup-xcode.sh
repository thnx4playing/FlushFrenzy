#!/bin/bash

# Flush Frenzy - Xcode Setup Script
# This script prepares the project for Xcode development and building

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
    # Refresh PATH to recognize newly installed CLI
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

# Clean any existing builds
print_status "Cleaning previous builds..."
rm -rf ios/ android/ .expo/
print_success "Previous builds cleaned"

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

# Prebuild for iOS
print_status "Running Expo prebuild for iOS..."
if command -v expo &> /dev/null; then
    expo prebuild --platform ios --clean
else
    print_warning "Using npx to run expo prebuild..."
    npx @expo/cli prebuild --platform ios --clean
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

# Set up development build configuration
print_status "Configuring development build..."

# Create or update .env file for development
cat > .env << EOF
# Development Environment Configuration
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_BUG_REPORT_KEY=your_bug_report_key_here
EOF

print_success "Development environment configured"

# Create iOS-specific scripts in package.json
print_status "Adding iOS-specific npm scripts..."

# Read current package.json
PACKAGE_JSON=$(cat package.json)

# Create updated package.json with iOS scripts
cat > package.json << EOF
{
  "name": "flushfrenzy",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "ios:dev": "expo run:ios --device",
    "ios:sim": "expo run:ios",
    "prebuild": "expo prebuild --clean",
    "prebuild:ios": "expo prebuild --platform ios --clean",
    "pods": "cd ios && pod install",
    "clean": "rm -rf ios/ android/ .expo/ && npm run prebuild",
    "build:ios": "eas build --platform ios",
    "build:ios:dev": "eas build --platform ios --profile development",
    "submit:ios": "eas submit --platform ios"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.1.0",
    "@fustaro/react-native-axis-pad": "^0.7.0",
    "@gorhom/bottom-sheet": "^5.1.8",
    "@react-native-async-storage/async-storage": "^2.1.2",
    "@react-native-community/slider": "4.5.6",
    "@react-native-picker/picker": "^2.11.1",
    "@react-navigation/native": "^7.1.17",
    "@react-navigation/stack": "^7.4.5",
    "@shopify/react-native-skia": "v2.0.0-next.4",
    "expo": "^53.0.20",
    "expo-audio": "^0.4.8",
    "expo-av": "~15.1.7",
    "expo-dev-client": "~5.2.4",
    "expo-haptics": "~14.1.4",
    "expo-linear-gradient": "~14.1.5",
    "expo-status-bar": "~2.2.3",
    "matter-js": "^0.20.0",
    "poly-decomp": "^0.3.0",
    "react": "19.0.0",
    "react-native": "0.79.5",
    "react-native-confetti-cannon": "^1.5.2",
    "react-native-game-engine": "^1.2.0",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-paper": "^5.14.5",
    "react-native-reanimated": "~3.17.4",
    "react-native-safe-area-context": "5.4.0",
    "react-native-screens": "~4.11.1",
    "react-native-svg": "15.11.2",
    "react-native-vector-icons": "^10.3.0",
    "zustand": "^5.0.7",
    "expo-web-browser": "~14.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~19.0.10",
    "typescript": "~5.8.3"
  },
  "private": true
}
EOF

print_success "iOS scripts added to package.json"

# Update app.config.js with enhanced iOS configuration
print_status "Enhancing iOS configuration..."

cat > app.config.js << 'EOF'
const path = require('path');

module.exports = {
  expo: {
    owner: "thnx4playing",
    name: "Flush Frenzy",
    slug: "FlushFrenzy",
    version: "1.0.0",
    orientation: "portrait",
    icon: path.resolve(__dirname, 'assets/app-icon.png'),
    userInterfaceStyle: "light",
    splash: {
      image: path.resolve(__dirname, 'assets/splash-icon.png'),
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.thnx4playing.FlushFrenzy",
      buildNumber: "6",
      icon: path.resolve(__dirname, 'assets/app-icon.png'),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "virtuixtech.com": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: "1.0",
              NSIncludesSubdomains: true
            }
          }
        },
        UIBackgroundModes: ["audio"],
        NSMicrophoneUsageDescription: "This app does not use the microphone.",
        NSCameraUsageDescription: "This app does not use the camera."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: path.resolve(__dirname, 'assets/adaptive-icon.png'),
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: path.resolve(__dirname, 'assets/favicon.png')
    },
    extra: {
      eas: {
        projectId: "3305a902-de48-4658-8acd-97ef7dca15c4"
      }
    },

    // Enable native development
    experiments: {
      tsconfigPaths: true
    },
    
    // Plugins
    plugins: [
      "expo-web-browser",
      "expo-dev-client",
      [
        "expo-av",
        {
          microphonePermission: false
        }
      ]
    ]
  }
};
EOF

print_success "iOS configuration enhanced"

# Update EAS configuration
print_status "Updating EAS build configuration..."

cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 16.17.4"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "6749656491"
      }
    },
    "preview": {
      "ios": {
        "ascAppId": "6749656491"
      }
    }
  }
}
EOF

print_success "EAS configuration updated"

# Create iOS development helper scripts
print_status "Creating iOS helper scripts..."

# Create ios-setup.sh for quick iOS setup
cat > ios-setup.sh << 'EOF'
#!/bin/bash
# Quick iOS setup script

echo "🍎 iOS Quick Setup"
echo "=================="

# Clean and rebuild
echo "Cleaning previous builds..."
rm -rf ios/ .expo/

echo "Running prebuild..."
expo prebuild --platform ios --clean

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
EOF

chmod +x ios-setup.sh

# Create xcode-open.sh for opening Xcode workspace
cat > xcode-open.sh << 'EOF'
#!/bin/bash
# Open Xcode workspace

if [ -d "ios" ]; then
    if [ -f "ios/FlushFrenzy.xcworkspace" ]; then
        echo "📱 Opening Xcode workspace..."
        open ios/FlushFrenzy.xcworkspace
    else
        echo "❌ Xcode workspace not found. Run './ios-setup.sh' first."
    fi
else
    echo "❌ iOS directory not found. Run './setup-xcode.sh' first."
fi
EOF

chmod +x xcode-open.sh

print_success "Helper scripts created"

# Create README for iOS development
cat > iOS-Development.md << 'EOF'
# iOS Development Guide for Flush Frenzy

## Quick Start

1. **Initial Setup** (run once):
   ```bash
   ./setup-xcode.sh
   ```

2. **Daily Development**:
   ```bash
   ./ios-setup.sh    # Clean rebuild when needed
   ./xcode-open.sh   # Open Xcode workspace
   ```

## Development Workflow

### Prerequisites
- macOS with Xcode installed
- iOS Simulator or physical iOS device
- Apple Developer Account (for device testing)

### Scripts Available

| Script | Purpose |
|--------|---------|
| `./setup-xcode.sh` | Complete project setup for Xcode |
| `./ios-setup.sh` | Quick iOS rebuild and pod install |
| `./xcode-open.sh` | Open Xcode workspace |

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run ios` | Start development server for iOS |
| `npm run ios:sim` | Run on iOS Simulator |
| `npm run ios:dev` | Run on connected iOS device |
| `npm run prebuild:ios` | Rebuild iOS native code |
| `npm run pods` | Install CocoaPods dependencies |
| `npm run clean` | Clean all builds and rebuild |

### Building for Distribution

1. **Development Build**:
   ```bash
   npm run build:ios:dev
   ```

2. **Production Build**:
   ```bash
   npm run build:ios
   ```

3. **Submit to App Store**:
   ```bash
   npm run submit:ios
   ```

## Xcode Configuration

### Development Team Setup
1. Open `ios/FlushFrenzy.xcworkspace` in Xcode
2. Select the project root in the navigator
3. Go to "Signing & Capabilities" tab
4. Select your development team
5. Xcode will automatically provision the app

### Bundle Identifier
- Development: `com.thnx4playing.FlushFrenzy`
- Ensure this matches your Apple Developer account

### Key iOS Settings
- **Target iOS Version**: iOS 13.0+
- **Orientation**: Portrait only
- **Background Modes**: Audio (for game sounds)
- **Privacy**: No camera/microphone permissions required

## Troubleshooting

### Common Issues

1. **CocoaPods Issues**:
   ```bash
   cd ios
   pod deintegrate
   pod install --repo-update
   ```

2. **Build Errors**:
   ```bash
   npm run clean
   ./ios-setup.sh
   ```

3. **Metro Bundle Issues**:
   ```bash
   npx expo start --clear
   ```

4. **Xcode Signing Issues**:
   - Check development team selection
   - Verify bundle identifier matches your Apple ID
   - Clean build folder (Cmd+Shift+K in Xcode)

### Getting Help

- Check Expo documentation: https://docs.expo.dev/
- iOS-specific Expo docs: https://docs.expo.dev/workflow/ios/
- React Native iOS guide: https://reactnative.dev/docs/running-on-ios

## Project Structure

```
ios/
├── FlushFrenzy/                # Main iOS app
├── FlushFrenzy.xcodeproj/      # Xcode project
├── FlushFrenzy.xcworkspace/    # Xcode workspace (use this)
├── Podfile                     # CocoaPods dependencies
└── Pods/                       # Installed pods
```

## Next Steps After Setup

1. Open Xcode workspace: `./xcode-open.sh`
2. Configure development team in Xcode
3. Test on simulator: `npm run ios:sim`
4. Test on device: `npm run ios:dev`
5. Build for distribution when ready: `npm run build:ios`
EOF

print_success "iOS Development guide created"

# Final verification
print_status "Running final verification..."

# Check if iOS directory was created
if [ -d "ios" ]; then
    print_success "iOS directory created successfully"
    
    # Check for Xcode workspace
    if [ -f "ios/FlushFrenzy.xcworkspace" ]; then
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
echo "✅ Project configured for iOS development"
echo "✅ Dependencies installed"
echo "✅ iOS prebuild completed"
echo "✅ Helper scripts created"
echo "✅ Development guide created"
echo ""
echo "📋 Next Steps:"
echo "1. Open Xcode: ./xcode-open.sh"
echo "2. Configure your development team in Xcode"
echo "3. Select target device/simulator"
echo "4. Build and run (Cmd+R)"
echo ""
echo "📖 See iOS-Development.md for detailed instructions"
echo ""
echo "🚀 Happy coding!"
EOF
