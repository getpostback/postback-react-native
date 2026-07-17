"use strict";

import { NativePostback } from "./NativePostback";
function normalizeEventType(eventType) {
  return eventType.toLowerCase().replace(/-/g, "_");
}
const STANDARD_EVENT_TYPES = new Set(["session_start", "login", "sign_up", "register", "purchase", "subscribe", "start_trial", "add_payment_info", "add_to_cart", "add_to_wishlist", "initiate_checkout", "view_content", "view_item", "search", "share", "tutorial_complete", "achieve_level", "level_start", "level_complete", "custom"]);
function numericValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function revenueValue(params) {
  return numericValue(params?.revenue) ?? numericValue(params?.price);
}
function normalizeConfig(configOrApiKey, options = {}) {
  const config = typeof configOrApiKey === "string" ? {
    ...options,
    apiKey: configOrApiKey
  } : configOrApiKey;
  const apiUrl = config.apiUrl ?? config.endpointBaseUrl;
  return apiUrl ? {
    ...config,
    apiUrl
  } : config;
}
class PostbackSDK {
  async configure(configOrApiKey, options = {}) {
    const config = normalizeConfig(configOrApiKey, options);
    if (typeof config.apiKey !== "string" || config.apiKey.trim().length === 0) {
      throw new Error("Postback.configure requires a non-empty apiKey.");
    }
    return NativePostback.configure(config);
  }
  async sendEvent(eventType, name, params) {
    const normalizedEventType = normalizeEventType(eventType);
    const nativeEventType = STANDARD_EVENT_TYPES.has(normalizedEventType) ? normalizedEventType : "custom";
    const nativeName = nativeEventType === "custom" && normalizedEventType !== "custom" ? name ?? normalizedEventType : name ?? null;
    return NativePostback.sendEvent(nativeEventType, nativeName, revenueValue(params), params?.currency ?? null, params ?? null);
  }
  async sendTestEvent() {
    return NativePostback.sendTestEvent();
  }
  async flush() {
    await NativePostback.flush();
  }
  async clearData() {
    await NativePostback.clearData();
  }
  async setCustomerUserId(userId) {
    await NativePostback.setCustomerUserId(userId);
  }
  async refreshAttribution() {
    return NativePostback.refreshAttribution();
  }
  async enableAppleAdsAttribution() {
    return NativePostback.enableAppleAdsAttribution();
  }
  async getPostbackId() {
    return NativePostback.getPostbackId();
  }
  async getAttribution() {
    return NativePostback.getAttribution();
  }
  async getAttributionParams() {
    return NativePostback.getAttributionParams();
  }
  async isInitialized() {
    return NativePostback.isInitialized();
  }
  async isSdkDisabled() {
    return NativePostback.isSdkDisabled();
  }
  async destroy() {
    await NativePostback.destroy();
  }
}
export const Postback = new PostbackSDK();
//# sourceMappingURL=Postback.js.map