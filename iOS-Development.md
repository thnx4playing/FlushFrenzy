# iOS Development Guide for Flush Frenzy

## Quick Start

### Windows Users
1. **Initial Setup** (run once):
   ```powershell
   .\setup-xcode.ps1
   ```

### macOS Users
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
- **macOS** with Xcode installed (for iOS builds)
- **iOS Simulator** or physical iOS device
- **Apple Developer Account** (for device testing)
- **Node.js** (18.x or later)
- **Expo CLI** and **EAS CLI**

### Scripts Available

| Script | Purpose | Platform |
|--------|---------|----------|
| `./setup-xcode.sh` | Complete project setup for Xcode | macOS |
| `.\setup-xcode.ps1` | Initial setup and preparation | Windows/macOS |
| `./ios-setup.sh` | Quick iOS rebuild and pod install | macOS |
| `./xcode-open.sh` | Open Xcode workspace | macOS |

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run ios` | Start development server for iOS |
| `npm run ios:sim` | Run on iOS Simulator |
| `npm run ios:dev` | Run on connected iOS device |
| `npm run prebuild:ios` | Rebuild iOS native code |
| `npm run pods` | Install CocoaPods dependencies |
| `npm run clean` | Clean all builds and rebuild (Unix) |
| `npm run clean:win` | Clean all builds and rebuild (Windows) |

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
- **Production**: `com.thnx4playing.FlushFrenzy`
- Ensure this matches your Apple Developer account

### Key iOS Settings
- **Target iOS Version**: iOS 13.0+
- **Orientation**: Portrait only
- **Background Modes**: Audio (for game sounds)
- **Privacy**: No camera/microphone permissions required
- **Full Screen**: Required (no home indicator)

## iOS-Specific Features

### Audio Configuration
- Background audio playback enabled
- No microphone permissions requested
- Optimized for game sound effects and music

### Network Security
- Configured for HTTPS connections to virtuixtech.com
- Bug fixes browser functionality enabled
- Secure web browser integration

### Performance
- Portrait-only orientation for optimal gameplay
- Full-screen experience
- Optimized for iOS devices (iPhone focus, no iPad)

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
   npm run clean      # macOS/Linux
   npm run clean:win  # Windows
   ./ios-setup.sh     # macOS only
   ```

3. **Metro Bundle Issues**:
   ```bash
   npx expo start --clear
   ```

4. **Xcode Signing Issues**:
   - Check development team selection
   - Verify bundle identifier matches your Apple ID
   - Clean build folder (Cmd+Shift+K in Xcode)

5. **Simulator Issues**:
   ```bash
   xcrun simctl erase all
   npm run ios:sim
   ```

### Getting Help

- **Expo Documentation**: https://docs.expo.dev/
- **iOS-specific Expo docs**: https://docs.expo.dev/workflow/ios/
- **React Native iOS guide**: https://reactnative.dev/docs/running-on-ios
- **EAS Build docs**: https://docs.expo.dev/build/introduction/

## Project Structure

```
ios/
├── FlushFrenzy/                # Main iOS app
├── FlushFrenzy.xcodeproj/      # Xcode project
├── FlushFrenzy.xcworkspace/    # Xcode workspace (use this)
├── Podfile                     # CocoaPods dependencies
└── Pods/                       # Installed pods
```

## Development Environment

### Required Tools
- **Xcode** (latest stable version)
- **iOS Simulator** (included with Xcode)
- **CocoaPods** (for iOS dependencies)
- **Expo CLI** (`npm install -g @expo/cli`)
- **EAS CLI** (`npm install -g @expo/eas-cli`)

### Optional Tools
- **iOS Device** (for testing on real hardware)
- **Flipper** (for debugging)
- **React Native Debugger**

## Next Steps After Setup

### First Time Setup
1. Run setup script: `./setup-xcode.sh` (macOS) or `.\setup-xcode.ps1` (Windows)
2. Open Xcode workspace: `./xcode-open.sh`
3. Configure development team in Xcode
4. Test on simulator: `npm run ios:sim`

### Daily Development
1. Start development server: `npm start`
2. Run on simulator: `npm run ios:sim`
3. Make changes and hot reload
4. Test on device when needed: `npm run ios:dev`

### Before Release
1. Test thoroughly on simulator and device
2. Build for TestFlight: `npm run build:ios:dev`
3. Submit for review: `npm run submit:ios`

## App Store Information

- **App Store Connect ID**: 6749656491
- **Bundle ID**: com.thnx4playing.FlushFrenzy
- **Team**: thnx4playing

## Support

For issues specific to this project, check:
1. This documentation
2. Project issues on GitHub
3. Expo/React Native documentation
4. iOS development forums

Happy coding! 🚀
