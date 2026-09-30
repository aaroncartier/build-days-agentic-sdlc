import assert from "node:assert/strict";
import { test } from "node:test";

import { validateCookLog } from "../../dist/src/shared/cook-log.js";
import { AzureTableCookLogStorage } from "../../dist/src/server/storage/azure-table-cook-log-storage.js";
import { InMemoryCookLogStorage } from "../../dist/src/server/storage/in-memory-cook-log-storage.js";

const validCookLog = (meatType = "Pork shoulder") => ({
  meatType,
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

test("in-memory storage returns isolated copies in creation order", async () => {
  const storage = new InMemoryCookLogStorage();
  const first = validCookLog();
  await storage.create(first);
  first.preparationSteps.reverse();
  await storage.create(validCookLog("Brisket"));

  const logs = await storage.list();
  assert.deepEqual(logs.map(({ meatType }) => meatType), ["Pork shoulder", "Brisket"]);
  assert.deepEqual(logs[0].preparationSteps, ["Trim fat cap", "Apply rub"]);
  logs[0].cookEvents.reverse();
  assert.deepEqual(
    (await storage.list())[0].cookEvents.map(({ event }) => event),
    ["Start cook", "Wrap"],
  );
});

test("Azure Table adapter durably round-trips logs and preserves nested ordering", async () => {
  const entities = [];
  let sequence = 0;
  const fetcher = async (input, init = {}) => {
    const url = new URL(input);
    if (init.method === "POST") {
      entities.push(JSON.parse(init.body));
      return new Response(null, { status: 204 });
    }
    if (url.searchParams.has("$filter")) {
      return Response.json({ value: [...entities] });
    }
    throw new Error("Unexpected Azure Table request");
  };
  const storage = new AzureTableCookLogStorage({
    endpoint: "https://tables.example.test",
    tableName: "CookLogs",
    getAccessToken: async () => "test-token",
    fetcher,
    createId: () => `id-${++sequence}`,
    now: () => new Date(`2026-09-30T15:08:0${sequence}Z`),
  });
  const first = validCookLog();
  const second = validCookLog("Brisket");

  await storage.create(first);
  await storage.create(second);

  assert.equal(entities.length, 2);
  assert.equal(entities[0].PartitionKey, "cook-logs");
  assert.equal(entities[0].RowKey, "id-1");
  const restored = await storage.list();
  assert.deepEqual(restored, [first, second]);
  assert.deepEqual(restored[0].preparationSteps, ["Trim fat cap", "Apply rub"]);
  assert.deepEqual(restored[0].cookEvents, first.cookEvents);
  assert.deepEqual(validateCookLog(restored[0]), { valid: true, value: first });
});

test("Azure Table adapter follows continuation tokens across pages", async () => {
  const first = validCookLog("First");
  const second = validCookLog("Second");
  let queryCount = 0;
  const fetcher = async (input) => {
    const url = new URL(input);
    if (!url.searchParams.has("$filter")) {
      return new Response(null, { status: 204 });
    }
    queryCount += 1;
    if (queryCount === 1) {
      return Response.json(
        {
          value: [{
            PartitionKey: "cook-logs",
            RowKey: "first",
            CookLogJson: JSON.stringify(first),
            CreatedAt: "2026-09-30T15:08:00.000Z",
          }],
        },
        { headers: { "x-ms-continuation-NextPartitionKey": "cook-logs", "x-ms-continuation-NextRowKey": "second" } },
      );
    }
    assert.equal(url.searchParams.get("NextRowKey"), "second");
    return Response.json({
      value: [{
        PartitionKey: "cook-logs",
        RowKey: "second",
        CookLogJson: JSON.stringify(second),
        CreatedAt: "2026-09-30T15:09:00.000Z",
      }],
    });
  };
  const storage = new AzureTableCookLogStorage({
    endpoint: "https://tables.example.test",
    tableName: "CookLogs",
    getAccessToken: async () => "test-token",
    fetcher,
  });

  assert.deepEqual(await storage.list(), [first, second]);
  assert.equal(queryCount, 2);
});

test("managed identity token provider requests a storage token without exposing failures", async () => {
  const { createAppServiceManagedIdentityTokenProvider } = await import(
    "../../dist/src/server/storage/azure-table-cook-log-storage.js"
  );
  let requestedUrl;
  let identityHeader;
  const tokenProvider = createAppServiceManagedIdentityTokenProvider(
    {
      IDENTITY_ENDPOINT: "http://localhost/metadata/identity/oauth2/token",
      IDENTITY_HEADER: "identity-secret",
    },
    async (input, init) => {
      requestedUrl = new URL(input);
      identityHeader = init.headers["X-IDENTITY-HEADER"];
      return Response.json({ access_token: "opaque-access-token" });
    },
  );

  assert.equal(await tokenProvider(), "opaque-access-token");
  assert.equal(requestedUrl.searchParams.get("resource"), "https://storage.azure.com/");
  assert.equal(identityHeader, "identity-secret");
});
