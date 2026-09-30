import { validateCookLog, type CookLog } from "../../shared/cook-log.js";
import { copyCookLog, type CookLogStorage } from "./cook-log-storage.js";

const partitionKey = "cook-logs";
const storageResource = "https://storage.azure.com/";
const apiVersion = "2019-02-02";

interface TableEntity {
  PartitionKey: string;
  RowKey: string;
  CookLogJson: string;
  CreatedAt: string;
}

export interface AzureTableCookLogStorageOptions {
  endpoint: string;
  tableName: string;
  getAccessToken: () => Promise<string>;
  fetcher?: typeof fetch;
  createId?: () => string;
  now?: () => Date;
}

export interface AppServiceIdentityEnvironment {
  IDENTITY_ENDPOINT?: string;
  IDENTITY_HEADER?: string;
}

export class StorageUnavailableError extends Error {
  constructor() {
    super("Cook log storage is unavailable.");
    this.name = "StorageUnavailableError";
  }
}

export function createAppServiceManagedIdentityTokenProvider(
  environment: AppServiceIdentityEnvironment,
  fetcher: typeof fetch = fetch,
): () => Promise<string> {
  return async () => {
    if (!environment.IDENTITY_ENDPOINT || !environment.IDENTITY_HEADER) {
      throw new StorageUnavailableError();
    }

    const identityUrl = new URL(environment.IDENTITY_ENDPOINT);
    identityUrl.searchParams.set("resource", storageResource);
    identityUrl.searchParams.set("api-version", "2019-08-01");

    let response: Response;
    try {
      response = await fetcher(identityUrl, {
        headers: { "X-IDENTITY-HEADER": environment.IDENTITY_HEADER },
      });
    } catch {
      throw new StorageUnavailableError();
    }
    if (!response.ok) {
      throw new StorageUnavailableError();
    }

    const body: unknown = await response.json().catch(() => null);
    if (
      typeof body !== "object" ||
      body === null ||
      !("access_token" in body) ||
      typeof body.access_token !== "string" ||
      body.access_token.length === 0
    ) {
      throw new StorageUnavailableError();
    }
    return body.access_token;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readContinuation(response: Response, header: string): string | null {
  return (
    response.headers.get(`x-ms-continuation-${header}`) ??
    response.headers.get(`X-Ms-Continuation-${header}`)
  );
}

export class AzureTableCookLogStorage implements CookLogStorage {
  private readonly baseUrl: URL;
  private readonly fetcher: typeof fetch;
  private readonly createId: () => string;
  private readonly now: () => Date;

  constructor(private readonly options: AzureTableCookLogStorageOptions) {
    if (!/^[A-Za-z][A-Za-z0-9]{2,62}$/.test(options.tableName)) {
      throw new Error("A valid Azure Table name is required.");
    }
    const endpoint = new URL(options.endpoint);
    if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
      throw new Error("Azure Table Storage must use HTTPS.");
    }
    this.baseUrl = new URL(`${options.tableName}`, endpoint.href.endsWith("/") ? endpoint : `${endpoint.href}/`);
    this.fetcher = options.fetcher ?? fetch;
    this.createId = options.createId ?? (() => crypto.randomUUID());
    this.now = options.now ?? (() => new Date());
  }

  async create(log: CookLog): Promise<CookLog> {
    const saved = copyCookLog(log);
    const entity: TableEntity = {
      PartitionKey: partitionKey,
      RowKey: this.createId(),
      CookLogJson: JSON.stringify(saved),
      CreatedAt: this.now().toISOString(),
    };

    await this.request(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json;odata=nometadata" },
      body: JSON.stringify(entity),
    });
    return copyCookLog(saved);
  }

  async list(): Promise<CookLog[]> {
    const entities: TableEntity[] = [];
    let nextPartitionKey: string | null = null;
    let nextRowKey: string | null = null;

    do {
      const url = new URL(this.baseUrl);
      url.searchParams.set("$filter", `PartitionKey eq '${partitionKey}'`);
      url.searchParams.set("$select", "PartitionKey,RowKey,CookLogJson,CreatedAt");
      if (nextPartitionKey && nextRowKey) {
        url.searchParams.set("NextPartitionKey", nextPartitionKey);
        url.searchParams.set("NextRowKey", nextRowKey);
      }

      const response = await this.request(url);
      const body: unknown = await response.json().catch(() => null);
      if (!isRecord(body) || !Array.isArray(body.value)) {
        throw new StorageUnavailableError();
      }
      for (const item of body.value) {
        if (
          !isRecord(item) ||
          item.PartitionKey !== partitionKey ||
          typeof item.RowKey !== "string" ||
          typeof item.CookLogJson !== "string" ||
          typeof item.CreatedAt !== "string"
        ) {
          throw new StorageUnavailableError();
        }
        entities.push(item as unknown as TableEntity);
      }

      nextPartitionKey = readContinuation(response, "NextPartitionKey");
      nextRowKey = readContinuation(response, "NextRowKey");
      if (Boolean(nextPartitionKey) !== Boolean(nextRowKey)) {
        throw new StorageUnavailableError();
      }
    } while (nextPartitionKey && nextRowKey);

    entities.sort(
      (left, right) =>
        left.CreatedAt.localeCompare(right.CreatedAt) ||
        left.RowKey.localeCompare(right.RowKey),
    );

    return entities.map(({ CookLogJson }) => {
      let value: unknown;
      try {
        value = JSON.parse(CookLogJson);
      } catch {
        throw new StorageUnavailableError();
      }
      const result = validateCookLog(value);
      if (!result.valid) {
        throw new StorageUnavailableError();
      }
      return copyCookLog(result.value);
    });
  }

  async checkAvailability(): Promise<void> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("$filter", `PartitionKey eq '${partitionKey}'`);
    url.searchParams.set("$top", "1");
    await this.request(url);
  }

  private async request(input: URL, init: RequestInit = {}): Promise<Response> {
    let token: string;
    try {
      token = await this.options.getAccessToken();
      if (!token) {
        throw new Error();
      }
    } catch {
      throw new StorageUnavailableError();
    }

    let response: Response;
    try {
      response = await this.fetcher(input, {
        ...init,
        headers: {
          Accept: "application/json;odata=nometadata",
          "x-ms-date": new Date().toUTCString(),
          "x-ms-version": apiVersion,
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
      });
    } catch {
      throw new StorageUnavailableError();
    }
    if (!response.ok) {
      throw new StorageUnavailableError();
    }
    return response;
  }
}

export function createAzureTableCookLogStorageFromAppService(
  environment: AppServiceIdentityEnvironment & {
    BBQ_TABLE_ENDPOINT?: string;
    BBQ_TABLE_NAME?: string;
  },
  fetcher: typeof fetch = fetch,
): AzureTableCookLogStorage {
  if (!environment.BBQ_TABLE_ENDPOINT || !environment.BBQ_TABLE_NAME) {
    throw new StorageUnavailableError();
  }
  return new AzureTableCookLogStorage({
    endpoint: environment.BBQ_TABLE_ENDPOINT,
    tableName: environment.BBQ_TABLE_NAME,
    getAccessToken: createAppServiceManagedIdentityTokenProvider(environment, fetcher),
    fetcher,
  });
}
