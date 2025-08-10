const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable native development
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
