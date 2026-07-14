# AppSprint for React Native

Mobile attribution and event tracking for React Native, with native iOS and Android SDKs bundled inside. Works with bare React Native and Expo. The JS bridge is thin: it forwards calls to the same native engines as our standalone iOS and Android SDKs.

NPM package: https://www.npmjs.com/package/appsprint-react-native

## Requirements

- React Native 0.71 or later
- React 18 or later
- iOS 14.0 or later
- Android 7.0 (API 24) or later

## Install

```bash
npm install appsprint-react-native
```

or

```bash
yarn add appsprint-react-native
```

### iOS

```bash
cd ios && pod install
```

The native pod is vendored inside the package, so no extra repository setup is needed.

### Android

Auto-linking handles the Android side. The package's manifest declares `INTERNET`, `ACCESS_NETWORK_STATE`, and `com.google.android.gms.permission.AD_ID`, which merge into your app at build time.

### Expo

If you use Expo prebuild, add the config plugin to `app.json` or `app.config.js`:

```json
{
  "plugins": [
    [
      "appsprint-react-native",
      {
        "trackingDescription": "This identifier helps us deliver personalized ads."
      }
    ]
  ]
}
```

The plugin injects `NSUserTrackingUsageDescription` on iOS and the Android permissions during prebuild.

| Plugin option | Type | Description | Default |
|---|---|---|---|
| `trackingDescription` | `string` | Text for the ATT permission prompt. | `"This identifier will be used to deliver personalized ads to you."` |
| `advertisingAttributionEndpoint` | `string` | Sets `NSAdvertisingAttributionReportEndpoint`. | none |

## Configure

Call `configure` once at app startup. It returns a promise that resolves after local state is restored; install registration runs in the background:

```tsx
import { AppSprint } from "appsprint-react-native";

await AppSprint.configure({
  apiKey: "YOUR_API_KEY",
});
```

A typical app calls this from `App.tsx` (or `app/_layout.tsx` on Expo Router):

```tsx
import { useEffect } from "react";
import { AppSprint, NativeAppSprint } from "appsprint-react-native";

export default function App() {
  useEffect(() => {
    (async () => {
      await AppSprint.configure({ apiKey: "YOUR_API_KEY" });

      // iOS only. Skipped at runtime on Android.
      await NativeAppSprint.requestTrackingAuthorization();
    })();
  }, []);

  return <RootNavigator />;
}
```

### Configuration options

| Option | Type | Default | What it does |
|---|---|---|---|
| `apiKey` | `string` | required | Your AppSprint app key. |
| `apiUrl` | `string` | `https://api.appsprint.app` | Override for staging or self-hosted environments. |
| `endpointBaseUrl` | `string` | alias for `apiUrl` | Accepted for compatibility. |
| `enableAppleAdsAttribution` | `boolean` | `true` | iOS only. Fetches Apple AdServices at install time. |
| `customerUserId` | `string \| null` | `null` | Your internal user ID. Persists across launches and replays if the first send fails. |
| `autoTrackSessions` | `boolean` | `true` | Fires `session_start` on `configure()` and on foreground, debounced to one event per 30 minutes. |
| `autoRefreshAttribution` | `boolean` | `true` | Refreshes attribution from the backend on `configure()` and on foreground. |
| `isDebug` | `boolean` | `false` | Forces debug-level logging on the native side. |
| `logLevel` | `0 \| 1 \| 2 \| 3` | `2` | `0 = debug`, `1 = info`, `2 = warn`, `3 = error`. |

ASO integrations may continue using `AppSprintAppleAds.configure(...)`. This
facade remains iOS-only, keeps Apple Ads attribution enabled, and now also
registers organic installs, automatic sessions, and events for all iOS users.

## Track events

```tsx
import { AppSprint } from "appsprint-react-native";

await AppSprint.sendEvent("login");
await AppSprint.sendEvent("sign_up");

await AppSprint.sendEvent("purchase", null, {
  revenue: 9.99,
  currency: "USD",
});

await AppSprint.sendEvent("custom", "onboarding_step", {
  screen: "welcome",
  step: 1,
});
```

`sendEvent` resolves once the native side has queued the event locally. The actual HTTP send happens on the next flush trigger (foreground, background, or another `sendEvent`).

### Built-in event types

`session_start`, `login`, `sign_up`, `register`, `purchase`, `subscribe`, `start_trial`, `add_payment_info`, `add_to_cart`, `add_to_wishlist`, `initiate_checkout`, `view_content`, `view_item`, `search`, `share`, `tutorial_complete`, `achieve_level`, `level_start`, `level_complete`, `custom`.

### Revenue events

Pass `revenue` (or `price` as an alias) plus `currency`. Currency must be a 3-letter ISO code; anything else is dropped on the native side before the request goes out.

```tsx
await AppSprint.sendEvent("subscribe", null, {
  revenue: 4.99,
  currency: "EUR",
  plan: "monthly",
});
```

### Custom events

```tsx
await AppSprint.sendEvent("custom", "level_skip", { level: 12 });
```

Use the second argument (`name`) to label the event. Keep it stable so your dashboard groups it correctly.

## Read attribution

Once an install registers, attribution is cached on the native side. You can read it any time:

```tsx
const attribution = await AppSprint.getAttribution();
const appsprintId = await AppSprint.getAppSprintId();
```

`AttributionResult.source` is one of `apple_ads`, `tracking_link`, or `organic`.

### Link RevenueCat or Superwall

For revenue webhooks, set only the `appsprintId` subscriber/user attribute. Do not forward the full `getAttributionParams()` map to RevenueCat; it contains attribution details such as `source` and `isAttributed` for diagnostics and custom integrations.

```tsx
import Purchases from "react-native-purchases";

const appsprintId = await AppSprint.getAppSprintId();
if (appsprintId) {
  await Purchases.setAttributes({ appsprintId });
}
```

### Manual refresh

If you need the latest server-side resolution (for example after granting ATT mid-session), call `refreshAttribution()`:

```tsx
const updated = await AppSprint.refreshAttribution();
console.log("source =", updated?.source);
```

## App Tracking Transparency (iOS only)

```tsx
import { NativeAppSprint } from "appsprint-react-native";

const authorized = await NativeAppSprint.requestTrackingAuthorization();
```

The helper waits internally for the app to reach foreground-active before showing the system prompt. If you call it during initial mount, it will queue and run when the user gets to your first screen.

For bare React Native apps, add `NSUserTrackingUsageDescription` to `ios/<App>/Info.plist`. Expo users get this through the config plugin's `trackingDescription` option.

`NativeAppSprint.requestTrackingAuthorization()` resolves `true` on Android without prompting; ATT is iOS-only.

## Google Advertising ID (Android only)

The native Android SDK reads GAID during install registration, off the main thread, honoring Limit Ad Tracking and dropping the all-zero ID. If your app cannot collect advertising IDs (children's apps, regional policies), remove the permission in your host app manifest:

```xml
<manifest xmlns:tools="http://schemas.android.com/tools" ...>
    <uses-permission
        android:name="com.google.android.gms.permission.AD_ID"
        tools:node="remove" />
</manifest>
```

## What happens behind the scenes

- `configure()` resolves after local-state restore. Install registration runs in the background and retries with backoff on transient failures.
- Events queue locally on native storage and survive app restarts.
- iOS fails fast on connectivity errors and retries through the SDK queue, so blocked or offline requests surface real errors instead of sitting in an OS connectivity wait.
- A rejected API key (`401` or `403`) disables the SDK on the native side. Future events drop until `clearData()` is called.
- Late identity updates (`setCustomerUserId`, iOS Apple Ads opt-in) retry automatically on the next `configure()` or foreground.

## Privacy

The vendored iOS framework ships a `PrivacyInfo.xcprivacy` manifest declaring `UserDefaults` access plus `DeviceID`, `ProductInteraction`, `UserID`, `CoarseLocation`, and `OtherDataTypes` collection, all marked `Tracking: false`. The core AppSprint API domain is not declared as a tracking domain, so ATT denial does not block install or event delivery.

For Android, include advertising ID collection, device IDs, approximate location/network-derived country, device or other identifiers, app activity, and (if you set `customerUserId`) user ID in your Play Console Data safety answers.

Don't pass raw PII through `params` or `customerUserId`. Both persist to native storage for retry durability. Use hashed or opaque identifiers instead (SHA-256 of an email, RevenueCat or Superwall `app_user_id`, your internal user UUID).

## Local development

```tsx
await AppSprint.configure({
  apiKey: "YOUR_DEV_KEY",
  apiUrl: "http://localhost:3000",
  isDebug: true,
});
```

On Android emulator, use `http://10.0.2.2:3000` to reach the host machine's localhost.

`isDebug: true` raises native log level to `debug`. iOS logs flow into Console.app; Android logs flow into `logcat` under the `AppSprint` tag.

## Public API reference

### `AppSprint`

```tsx
import { AppSprint } from "appsprint-react-native";
```

- `configure(config)` initializes the SDK.
- `sendEvent(eventType, name?, params?)` enqueues an event.
- `flush()` drains the queue immediately.
- `refreshAttribution()` fetches the latest attribution from the backend.
- `setCustomerUserId(userId)` updates the customer user ID.
- `getAttribution()` returns the cached attribution.
- `getAttributionParams()` returns a flat attribution/debug payload for custom integrations.
- `getAppSprintId()` returns the SDK install identifier.
- `enableAppleAdsAttribution()` re-enables Apple Ads at runtime on iOS; returns `false` on Android.
- `sendTestEvent()` posts a diagnostic event and resolves to `{ success, message }`.
- `isInitialized()` reports whether `configure()` resolved.
- `isSdkDisabled()` reports whether a rejected API key disabled the SDK.
- `clearData()` wipes local state.
- `destroy()` removes native lifecycle observers.

### `NativeAppSprint`

```tsx
import { NativeAppSprint } from "appsprint-react-native";
```

- `getDeviceInfo()` returns the attribution device signal payload.
- `getAdServicesToken()` returns Apple's AdServices token on iOS; `null` on Android.
- `requestTrackingAuthorization()` shows the ATT prompt on iOS; resolves `true` on Android.

## Support

Issues and feature requests on the [GitHub repo](https://github.com/getappsprint/appsprint-react-native). Direct support at support@appsprint.app.

## License

MIT
