"use strict";

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const requiredPaths = [
  "android/libs/postback-sdk.aar",
  "ios/PostbackSDK.xcframework/ios-arm64/PostbackSDK.framework/PostbackSDK",
  "ios/PostbackSDK.xcframework/ios-arm64/dSYMs/PostbackSDK.framework.dSYM/Contents/Resources/DWARF/PostbackSDK",
  "ios/PostbackSDK.xcframework/ios-arm64_x86_64-simulator/PostbackSDK.framework/PostbackSDK",
  "ios/PostbackSDK.xcframework/ios-arm64_x86_64-simulator/dSYMs/PostbackSDK.framework.dSYM/Contents/Resources/DWARF/PostbackSDK",
  "app.plugin.js",
  "plugin/build/index.js",
];

const missingPaths = requiredPaths.filter((relativePath) => {
  return !fs.existsSync(path.join(projectRoot, relativePath));
});

if (missingPaths.length > 0) {
  console.error("Missing required release artifacts:");
  for (const missingPath of missingPaths) {
    console.error(`- ${missingPath}`);
  }
  process.exit(1);
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
);

const pluginEntries = packageJson.expo?.plugins ?? [];
if (!pluginEntries.includes("./app.plugin.js")) {
  console.error('package.json must register "./app.plugin.js" in expo.plugins.');
  process.exit(1);
}

const podspec = fs.readFileSync(
  path.join(projectRoot, "postback-react-native.podspec"),
  "utf8"
);

if (!podspec.includes(":git => repository_url")) {
  console.error("podspec must pass a string repository URL to CocoaPods :git.");
  process.exit(1);
}

if (!podspec.includes(':tag => "v#{s.version}"')) {
  console.error("podspec source tag must match v-prefixed GitHub release tags.");
  process.exit(1);
}

const androidGradle = fs.readFileSync(
  path.join(projectRoot, "android", "build.gradle"),
  "utf8"
);

if (!androidGradle.includes("rootProject.allprojects")) {
  console.error("Android build must expose the vendored AAR repository to the host app.");
  process.exit(1);
}

if (!androidGradle.includes("implementation(name: 'postback-sdk', ext: 'aar')")) {
  console.error("Android build must consume the vendored core SDK as a module dependency.");
  process.exit(1);
}

console.log("Release artifacts validated.");
