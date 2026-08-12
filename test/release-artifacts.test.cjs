"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const packageJson = require(path.join(projectRoot, "package.json"));

test("required binary artifacts are present", () => {
  const requiredPaths = [
    "android/libs/postback-sdk.aar",
    "ios/PostbackSDK.xcframework/ios-arm64/PostbackSDK.framework/PostbackSDK",
    "ios/PostbackSDK.xcframework/ios-arm64/dSYMs/PostbackSDK.framework.dSYM/Contents/Resources/DWARF/PostbackSDK",
    "ios/PostbackSDK.xcframework/ios-arm64_x86_64-simulator/PostbackSDK.framework/PostbackSDK",
    "ios/PostbackSDK.xcframework/ios-arm64_x86_64-simulator/dSYMs/PostbackSDK.framework.dSYM/Contents/Resources/DWARF/PostbackSDK",
    "app.plugin.js",
    "plugin/build/index.js",
  ];

  for (const relativePath of requiredPaths) {
    assert.equal(
      fs.existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} should exist`
    );
  }
});

test("package metadata reflects the binary-backed distribution contract", () => {
  assert.equal(packageJson["react-native"], "src/index.ts");
  assert.equal(packageJson.source, "src/index.ts");
  assert.equal(packageJson.files.includes("app.plugin.js"), true);
  assert.equal(packageJson.files.includes("src"), true);
  assert.equal(packageJson.files.includes("lib"), true);
  assert.equal(packageJson.files.includes("!lib/**/*.map"), true);
  assert.deepEqual(packageJson.expo?.plugins, ["./app.plugin.js"]);
});

test("generated TypeScript declarations keep native diagnostics internal", () => {
  const indexDeclarations = fs.readFileSync(
    path.join(projectRoot, "lib/typescript/index.d.ts"),
    "utf8"
  );
  const typeDeclarations = fs.readFileSync(
    path.join(projectRoot, "lib/typescript/types.d.ts"),
    "utf8"
  );

  assert.doesNotMatch(indexDeclarations, /NativePostback|InstallType|DeviceInfo/);
  assert.doesNotMatch(typeDeclarations, /getDeviceInfo|getWebViewUserAgent|getAdServicesToken/);
});

test("podspec resolves npm repository metadata to a CocoaPods git URL", () => {
  const podspec = fs.readFileSync(
    path.join(projectRoot, "postback-react-native.podspec"),
    "utf8"
  );

  assert.match(podspec, /repository_url = repository\.is_a\?\(Hash\) \? repository\["url"\] : repository/);
  assert.equal(
    podspec.includes('repository_url = repository_url&.sub(/^git\\+/, "")'),
    true,
    "podspec should strip npm's git+ URL prefix"
  );
  assert.match(podspec, /:git => repository_url/);
  assert.match(podspec, /:tag => "v#\{s\.version\}"/);
});

test("android permissions are packaged for consumers", () => {
  const manifest = fs.readFileSync(
    path.join(projectRoot, "android/src/main/AndroidManifest.xml"),
    "utf8"
  );
  const plugin = fs.readFileSync(
    path.join(projectRoot, "plugin/build/index.js"),
    "utf8"
  );

  assert.match(manifest, /android\.permission\.INTERNET/);
  assert.match(plugin, /android\.permission\.INTERNET/);
  assert.match(manifest, /android\.permission\.ACCESS_NETWORK_STATE/);
  assert.match(plugin, /android\.permission\.ACCESS_NETWORK_STATE/);
  assert.match(manifest, /com\.google\.android\.gms\.permission\.AD_ID/);
  assert.match(plugin, /com\.google\.android\.gms\.permission\.AD_ID/);

  assert.match(plugin, /withAndroidManifest/);
  assert.doesNotMatch(plugin, /NSUserTrackingUsageDescription/);
  assert.doesNotMatch(plugin, /trackingDescription/);
});

test("iOS package links full attribution dependencies without an ATT prompt API", () => {
  const podspec = fs.readFileSync(
    path.join(projectRoot, "postback-react-native.podspec"),
    "utf8"
  );
  const binary = fs.readFileSync(
    path.join(
      projectRoot,
      "ios/PostbackSDK.xcframework/ios-arm64/PostbackSDK.framework/PostbackSDK"
    )
  );

  assert.match(podspec, /AppTrackingTransparency/);
  assert.match(podspec, /"AdSupport"/);
  assert.match(podspec, /"CoreTelephony"/);
  assert.match(podspec, /"Metal"/);
  assert.match(podspec, /"Network"/);
  assert.match(podspec, /"WebKit"/);
  assert.match(podspec, /"Security"/);
  assert.match(podspec, /s\.weak_frameworks = "AdServices", "AppTrackingTransparency", "AdSupport", "StoreKit"/);
  for (const framework of ["AdSupport", "CoreTelephony", "Metal", "WebKit"]) {
    assert.equal(
      binary.includes(
        Buffer.from(`/System/Library/Frameworks/${framework}.framework/${framework}`)
      ),
      true,
      `release binary must link ${framework}`
    );
  }
  assert.equal(binary.includes(Buffer.from("/usr/lib/swift/libswiftNetwork.dylib")), true);
  assert.equal(binary.includes(Buffer.from("AppTrackingTransparency.framework")), true);
  assert.equal(
    binary.includes(Buffer.from("/System/Library/Frameworks/Security.framework/Security")),
    true
  );
  assert.equal(
    binary.includes(Buffer.from("/System/Library/Frameworks/StoreKit.framework/StoreKit")),
    true
  );
  assert.equal(binary.includes(Buffer.from("ATTrackingManager")), true);
  assert.equal(binary.includes(Buffer.from("requestTrackingAuthorization")), false);
});

test("iOS binary distribution does not embed a privacy manifest", () => {
  for (const slice of ["ios-arm64", "ios-arm64_x86_64-simulator"]) {
    assert.equal(
      fs.existsSync(
        path.join(
          projectRoot,
          `ios/PostbackSDK.xcframework/${slice}/PostbackSDK.framework/PrivacyInfo.xcprivacy`
        )
      ),
      false
    );
  }
});

test("iOS wrapper keeps the native signal collector out of its public bridge", () => {
  const swiftInterface = fs.readFileSync(
    path.join(
      projectRoot,
      "ios/PostbackSDK.xcframework/ios-arm64/PostbackSDK.framework/Modules/PostbackSDK.swiftmodule/arm64-apple-ios.swiftinterface"
    ),
    "utf8"
  );
  const bridge = fs.readFileSync(
    path.join(projectRoot, "ios/PostbackBridge.swift"),
    "utf8"
  );

  assert.doesNotMatch(swiftInterface, /PostbackNative|DeviceInfo|InstallType/);
  assert.doesNotMatch(bridge, /PostbackNative|getDeviceInfo|getWebViewUserAgent|getAdServicesToken/);
});

test("android wrapper declares local AAR runtime dependencies", () => {
  const gradle = fs.readFileSync(path.join(projectRoot, "android/build.gradle"), "utf8");
  const bridge = fs.readFileSync(
    path.join(projectRoot, "android/src/main/kotlin/sh/postback/PostbackBridgeModule.kt"),
    "utf8"
  );

  assert.match(gradle, /rootProject\.allprojects/);
  assert.match(gradle, /implementation\(name: 'postback-sdk', ext: 'aar'\)/);
  assert.match(gradle, /lifecycle-process:2\.10\.0/);
  assert.match(gradle, /play-services-ads-identifier:18\.3\.0/);
  assert.match(gradle, /installreferrer:installreferrer:2\.2/);
  assert.doesNotMatch(bridge, /PostbackNative|getDeviceInfo|getWebViewUserAgent|getAdServicesToken/);
});
