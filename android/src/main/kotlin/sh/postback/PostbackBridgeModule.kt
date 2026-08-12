package sh.postback

import sh.postback.sdk.Postback
import sh.postback.sdk.PostbackConfig
import sh.postback.sdk.PostbackEventType
import sh.postback.sdk.AttributionResult
import sh.postback.sdk.GoogleAdsConsent
import sh.postback.sdk.GoogleAdsConsentStatus
import com.facebook.react.bridge.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class PostbackBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PostbackModule"

    @Volatile private var cachedSdk: Postback? = null
    private val bridgeExecutor: ExecutorService = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "PostbackRNBridge").apply { isDaemon = true }
    }

    private fun sdk(): Postback {
        cachedSdk?.let { return it }
        return synchronized(this) {
            cachedSdk ?: resolveSdk().also { cachedSdk = it }
        }
    }

    private fun resolveSdk(): Postback {
        val sdkClass = Postback::class.java

        runCatching {
            val shared = sdkClass.getMethod("shared", android.content.Context::class.java)
            return shared.invoke(null, reactApplicationContext) as Postback
        }

        val companion = sdkClass.getField("Companion").get(null)
        val shared = companion.javaClass.getMethod("shared", android.content.Context::class.java)
        return shared.invoke(companion, reactApplicationContext) as Postback
    }

    private fun runAsync(code: String, promise: Promise, block: () -> Unit) {
        bridgeExecutor.execute {
            try {
                block()
            } catch (t: Throwable) {
                promise.reject(code, t.message, t)
            }
        }
    }

    private fun resolveSync(code: String, promise: Promise, block: () -> Any?) {
        try {
            promise.resolve(block())
        } catch (t: Throwable) {
            promise.reject(code, t.message, t)
        }
    }

    // Core SDK

    @ReactMethod
    fun configure(config: ReadableMap, promise: Promise) {
        val apiKey = config.getString("apiKey")?.trim().orEmpty()
        if (apiKey.isEmpty()) {
            promise.reject("CONFIGURE_ERROR", "Postback.configure requires a non-empty apiKey.")
            return
        }

        runAsync("CONFIGURE_ERROR", promise) {
            val sdkConfig = PostbackConfig(
                apiKey = apiKey,
                apiUrl = when {
                    config.hasKey("apiUrl") -> config.getString("apiUrl") ?: "https://api.postback.sh"
                    config.hasKey("endpointBaseUrl") -> config.getString("endpointBaseUrl") ?: "https://api.postback.sh"
                    else -> "https://api.postback.sh"
                },
                isDebug = if (config.hasKey("isDebug")) config.getBoolean("isDebug") else false,
                logLevel = if (config.hasKey("logLevel")) config.getInt("logLevel") else if (config.hasKey("isDebug") && config.getBoolean("isDebug")) 0 else 2,
                customerUserId = if (config.hasKey("customerUserId")) config.getString("customerUserId") else null,
                autoTrackSessions = if (config.hasKey("autoTrackSessions")) config.getBoolean("autoTrackSessions") else true,
                autoRefreshAttribution = if (config.hasKey("autoRefreshAttribution")) config.getBoolean("autoRefreshAttribution") else true,
                googleAdsConsent = googleAdsConsentFrom(config),
            )
            sdk().configure(sdkConfig)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun sendEvent(eventType: String, name: String?, revenue: Double?, currency: String?, parameters: ReadableMap?, promise: Promise) {
        val type = PostbackEventType.entries.find { it.wireValue == eventType } ?: PostbackEventType.CUSTOM
        val normalizedName = normalizedEventName(name)
        if (type == PostbackEventType.CUSTOM && normalizedName == null) {
            promise.resolve(false)
            return
        }

        runAsync("SEND_EVENT_ERROR", promise) {
            val params = mutableMapOf<String, Any?>()
            parameters?.toHashMap()?.forEach { (key, value) -> params[key] = value }
            val normalizedCurrency = normalizedCurrency(currency ?: params["currency"] as? String)
            params.remove("currency")
            if (revenue != null) params["revenue"] = revenue
            if (normalizedCurrency != null) params["currency"] = normalizedCurrency
            sdk().sendEvent(type, normalizedName, if (params.isNotEmpty()) params else null)
            promise.resolve(true)
        }
    }

    private fun normalizedEventName(name: String?): String? {
        val normalized = name?.trim()
        return normalized?.takeIf {
            it.isNotEmpty() && it.length <= MAX_EVENT_NAME_LENGTH && '\u0000' !in it
        }
    }

    private fun normalizedCurrency(currency: String?): String? {
        val normalized = currency?.trim() ?: return null
        if (normalized.length != 3 || normalized.any { it !in 'A'..'Z' && it !in 'a'..'z' }) {
            return null
        }
        return normalized.uppercase(java.util.Locale.US)
    }

    @ReactMethod
    fun sendTestEvent(promise: Promise) {
        runAsync("TEST_EVENT_ERROR", promise) {
            val result = sdk().sendTestEvent()
            val map = Arguments.createMap()
            map.putBoolean("success", result.success)
            map.putString("message", result.message)
            promise.resolve(map)
        }
    }

    @ReactMethod
    fun flush(promise: Promise) {
        runAsync("FLUSH_ERROR", promise) {
            sdk().flush()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun clearData(promise: Promise) {
        runAsync("CLEAR_DATA_ERROR", promise) {
            sdk().clearData()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun setCustomerUserId(userId: String, promise: Promise) {
        runAsync("SET_USER_ID_ERROR", promise) {
            sdk().setCustomerUserId(userId)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun refreshAttribution(promise: Promise) {
        runAsync("REFRESH_ATTRIBUTION_ERROR", promise) {
            promise.resolve(sdk().refreshAttribution()?.let { attributionToMap(it) })
        }
    }

    @ReactMethod
    fun enableAppleAdsAttribution(promise: Promise) {
        promise.resolve(false)
    }

    @ReactMethod
    fun getPostbackId(promise: Promise) {
        resolveSync("GET_POSTBACK_ID_ERROR", promise) { sdk().getPostbackId() }
    }

    @ReactMethod
    fun getAttribution(promise: Promise) {
        resolveSync("GET_ATTRIBUTION_ERROR", promise) {
            sdk().getAttribution()?.let { attributionToMap(it) }
        }
    }

    @ReactMethod
    fun getAttributionParams(promise: Promise) {
        resolveSync("GET_ATTRIBUTION_PARAMS_ERROR", promise) {
            val map = Arguments.createMap()
            sdk().getAttributionParams().forEach { (key, value) -> map.putString(key, value) }
            map
        }
    }

    private fun attributionToMap(attr: AttributionResult): WritableMap {
        val map = Arguments.createMap()
        map.putBoolean("isAttributed", attr.isAttributed)
        map.putString("source", attr.source)
        map.putDouble("confidence", attr.confidence)
        attr.matchType?.let { map.putString("matchType", it) }
        attr.campaignName?.let { map.putString("campaignName", it) }
        attr.link?.let {
            val link = Arguments.createMap()
            link.putString("id", it.id)
            link.putString("name", it.name)
            map.putMap("link", link)
        }
        attr.appleAds?.let {
            val appleAds = Arguments.createMap()
            appleAds.putString("campaignId", it.campaignId)
            it.orgId?.let { value -> appleAds.putString("orgId", value) }
            it.adGroupId?.let { value -> appleAds.putString("adGroupId", value) }
            it.keywordId?.let { value -> appleAds.putString("keywordId", value) }
            it.adId?.let { value -> appleAds.putString("adId", value) }
            it.countryOrRegion?.let { value -> appleAds.putString("countryOrRegion", value) }
            it.claimType?.let { value -> appleAds.putString("claimType", value) }
            it.clickDate?.let { value -> appleAds.putString("clickDate", value) }
            it.impressionDate?.let { value -> appleAds.putString("impressionDate", value) }
            it.conversionType?.let { value -> appleAds.putString("conversionType", value) }
            it.supplyPlacement?.let { value -> appleAds.putString("supplyPlacement", value) }
            map.putMap("appleAds", appleAds)
        }
        attr.utmSource?.let { map.putString("utmSource", it) }
        attr.utmMedium?.let { map.putString("utmMedium", it) }
        attr.utmCampaign?.let { map.putString("utmCampaign", it) }
        attr.utmContent?.let { map.putString("utmContent", it) }
        attr.utmTerm?.let { map.putString("utmTerm", it) }
        return map
    }

    private fun googleAdsConsentFrom(config: ReadableMap): GoogleAdsConsent? {
        if (!config.hasKey("googleAdsConsent") || config.isNull("googleAdsConsent")) return null
        val consent = config.getMap("googleAdsConsent") ?: return null
        if (!consent.hasKey("adUserData") || consent.isNull("adUserData")) return null
        if (consent.getType("adUserData") != ReadableType.String) return null
        return googleAdsConsentStatus(consent.getString("adUserData"))
            ?.let { GoogleAdsConsent(it) }
    }

    private fun googleAdsConsentStatus(value: String?): GoogleAdsConsentStatus? {
        val normalized = value?.trim()?.uppercase(java.util.Locale.US) ?: return null
        return GoogleAdsConsentStatus.entries.firstOrNull {
            it.wireValue == normalized || it.name == normalized
        }
    }

    @ReactMethod
    fun isInitialized(promise: Promise) {
        resolveSync("IS_INITIALIZED_ERROR", promise) { sdk().isInitialized() }
    }

    @ReactMethod
    fun isSdkDisabled(promise: Promise) {
        resolveSync("SDK_DISABLED_ERROR", promise) { sdk().isSdkDisabled() }
    }

    @ReactMethod
    fun destroy(promise: Promise) {
        runAsync("DESTROY_ERROR", promise) {
            sdk().destroy()
            promise.resolve(null)
        }
    }

    override fun invalidate() {
        bridgeExecutor.shutdown()
        super.invalidate()
    }

    private companion object {
        const val MAX_EVENT_NAME_LENGTH = 255
    }
}
