const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@components": path.resolve(__dirname, "src/components/"),
  "@db": path.resolve(__dirname, "src/db/"),
  "@": path.resolve(__dirname, "./"),
};

config.resolver.assetExts.push("wasm");
config.resolver.sourceExts.push("sql");

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: "./global.css" });
