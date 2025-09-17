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

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.thnx4playing.FlushFrenzy",
      buildNumber: "6",
      icon: path.resolve(__dirname, 'assets/app-icon.png'),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
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
      "expo-web-browser"
    ]
  }
};
