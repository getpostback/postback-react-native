import {
  ConfigPlugin,
  withAndroidManifest,
  withInfoPlist,
} from "@expo/config-plugins";

type AndroidManifest = {
  manifest: {
    "uses-permission"?: Array<{
      $?: {
        "android:name"?: string;
      };
    }>;
  };
};

const ANDROID_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "com.google.android.gms.permission.AD_ID",
];

function ensureAndroidPermission(
  androidManifest: AndroidManifest,
  permissionName: string
) {
  const permissions = androidManifest.manifest["uses-permission"] ?? [];
  const alreadyDeclared = permissions.some(
    (permission) => permission.$?.["android:name"] === permissionName
  );

  if (!alreadyDeclared) {
    permissions.push({ $: { "android:name": permissionName } });
  }

  androidManifest.manifest["uses-permission"] = permissions;
}

const withPostback: ConfigPlugin<{
  trackingDescription?: string;
  advertisingAttributionEndpoint?: string;
} | void> = (config, props) => {
  const description =
    props?.trackingDescription ??
    "This identifier will be used to deliver personalized ads to you.";

  config = withInfoPlist(config, (config) => {
    // Add ATT usage description
    config.modResults.NSUserTrackingUsageDescription = description;

    // Add advertising attribution report endpoint
    if (props?.advertisingAttributionEndpoint) {
      config.modResults.NSAdvertisingAttributionReportEndpoint =
        props.advertisingAttributionEndpoint;
    }

    return config;
  });

  config = withAndroidManifest(config, (config) => {
    for (const permission of ANDROID_PERMISSIONS) {
      ensureAndroidPermission(config.modResults as AndroidManifest, permission);
    }

    return config;
  });

  return config;
};

export default withPostback;
