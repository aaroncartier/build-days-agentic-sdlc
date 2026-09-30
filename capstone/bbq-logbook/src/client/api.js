export class HttpCookLogService {
  constructor(fetchImplementation = fetch) {
    this.fetch = fetchImplementation;
  }

  async listCookLogs() {
    const response = await this.fetch("/api/cook-logs");
    if (!response.ok) {
      throw new Error("Cook logs could not be loaded.");
    }

    const logs = await response.json();
    if (!Array.isArray(logs)) {
      throw new Error("Cook logs could not be loaded.");
    }

    return logs;
  }

  async createCookLog(cookLog) {
    const response = await this.fetch("/api/cook-logs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cookLog),
    });
    if (!response.ok) {
      throw new Error("Cook log could not be saved.");
    }

    return response.json();
  }
}
