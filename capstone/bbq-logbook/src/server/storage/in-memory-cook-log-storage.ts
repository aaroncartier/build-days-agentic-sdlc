import type { CookLog } from "../../shared/cook-log.js";
import { copyCookLog, type CookLogStorage } from "./cook-log-storage.js";

export class InMemoryCookLogStorage implements CookLogStorage {
  private readonly logs: CookLog[] = [];

  async create(log: CookLog): Promise<CookLog> {
    const saved = copyCookLog(log);
    this.logs.push(saved);
    return copyCookLog(saved);
  }

  async list(): Promise<CookLog[]> {
    return this.logs.map(copyCookLog);
  }

  async checkAvailability(): Promise<void> {}
}
