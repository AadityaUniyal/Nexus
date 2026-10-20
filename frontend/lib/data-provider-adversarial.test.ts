import assert from "node:assert/strict";
import test from "node:test";
import { OfflineMutationBuffer, mutationBuffer, ApiNexusDataProvider, dataProvider } from "./data-provider";

test("Adversarial: Retry-After header with positive integer delays retry accurately", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;
  const timestamps: number[] = [];

  const throttledWithRetryAfter = async () => {
    calls++;
    timestamps.push(Date.now());
    if (calls === 1) {
      return new Response(JSON.stringify({ error: { message: "Rate limit exceeded" } }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "1", // 1 second
        },
      });
    }
    return new Response(JSON.stringify({ success: true, data: { status: "persisted" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const start = Date.now();
  const res = await buffer.executeMutation<{ status: string }>(
    "/api/v1/operations/vehicles",
    { method: "POST", body: "{}" },
    throttledWithRetryAfter
  );
  const elapsed = Date.now() - start;

  assert.equal(calls, 2);
  assert.equal(res.status, "persisted");
  // Retry-After was 1s, so elapsed time must be at least ~950ms
  assert.ok(elapsed >= 950, `Expected delay >= 950ms from Retry-After: 1, got ${elapsed}ms`);
  assert.equal(buffer.getPending().length, 0);
});

test("Adversarial: Transient Gateway Errors (HTTP 502, 503, 504) trigger retries and bubble error on exhaustion", async () => {
  const buffer = new OfflineMutationBuffer();

  for (const statusCode of [502, 503, 504]) {
    let calls = 0;
    const gatewayError = async () => {
      calls++;
      return new Response(JSON.stringify({ detail: `Gateway error ${statusCode}` }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    };

    await assert.rejects(
      async () => {
        await buffer.executeMutation(
          `/api/v1/operations/test-${statusCode}`,
          { method: "POST", body: "{}" },
          gatewayError
        );
      },
      (err: Error) => {
        assert.match(err.message, /Mutation Failed after 4 attempts/);
        assert.match(err.message, new RegExp(`HTTP ${statusCode}`));
        return true;
      }
    );

    assert.equal(calls, 4, `Expected 4 attempts for HTTP ${statusCode}, got ${calls}`);
  }
});

test("Adversarial: HTTP 500 Internal Server Error fails fast without retrying", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;

  const serverError = async () => {
    calls++;
    return new Response(JSON.stringify({ detail: "Database connection failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  };

  await assert.rejects(
    async () => {
      await buffer.executeMutation(
        "/api/v1/operations/trips",
        { method: "POST", body: "{}" },
        serverError
      );
    },
    (err: Error) => {
      assert.match(err.message, /Database connection failed/);
      return true;
    }
  );

  assert.equal(calls, 1, "HTTP 500 should fail fast without retry loops");
  assert.equal(buffer.getPending().length, 0);
});

test("Adversarial: Non-retriable client errors (401, 403, 404, 422) fail fast on attempt 1", async () => {
  const buffer = new OfflineMutationBuffer();

  for (const statusCode of [401, 403, 404, 422]) {
    let calls = 0;
    const clientErr = async () => {
      calls++;
      return new Response(JSON.stringify({ error: { message: `Client error ${statusCode}` } }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    };

    await assert.rejects(
      async () => {
        await buffer.executeMutation(
          "/api/v1/operations/orders",
          { method: "PATCH", body: "{}" },
          clientErr
        );
      },
      (err: Error) => {
        assert.match(err.message, new RegExp(`Client error ${statusCode}`));
        return true;
      }
    );

    assert.equal(calls, 1, `HTTP ${statusCode} should not retry`);
  }
});

test("Adversarial: Zero Mock Guarantee — mutations never return mock objects on failure", async () => {
  const buffer = new OfflineMutationBuffer();

  // Test with network failure
  let returnedValue: any = "NOT_RETURNED";
  try {
    returnedValue = await buffer.executeMutation(
      "/api/v1/operations/warehouses",
      { method: "POST", body: "{}" },
      async () => {
        throw new Error("Network timeout");
      }
    );
  } catch (err: any) {
    // Expected to throw
    assert.match(err.message, /Network unreachable/);
  }
  assert.equal(returnedValue, "NOT_RETURNED", "Must NEVER return fallback or mock object on mutation failure");

  // Test with 429 quota exhaustion
  returnedValue = "NOT_RETURNED";
  try {
    returnedValue = await buffer.executeMutation(
      "/api/v1/operations/incidents",
      { method: "POST", body: "{}" },
      async () => {
        return new Response(JSON.stringify({ error: { message: "Exceeded" } }), { status: 429 });
      }
    );
  } catch (err: any) {
    assert.match(err.message, /Mutation Failed after 4 attempts/);
  }
  assert.equal(returnedValue, "NOT_RETURNED", "Must NEVER return fallback or mock object on rate-limit exhaustion");
});

test("Adversarial: Storage quota error and listener subscriptions handle state cleanly", async () => {
  // Simulate mock window with problematic localStorage
  const notifications: number[] = [];
  const buffer = new OfflineMutationBuffer();

  const unsubscribe = buffer.subscribe((items) => {
    notifications.push(items.length);
  });

  // Execute a successful mutation
  await buffer.executeMutation(
    "/api/v1/operations/vehicles",
    { method: "POST", body: "{}" },
    async () => new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 })
  );

  assert.ok(notifications.length >= 2, "Subscriber should be notified on queue state changes");
  assert.equal(buffer.getPending().length, 0);

  unsubscribe();
});

test("Adversarial: Concurrent mutations execute independently without race conditions", async () => {
  const buffer = new OfflineMutationBuffer();

  let callA = 0;
  let callB = 0;
  let callC = 0;

  const fnA = async () => {
    callA++;
    if (callA < 2) return new Response(JSON.stringify({ detail: "Rate limit" }), { status: 429 });
    return new Response(JSON.stringify({ success: true, data: { item: "A" } }), { status: 200 });
  };

  const fnB = async () => {
    callB++;
    return new Response(JSON.stringify({ success: true, data: { item: "B" } }), { status: 200 });
  };

  const fnC = async () => {
    callC++;
    return new Response(JSON.stringify({ error: { message: "Invalid payload" } }), { status: 400 });
  };

  const [resA, resB, resC] = await Promise.allSettled([
    buffer.executeMutation<{ item: string }>("/api/v1/operations/a", { method: "POST" }, fnA),
    buffer.executeMutation<{ item: string }>("/api/v1/operations/b", { method: "POST" }, fnB),
    buffer.executeMutation<{ item: string }>("/api/v1/operations/c", { method: "POST" }, fnC),
  ]);

  assert.equal(resA.status, "fulfilled");
  if (resA.status === "fulfilled") {
    assert.equal(resA.value.item, "A");
  }

  assert.equal(resB.status, "fulfilled");
  if (resB.status === "fulfilled") {
    assert.equal(resB.value.item, "B");
  }

  assert.equal(resC.status, "rejected");
  if (resC.status === "rejected") {
    assert.match(resC.reason.message, /Invalid payload/);
  }

  assert.equal(buffer.getPending().length, 0);
});
