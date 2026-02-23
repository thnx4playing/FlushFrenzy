const { withInfoPlist } = require('expo/config-plugins');

// Removes NSMotionUsageDescription from Info.plist so iOS doesn't prompt
// for motion/health permissions. We only use CMMotionManager (Accelerometer)
// which doesn't require this key — expo-sensors adds it unnecessarily.
module.exports = function removeMotionPermission(config) {
  return withInfoPlist(config, (config) => {
    delete config.modResults.NSMotionUsageDescription;
    return config;
  });
};
