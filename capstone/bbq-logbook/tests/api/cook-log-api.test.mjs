import assert from "node:assert/strict";
import { test } from "node:test";

import { createCookLogApi } from "../../dist/src/server/api/cook-log-api.js";
import { InMemoryCookLogStorage } from "../../dist/src/server/storage/in-memory-cook-log-storage.js";

const validCookLog = () => ({
  meatType: "Pork shoulder",
  initialWeightKg: 5.4,
  trimmedWeightKg: 4.8,
  seasonings: ["salt", "pepper"],
  preparationSteps: ["Trim fat cap", "Apply rub"],
  cookEvents: [
    { event: "Start cook", observation: "Smoker at 110 C" },
    { event: "Wrap", observation: "Bark set" },
  ],
  totalCookMinutes: 420,
  finalObservations: "Tender with a firm bark",
  appearanceRating: 5,
  tasteRating: 4,
  textureRating: 5,
});

const jsonRequest = (method, value) =>
  new Request("http://localhost/api/cook-logs", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });

test("API creates and browses complete cook logs with ordered values", async () => {
  const storage = new InMemoryCookLogStorage();
  const api = createCookLogApi(storage);
  const log = validCookLog();

  const create = await api(jsonRequest("POST", log));
  assert.equal(create.status, 201);
  assert.deepEqual(await create.json(), log);

  const browse = await api(new Request("http://localhost/api/cook-logs"));
  assert.equal(browse.status, 200);
  assert.deepEqual(await browse.json(), [log]);
});

test("API rejects invalid contract values without persisting them", async () => {
  const cases = [
    ["weight", (log) => (log.trimmedWeightKg = 6)],
    ["cook time", (log) => (log.totalCookMinutes = 0)],
    ["rating", (log) => (log.tasteRating = 6)],
    ["preparation", (log) => (log.preparationSteps = [])],
  ];
  for (const [name, invalidate] of cases) {
    const storage = new InMemoryCookLogStorage();
    const api = createCookLogApi(storage);
    const log = validCookLog();
    invalidate(log);

    const response = await api(jsonRequest("POST", log));

    assert.equal(response.status, 400, `${name} should be rejected`);
    const body = await response.json();
    assert.equal(body.error, "validation_failed");
    assert.ok(body.issues.length > 0);
    assert.deepEqual(await storage.list(), []);
  }
});

test("API returns safe errors for malformed input and storage failures", async () => {
  const storage = new InMemoryCookLogStorage();
  const unavailableStorage = {
    ...storage,
    create: async () => {
      throw new Error("connection string: secret-storage-credential");
    },
    list: async () => {
      throw new Error("account key: secret-storage-credential");
    },
  };
  const api = createCookLogApi(unavailableStorage);

  const malformed = await api(
    new Request("http://localhost/api/cook-logs", {
      method: "POST",
      body: "password=secret-storage-credential",
    }),
  );
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error, "invalid_json");

  const createError = await api(jsonRequest("POST", validCookLog()));
  assert.equal(createError.status, 503);
  const createBody = await createError.text();
  assert.match(createBody, /storage_unavailable/);
  assert.doesNotMatch(createBody, /secret-storage-credential/);

  const listError = await api(new Request("http://localhost/api/cook-logs"));
  assert.equal(listError.status, 503);
  const listBody = await listError.text();
  assert.match(listBody, /storage_unavailable/);
  assert.doesNotMatch(listBody, /secret-storage-credential/);
});

test("liveness stays healthy while readiness reports unavailable storage", async () => {
  const api = createCookLogApi({
    create: async () => {
      throw new Error("offline");
    },
    list: async () => {
      throw new Error("offline");
    },
    checkAvailability: async () => {
      throw new Error("private dependency detail");
    },
  });

  const live = await api(new Request("http://localhost/health/live"));
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), { status: "ok" });

  const ready = await api(new Request("http://localhost/health/ready"));
  assert.equal(ready.status, 503);
  const readyBody = await ready.text();
  assert.equal(readyBody, JSON.stringify({ status: "not_ready" }));
  assert.doesNotMatch(readyBody, /private dependency detail/);
});

test("readiness reports healthy storage", async () => {
  const api = createCookLogApi(new InMemoryCookLogStorage());
  const response = await api(new Request("http://localhost/health/ready"));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ready" });
});
