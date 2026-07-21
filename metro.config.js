const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;
  const cryptoShim = path.resolve(__dirname, 'lib/nodeCryptoShim.js');
  const defaultResolveRequest = resolver.resolveRequest;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    resolveRequest(context, moduleName, platform) {
      if (moduleName === 'crypto') {
        return {
          type: 'sourceFile',
          filePath: cryptoShim,
        };
      }

      return defaultResolveRequest
        ? defaultResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    },
  };

  return config;
})();
