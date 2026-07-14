import { Platform } from "react-native";

import { AppSprint } from "./AppSprint";
import type { AttributionParams, AttributionResult } from "./types";

export interface AppSprintAppleAdsConfig {
  apiKey: string;
  apiUrl?: string;
  isDebug?: boolean;
}

function assertIos() {
  if (Platform.OS !== "ios") {
    throw new Error("AppSprintAppleAds is only supported on iOS.");
  }
}

class AppSprintAppleAdsSDK {
  async configure(config: AppSprintAppleAdsConfig): Promise<boolean> {
    assertIos();
    return AppSprint.configure({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      enableAppleAdsAttribution: true,
      isDebug: config.isDebug ?? false,
      customerUserId: null,
      autoTrackSessions: true,
      autoRefreshAttribution: false,
      eventTrackingEnabled: true,
    });
  }

  async getAppSprintId(): Promise<string | null> {
    assertIos();
    return AppSprint.getAppSprintId();
  }

  async getAttributionParams(): Promise<AttributionParams> {
    assertIos();
    return AppSprint.getAttributionParams();
  }

  async getAttribution(): Promise<AttributionResult | null> {
    assertIos();
    return AppSprint.getAttribution();
  }

  async refreshAttribution(): Promise<AttributionResult | null> {
    assertIos();
    return AppSprint.refreshAttribution();
  }
}

export const AppSprintAppleAds = new AppSprintAppleAdsSDK();
