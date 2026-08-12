"use strict";

const Module = require("node:module");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const sdkCachePattern = `${path.sep}lib${path.sep}commonjs${path.sep}`;

function createSdkTestContext(options = {}) {
  const calls = [];
  const resolvedValues = options.resolvedValues ?? {};

  const nativeModule = {
    async configure(config) {
      calls.push({ method: "configure", args: [config] });
      return resolvedValues.configure ?? true;
    },
    async sendEvent(eventType, name, revenue, currency, parameters) {
      calls.push({ method: "sendEvent", args: [eventType, name, revenue, currency, parameters] });
      return resolvedValues.sendEvent ?? true;
    },
    async sendTestEvent() {
      calls.push({ method: "sendTestEvent", args: [] });
      return resolvedValues.sendTestEvent ?? { success: true, message: "ok" };
    },
    async flush() {
      calls.push({ method: "flush", args: [] });
    },
    async clearData() {
      calls.push({ method: "clearData", args: [] });
    },
    async setCustomerUserId(userId) {
      calls.push({ method: "setCustomerUserId", args: [userId] });
    },
    async refreshAttribution() {
      calls.push({ method: "refreshAttribution", args: [] });
      return resolvedValues.refreshAttribution ?? null;
    },
    async enableAppleAdsAttribution() {
      calls.push({ method: "enableAppleAdsAttribution", args: [] });
      return resolvedValues.enableAppleAdsAttribution ?? true;
    },
    async getPostbackId() {
      calls.push({ method: "getPostbackId", args: [] });
      return resolvedValues.getPostbackId ?? null;
    },
    async getAttribution() {
      calls.push({ method: "getAttribution", args: [] });
      return resolvedValues.getAttribution ?? null;
    },
    async getAttributionParams() {
      calls.push({ method: "getAttributionParams", args: [] });
      return resolvedValues.getAttributionParams ?? {};
    },
    async isInitialized() {
      calls.push({ method: "isInitialized", args: [] });
      return resolvedValues.isInitialized ?? false;
    },
    async isSdkDisabled() {
      calls.push({ method: "isSdkDisabled", args: [] });
      return resolvedValues.isSdkDisabled ?? false;
    },
    async destroy() {
      calls.push({ method: "destroy", args: [] });
    },
    async getDeviceInfo() {
      calls.push({ method: "getDeviceInfo", args: [] });
      return resolvedValues.getDeviceInfo ?? { sdkPlatform: "ios", osVersion: "18.7" };
    },
    async getWebViewUserAgent() {
      calls.push({ method: "getWebViewUserAgent", args: [] });
      return resolvedValues.getWebViewUserAgent ?? null;
    },
    async getAdServicesToken() {
      calls.push({ method: "getAdServicesToken", args: [] });
      return resolvedValues.getAdServicesToken ?? null;
    },
  };

  const reactNativeMock = {
    Platform: { OS: options.platform ?? "ios" },
    NativeModules: { PostbackModule: nativeModule },
  };

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "react-native") {
      return reactNativeMock;
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  for (const cacheKey of Object.keys(require.cache)) {
    if (cacheKey.includes(sdkCachePattern)) {
      delete require.cache[cacheKey];
    }
  }

  const sdk = require(path.join(projectRoot, "lib/commonjs/index.js"));

  function restore() {
    Module._load = originalLoad;
    for (const cacheKey of Object.keys(require.cache)) {
      if (cacheKey.includes(sdkCachePattern)) {
        delete require.cache[cacheKey];
      }
    }
  }

  return { sdk, calls, nativeModule, restore };
}

module.exports = { createSdkTestContext };
