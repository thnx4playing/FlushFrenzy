module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-worklets-core/plugin'],
      'react-native-worklets/plugin',  // Reanimated 4: replaces react-native-reanimated/plugin. Must be LAST.
    ],
  };
};
