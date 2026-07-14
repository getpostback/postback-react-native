"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppSprintAppleAds = void 0;
var _reactNative = require("react-native");
var _AppSprint = require("./AppSprint");
function assertIos() {
  if (_reactNative.Platform.OS !== "ios") {
    throw new Error("AppSprintAppleAds is only supported on iOS.");
  }
}
class AppSprintAppleAdsSDK {
  async configure(config) {
    assertIos();
    return _AppSprint.AppSprint.configure({
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
    return _AppSprint.AppSprint.getAppSprintId();
  }
  async getAttributionParams() {
    assertIos();
    return _AppSprint.AppSprint.getAttributionParams();
  }
  async getAttribution() {
    assertIos();
    return _AppSprint.AppSprint.getAttribution();
  }
  async refreshAttribution() {
    assertIos();
    return _AppSprint.AppSprint.refreshAttribution();
  }
}
const AppSprintAppleAds = exports.AppSprintAppleAds = new AppSprintAppleAdsSDK();
//# sourceMappingURL=AppSprintAppleAds.js.map