export interface CookEvent {
  event: string;
  observation: string;
}

export interface CookLog {
  meatType: string;
  initialWeightKg: number;
  trimmedWeightKg: number;
  seasonings: string[];
  preparationSteps: string[];
  cookEvents: CookEvent[];
  totalCookMinutes: number;
  finalObservations: string;
  appearanceRating: number;
  tasteRating: number;
  textureRating: number;
}

export type CookLogField =
  | keyof CookLog
  | `cookEvents.${number}.event`
  | `cookEvents.${number}.observation`;

export interface CookLogValidationIssue {
  field: CookLogField;
  message: string;
}

export type CookLogValidationResult =
  | { valid: true; value: CookLog }
  | { valid: false; issues: CookLogValidationIssue[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonBlankString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isRating = (value: unknown): value is number =>
  Number.isInteger(value) && typeof value === "number" && value >= 1 && value <= 5;

export function validateCookLog(value: unknown): CookLogValidationResult {
  if (!isRecord(value)) {
    return {
      valid: false,
      issues: [{ field: "meatType", message: "Cook log must be an object." }],
    };
  }

  const issues: CookLogValidationIssue[] = [];
  const requireText = (field: "meatType" | "finalObservations") => {
    if (!isNonBlankString(value[field])) {
      issues.push({ field, message: "A non-empty value is required." });
    }
  };
  const requirePositive = (
    field: "initialWeightKg" | "trimmedWeightKg" | "totalCookMinutes",
  ) => {
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

  for (const field of ["appearanceRating", "tasteRating", "textureRating"] as const) {
    if (!isRating(value[field])) {
      issues.push({
        field,
        message: "Rating must be an integer from 1 through 5.",
      });
    }
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return { valid: true, value: value as unknown as CookLog };
}
