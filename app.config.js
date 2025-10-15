const path = require('path');

module.exports = {
  expo: {
    owner: "thnx4playing",
    name: "Flush Frenzy",
    slug: "FlushFrenzy",
    version: "1.2.0",
    orientation: "portrait",
    icon: path.resolve(__dirname, 'assets/app-icon-halloween.png'),
    userInterfaceStyle: "light",
    splash: {
      image: path.resolve(__dirname, 'assets/splash-icon.png'),
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    loading: {
      backgroundColor: "transparent"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.thnx4playing.FlushFrenzy",
      buildNumber: "3",
      icon: path.resolve(__dirname, 'assets/app-icon-halloween.png'),
      splash: {
        image: path.resolve(__dirname, 'assets/splash-icon.png'),
        resizeMode: "cover",
        backgroundColor: "#ffffff"
      },
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
        NSMicrophoneUsageDescription: "This app does not use the microphone.",
        NSCameraUsageDescription: "This app does not use the camera.",
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
      "expo-web-browser",
      "expo-dev-client",
      [
        "expo-av",
        {
          microphonePermission: false
        }
      ],
      [
        "expo-audio",
        {
          microphonePermission: false
        }
      ]
    ]
  }
};
