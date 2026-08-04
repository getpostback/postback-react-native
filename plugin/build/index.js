"use strict";

const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

const ANDROID_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "com.google.android.gms.permission.AD_ID",
];

function ensureAndroidPermission(androidManifest, permissionName) {
  const permissions = androidManifest.manifest["uses-permission"] ?? [];
  const alreadyDeclared = permissions.some(
    (permission) => permission.$?.["android:name"] === permissionName
  );

  if (!alreadyDeclared) {
    permissions.push({ $: { "android:name": permissionName } });
  }

  androidManifest.manifest["uses-permission"] = permissions;
}

const withPostback = (config, props) => {
  if (props?.advertisingAttributionEndpoint) {
    config = withInfoPlist(config, (expoConfig) => {
      if (props?.advertisingAttributionEndpoint) {
        expoConfig.modResults.NSAdvertisingAttributionReportEndpoint =
          props.advertisingAttributionEndpoint;
      }

      return expoConfig;
    });
  }

  return withAndroidManifest(config, (expoConfig) => {
    for (const permission of ANDROID_PERMISSIONS) {
      ensureAndroidPermission(expoConfig.modResults, permission);
    }

    return expoConfig;
  });
};

module.exports = withPostback;
module.exports.default = withPostback;
