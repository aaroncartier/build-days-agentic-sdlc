export const createEmptyDraft = () => ({
  meatType: "",
  initialWeightKg: "",
  trimmedWeightKg: "",
  seasonings: "",
  preparationSteps: [""],
  cookEvents: [],
  totalCookMinutes: "",
  finalObservations: "",
  appearanceRating: "",
  tasteRating: "",
  textureRating: "",
});

export const moveItem = (items, index, direction) => {
  const destination = index + direction;
  if (index < 0 || index >= items.length || destination < 0 || destination >= items.length) {
    return [...items];
  }

  const result = [...items];
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
};

export function buildCookLog(draft) {
  return {
    meatType: draft.meatType,
    initialWeightKg: Number(draft.initialWeightKg),
    trimmedWeightKg: Number(draft.trimmedWeightKg),
    seasonings: draft.seasonings
      .split(",")
      .map((seasoning) => seasoning.trim())
      .filter(Boolean),
    preparationSteps: [...draft.preparationSteps],
    cookEvents: draft.cookEvents.map(({ event, observation }) => ({
      event,
      observation,
    })),
    totalCookMinutes: Number(draft.totalCookMinutes),
    finalObservations: draft.finalObservations,
    appearanceRating: Number(draft.appearanceRating),
    tasteRating: Number(draft.tasteRating),
    textureRating: Number(draft.textureRating),
  };
}

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonBlankString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const isPositiveFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const isRating = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;

export function validateCookLog(value) {
  if (!isRecord(value)) {
    return {
      valid: false,
      issues: [{ field: "meatType", message: "Cook log must be an object." }],
    };
  }

  const issues = [];
  const requireText = (field) => {
    if (!isNonBlankString(value[field])) {
      issues.push({ field, message: "A non-empty value is required." });
    }
  };
  const requirePositive = (field) => {
    if (!isPositiveFiniteNumber(value[field])) {
      issues.push({ field, message: "Value must be a positive finite number." });
    }
  };

  requireText("meatType");
  requirePositive("initialWeightKg");
  requirePositive("trimmedWeightKg");

  if (
    isPositiveFiniteNumber(value.initialWeightKg) &&
    isPositiveFiniteNumber(value.trimmedWeightKg) &&
    value.trimmedWeightKg > value.initialWeightKg
  ) {
    issues.push({
      field: "trimmedWeightKg",
      message: "Trimmed weight cannot exceed initial weight.",
    });
  }

  if (!Array.isArray(value.seasonings)) {
    issues.push({ field: "seasonings", message: "Seasonings must be a list." });
  } else if (!value.seasonings.every(isNonBlankString)) {
    issues.push({
      field: "seasonings",
      message: "Each seasoning must be a non-empty value.",
    });
  }

  if (!Array.isArray(value.preparationSteps) || value.preparationSteps.length === 0) {
    issues.push({
      field: "preparationSteps",
      message: "At least one preparation step is required.",
    });
  } else if (!value.preparationSteps.every(isNonBlankString)) {
    issues.push({
      field: "preparationSteps",
      message: "Each preparation step must be a non-empty value.",
    });
  }

  if (!Array.isArray(value.cookEvents)) {
    issues.push({ field: "cookEvents", message: "Cook events must be a list." });
  } else {
    value.cookEvents.forEach((event, index) => {
      if (!isRecord(event) || !isNonBlankString(event.event)) {
        issues.push({
          field: `cookEvents.${index}.event`,
          message: "A non-empty event description is required.",
        });
      }
      if (!isRecord(event) || !isNonBlankString(event.observation)) {
        issues.push({
          field: `cookEvents.${index}.observation`,
          message: "A non-empty observation is required.",
        });
      }
    });
  }

  requirePositive("totalCookMinutes");
  requireText("finalObservations");

  for (const field of ["appearanceRating", "tasteRating", "textureRating"]) {
    if (!isRating(value[field])) {
      issues.push({
        field,
        message: "Rating must be an integer from 1 through 5.",
      });
    }
  }

  return issues.length > 0
    ? { valid: false, issues }
    : { valid: true, value };
}

export class CookLogWorkflow {
  constructor(service) {
    this.service = service;
    this.state = {
      loadStatus: "loading",
      logs: [],
      saveStatus: "idle",
      validationIssues: [],
      selectedLogIndex: null,
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  updateState(update) {
    this.state = { ...this.state, ...update };
    this.emit();
  }

  async load() {
    this.updateState({ loadStatus: "loading", loadError: undefined });
    try {
      const logs = await this.service.listCookLogs();
      this.updateState({
        loadStatus: "ready",
        logs,
        selectedLogIndex: logs.length > 0 ? 0 : null,
      });
      return true;
    } catch {
      this.updateState({
        loadStatus: "failure",
        loadError: "Saved cook logs could not be loaded. Check your connection and retry.",
      });
      return false;
    }
  }

  selectLog(index) {
    if (index < 0 || index >= this.state.logs.length) {
      return;
    }
    this.updateState({ selectedLogIndex: index });
  }

  async save(draft) {
    const cookLog = buildCookLog(draft);
    const validation = validateCookLog(cookLog);
    if (!validation.valid) {
      this.updateState({
        saveStatus: "validation",
        validationIssues: validation.issues,
      });
      return false;
    }

    this.updateState({
      saveStatus: "saving",
      saveError: undefined,
      validationIssues: [],
    });

    try {
      const savedLog = await this.service.createCookLog(validation.value);
      const logs = [savedLog, ...this.state.logs];
      this.updateState({
        loadStatus: "ready",
        logs,
        selectedLogIndex: 0,
        saveStatus: "success",
      });
      return true;
    } catch {
      this.updateState({
        saveStatus: "failure",
        saveError: "Cook log was not saved. Your entries are still here; retry when the service is available.",
      });
      return false;
    }
  }
}
