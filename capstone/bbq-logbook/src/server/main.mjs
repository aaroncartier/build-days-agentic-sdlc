import { createCookLogHttpServer } from "./http-server.mjs";
import { createAzureTableCookLogStorageFromAppService } from "./storage/azure-table-cook-log-storage.js";
import { InMemoryCookLogStorage } from "./storage/in-memory-cook-log-storage.js";

function createStorage(environment) {
  if (environment.STORAGE_BACKEND === "memory") {
    return new InMemoryCookLogStorage();
  }
  if (environment.STORAGE_BACKEND === "azure") {
    return createAzureTableCookLogStorageFromAppService(environment);
  }
  throw new Error("Set STORAGE_BACKEND to 'azure' or explicitly to 'memory'.");
}

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be an integer between 0 and 65535.");
}

const host = process.env.HOST ?? "0.0.0.0";
const server = createCookLogHttpServer(createStorage(process.env));
server.once("error", (error) => {
  console.error(`Cook Logbook server failed: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  const address = server.address();
  if (address && typeof address === "object") {
    console.log(`Cook Logbook listening on http://${host}:${address.port}`);
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close());
}
