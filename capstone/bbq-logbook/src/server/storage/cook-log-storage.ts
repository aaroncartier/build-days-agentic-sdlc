import type { CookLog } from "../../shared/cook-log.js";

export interface CookLogStorage {
  create(log: CookLog): Promise<CookLog>;
  list(): Promise<CookLog[]>;
  checkAvailability(): Promise<void>;
}

export function copyCookLog(log: CookLog): CookLog {
  return {
    ...log,
    seasonings: [...log.seasonings],
    preparationSteps: [...log.preparationSteps],
    cookEvents: log.cookEvents.map((event) => ({ ...event })),
  };
}
