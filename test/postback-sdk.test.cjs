"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createSdkTestContext } = require("./helpers/load-sdk.cjs");

test("exports the documented public API", async () => {
  const ctx = createSdkTestContext();

  try {
    assert.ok(ctx.sdk.Postback);
    assert.equal(ctx.sdk.NativePostback, undefined);
    assert.equal(typeof ctx.sdk.Postback.configure, "function");
    assert.equal(typeof ctx.sdk.Postback.sendEvent, "function");
    assert.equal(typeof ctx.sdk.Postback.sendTestEvent, "function");
    assert.equal(typeof ctx.sdk.Postback.flush, "function");
    assert.equal(typeof ctx.sdk.Postback.clearData, "function");
    assert.equal(typeof ctx.sdk.Postback.setCustomerUserId, "function");
    assert.equal(typeof ctx.sdk.Postback.refreshAttribution, "function");
    assert.equal(typeof ctx.sdk.Postback.getPostbackId, "function");
    assert.equal(typeof ctx.sdk.Postback.getAttribution, "function");
    assert.equal(typeof ctx.sdk.Postback.getAttributionParams, "function");
    assert.equal(typeof ctx.sdk.Postback.isInitialized, "function");
    assert.equal(typeof ctx.sdk.Postback.isSdkDisabled, "function");
    assert.equal(typeof ctx.sdk.Postback.destroy, "function");
  } finally {
    ctx.restore();
  }
});

test("configure delegates to native module", async () => {
  const ctx = createSdkTestContext();

  try {
    const configured = await ctx.sdk.Postback.configure({
      apiKey: "test-key",
      isDebug: true,
      googleAdsConsent: { adUserData: "GRANTED" },
    });

    const configCall = ctx.calls.find((c) => c.method === "configure");
    assert.ok(configCall, "configure was called on native module");
    assert.equal(configured, true);
    assert.equal(configCall.args[0].apiKey, "test-key");
    assert.equal(configCall.args[0].isDebug, true);
    assert.deepEqual(configCall.args[0].googleAdsConsent, { adUserData: "GRANTED" });
    assert.equal(configCall.args[0].autoTrackSessions, undefined);
    assert.equal(configCall.args[0].autoRefreshAttribution, undefined);
  } finally {
    ctx.restore();
  }
});

test("configure accepts apiKey overload and endpointBaseUrl options", async () => {
  const ctx = createSdkTestContext();

  try {
    const configured = await ctx.sdk.Postback.configure("test-key", {
      endpointBaseUrl: "https://edge.example.com",
      isDebug: true,
      autoTrackSessions: false,
      autoRefreshAttribution: false,
    });

    const configCall = ctx.calls.find((c) => c.method === "configure");
    assert.ok(configCall, "configure was called on native module");
    assert.equal(configured, true);
    assert.equal(configCall.args[0].apiKey, "test-key");
    assert.equal(configCall.args[0].apiUrl, "https://edge.example.com");
    assert.equal(configCall.args[0].isDebug, true);
    assert.equal(configCall.args[0].autoTrackSessions, false);
    assert.equal(configCall.args[0].autoRefreshAttribution, false);
  } finally {
    ctx.restore();
  }
});

test("sendEvent delegates with correct parameters", async () => {
  const ctx = createSdkTestContext();

  try {
    const sent = await ctx.sdk.Postback.sendEvent("PURCHASE", "test_purchase", {
      revenue: 4.99,
      currency: "USD",
      source: "test",
      googleAdsConsent: { adUserData: "DENIED" },
    });

    const sendCall = ctx.calls.find((c) => c.method === "sendEvent");
    assert.ok(sendCall, "sendEvent was called on native module");
    assert.equal(sendCall.args[0], "purchase");
    assert.equal(sent, true);
    assert.equal(sendCall.args[1], "test_purchase");
    assert.equal(sendCall.args[2], 4.99);
    assert.equal(sendCall.args[3], "USD");
    assert.deepEqual(sendCall.args[4], {
      revenue: 4.99,
      currency: "USD",
      source: "test",
      googleAdsConsent: { adUserData: "DENIED" },
    });
  } finally {
    ctx.restore();
  }
});

test("sendEvent accepts price as revenue fallback", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("purchase", "checkout", {
      price: "5.50",
      currency: "EUR",
    });

    const sendCall = ctx.calls.find((c) => c.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[2], 5.5);
    assert.deepEqual(sendCall.args[4], { price: "5.50", currency: "EUR" });
  } finally {
    ctx.restore();
  }
});

test("sendEvent supports alternate event name spellings", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("ADD_PAYMENT_INFO");
    await ctx.sdk.Postback.sendEvent("achieve-level");

    const sendCalls = ctx.calls.filter((c) => c.method === "sendEvent");
    assert.equal(sendCalls[0].args[0], "add_payment_info");
    assert.equal(sendCalls[1].args[0], "achieve_level");
  } finally {
    ctx.restore();
  }
});

test("sendEvent preserves zero revenue", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("purchase", "trial_start", {
      revenue: 0,
      currency: "USD",
    });

    const sendCall = ctx.calls.find((c) => c.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[2], 0);
    assert.equal(sendCall.args[3], "USD");
  } finally {
    ctx.restore();
  }
});

test("sendEvent drops non-finite revenue before native bridge", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("purchase", "bad_number", {
      revenue: Number.NaN,
      currency: "USD",
    });
    await ctx.sdk.Postback.sendEvent("purchase", "bad_price", {
      price: Number.POSITIVE_INFINITY,
      currency: "USD",
    });

    const sendCalls = ctx.calls.filter((c) => c.method === "sendEvent");
    assert.equal(sendCalls.length, 2);
    assert.equal(sendCalls[0].args[2], null);
    assert.equal(sendCalls[1].args[2], null);
  } finally {
    ctx.restore();
  }
});

test("sendEvent falls back to price when revenue is non-finite", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("purchase", "checkout", {
      revenue: Number.NaN,
      price: "9.99",
      currency: "USD",
    });

    const sendCall = ctx.calls.find((c) => c.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[2], 9.99);
  } finally {
    ctx.restore();
  }
});

test("sendEvent preserves unknown strings as custom event names", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("purcase");

    const sendCall = ctx.calls.find((c) => c.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[0], "custom");
    assert.equal(sendCall.args[1], "purcase");
  } finally {
    ctx.restore();
  }
});

test("sendEvent ignores custom events without a valid name", async () => {
  const ctx = createSdkTestContext();

  try {
    assert.equal(await ctx.sdk.Postback.sendEvent("custom"), false);
    assert.equal(await ctx.sdk.Postback.sendEvent("CUSTOM", "   "), false);
    assert.equal(
      await ctx.sdk.Postback.sendEvent("custom", "n".repeat(256)),
      false
    );
    assert.equal(
      await ctx.sdk.Postback.sendEvent("custom", "😀".repeat(128)),
      false
    );
    assert.equal(
      await ctx.sdk.Postback.sendEvent("custom", "checkout\0complete"),
      false
    );
    assert.equal(
      ctx.calls.some((call) => call.method === "sendEvent"),
      false
    );
  } finally {
    ctx.restore();
  }
});

test("sendEvent trims valid custom names and accepts the 255 UTF-16 unit boundary", async () => {
  const ctx = createSdkTestContext();

  try {
    const boundaryName = `${"😀".repeat(127)}x`;
    assert.equal(boundaryName.length, 255);
    assert.equal(
      await ctx.sdk.Postback.sendEvent("custom", `  ${boundaryName}  `),
      true
    );

    const sendCall = ctx.calls.find((call) => call.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[0], "custom");
    assert.equal(sendCall.args[1], boundaryName);
  } finally {
    ctx.restore();
  }
});

test("sendEvent omits an invalid optional name from built-in events", async () => {
  const ctx = createSdkTestContext();

  try {
    assert.equal(
      await ctx.sdk.Postback.sendEvent("purchase", "n".repeat(256)),
      true
    );

    const sendCall = ctx.calls.find((call) => call.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[0], "purchase");
    assert.equal(sendCall.args[1], null);

    await ctx.sdk.Postback.sendEvent("login", "opened\0home");
    const loginCall = ctx.calls.find(
      (call) => call.method === "sendEvent" && call.args[0] === "login"
    );
    assert.ok(loginCall);
    assert.equal(loginCall.args[1], null);
  } finally {
    ctx.restore();
  }
});

test("sendEvent only forwards normalized three-letter ASCII currency codes", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("purchase", null, {
      revenue: 2.5,
      currency: " usd ",
    });
    await ctx.sdk.Postback.sendEvent("purchase", null, {
      revenue: 3.5,
      currency: "éur",
    });

    const sendCalls = ctx.calls.filter((call) => call.method === "sendEvent");
    assert.equal(sendCalls.length, 2);
    assert.equal(sendCalls[0].args[3], "USD");
    assert.deepEqual(sendCalls[0].args[4], {
      revenue: 2.5,
      currency: "USD",
    });
    assert.equal(sendCalls[1].args[3], null);
    assert.deepEqual(sendCalls[1].args[4], { revenue: 3.5 });
  } finally {
    ctx.restore();
  }
});

test("sendEvent handles null name and params", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.sendEvent("login");

    const sendCall = ctx.calls.find((c) => c.method === "sendEvent");
    assert.ok(sendCall);
    assert.equal(sendCall.args[0], "login");
    assert.equal(sendCall.args[1], null);
    assert.equal(sendCall.args[2], null);
    assert.equal(sendCall.args[3], null);
    assert.equal(sendCall.args[4], null);
  } finally {
    ctx.restore();
  }
});

test("getPostbackId returns value from native module", async () => {
  const ctx = createSdkTestContext({
    resolvedValues: { getPostbackId: "app_123" },
  });

  try {
    const id = await ctx.sdk.Postback.getPostbackId();
    assert.equal(id, "app_123");
  } finally {
    ctx.restore();
  }
});

test("getAttribution returns value from native module", async () => {
  const attr = {
    isAttributed: true,
    source: "tracking_link",
    matchType: "ip_user_agent",
    link: { id: "link_123", name: "Spring Campaign" },
    utmSource: "newsletter",
  };
  const ctx = createSdkTestContext({
    resolvedValues: { getAttribution: attr },
  });

  try {
    const result = await ctx.sdk.Postback.getAttribution();
    assert.deepEqual(result, attr);
  } finally {
    ctx.restore();
  }
});

test("refreshAttribution returns updated native attribution", async () => {
  const attr = {
    isAttributed: true,
    source: "apple_ads",
    matchType: "apple_ads",
    appleAds: { campaignId: "123" },
  };
  const ctx = createSdkTestContext({
    resolvedValues: { refreshAttribution: attr },
  });

  try {
    const result = await ctx.sdk.Postback.refreshAttribution();
    const call = ctx.calls.find((c) => c.method === "refreshAttribution");
    assert.ok(call);
    assert.deepEqual(result, attr);
  } finally {
    ctx.restore();
  }
});

test("getAttributionParams returns partner payload from native module", async () => {
  const params = {
    postbackId: "app_123",
    gclid: "gclid_123",
  };
  const ctx = createSdkTestContext({
    resolvedValues: { getAttributionParams: params },
  });

  try {
    const result = await ctx.sdk.Postback.getAttributionParams();
    assert.deepEqual(result, params);
  } finally {
    ctx.restore();
  }
});

test("sendTestEvent delegates to native module", async () => {
  const ctx = createSdkTestContext({
    resolvedValues: {
      sendTestEvent: { success: true, message: "Test event sent successfully." },
    },
  });

  try {
    const result = await ctx.sdk.Postback.sendTestEvent();
    assert.equal(result.success, true);
    assert.equal(result.message, "Test event sent successfully.");
  } finally {
    ctx.restore();
  }
});

test("flush delegates to native module", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.flush();
    const flushCall = ctx.calls.find((c) => c.method === "flush");
    assert.ok(flushCall, "flush was called on native module");
  } finally {
    ctx.restore();
  }
});

test("clearData delegates to native module", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.clearData();
    const clearCall = ctx.calls.find((c) => c.method === "clearData");
    assert.ok(clearCall, "clearData was called on native module");
  } finally {
    ctx.restore();
  }
});

test("setCustomerUserId delegates with userId", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.setCustomerUserId("user_456");
    const setCall = ctx.calls.find((c) => c.method === "setCustomerUserId");
    assert.ok(setCall);
    assert.equal(setCall.args[0], "user_456");
  } finally {
    ctx.restore();
  }
});

test("destroy delegates to native module and remains awaitable", async () => {
  const ctx = createSdkTestContext();

  try {
    await ctx.sdk.Postback.destroy();
    const destroyCall = ctx.calls.find((c) => c.method === "destroy");
    assert.ok(destroyCall, "destroy was called on native module");
  } finally {
    ctx.restore();
  }
});

test("configure rejects empty apiKey before calling native module", async () => {
  const ctx = createSdkTestContext();

  try {
    await assert.rejects(
      () => ctx.sdk.Postback.configure({ apiKey: "   " }),
      /non-empty apiKey/
    );
    const configCall = ctx.calls.find((c) => c.method === "configure");
    assert.equal(configCall, undefined);
  } finally {
    ctx.restore();
  }
});

test("unsupported platforms return the documented safe fallback behavior", async () => {
  const ctx = createSdkTestContext({ platform: "web" });

  try {
    assert.equal(await ctx.sdk.Postback.isInitialized(), false);
    assert.equal(await ctx.sdk.Postback.isSdkDisabled(), false);
    assert.deepEqual(await ctx.sdk.Postback.getAttributionParams(), {});
    await ctx.sdk.Postback.destroy();
  } finally {
    ctx.restore();
  }
});
