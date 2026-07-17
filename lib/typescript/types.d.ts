export interface PostbackConfig {
    apiKey: string;
    apiUrl?: string;
    endpointBaseUrl?: string;
    enableAppleAdsAttribution?: boolean;
    isDebug?: boolean;
    logLevel?: 0 | 1 | 2 | 3;
    customerUserId?: string | null;
    autoTrackSessions?: boolean;
    autoRefreshAttribution?: boolean;
    eventTrackingEnabled?: boolean;
    googleAdsConsent?: GoogleAdsConsent | null;
}
export type PostbackOptions = Omit<PostbackConfig, "apiKey">;
export type LogLevel = 0 | 1 | 2 | 3;
export type EventType = "session_start" | "SESSION_START" | "login" | "LOGIN" | "sign_up" | "SIGN_UP" | "register" | "REGISTER" | "purchase" | "PURCHASE" | "subscribe" | "SUBSCRIBE" | "start_trial" | "START_TRIAL" | "add_payment_info" | "ADD_PAYMENT_INFO" | "add_to_cart" | "ADD_TO_CART" | "add_to_wishlist" | "ADD_TO_WISHLIST" | "initiate_checkout" | "INITIATE_CHECKOUT" | "view_content" | "VIEW_CONTENT" | "view_item" | "VIEW_ITEM" | "search" | "SEARCH" | "share" | "SHARE" | "tutorial_complete" | "TUTORIAL_COMPLETE" | "achieve_level" | "ACHIEVE_LEVEL" | "level_start" | "LEVEL_START" | "level_complete" | "LEVEL_COMPLETE" | "custom" | "CUSTOM";
export type GoogleAdsConsentStatus = "GRANTED" | "DENIED" | "UNSPECIFIED" | "granted" | "denied" | "unspecified";
export interface GoogleAdsConsent {
    adUserData: GoogleAdsConsentStatus;
}
export interface EventParams {
    revenue?: number;
    price?: number | string;
    currency?: string;
    googleAdsConsent?: GoogleAdsConsent | null;
    googleAdsAdUserDataConsent?: GoogleAdsConsentStatus;
    email?: string;
    name?: string;
    phone_number?: string;
    date_of_birth?: string;
    [key: string]: unknown;
}
export type AttributionParams = Record<string, string>;
export interface AttributionLink {
    id: string;
    name: string;
}
export interface AppleAdsAttribution {
    campaignId: string;
    orgId?: string | null;
    adGroupId?: string | null;
    keywordId?: string | null;
    adId?: string | null;
    countryOrRegion?: string | null;
    claimType?: string | null;
    clickDate?: string | null;
    impressionDate?: string | null;
    conversionType?: string | null;
    supplyPlacement?: string | null;
}
export interface AttributionResult {
    isAttributed?: boolean;
    source?: "tracking_link" | "apple_ads" | "organic" | "fingerprint" | string;
    matchType?: "idfa" | "idfv" | "ip_user_agent" | "apple_ads" | "organic" | string;
    link?: AttributionLink | null;
    appleAds?: AppleAdsAttribution | null;
    confidence?: number;
    campaignName?: string | null;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string | null;
    utmTerm?: string | null;
}
export interface InstallResponse {
    postbackId: string;
    attribution: AttributionResult;
    attributionParams?: AttributionParams;
}
export interface TestEventResult {
    success: boolean;
    message: string;
}
export interface DeviceInfo {
    deviceModel?: string;
    screenWidth?: number;
    screenHeight?: number;
    nativeScreenWidth?: number;
    nativeScreenHeight?: number;
    screenScale?: number;
    hardwareConcurrency?: number;
    processorCount?: number;
    maxTouchPoints?: number;
    memoryGb?: number;
    lowPowerMode?: boolean;
    batteryState?: string;
    batteryLevelBucket?: string;
    preferredLanguages?: string[];
    timezoneOffsetMinutes?: number;
    deviceManufacturer?: string;
    deviceBrand?: string;
    deviceProduct?: string;
    deviceHardware?: string;
    gpuVendor?: string;
    gpuRenderer?: string;
    connectionType?: string;
    networkType?: string;
    colorScheme?: "light" | "dark";
    carrierName?: string;
    carrierCountryCode?: string;
    mobileCountryCode?: string;
    mobileNetworkCode?: string;
    sdkPlatform?: string;
    sdkVersion?: string;
    sdkWebViewUserAgent?: string;
    locale?: string;
    timezone?: string;
    osVersion?: string;
    appVersion?: string;
    gaid?: string;
    idfv?: string;
    idfa?: string;
    adServicesToken?: string;
    attStatus?: "not_determined" | "restricted" | "denied" | "authorized";
}
export interface NativePostbackModule {
    configure(config: Record<string, unknown>): Promise<boolean>;
    sendEvent(eventType: string, name: string | null, revenue: number | null, currency: string | null, parameters: Record<string, unknown> | null): Promise<boolean>;
    sendTestEvent(): Promise<TestEventResult>;
    flush(): Promise<void>;
    clearData(): Promise<void>;
    setCustomerUserId(userId: string): Promise<void>;
    refreshAttribution(): Promise<AttributionResult | null>;
    enableAppleAdsAttribution(): Promise<boolean>;
    getPostbackId(): Promise<string | null>;
    getAttribution(): Promise<AttributionResult | null>;
    getAttributionParams(): Promise<AttributionParams>;
    isInitialized(): Promise<boolean>;
    isSdkDisabled(): Promise<boolean>;
    destroy(): Promise<void>;
    getDeviceInfo(): Promise<DeviceInfo>;
    getWebViewUserAgent?(): Promise<string | null>;
    getAdServicesToken(): Promise<string | null>;
    requestTrackingAuthorization(): Promise<boolean>;
}
//# sourceMappingURL=types.d.ts.map