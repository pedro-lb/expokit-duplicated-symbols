const disableAutolinkConfig = {
  platforms: {
    ios: null,
    android: null,
  },
};

module.exports = {
  dependencies: {
    // These libraries are included in ExpoKit; autolinking them
    // results in duplicate symbol errors
    'react-native-gesture-handler': disableAutolinkConfig,
    'react-native-webview': disableAutolinkConfig,
    'react-native-reanimated': disableAutolinkConfig,
    '@react-native-community/netinfo': disableAutolinkConfig,
  },
};
