import assert from "node:assert/strict";
import { test } from "node:test";

import { validateCookLog as validateSharedCookLog } from "../../dist/src/shared/cook-log.js";
import { HttpCookLogService } from "../../src/client/api.js";
import {
  buildCookLog,
  CookLogWorkflow,
  createEmptyDraft,
  moveItem,
  validateCookLog,
} from "../../src/client/workflow.js";
import { renderCookLogbook } from "../../src/client/view.js";

const completeDraft = () => ({
  meatType: "Pork shoulder",
  initialWeightKg: "5.4",
  trimmedWeightKg: "4.8",
  seasonings: "salt, pepper",
  preparationSteps: ["Trim fat cap", "Apply rub"],
  cookEvents: [
    { event: "Start cook", observation: "Smoker at 110 C" },
    { event: "Wrap", observation: "Bark set" },
  ],
  totalCookMinutes: "420",
  finalObservations: "Tender with a firm bark",
  appearanceRating: "5",
  tasteRating: "4",
  textureRating: "5",
});

class ApiDouble {
  constructor(logs = []) {
    this.logs = logs;
    this.createCalls = [];
    this.listCalls = 0;
    this.createErrorCount = 0;
    this.listErrorCount = 0;
  }

  async listCookLogs() {
    this.listCalls += 1;
    if (this.listErrorCount > 0) {
      this.listErrorCount -= 1;
      throw new Error("private service detail");
    }
    return [...this.logs];
  }

  async createCookLog(log) {
    this.createCalls.push(log);
    if (this.createErrorCount > 0) {
      this.createErrorCount -= 1;
      throw new Error("private service detail");
    }
    this.logs.unshift(log);
    return log;
  }
}

test("uses native keyboard-operable controls with associated labels and accessible order actions", () => {
  const state = new CookLogWorkflow(new ApiDouble()).state;
  const draft = completeDraft();
  const html = renderCookLogbook(state, draft);
  const controlIds = [...html.matchAll(/<(?:input|textarea|select)\b[^>]*\bid="([^"]+)"/g)]
    .map((match) => match[1]);
  const labelTargets = [...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)]
    .map((match) => match[1]);

  assert.ok(controlIds.length > 10);
  assert.deepEqual(
    controlIds.filter((id) => !labelTargets.includes(id)),
    [],
    "every form control has a programmatically associated label",
  );
  assert.match(html, /<form id="cook-log-form" novalidate/);
  assert.match(html, /<button class="primary-button" type="submit"/);
  assert.match(html, /type="button" data-action="add-preparation"/);
  assert.match(html, /aria-label="Move preparation step 1 down"/);
  assert.match(html, /aria-label="Move preparation step 1 up" disabled/);
  assert.match(html, /type="button" data-action="add-event"/);
  assert.deepEqual(moveItem(["trim", "rub", "rest"], 0, 1), ["rub", "trim", "rest"]);
  assert.deepEqual(moveItem(["trim", "rub"], 0, -1), ["trim", "rub"]);
});

test("matches the shared contract and rejects invalid input without calling save", async () => {
  const service = new ApiDouble();
  const workflow = new CookLogWorkflow(service);
  const draft = completeDraft();
  draft.trimmedWeightKg = "6";
  draft.appearanceRating = "6";
  await workflow.load();

  assert.deepEqual(validateCookLog(buildCookLog(draft)), validateSharedCookLog(buildCookLog(draft)));
  assert.equal(await workflow.save(draft), false);
  assert.equal(service.createCalls.length, 0);
  assert.equal(workflow.state.saveStatus, "validation");

  const html = renderCookLogbook(workflow.state, draft);
  assert.match(html, /role="alert"/);
  assert.match(html, /Cook log was not saved/);
  assert.match(html, /id="trimmedWeightKg"[^>]*aria-describedby="help-trimmedWeightKg error-trimmedWeightKg" aria-invalid="true"/);
  assert.match(html, /id="appearanceRating"[^>]*aria-invalid="true"/);
});

test("keeps client validation aligned with shared validation for incomplete and malformed records", () => {
  const invalidDraft = createEmptyDraft();
  invalidDraft.preparationSteps = ["Trim first", "  "];
  invalidDraft.cookEvents = [{ event: "", observation: "" }];
  const invalidRecord = buildCookLog(invalidDraft);
  assert.deepEqual(validateCookLog(invalidRecord), validateSharedCookLog(invalidRecord));

  const state = {
    loadStatus: "ready",
    logs: [],
    saveStatus: "validation",
    validationIssues: validateCookLog(invalidRecord).issues,
    selectedLogIndex: null,
  };
  const html = renderCookLogbook(state, invalidDraft);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicateIds, [], "error and description IDs are unique");
  assert.match(html, /href="#preparation-1"/);
  assert.match(html, /id="preparation-1"[^>]*aria-invalid="true"/);
  assert.match(html, /id="cook-event-0"[^>]*aria-invalid="true"/);
  assert.match(html, /id="cook-observation-0"[^>]*aria-invalid="true"/);
});

test("HTTP adapter lists and creates logs through the cook-log API", async () => {
  const requests = [];
  const log = buildCookLog(completeDraft());
  const service = new HttpCookLogService(async (url, options = {}) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => (options.method === "POST" ? log : [log]),
    };
  });

  assert.deepEqual(await service.listCookLogs(), [log]);
  assert.deepEqual(await service.createCookLog(log), log);
  assert.equal(requests[0].url, "/api/cook-logs");
  assert.equal(requests[1].url, "/api/cook-logs");
  assert.equal(requests[1].options.method, "POST");
  assert.equal(requests[1].options.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(requests[1].options.body), log);
});

test("shows loading, empty, and accessible load-failure states with retry", async () => {
  const service = new ApiDouble();
  const workflow = new CookLogWorkflow(service);

  assert.match(renderCookLogbook(workflow.state, createEmptyDraft()), /role="status"[^>]*>Loading saved cook logs/);
  const loading = workflow.load();
  await loading;
  assert.match(renderCookLogbook(workflow.state, createEmptyDraft()), /No cook logs have been saved yet/);
  assert.match(renderCookLogbook(workflow.state, createEmptyDraft()), /Create the first cook log/);

  service.listErrorCount = 1;
  assert.equal(await workflow.load(), false);
  const failed = renderCookLogbook(workflow.state, createEmptyDraft());
  assert.match(failed, /role="alert"/);
  assert.match(failed, /data-action="retry-load"/);
  assert.doesNotMatch(failed, /private service detail/);
  assert.equal(await workflow.load(), true);
  assert.equal(workflow.state.loadStatus, "ready");
});

test("announces a pending save with an accessible status instead of claiming success", async () => {
  const service = new ApiDouble();
  let completeSave;
  service.createCookLog = (log) => new Promise((resolve) => {
    completeSave = () => resolve(log);
  });
  const workflow = new CookLogWorkflow(service);
  const draft = completeDraft();
  await workflow.load();

  const save = workflow.save(draft);
  assert.equal(workflow.state.saveStatus, "saving");
  const savingHtml = renderCookLogbook(workflow.state, draft);
  assert.match(savingHtml, /id="save-status"[^>]*role="status"[^>]*>Saving cook log/);
  assert.doesNotMatch(savingHtml, /Cook log saved\./);

  completeSave();
  assert.equal(await save, true);
  assert.equal(workflow.state.saveStatus, "success");
});

test("retains entered values after a service failure and retries into a complete saved review", async () => {
  const draft = completeDraft();
  const service = new ApiDouble();
  service.createErrorCount = 1;
  const workflow = new CookLogWorkflow(service);
  await workflow.load();

  assert.equal(await workflow.save(draft), false);
  assert.equal(workflow.state.saveStatus, "failure");
  assert.equal(workflow.state.logs.length, 0);
  const failureHtml = renderCookLogbook(workflow.state, draft);
  assert.match(failureHtml, /role="alert"/);
  assert.match(failureHtml, /Your entries are still here/);
  assert.match(failureHtml, /value="Pork shoulder"/);
  assert.match(failureHtml, /value="Apply rub"/);
  assert.match(failureHtml, /value="salt, pepper"/);
  assert.doesNotMatch(failureHtml, /Cook log saved\./);

  assert.equal(await workflow.save(draft), true);
  assert.equal(workflow.state.saveStatus, "success");
  assert.deepEqual(workflow.state.logs[0], buildCookLog(draft));
  assert.equal(service.createCalls.length, 2);
  assert.match(renderCookLogbook(workflow.state, createEmptyDraft()), /Cook log saved/);

  const review = renderCookLogbook(workflow.state, createEmptyDraft());
  assert.match(review, /Trim fat cap/);
  assert.match(review, /Apply rub/);
  assert.ok(review.indexOf("Trim fat cap") < review.indexOf("Apply rub"));
  assert.match(review, /Start cook/);
  assert.match(review, /Smoker at 110 C/);
  assert.match(review, /Wrap/);
  assert.match(review, /Bark set/);
  assert.ok(review.indexOf("Start cook") < review.indexOf("Wrap"));
  assert.match(review, /5 out of 5/);
  assert.match(review, /4 out of 5/);
  assert.match(review, /Tender with a firm bark/);
  assert.match(review, /4\.8 kg/);
  assert.match(review, /5\.4 kg/);
  assert.match(review, /salt, pepper/);
  assert.match(review, /Appearance rating<\/dt><dd>5 out of 5/);
  assert.match(review, /Taste rating<\/dt><dd>4 out of 5/);
  assert.match(review, /Texture rating<\/dt><dd>5 out of 5/);
});

test("preserves order for preparation steps and cook events and accepts an unseasoned log", () => {
  const draft = completeDraft();
  draft.seasonings = "";
  draft.preparationSteps = moveItem(draft.preparationSteps, 1, -1);
  draft.cookEvents = moveItem(draft.cookEvents, 1, -1);
  const cookLog = buildCookLog(draft);
  const validation = validateCookLog(cookLog);

  assert.equal(validation.valid, true);
  assert.deepEqual(validateSharedCookLog(cookLog), validation);
  assert.deepEqual(cookLog.seasonings, []);
  const service = new ApiDouble([cookLog]);
  const workflow = new CookLogWorkflow(service);
  workflow.state = {
    ...workflow.state,
    loadStatus: "ready",
    logs: [cookLog],
    selectedLogIndex: 0,
  };

  const review = renderCookLogbook(workflow.state, draft);
  assert.ok(review.indexOf("Apply rub") < review.indexOf("Trim fat cap"));
  assert.ok(review.indexOf("Wrap") < review.indexOf("Start cook"));
  assert.match(review, /None recorded/);
  assert.match(review, /Appearance rating/);
  assert.match(review, /Taste rating/);
  assert.match(review, /Texture rating/);
});
