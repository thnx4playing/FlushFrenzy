# iOS Development Guide for Flush Frenzy

**Updated: February 2026 - Touchless Mode V2**

## Quick Start

1. **On Windows** - Prepare project:
   ```powershell
   .\setup-xcode.ps1
   ```

2. **On macOS** - Full iOS setup:
   ```bash
   ./setup-xcode.sh
   ```

3. **Open Xcode**:
   ```bash
   open ios/FlushFrenzy.xcworkspace
   ```

## Current Project Configuration

| Setting | Value |
|---------|-------|
| Version | 1.3.1 |
| Build Number | 10 |
| iOS Deployment Target | 16.0 |
| Bundle Identifier | com.thnx4playing.FlushFrenzy |

### Plugins Configured
- `expo-build-properties` - iOS 16.0 deployment target
- `expo-camera` - Camera permission for touchless mode
- `react-native-vision-camera` - Vision camera for face detection
- `expo-av` - Audio/video for blow detection
- `expo-audio` - Microphone access

### Permissions
- **Camera**: "Used in Touchless Mode for head tracking to aim without touching the screen."
- **Microphone**: "Used in Touchless Mode to detect blowing into the microphone to launch toilet paper rolls."

## Development Workflow

### Prerequisites
- macOS with Xcode 15+ installed
- iOS 16.0+ Simulator or physical device
- Apple Developer Account (for device testing)
- CocoaPods installed (`sudo gem install cocoapods`)

### Scripts Available

| Script | Platform | Purpose |
|--------|----------|---------|
| `./setup-xcode.sh` | macOS | Complete project setup for Xcode |
| `.\setup-xcode.ps1` | Windows | Prepare project (prebuild only) |
| `./ios-setup.sh` | macOS | Quick iOS rebuild and pod install |
| `./xcode-open.sh` | macOS | Open Xcode workspace |

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run ios` | Start development server for iOS |
| `npm run ios:sim` | Run on iOS Simulator |
| `npm run ios:dev` | Run on connected iOS device |
| `npm run prebuild:ios` | Rebuild iOS native code |
| `npm run pods` | Install CocoaPods dependencies |
| `npm run clean` | Clean all builds and rebuild |

## Manual Setup Steps

If scripts don't work, follow these steps:

```bash
# 1. Install dependencies
npm install

# 2. Clean previous builds
rm -rf ios/ .expo/

# 3. Generate iOS project
npx expo prebuild --platform ios --clean

# 4. Install CocoaPods (macOS only)
cd ios
pod install --repo-update
cd ..

# 5. Open in Xcode
open ios/FlushFrenzy.xcworkspace
```

## Xcode Configuration

### Development Team Setup
1. Open `ios/FlushFrenzy.xcworkspace` in Xcode
2. Select the project root in the navigator
3. Go to "Signing & Capabilities" tab
4. Select your development team
5. Xcode will automatically provision the app

### Key iOS Settings
- **Target iOS Version**: iOS 16.0+
- **Orientation**: Portrait only
- **Requires Full Screen**: Yes
- **Background Modes**: None required

## Building for Distribution

### EAS Build (Recommended)

1. **Development Build** (for testing):
   ```bash
   eas build --platform ios --profile development
   ```

2. **Production Build** (for TestFlight/App Store):
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

### Local Xcode Build

1. Open `ios/FlushFrenzy.xcworkspace`
2. Select "Any iOS Device" or your device
3. Product → Archive
4. Distribute to App Store Connect

## Troubleshooting

### Common Issues

1. **CocoaPods Issues**:
   ```bash
   cd ios
   pod deintegrate
   pod cache clean --all
   pod install --repo-update
   ```

2. **Build Errors After Config Changes**:
   ```bash
   rm -rf ios/
   npx expo prebuild --platform ios --clean
   cd ios && pod install && cd ..
   ```

3. **Metro Bundle Issues**:
   ```bash
   npx expo start --clear
   ```

4. **Xcode Signing Issues**:
   - Check development team selection
   - Verify bundle identifier matches your Apple ID
   - Clean build folder (Cmd+Shift+K in Xcode)

5. **Vision Camera / Worklets Issues**:
   - Ensure iOS 16.0+ deployment target
   - Check babel.config.js has worklets plugin
   - Rebuild with clean prebuild

### Getting Help

- Expo documentation: https://docs.expo.dev/
- React Native Vision Camera: https://react-native-vision-camera.com/
- EAS Build docs: https://docs.expo.dev/build/introduction/

## Project Structure

```
ios/
├── FlushFrenzy/                # Main iOS app
│   ├── AppDelegate.mm          # App delegate
│   ├── Info.plist              # App configuration
│   └── Supporting/             # Supporting files
├── FlushFrenzy.xcodeproj/      # Xcode project (don't use directly)
├── FlushFrenzy.xcworkspace/    # Xcode workspace (USE THIS)
├── Podfile                     # CocoaPods dependencies
└── Pods/                       # Installed pods
```

## Touchless Mode Notes

The current build (v1.3.1 build 10) has:
- Frame processor disabled (worklets threading issues)
- Auto-sweep aiming enabled by default
- Single blow = launch
- Camera renders for Apple compliance but no face detection active

To re-enable face detection in the future:
1. Fix worklets threading in `TouchlessControls.tsx`
2. Uncomment frame processor code
3. Set `useFaceDetection` initial state to `true`
