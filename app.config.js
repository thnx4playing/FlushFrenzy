const path = require('path');

module.exports = {
  expo: {
    owner: "thnx4playing",
    name: "Flush Frenzy",
    slug: "FlushFrenzy",
    version: "1.3.1",
    orientation: "portrait",
    icon: path.resolve(__dirname, 'assets/default/app-icon.png'),
    userInterfaceStyle: "light",
    loading: {
      backgroundColor: "transparent"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.thnx4playing.FlushFrenzy",
      buildNumber: "10",
      icon: path.resolve(__dirname, 'assets/default/app-icon.png'),
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
        NSMicrophoneUsageDescription: "Used in Touchless Mode to detect blowing into the microphone to launch toilet paper rolls.",
        NSCameraUsageDescription: "Used in Touchless Mode for head tracking to aim without touching the screen.",
        UIRequiresFullScreen: true,
        UISupportedInterfaceOrientations: ["UIInterfaceOrientationPortrait"]
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
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.0"
          }
        }
      ],
      "expo-web-browser",
      "expo-dev-client",
      [
        "expo-camera",
        {
          cameraPermission: "Used in Touchless Mode for head tracking to aim without touching the screen.",
          microphonePermission: "Used in Touchless Mode to detect blowing into the microphone to launch toilet paper rolls."
        }
      ],
      [
        "react-native-vision-camera",
        {
          cameraPermissionText: "Used in Touchless Mode for head tracking to aim without touching the screen."
        }
      ],
      [
        "expo-av",
        {
          microphonePermission: "Used in Touchless Mode to detect blowing into the microphone to launch toilet paper rolls."
        }
      ],
      [
        "expo-audio",
        {
          microphonePermission: "Used in Touchless Mode to detect blowing into the microphone to launch toilet paper rolls."
        }
      ],
      "expo-sensors",
      "./plugins/removeMotionPermission"
    ]
  }
};
