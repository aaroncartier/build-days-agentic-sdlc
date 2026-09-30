import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../src/client/", import.meta.url));
const destination = fileURLToPath(new URL("../dist/client/", import.meta.url));
const serverSource = fileURLToPath(new URL("../src/server/", import.meta.url));
const serverDestination = fileURLToPath(
  new URL("../dist/src/server/", import.meta.url),
);

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await mkdir(serverDestination, { recursive: true });
await cp(source, destination, { recursive: true });
await cp(join(serverSource, "http-server.mjs"), join(serverDestination, "http-server.mjs"));
await cp(join(serverSource, "main.mjs"), join(serverDestination, "main.mjs"));
