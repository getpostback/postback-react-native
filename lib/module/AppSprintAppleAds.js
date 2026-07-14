"use strict";

import { Platform } from "react-native";
import { AppSprint } from "./AppSprint";
function assertIos() {
  if (Platform.OS !== "ios") {
    throw new Error("AppSprintAppleAds is only supported on iOS.");
  }
}
class AppSprintAppleAdsSDK {
  async configure(config) {
    assertIos();
    return AppSprint.configure({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      enableAppleAdsAttribution: true,
      isDebug: config.isDebug ?? false,
      customerUserId: null,
      autoTrackSessions: true,
      autoRefreshAttribution: false,
      eventTrackingEnabled: true
    });
  }
  async getAppSprintId() {
    assertIos();
    return AppSprint.getAppSprintId();
  }
  async getAttributionParams() {
    assertIos();
    return AppSprint.getAttributionParams();
  }
  async getAttribution() {
    assertIos();
    return AppSprint.getAttribution();
  }
  async refreshAttribution() {
    assertIos();
    return AppSprint.refreshAttribution();
  }
}
export const AppSprintAppleAds = new AppSprintAppleAdsSDK();
//# sourceMappingURL=AppSprintAppleAds.js.map