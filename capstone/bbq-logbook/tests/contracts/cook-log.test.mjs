import assert from "node:assert/strict";
import { test } from "node:test";

import { validateCookLog } from "../../dist/src/shared/cook-log.js";

const validCookLog = () => ({
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
});

test("accepts a complete cook log and preserves ordered values and distinct ratings", () => {
  const log = validCookLog();
  const result = validateCookLog(log);

  assert.equal(result.valid, true);
  assert.deepEqual(result.value, log);
  assert.deepEqual(result.value.preparationSteps, ["Trim fat cap", "Apply rub"]);
  assert.deepEqual(result.value.cookEvents, log.cookEvents);
  assert.equal(result.value.appearanceRating, 5);
  assert.equal(result.value.tasteRating, 4);
  assert.equal(result.value.textureRating, 5);
});

test("accepts no seasonings and positive boundary values with equal weights", () => {
  const log = validCookLog();
  log.initialWeightKg = Number.MIN_VALUE;
  log.trimmedWeightKg = Number.MIN_VALUE;
  log.seasonings = [];
  log.totalCookMinutes = Number.MIN_VALUE;
  log.appearanceRating = 1;
  log.tasteRating = 5;

  const result = validateCookLog(log);

  assert.equal(result.valid, true);
  assert.deepEqual(result.value.seasonings, []);
});

test("rejects missing or blank required text and preparation steps", () => {
  const log = validCookLog();
  log.meatType = "   ";
  log.preparationSteps = [];
  log.finalObservations = "";

  const result = validateCookLog(log);

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.issues.map(({ field }) => field),
    ["meatType", "preparationSteps", "finalObservations"],
  );
});

test("rejects missing required weights and cook time", () => {
  for (const field of ["initialWeightKg", "trimmedWeightKg", "totalCookMinutes"]) {
    const log = validCookLog();
    delete log[field];
    const result = validateCookLog(log);
    assert.equal(result.valid, false, `${field} should be required`);
    assert.ok(result.issues.some((issue) => issue.field === field));
  }
});

test("rejects non-positive, non-finite, or reversed weights and cook times", () => {
  for (const [field, invalidValue] of [
    ["initialWeightKg", 0],
    ["trimmedWeightKg", -1],
    ["totalCookMinutes", 0],
    ["totalCookMinutes", Infinity],
  ]) {
    const log = validCookLog();
    log[field] = invalidValue;
    const result = validateCookLog(log);
    assert.equal(result.valid, false, `${field} should be rejected`);
    assert.ok(result.issues.some((issue) => issue.field === field));
  }

  const log = validCookLog();
  log.trimmedWeightKg = log.initialWeightKg + 0.1;
  const result = validateCookLog(log);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.field === "trimmedWeightKg"));
});

test("rejects missing or invalid ratings unless each is an integer from 1 through 5", () => {
  for (const [field, invalidValue] of [
    ["appearanceRating", 0],
    ["tasteRating", 6],
    ["textureRating", 2.5],
    ["appearanceRating", undefined],
  ]) {
    const log = validCookLog();
    log[field] = invalidValue;
    const result = validateCookLog(log);
    assert.equal(result.valid, false, `${field} should be rejected`);
    assert.ok(result.issues.some((issue) => issue.field === field));
  }
});

test("rejects incomplete or malformed cook events with field-specific issues", () => {
  const log = validCookLog();
  log.cookEvents = [{ event: "Wrap", observation: " " }];

  const result = validateCookLog(log);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some((issue) => issue.field === "cookEvents.0.observation"),
  );
});

test("rejects non-object cook logs", () => {
  assert.deepEqual(validateCookLog(null), {
    valid: false,
    issues: [{ field: "meatType", message: "Cook log must be an object." }],
  });
});
