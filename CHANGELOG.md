# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.1.14 - 2026-07-14

### Changed
- The iOS-only `AppSprintAppleAds` facade now registers all installs and enables automatic session and event tracking, so ASO keys collect first-party analytics for organic users as well as Apple Ads users.
- Updates the vendored iOS SDK to v1.1.11 with API-key scope isolation and compile-time macOS exclusion for the ASO facade.

## 1.1.13 - 2026-07-01

### Fixed
- Updates the vendored iOS SDK to v1.1.10 so AppSprintSDK dSYMs are included for App Store Connect upload validation.

## 1.1.12 - 2026-06-24

### Fixed
- Updates the vendored Android SDK to v1.1.4 so optional cellular-network subtype probes cannot crash startup on newer Android versions that deny telephony access.

## 1.1.11 - 2026-06-19

### Changed
- Updates the vendored native SDKs to iOS v1.1.9 and Android v1.1.3 so attribution params use `appsprintId` only.
- Removes legacy competitor-name fixtures from SDK tests and comments.

## 1.1.10 - 2026-06-15

### Added
- Adds `AppSprintAppleAds`, an iOS-only Apple Ads ROAS facade that configures the native SDK with Apple Ads attribution enabled and event/session tracking disabled.
- Throws a clear unsupported-platform error when the Apple Ads facade is called on Android.

### Changed
- Updates the vendored iOS SDK to v1.1.8.

## 1.1.9 - 2026-05-21

### Fixed
- Updated the vendored iOS SDK to v1.1.7 so the core AppSprint API is no longer declared as an iOS tracking domain and ATT denial cannot block install or event delivery.
- iOS connectivity failures now fail fast and retry through the SDK queue instead of hanging behind `waitsForConnectivity`.

## 1.1.8 - 2026-05-19

### Fixed
- Updated the vendored iOS SDK to v1.1.6 so iOS install registration treats the retained WKWebView user-agent as a critical attribution signal and defers early attempts while WebKit is still unavailable.

## 1.1.7 - 2026-05-19

### Fixed
- Updated the vendored iOS SDK to v1.1.5 for SDK WebView user-agent and nested diagnostic payload fixes.

## 1.1.6 - 2026-05-19

### Fixed
- Updated the vendored iOS SDK to v1.1.4 so install registration reliably includes the SDK WebView user-agent during app launch.

## 1.1.5 - 2026-05-18

### Added
- Updated vendored native SDKs to iOS v1.1.3 and Android v1.1.2.
- Exposes `sdkWebViewUserAgent` through `getDeviceInfo()` and adds a direct `getWebViewUserAgent()` diagnostic helper.

## 1.1.4 - 2026-05-18

### Added
- Updated vendored native SDKs to iOS v1.1.2 and Android v1.1.1.
- Exposes the native `colorScheme` diagnostic field through `getDeviceInfo()`.

## 1.1.3 - 2026-05-17

### Changed
- Simplified public release notes for the latest iOS attribution update.

## 1.1.2 - 2026-05-17

### Fixed
- Tightened iOS CocoaPods metadata for the vendored AppSprintSDK binary.

## 1.1.1 - 2026-05-17

### Added
- Updated the vendored iOS SDK to v1.1.1 with reliability improvements for iOS attribution payloads.

## 1.1.0 - 2026-05-17

### Added
- Updated vendored native SDKs to iOS v1.1.0 and Android v1.1.0.
- Exposed additional platform-safe `getDeviceInfo()` fields for attribution quality and rollout debugging.

## 1.0.4 - 2026-05-12

### Fixed
- Fixed the iOS podspec source metadata so CocoaPods receives a string git URL instead of npm's repository object.
- Stripped npm's `git+` repository URL prefix and aligned the podspec tag with `v*` release tags.

## 1.0.3 - 2026-05-12

### Changed
- Updated the release workflow for npm Trusted Publishing with a current Node/npm toolchain.
- Switched install instructions to the public npm package.
- Normalized repository metadata for npm provenance.

## 1.0.2 - 2026-05-11

### Changed
- Release workflow temporarily treated GitHub tags as the distribution path before npm publishing was enabled in 1.0.3.
- Temporary install instructions pointed to the GitHub `v1.0.2` tag.

## 1.0.1 - 2026-05-11

### Added
- Google Ads consent configuration and event payload parity.
- Full Apple Ads attribution fields exposed through the bridge.

### Fixed
- Updated vendored native binaries with iOS v1.0.1 and Android v1.0.2.
- Completed `getDeviceInfo()` parity for app version, GAID, IDFV/IDFA, AdServices token, and ATT status where platform-available.
- Replaced per-call Android bridge threads with a bounded bridge executor.
- Pointed temporary install instructions at the GitHub `v1.0.1` tag before npm publishing was enabled.

## 1.0.0 - 2026-05-11

### Added
- Updated vendored iOS and Android SDKs to 1.0.0.
- Added `autoTrackSessions` and `autoRefreshAttribution` configuration.
- Added `refreshAttribution()` for manual attribution refresh parity.

## 0.2.0 - 2026-04-13

### Added
- TypeScript bridge to native iOS and Android SDKs
- Full public API: configure, sendEvent, flush, getAttribution, etc.
- Expo config plugin for ATT permission
- Prepack validation for vendored binaries
- CI/CD workflows (typecheck, test)
- Vendored iOS XCFramework and Android AAR

## 0.1.0

### Added
- Initial SDK scaffold with React Native builder-bob
