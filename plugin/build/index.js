"use strict";

const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

const DEFAULT_TRACKING_DESCRIPTION =
  "This identifier will be used to deliver personalized ads to you.";

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

const withPostback = (config, props) =>
  withAndroidManifest(
    withInfoPlist(config, (expoConfig) => {
      expoConfig.modResults.NSUserTrackingUsageDescription =
        props?.trackingDescription ?? DEFAULT_TRACKING_DESCRIPTION;

      if (props?.advertisingAttributionEndpoint) {
        expoConfig.modResults.NSAdvertisingAttributionReportEndpoint =
          props.advertisingAttributionEndpoint;
      }

      return expoConfig;
    }),
    (expoConfig) => {
      for (const permission of ANDROID_PERMISSIONS) {
        ensureAndroidPermission(expoConfig.modResults, permission);
      }

      return expoConfig;
    }
  );

module.exports = withPostback;
module.exports.default = withPostback;
