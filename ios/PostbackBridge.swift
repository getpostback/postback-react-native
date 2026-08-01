import Foundation
import React
import PostbackSDK

@objc(PostbackModule)
class PostbackBridge: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  // MARK: - Core SDK

  @objc func configure(_ config: NSDictionary,
                       resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    let apiKey = (config["apiKey"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    guard !apiKey.isEmpty else {
      reject("CONFIGURE_ERROR", "Postback.configure requires a non-empty apiKey.", nil)
      return
    }

    Task { @MainActor in
      let apiUrl = (config["apiUrl"] as? String) ?? (config["endpointBaseUrl"] as? String)
      let enableAppleAds = config["enableAppleAdsAttribution"] as? Bool ?? true
      let isDebug = config["isDebug"] as? Bool ?? false
      let logLevelRaw = config["logLevel"] as? Int
      let customerUserId = config["customerUserId"] as? String
      let autoTrackSessions = config["autoTrackSessions"] as? Bool ?? true
      let autoRefreshAttribution = config["autoRefreshAttribution"] as? Bool ?? true
      let eventTrackingEnabled = config["eventTrackingEnabled"] as? Bool ?? true
      let googleAdsConsent = Self.googleAdsConsent(from: config["googleAdsConsent"])

      let logLevel: PostbackLogLevel
      if let raw = logLevelRaw, let level = PostbackLogLevel(rawValue: raw) {
        logLevel = level
      } else {
        logLevel = isDebug ? .debug : .warn
      }

      var sdkConfig = PostbackConfig(
        apiKey: apiKey,
        enableAppleAdsAttribution: enableAppleAds,
        isDebug: isDebug,
        logLevel: logLevel,
        customerUserId: customerUserId,
        autoTrackSessions: autoTrackSessions,
        autoRefreshAttribution: autoRefreshAttribution,
        eventTrackingEnabled: eventTrackingEnabled,
        googleAdsConsent: googleAdsConsent
      )

      if let urlString = apiUrl, let url = URL(string: urlString) {
        sdkConfig = PostbackConfig(
          apiKey: apiKey,
          apiURL: url,
          enableAppleAdsAttribution: enableAppleAds,
          isDebug: isDebug,
          logLevel: logLevel,
          customerUserId: customerUserId,
          autoTrackSessions: autoTrackSessions,
          autoRefreshAttribution: autoRefreshAttribution,
          eventTrackingEnabled: eventTrackingEnabled,
          googleAdsConsent: googleAdsConsent
        )
      }

      await Postback.shared.configure(sdkConfig)
      resolve(true)
    }
  }

  @objc func sendEvent(_ eventType: String,
                       name: String?,
                       revenue: NSNumber?,
                       currency: String?,
                       parameters: NSDictionary?,
                       resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    let type = PostbackEventType(rawValue: eventType) ?? .custom
    let normalizedName = Self.normalizedEventName(name)
    guard type != .custom || normalizedName != nil else {
      resolve(false)
      return
    }

    Task { @MainActor in
      var params: [String: Any]? = nil
      if let parameters = parameters as? [String: Any] {
        params = parameters
      }
      let normalizedCurrency = Self.normalizedCurrency(currency ?? params?["currency"] as? String)
      params?.removeValue(forKey: "currency")
      if let rev = revenue?.doubleValue {
        if params == nil { params = [:] }
        params?["revenue"] = rev
      }
      if let cur = normalizedCurrency {
        if params == nil { params = [:] }
        params?["currency"] = cur
      }

      await Postback.shared.sendEvent(type, name: normalizedName, params: params)
      resolve(true)
    }
  }

  private static func normalizedEventName(_ name: String?) -> String? {
    guard let normalized = name?.trimmingCharacters(in: .whitespacesAndNewlines),
          !normalized.isEmpty,
          normalized.utf16.count <= 255,
          !normalized.contains("\u{0}") else {
      return nil
    }
    return normalized
  }

  private static func normalizedCurrency(_ currency: String?) -> String? {
    guard let normalized = currency?.trimmingCharacters(in: .whitespacesAndNewlines),
          normalized.utf8.count == 3,
          normalized.utf8.allSatisfy({ (65...90).contains($0) || (97...122).contains($0) }) else {
      return nil
    }
    return normalized.uppercased()
  }

  @objc func sendTestEvent(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      let result = await Postback.shared.sendTestEvent()
      resolve(["success": result.success, "message": result.message])
    }
  }

  @objc func flush(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      await Postback.shared.flush()
      resolve(nil)
    }
  }

  @objc func clearData(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      Postback.shared.clearData()
      resolve(nil)
    }
  }

  @objc func setCustomerUserId(_ userId: String,
                                resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      await Postback.shared.setCustomerUserId(userId)
      resolve(nil)
    }
  }

  @objc func refreshAttribution(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      guard let attr = await Postback.shared.refreshAttribution() else {
        resolve(NSNull())
        return
      }
      resolve(Self.attributionToDictionary(attr))
    }
  }

  @objc func enableAppleAdsAttribution(_ resolve: @escaping RCTPromiseResolveBlock,
                                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      resolve(Postback.shared.enableAppleAdsAttribution())
    }
  }

  @objc func getPostbackId(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      let id = Postback.shared.getPostbackId()
      resolve(id as Any)
    }
  }

  @objc func getAttribution(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      guard let attr = Postback.shared.getAttribution() else {
        resolve(NSNull())
        return
      }
      resolve(Self.attributionToDictionary(attr))
    }
  }

  @objc func getAttributionParams(_ resolve: @escaping RCTPromiseResolveBlock,
                                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      resolve(Postback.shared.getAttributionParams())
    }
  }

  @objc func isInitialized(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      resolve(Postback.shared.isInitialized)
    }
  }

  @objc func isSdkDisabled(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      resolve(Postback.shared.isSdkDisabled())
    }
  }

  @objc func destroy(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      Postback.shared.destroy()
      resolve(nil)
    }
  }

  // MARK: - Utility (device info, ATT)

  @objc func getDeviceInfo(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      let info = PostbackNative.getDeviceInfo()
      let sdkWebViewUserAgent: String?
      if let userAgent = info.sdkWebViewUserAgent {
        sdkWebViewUserAgent = userAgent
      } else {
        sdkWebViewUserAgent = await PostbackNative.getWebViewUserAgent()
      }
      var dict: [String: Any] = [:]
      if let m = info.deviceModel { dict["deviceModel"] = m }
      if let w = info.screenWidth { dict["screenWidth"] = w }
      if let h = info.screenHeight { dict["screenHeight"] = h }
      if let w = info.nativeScreenWidth { dict["nativeScreenWidth"] = w }
      if let h = info.nativeScreenHeight { dict["nativeScreenHeight"] = h }
      if let scale = info.screenScale { dict["screenScale"] = scale }
      if let concurrency = info.hardwareConcurrency { dict["hardwareConcurrency"] = concurrency }
      if let count = info.processorCount { dict["processorCount"] = count }
      if let touch = info.maxTouchPoints { dict["maxTouchPoints"] = touch }
      if let memory = info.memoryGb { dict["memoryGb"] = memory }
      if let lowPower = info.lowPowerMode { dict["lowPowerMode"] = lowPower }
      if let state = info.batteryState { dict["batteryState"] = state }
      if let bucket = info.batteryLevelBucket { dict["batteryLevelBucket"] = bucket }
      if let languages = info.preferredLanguages { dict["preferredLanguages"] = languages }
      if let offset = info.timezoneOffsetMinutes { dict["timezoneOffsetMinutes"] = offset }
      if let value = info.deviceManufacturer { dict["deviceManufacturer"] = value }
      if let value = info.deviceBrand { dict["deviceBrand"] = value }
      if let value = info.deviceProduct { dict["deviceProduct"] = value }
      if let value = info.deviceHardware { dict["deviceHardware"] = value }
      if let value = info.gpuVendor { dict["gpuVendor"] = value }
      if let value = info.gpuRenderer { dict["gpuRenderer"] = value }
      if let value = info.connectionType { dict["connectionType"] = value }
      if let value = info.networkType { dict["networkType"] = value }
      if let value = info.colorScheme { dict["colorScheme"] = value }
      if let value = info.carrierName { dict["carrierName"] = value }
      if let value = info.carrierCountryCode { dict["carrierCountryCode"] = value }
      if let value = info.mobileCountryCode { dict["mobileCountryCode"] = value }
      if let value = info.mobileNetworkCode { dict["mobileNetworkCode"] = value }
      if let value = info.sdkPlatform { dict["sdkPlatform"] = value }
      if let value = info.sdkVersion { dict["sdkVersion"] = value }
      if let value = sdkWebViewUserAgent { dict["sdkWebViewUserAgent"] = value }
      if let l = info.locale { dict["locale"] = l }
      if let t = info.timezone { dict["timezone"] = t }
      if let o = info.osVersion { dict["osVersion"] = o }
      if let appVersion = info.appVersion { dict["appVersion"] = appVersion }
      if let v = info.idfv { dict["idfv"] = v }
      if let a = info.idfa { dict["idfa"] = a }
      if let token = info.adServicesToken { dict["adServicesToken"] = token }
      if let attStatus = info.attStatus { dict["attStatus"] = attStatus.rawValue }
      resolve(dict)
    }
  }

  @objc func getWebViewUserAgent(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      let userAgent = await PostbackNative.getWebViewUserAgent()
      resolve(userAgent as Any)
    }
  }

  @objc func getAdServicesToken(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    let token = PostbackNative.getAdServicesToken()
    resolve(token as Any)
  }

  @objc func requestTrackingAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      let authorized = await PostbackNative.requestTrackingAuthorization()
      resolve(authorized)
    }
  }

  private static func attributionToDictionary(_ attr: AttributionResult) -> [String: Any] {
    var dict: [String: Any] = [
      "isAttributed": attr.isAttributed,
      "source": attr.source,
      "confidence": attr.confidence,
    ]
    if let matchType = attr.matchType { dict["matchType"] = matchType }
    if let campaignName = attr.campaignName { dict["campaignName"] = campaignName }
    if let link = attr.link {
      dict["link"] = ["id": link.id, "name": link.name]
    }
    if let appleAds = attr.appleAds {
      var apple: [String: Any] = ["campaignId": appleAds.campaignId]
      if let orgId = appleAds.orgId { apple["orgId"] = orgId }
      if let adGroupId = appleAds.adGroupId { apple["adGroupId"] = adGroupId }
      if let keywordId = appleAds.keywordId { apple["keywordId"] = keywordId }
      if let adId = appleAds.adId { apple["adId"] = adId }
      if let country = appleAds.countryOrRegion { apple["countryOrRegion"] = country }
      if let claimType = appleAds.claimType { apple["claimType"] = claimType }
      if let clickDate = appleAds.clickDate { apple["clickDate"] = clickDate }
      if let impressionDate = appleAds.impressionDate { apple["impressionDate"] = impressionDate }
      if let conversion = appleAds.conversionType { apple["conversionType"] = conversion }
      if let supplyPlacement = appleAds.supplyPlacement { apple["supplyPlacement"] = supplyPlacement }
      dict["appleAds"] = apple
    }
    if let utmSource = attr.utmSource { dict["utmSource"] = utmSource }
    if let utmMedium = attr.utmMedium { dict["utmMedium"] = utmMedium }
    if let utmCampaign = attr.utmCampaign { dict["utmCampaign"] = utmCampaign }
    if let utmContent = attr.utmContent { dict["utmContent"] = utmContent }
    if let utmTerm = attr.utmTerm { dict["utmTerm"] = utmTerm }
    return dict
  }

  private static func googleAdsConsent(from value: Any?) -> GoogleAdsConsent? {
    let dict: [String: Any]?
    if let typed = value as? [String: Any] {
      dict = typed
    } else if let nsDict = value as? NSDictionary {
      dict = nsDict as? [String: Any]
    } else {
      dict = nil
    }

    guard let dict, let status = googleAdsConsentStatus(from: dict["adUserData"]) else {
      return nil
    }
    return GoogleAdsConsent(adUserData: status)
  }

  private static func googleAdsConsentStatus(from value: Any?) -> GoogleAdsConsentStatus? {
    guard let raw = value as? String else {
      return nil
    }
    return GoogleAdsConsentStatus(rawValue: raw.trimmingCharacters(in: .whitespacesAndNewlines).uppercased())
  }
}
