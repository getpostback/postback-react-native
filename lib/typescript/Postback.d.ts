import type { PostbackConfig, PostbackOptions, AttributionParams, AttributionResult, EventParams, EventType, TestEventResult } from "./types";
declare class PostbackSDK {
    configure(configOrApiKey: PostbackConfig | string, options?: PostbackOptions): Promise<boolean>;
    sendEvent(eventType: EventType | string, name?: string | null, params?: EventParams): Promise<boolean>;
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
}
export declare const Postback: PostbackSDK;
export {};
//# sourceMappingURL=Postback.d.ts.map