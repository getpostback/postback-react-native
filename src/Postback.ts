import { NativePostback } from "./NativePostback";
import type {
  PostbackConfig,
  PostbackOptions,
  AttributionParams,
  AttributionResult,
  EventParams,
  EventType,
  TestEventResult,
} from "./types";

function normalizeEventType(eventType: EventType | string): string {
  return eventType.toLowerCase().replace(/-/g, "_");
}

const STANDARD_EVENT_TYPES = new Set([
  "session_start",
  "login",
  "sign_up",
  "register",
  "purchase",
  "subscribe",
  "start_trial",
  "add_payment_info",
  "add_to_cart",
  "add_to_wishlist",
  "initiate_checkout",
  "view_content",
  "view_item",
  "search",
  "share",
  "tutorial_complete",
  "achieve_level",
  "level_start",
  "level_complete",
  "custom",
]);

function numericValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function revenueValue(params?: EventParams): number | null {
  return numericValue(params?.revenue) ?? numericValue(params?.price);
}

function normalizeConfig(
  configOrApiKey: PostbackConfig | string,
  options: PostbackOptions = {}
): PostbackConfig {
  const config =
    typeof configOrApiKey === "string"
      ? { ...options, apiKey: configOrApiKey }
      : configOrApiKey;
  const apiUrl = config.apiUrl ?? config.endpointBaseUrl;
  return apiUrl ? { ...config, apiUrl } : config;
}

class PostbackSDK {
  async configure(
    configOrApiKey: PostbackConfig | string,
    options: PostbackOptions = {}
  ): Promise<boolean> {
    const config = normalizeConfig(configOrApiKey, options);
    if (typeof config.apiKey !== "string" || config.apiKey.trim().length === 0) {
      throw new Error("Postback.configure requires a non-empty apiKey.");
    }

    return NativePostback.configure(config as unknown as Record<string, unknown>);
  }

  async sendEvent(
    eventType: EventType | string,
    name?: string | null,
    params?: EventParams
  ): Promise<boolean> {
    const normalizedEventType = normalizeEventType(eventType);
    const nativeEventType = STANDARD_EVENT_TYPES.has(normalizedEventType)
      ? normalizedEventType
      : "custom";
    const nativeName =
      nativeEventType === "custom" && normalizedEventType !== "custom"
        ? name ?? normalizedEventType
        : name ?? null;

    return NativePostback.sendEvent(
      nativeEventType,
      nativeName,
      revenueValue(params),
      params?.currency ?? null,
      params ?? null
    );
  }

  async sendTestEvent(): Promise<TestEventResult> {
    return NativePostback.sendTestEvent();
  }

  async flush(): Promise<void> {
    await NativePostback.flush();
  }

  async clearData(): Promise<void> {
    await NativePostback.clearData();
  }

  async setCustomerUserId(userId: string): Promise<void> {
    await NativePostback.setCustomerUserId(userId);
  }

  async refreshAttribution(): Promise<AttributionResult | null> {
    return NativePostback.refreshAttribution();
  }

  async enableAppleAdsAttribution(): Promise<boolean> {
    return NativePostback.enableAppleAdsAttribution();
  }

  async getPostbackId(): Promise<string | null> {
    return NativePostback.getPostbackId();
  }

  async getAttribution(): Promise<AttributionResult | null> {
    return NativePostback.getAttribution();
  }

  async getAttributionParams(): Promise<AttributionParams> {
    return NativePostback.getAttributionParams();
  }

  async isInitialized(): Promise<boolean> {
    return NativePostback.isInitialized();
  }

  async isSdkDisabled(): Promise<boolean> {
    return NativePostback.isSdkDisabled();
  }

  async destroy(): Promise<void> {
    await NativePostback.destroy();
  }
}

export const Postback = new PostbackSDK();
