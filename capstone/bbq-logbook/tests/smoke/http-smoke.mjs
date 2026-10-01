import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

const applicationRoot = new URL("../../", import.meta.url);

function launchMainServer(environment) {
  const childEnvironment = {
    ...globalThis.process.env,
    HOST: "127.0.0.1",
    PORT: "0",
    ...environment,
  };
  if (environment.STORAGE_BACKEND === "azure") {
    delete childEnvironment.IDENTITY_ENDPOINT;
    delete childEnvironment.IDENTITY_HEADER;
  }
  const child = spawn(
    globalThis.process.execPath,
    ["dist/src/server/main.mjs"],
    {
      cwd: applicationRoot,
      env: childEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    output += chunk;
  });
  return {
    child,
    get output() {
      return output;
    },
  };
}

async function waitForMainServer(server) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const match = server.output.match(/listening on (http:\/\/127\.0\.0\.1:\d+)/);
    if (match) return match[1];
    if (server.child.exitCode !== null) {
      throw new Error(`Server exited before listening:\n${server.output}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Server did not start:\n${server.output}`);
}

async function stopMainServer(server) {
  if (server.child.exitCode !== null || server.child.signalCode !== null) return;
  server.child.kill("SIGTERM");
  await once(server.child, "exit");
}

function validCookLog() {
  return {
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
  };
}

test("built production entry point serves assets and the Cook Log HTTP workflow", async () => {
  const server = launchMainServer({
    NODE_ENV: "test",
    STORAGE_BACKEND: "memory",
  });

  try {
    const baseUrl = await waitForMainServer(server);

    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /BBQ Cook Logbook/);
    const clientScript = await fetch(new URL("/main.js", baseUrl));
    assert.equal(clientScript.status, 200);
    assert.match(clientScript.headers.get("content-type"), /javascript/);

    const live = await fetch(new URL("/health/live", baseUrl));
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: "ok" });
    const ready = await fetch(new URL("/health/ready", baseUrl));
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: "ready" });

    const invalid = validCookLog();
    invalid.trimmedWeightKg = 6;
    const rejected = await fetch(new URL("/api/cook-logs", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalid),
    });
    assert.equal(rejected.status, 400);
    assert.equal((await rejected.json()).error, "validation_failed");
    assert.deepEqual(await (await fetch(new URL("/api/cook-logs", baseUrl))).json(), []);

    const log = validCookLog();
    const created = await fetch(new URL("/api/cook-logs", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), log);
    assert.deepEqual(await (await fetch(new URL("/api/cook-logs", baseUrl))).json(), [log]);
  } finally {
    await stopMainServer(server);
  }
});

test("Azure mode fails readiness safely when managed identity is unavailable", async () => {
  const server = launchMainServer({
    BBQ_TABLE_ENDPOINT: "https://storage.example.test",
    BBQ_TABLE_NAME: "CookLogs",
    STORAGE_BACKEND: "azure",
  });

  try {
    const baseUrl = await waitForMainServer(server);
    const live = await fetch(new URL("/health/live", baseUrl));
    assert.equal(live.status, 200);
    const ready = await fetch(new URL("/health/ready", baseUrl));
    assert.equal(ready.status, 503);
    const body = await ready.text();
    assert.equal(body, JSON.stringify({ status: "not_ready" }));
    assert.doesNotMatch(body, /storage\.example\.test/);
  } finally {
    await stopMainServer(server);
  }
});

test("production startup fails rather than silently selecting memory storage", async () => {
  const server = launchMainServer({});
  const [code] = await once(server.child, "exit");

  assert.notEqual(code, 0);
  assert.match(server.output, /Set STORAGE_BACKEND/);
});
