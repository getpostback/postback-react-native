# Postback for React Native

Mobile attribution and event tracking for React Native, with native iOS and Android SDKs bundled inside. Works with bare React Native and Expo. The JS bridge is thin: it forwards calls to the same native engines as our standalone iOS and Android SDKs.

NPM package: https://www.npmjs.com/package/postback-react-native

## Requirements

- React Native 0.71 or later
- React 18 or later
- iOS 14.0 or later
- Android 7.0 (API 24) or later

## Install

```bash
npm install postback-react-native
```

or

```bash
yarn add postback-react-native
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
    "postback-react-native"
  ]
}
```

The plugin adds the Android permissions during prebuild. It does not add `NSUserTrackingUsageDescription` or any ATT configuration.

| Plugin option | Type | Description | Default |
|---|---|---|---|
| `advertisingAttributionEndpoint` | `string` | Sets `NSAdvertisingAttributionReportEndpoint`. | none |

## Configure

Call `configure` once at app startup. It returns a promise that resolves after local state is restored; install registration runs in the background:

```tsx
import { Postback } from "postback-react-native";

await Postback.configure({
  apiKey: "YOUR_API_KEY",
});
```

A typical app calls this from `App.tsx` (or `app/_layout.tsx` on Expo Router):

```tsx
import { useEffect } from "react";
import { Postback } from "postback-react-native";

export default function App() {
  useEffect(() => {
    (async () => {
      await Postback.configure({ apiKey: "YOUR_API_KEY" });
    })();
  }, []);

  return <RootNavigator />;
}
```

### Configuration options

| Option | Type | Default | What it does |
|---|---|---|---|
| `apiKey` | `string` | required | Your Postback app key. |
| `apiUrl` | `string` | `https://api.postback.sh` | Override for staging or self-hosted environments. |
| `endpointBaseUrl` | `string` | alias for `apiUrl` | Accepted for compatibility. |
| `enableAppleAdsAttribution` | `boolean` | `true` | iOS only. Fetches Apple AdServices at install time. |
| `customerUserId` | `string \| null` | `null` | Your internal user ID. Persists across launches and replays if the first send fails. |
| `autoTrackSessions` | `boolean` | `true` | Fires `session_start` on `configure()` and on foreground, debounced to one event per 30 minutes. |
| `autoRefreshAttribution` | `boolean` | `true` | Refreshes attribution from the backend on `configure()` and on foreground. |
| `isDebug` | `boolean` | `false` | Forces debug-level logging on the native side. |
| `logLevel` | `0 \| 1 \| 2 \| 3` | `2` | `0 = debug`, `1 = info`, `2 = warn`, `3 = error`. |

## Track events

```tsx
import { Postback } from "postback-react-native";

await Postback.sendEvent("login");
await Postback.sendEvent("sign_up");

await Postback.sendEvent("purchase", null, {
  revenue: 9.99,
  currency: "USD",
});

await Postback.sendEvent("custom", "onboarding_step", {
  screen: "welcome",
  step: 1,
});
```

`sendEvent` resolves to `true` once the native side has queued the event locally. It resolves to `false` when a custom event is ignored because its name is missing or invalid. The actual HTTP send happens on the next flush trigger (foreground, background, or another `sendEvent`).

### Built-in event types

`session_start`, `login`, `sign_up`, `register`, `purchase`, `subscribe`, `start_trial`, `add_payment_info`, `add_to_cart`, `add_to_wishlist`, `initiate_checkout`, `view_content`, `view_item`, `search`, `share`, `tutorial_complete`, `achieve_level`, `level_start`, `level_complete`, `custom`.

### Revenue events

Pass `revenue` (or `price` as an alias) plus `currency`. Currency is trimmed, must contain exactly three ASCII letters, and is normalized to uppercase. An invalid currency is omitted while the event still sends.

```tsx
await Postback.sendEvent("subscribe", null, {
  revenue: 4.99,
  currency: "EUR",
  plan: "monthly",
});
```

### Custom events

```tsx
await Postback.sendEvent("custom", "level_skip", { level: 12 });
```

Custom events require a `name` containing 1–255 UTF-16 code units after trimming, with no NUL (`U+0000`) characters. A custom event with a missing or invalid name is ignored. Keep the name stable so your dashboard groups it correctly.

Names on built-in events are optional; an invalid optional name is omitted while the event still sends. Events restored from an older native queue are revalidated on flush: invalid legacy custom events are dropped, while invalid legacy names on built-in events are omitted. Invalid legacy currency fields are also omitted on Android; current cross-platform calls normalize currency before queuing on either platform.

## Read attribution

Once an install registers, attribution is cached on the native side. You can read it any time:

```tsx
const attribution = await Postback.getAttribution();
const postbackId = await Postback.getPostbackId();
```

`AttributionResult.source` is one of `apple_ads`, `tracking_link`, or `organic`.

### Link RevenueCat or Superwall

For revenue webhooks, set only the `postbackId` subscriber/user attribute. Do not forward the full `getAttributionParams()` map to RevenueCat; it contains attribution details such as `source` and `isAttributed` for diagnostics and custom integrations.

```tsx
import Purchases from "react-native-purchases";

const postbackId = await Postback.getPostbackId();
if (postbackId) {
  await Purchases.setAttributes({ postbackId });
}
```

### Manual refresh

If you need the latest server-side resolution (for example after a late Apple Ads token is processed), call `refreshAttribution()`:

```tsx
const updated = await Postback.refreshAttribution();
console.log("source =", updated?.source);
```

## Privacy on iOS

Postback does not show an ATT prompt. IDFA is used only if the host app already has authorized access; Apple Ads attribution works through AdServices independently. See the [Postback Privacy Policy](https://postback.sh/privacy). Host apps remain responsible for their own privacy notices, App Store answers, and permissions.

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
- Late updates (`setCustomerUserId`, iOS Apple Ads tokens) retry automatically on the next `configure()` or foreground.

## Privacy

For Android, include advertising ID collection, device IDs, approximate location/network-derived country, device or other identifiers, app activity, and (if you set `customerUserId`) user ID in your Play Console Data safety answers.

Don't pass raw PII through `params` or `customerUserId`. Both persist to native storage for retry durability. Use hashed or opaque identifiers instead (SHA-256 of an email, RevenueCat or Superwall `app_user_id`, your internal user UUID).

## Local development

```tsx
await Postback.configure({
  apiKey: "YOUR_DEV_KEY",
  apiUrl: "http://localhost:3000",
  isDebug: true,
});
```

On Android emulator, use `http://10.0.2.2:3000` to reach the host machine's localhost.

`isDebug: true` raises native log level to `debug`. iOS logs flow into Console.app; Android logs flow into `logcat` under the `Postback` tag.

## Public API reference

### `Postback`

```tsx
import { Postback } from "postback-react-native";
```

- `configure(config)` initializes the SDK.
- `sendEvent(eventType, name?, params?)` enqueues an event.
- `flush()` drains the queue immediately.
- `refreshAttribution()` fetches the latest attribution from the backend.
- `setCustomerUserId(userId)` updates the customer user ID.
- `getAttribution()` returns the cached attribution.
- `getAttributionParams()` returns a flat attribution/debug payload for custom integrations.
- `getPostbackId()` returns the SDK install identifier.
- `enableAppleAdsAttribution()` re-enables Apple Ads at runtime on iOS; returns `false` on Android.
- `sendTestEvent()` posts a diagnostic event and resolves to `{ success, message }`. If the backend says the cached install no longer exists, the native SDK re-registers once and retries the test event once; it never loops.
- `isInitialized()` reports whether `configure()` resolved.
- `isSdkDisabled()` reports whether a rejected API key disabled the SDK.
- `clearData()` wipes local state.
- `destroy()` removes native lifecycle observers.

## Support

Issues and feature requests on the [GitHub repo](https://github.com/getpostback/postback-react-native). Direct support at support@postback.sh.

## License

MIT
