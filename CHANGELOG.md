# Changelog

All notable changes to the Postback React Native SDK are documented here.

## Unreleased

### Changed

- Restored the iOS device and browser signal bundle in install payloads and `getDeviceInfo()`, including connection/network type, the WebView user agent, and opportunistic IDFA/IDFV values when the OS already makes them available. The SDK does not request ATT permission and does not collect carrier/SIM metadata on iOS; those fields remain available on Android.
- Added iOS install lifecycle classification plus VPN, Low Data Mode, and expensive-network diagnostics to `getDeviceInfo()` and the native install payload. The fields remain optional for Android compatibility.

## 1.0.2 - 2026-08-04

### Changed

- Removed the iOS ATT request helper, IDFA/IDFV bridge fields, and Expo tracking-usage-description injection.
- Vendored the privacy-safe Postback iOS SDK while retaining Apple Ads attribution through AdServices.

## 1.0.1 - 2026-08-01

### Fixed

- Align custom event names and currency validation with the native SDKs and Edge contract.

## 1.0.0 - 2026-07-17

### Added

- Initial Postback React Native release with install attribution, event tracking, Expo configuration support, and bundled Postback 1.0.0 native SDKs.
