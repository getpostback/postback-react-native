import { NativeModules, Platform } from "react-native";
import type { NativePostbackModule } from "./types";

const LINKING_ERROR =
  "The package 'postback-react-native' doesn't seem to be linked. " +
  "Make sure you have run 'pod install' and rebuilt the app.";

const unsupportedPlatformModule: NativePostbackModule = {
  async configure() {
    return false;
  },
  async sendEvent() {
    return false;
  },
  async sendTestEvent() {
    return { success: false, message: "Unsupported platform" };
  },
  async flush() {},
  async clearData() {},
  async setCustomerUserId() {},
  async refreshAttribution() {
    return null;
  },
  async enableAppleAdsAttribution() {
    return false;
  },
  async getPostbackId() {
    return null;
  },
  async getAttribution() {
    return null;
  },
  async getAttributionParams() {
    return {};
  },
  async isInitialized() {
    return false;
  },
  async isSdkDisabled() {
    return false;
  },
  async destroy() {},
  async getDeviceInfo() {
    return {};
  },
  async getWebViewUserAgent() {
    return null;
  },
  async getAdServicesToken() {
    return null;
  },
  async requestTrackingAuthorization() {
    return false;
  },
};

const NativePostback: NativePostbackModule =
  Platform.OS === "ios" || Platform.OS === "android"
    ? NativeModules.PostbackModule ??
      new Proxy({} as NativePostbackModule, {
        get() {
          throw new Error(LINKING_ERROR);
        },
      })
    : unsupportedPlatformModule;

export { NativePostback };
