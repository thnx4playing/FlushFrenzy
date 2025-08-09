const path = require('path');

module.exports = {
  expo: {
    name: "ToiletOlympicsGameV2",
    slug: "ToiletOlympicsGameV2",
    version: "1.7.0",
    orientation: "portrait",
    icon: path.resolve(__dirname, 'assets/icon.png'),
    userInterfaceStyle: "light",
    splash: {
      image: path.resolve(__dirname, 'assets/splash-icon.png'),
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.thnx4playing.ToiletOlympicsGameV2",
      buildNumber: "26",
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
        projectId: "1ecbd8c5-1539-4fa1-b58e-0591783b6203"
      }
    }
  }
};
