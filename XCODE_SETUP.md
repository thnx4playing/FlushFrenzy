# Xcode Development Setup

## Prerequisites
- macOS with Xcode installed
- Node.js and npm/yarn
- React Native CLI

## Setup Instructions

### 1. Clone the repository on your iMac
```bash
git clone https://github.com/thnx4playing/ToiletOlympics.git
cd ToiletOlympics
```

### 2. Install dependencies
```bash
npm install
```

### 3. Generate iOS project files
```bash
npx expo prebuild --platform ios --clean
```

### 4. Open in Xcode
```bash
open ios/ToiletOlympicsGameV2.xcworkspace
```

### 5. Build and run
- Select your target device/simulator in Xcode
- Press Cmd+R to build and run

## Development Workflow

1. **Make changes** in the React Native code
2. **Sync with GitHub** from your Windows machine
3. **Pull changes** on your iMac
4. **Rebuild in Xcode** to test

## Troubleshooting

### If prebuild fails:
```bash
npx expo install --fix
npx expo prebuild --platform ios --clean
```

### If Xcode can't find dependencies:
```bash
cd ios
pod install
cd ..
```

### To clean and rebuild:
```bash
npx expo prebuild --platform ios --clean
cd ios
pod install
cd ..
```

## Notes
- The iOS project will be generated in the `ios/` folder
- Use `ToiletOlympicsGameV2.xcworkspace` (not .xcodeproj)
- Metro bundler will start automatically when you run from Xcode
