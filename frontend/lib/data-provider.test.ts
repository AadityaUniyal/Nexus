import assert from "node:assert/strict";
import test from "node:test";
import { OfflineMutationBuffer, mutationBuffer, dataProvider } from "./data-provider";

test("OfflineMutationBuffer retries on HTTP 429 and succeeds on subsequent attempt", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;

  const fakeFetch = async () => {
    calls++;
    if (calls < 3) {
      return new Response(JSON.stringify({ error: { message: "Free tier rate limit" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, data: { id: "veh-101", status: "OPERATIONAL" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await buffer.executeMutation<{ id: string; status: string }>(
    "/api/v1/operations/vehicles",
    { method: "POST", body: JSON.stringify({ code: "V-101" }) },
    fakeFetch
  );

  assert.equal(calls, 3);
  assert.equal(result.id, "veh-101");
  assert.equal(buffer.getPending().length, 0);
});

test("OfflineMutationBuffer bubbles up error when 429 retries are exhausted (Zero Mocks)", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;

  const alwaysThrottled = async () => {
    calls++;
    return new Response(JSON.stringify({ error: { message: "Quota exhausted" } }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  };

  await assert.rejects(
    async () => {
      await buffer.executeMutation(
        "/api/v1/operations/warehouses",
        { method: "POST", body: "{}" },
        alwaysThrottled
      );
    },
    (err: Error) => {
      assert.match(err.message, /Mutation Failed after \d+ attempts/);
      assert.match(err.message, /Quota exhausted/);
      return true;
    }
  );

  assert.equal(calls, 4); // Initial + 3 retries
});

test("OfflineMutationBuffer bubbles up network connection errors when retries exhausted", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;

  const networkDrop = async () => {
    calls++;
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(
    async () => {
      await buffer.executeMutation(
        "/api/v1/operations/orders",
        { method: "POST", body: "{}" },
        networkDrop
      );
    },
    (err: Error) => {
      assert.match(err.message, /Network unreachable/);
      return true;
    }
  );

  assert.equal(calls, 4);
});

test("OfflineMutationBuffer does not retry client validation errors (HTTP 400)", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;

  const badRequest = async () => {
    calls++;
    return new Response(JSON.stringify({ error: { message: "Invalid payload" } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  };

  await assert.rejects(
    async () => {
      await buffer.executeMutation(
        "/api/v1/operations/incidents",
        { method: "POST", body: "{}" },
        badRequest
      );
    },
    (err: Error) => {
      assert.equal(err.message, "Invalid payload");
      return true;
    }
  );

  assert.equal(calls, 1); // Fails fast without useless retries
  assert.equal(buffer.getPending().length, 0);
});
