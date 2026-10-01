const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const errorId = (field) => `error-${field.replaceAll(".", "-")}`;
const fieldError = (state, field) =>
  state.validationIssues.find((issue) => issue.field === field)?.message;
const validationTarget = (field, draft) => {
  if (field === "preparationSteps") {
    const index = draft.preparationSteps.findIndex((step) => !step.trim());
    return `preparation-${Math.max(0, index)}`;
  }
  if (field.startsWith("cookEvents.")) {
    const [, index, property] = field.split(".");
    return `cook-${property === "event" ? "event" : "observation"}-${index}`;
  }
  return field;
};

function describedBy(field, error, helpField = field) {
  return `aria-describedby="help-${helpField.replaceAll(".", "-")}${error ? ` ${errorId(field)}` : ""}"${error ? ' aria-invalid="true"' : ""}`;
}

function fieldErrorMarkup(field, error) {
  return error
    ? `<span class="field-error" id="${errorId(field)}">${escapeHtml(error)}</span>`
    : "";
}

function textField({ id, field, label, value, type = "text", help, required = true, error }) {
  const valueAttribute = `value="${escapeHtml(value)}"`;
  return `<div class="field">
    <label for="${id}">${escapeHtml(label)}${required ? " <span>(required)</span>" : " <span>(optional)</span>"}</label>
    <input id="${id}" name="${id}" type="${type}" ${type === "number" ? 'inputmode="decimal"' : ""} ${valueAttribute} ${required ? "required" : ""} ${type === "number" ? 'step="any"' : ""} data-field="${field}" ${describedBy(field, error)}>
    <span class="field-help" id="help-${field.replaceAll(".", "-")}">${escapeHtml(help)}</span>
    ${fieldErrorMarkup(field, error)}
  </div>`;
}

function textareaField({ id, field, label, value, help, error }) {
  return `<div class="field">
    <label for="${id}">${escapeHtml(label)} <span>(required)</span></label>
    <textarea id="${id}" name="${id}" required data-field="${field}" ${describedBy(field, error)}>${escapeHtml(value)}</textarea>
    <span class="field-help" id="help-${field}">${escapeHtml(help)}</span>
    ${fieldErrorMarkup(field, error)}
  </div>`;
}

function ratingField(field, label, value, error) {
  return `<div class="field">
    <label for="${field}">${escapeHtml(label)} <span>(required)</span></label>
    <select id="${field}" name="${field}" required data-field="${field}" ${describedBy(field, error)}>
      <option value="" ${value === "" ? "selected" : ""}>Choose a rating</option>
      ${[1, 2, 3, 4, 5].map((rating) => `<option value="${rating}" ${value === String(rating) ? "selected" : ""}>${rating}</option>`).join("")}
    </select>
    <span class="field-help" id="help-${field}">Choose a whole number from 1 to 5.</span>
    ${fieldErrorMarkup(field, error)}
  </div>`;
}

function orderedRows({ items, kind, state }) {
  const firstIncompletePreparation = kind === "preparation"
    ? items.findIndex((item) => !item.trim())
    : -1;
  return items.map((item, index) => {
    const title = kind === "preparation" ? `Preparation step ${index + 1}` : `Cook event ${index + 1}`;
    const path = kind === "preparation" ? "preparationSteps" : `cookEvents.${index}.event`;
    const error = kind === "preparation"
      ? fieldError(state, path) && index === (firstIncompletePreparation < 0 ? 0 : firstIncompletePreparation)
        ? fieldError(state, path)
        : undefined
      : fieldError(state, path);
    const helpPath = kind === "preparation" ? `${path}.${index}` : path;
    const observationPath = `cookEvents.${index}.observation`;
    const observationError = fieldError(state, observationPath);
    const content = kind === "preparation"
      ? `<div class="field">
          <label for="preparation-${index}">${title} <span>(required)</span></label>
          <input id="preparation-${index}" name="preparation-${index}" value="${escapeHtml(item)}" required data-field="preparationSteps" data-index="${index}" data-focus-key="preparation-${index}" ${describedBy(path, error, helpPath)}>
          <span class="field-help" id="help-${helpPath.replaceAll(".", "-")}">Enter this step in the order you performed it.</span>
          ${fieldErrorMarkup(path, error)}
        </div>`
      : `<div class="field">
          <label for="cook-event-${index}">${title} <span>(required)</span></label>
          <input id="cook-event-${index}" name="cook-event-${index}" value="${escapeHtml(item.event)}" required data-field="cookEvents.event" data-index="${index}" data-focus-key="cook-event-${index}" ${describedBy(path, error)}>
          <span class="field-help" id="help-${path.replaceAll(".", "-")}">Enter the event in the order it happened.</span>
          ${fieldErrorMarkup(path, error)}
        </div>
        <div class="field">
          <label for="cook-observation-${index}">Cook event ${index + 1} observation <span>(required)</span></label>
          <textarea id="cook-observation-${index}" name="cook-observation-${index}" required data-field="cookEvents.observation" data-index="${index}" ${describedBy(observationPath, observationError)}>${escapeHtml(item.observation)}</textarea>
          <span class="field-help" id="help-${observationPath.replaceAll(".", "-")}">Record what you observed at this point.</span>
          ${fieldErrorMarkup(observationPath, observationError)}
        </div>`;

    return `<li class="ordered-row">
      ${content}
      <div class="row-actions" aria-label="${title} order controls">
        <button type="button" data-action="move-${kind}" data-index="${index}" data-direction="-1" aria-label="Move ${title.toLowerCase()} up" ${index === 0 ? "disabled" : ""}>Move up</button>
        <button type="button" data-action="move-${kind}" data-index="${index}" data-direction="1" aria-label="Move ${title.toLowerCase()} down" ${index === items.length - 1 ? "disabled" : ""}>Move down</button>
        <button type="button" data-action="remove-${kind}" data-index="${index}" aria-label="Remove ${title.toLowerCase()}">Remove</button>
      </div>
    </li>`;
  }).join("");
}

function renderReview(log, index) {
  if (!log) {
    return `<p class="muted">Select a saved cook log to review its complete record.</p>`;
  }

  const list = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<article class="review-card" aria-labelledby="review-heading">
    <h3 id="review-heading" tabindex="-1">Cook log ${index + 1}: ${escapeHtml(log.meatType)}</h3>
    <dl class="record-summary">
      <dt>Meat type</dt><dd>${escapeHtml(log.meatType)}</dd>
      <dt>Initial weight</dt><dd>${escapeHtml(log.initialWeightKg)} kg</dd>
      <dt>Trimmed weight</dt><dd>${escapeHtml(log.trimmedWeightKg)} kg</dd>
      <dt>Seasonings</dt><dd>${log.seasonings.length ? escapeHtml(log.seasonings.join(", ")) : "None recorded"}</dd>
      <dt>Total cook time</dt><dd>${escapeHtml(log.totalCookMinutes)} minutes</dd>
      <dt>Final observations</dt><dd>${escapeHtml(log.finalObservations)}</dd>
      <dt>Appearance rating</dt><dd>${escapeHtml(log.appearanceRating)} out of 5</dd>
      <dt>Taste rating</dt><dd>${escapeHtml(log.tasteRating)} out of 5</dd>
      <dt>Texture rating</dt><dd>${escapeHtml(log.textureRating)} out of 5</dd>
    </dl>
    <section aria-labelledby="review-preparation-heading">
      <h4 id="review-preparation-heading">Preparation steps</h4>
      <ol>${list(log.preparationSteps)}</ol>
    </section>
    <section aria-labelledby="review-events-heading">
      <h4 id="review-events-heading">Cook events and observations</h4>
      ${log.cookEvents.length
        ? `<ol>${log.cookEvents.map(({ event, observation }) => `<li><strong>${escapeHtml(event)}</strong><p>${escapeHtml(observation)}</p></li>`).join("")}</ol>`
        : "<p>No intermediate cook events recorded.</p>"}
    </section>
  </article>`;
}

function renderSavedLogs(state) {
  if (state.loadStatus === "loading") {
    return `<p id="load-status" class="status" role="status" aria-live="polite" tabindex="-1">Loading saved cook logs…</p>`;
  }
  if (state.loadStatus === "failure") {
    return `<div class="error-panel" role="alert">
      <p>${escapeHtml(state.loadError)}</p>
      <button type="button" data-action="retry-load">Retry loading saved logs</button>
    </div>`;
  }
  if (state.logs.length === 0) {
    return `<div class="empty-state">
      <p>No cook logs have been saved yet.</p>
      <a class="button-link" href="#create">Create the first cook log</a>
    </div>`;
  }

  return `<div class="saved-layout">
    <ul class="saved-list" aria-label="Saved cook logs">
      ${state.logs.map((log, index) => `<li>
        <button type="button" id="log-review-${index}" data-action="review-log" data-index="${index}" ${state.selectedLogIndex === index ? 'aria-current="true"' : ""}>
          Review cook log ${index + 1}: ${escapeHtml(log.meatType)}
        </button>
      </li>`).join("")}
    </ul>
    <div class="review-content">${renderReview(
      state.selectedLogIndex === null ? null : state.logs[state.selectedLogIndex],
      state.selectedLogIndex ?? 0,
    )}</div>
  </div>`;
}

export function renderCookLogbook(state, draft) {
  const meatError = fieldError(state, "meatType");
  const initialWeightError = fieldError(state, "initialWeightKg");
  const trimmedWeightError = fieldError(state, "trimmedWeightKg");
  const seasoningsError = fieldError(state, "seasonings");
  const cookTimeError = fieldError(state, "totalCookMinutes");
  const finalObservationsError = fieldError(state, "finalObservations");
  const globalError = state.saveStatus === "validation"
    ? `<div class="error-panel validation-summary" role="alert" aria-live="assertive">
        <p>Cook log was not saved. Correct the highlighted fields.</p>
      <ul>${state.validationIssues.map(({ field, message }) => `<li><a href="#${validationTarget(field, draft)}">${escapeHtml(message)}</a></li>`).join("")}</ul>
      </div>`
    : state.saveStatus === "failure"
      ? `<div id="save-error" class="error-panel" role="alert" aria-live="assertive" tabindex="-1"><p>${escapeHtml(state.saveError)}</p></div>`
      : state.saveStatus === "success"
        ? `<p class="success-panel" role="status" aria-live="polite">Cook log saved. Review the complete record below.</p>`
        : state.saveStatus === "saving"
          ? `<p id="save-status" class="status" role="status" aria-live="polite" tabindex="-1">Saving cook log…</p>`
          : "";
  const ratingError = (field) => fieldError(state, field);

  return `<header class="page-header">
    <p class="eyebrow">BBQ Cook Logbook</p>
    <h1>Record a cook. Learn from it.</h1>
    <p>Capture one cook attempt, then browse the details whenever you need them.</p>
  </header>
  <main class="page-content">
    <section id="create" class="panel" aria-labelledby="create-heading">
      <h2 id="create-heading">Create a cook log</h2>
      ${globalError}
      <form id="cook-log-form" novalidate ${state.saveStatus === "saving" ? 'aria-busy="true"' : ""}>
        <div class="form-grid">
          ${textField({ id: "meatType", field: "meatType", label: "Meat type", value: draft.meatType, help: "For example, pork shoulder or beef brisket.", error: meatError })}
          ${textField({ id: "initialWeightKg", field: "initialWeightKg", label: "Initial weight (kg)", value: draft.initialWeightKg, type: "number", help: "Enter a positive weight in kilograms.", error: initialWeightError })}
          ${textField({ id: "trimmedWeightKg", field: "trimmedWeightKg", label: "Trimmed weight (kg)", value: draft.trimmedWeightKg, type: "number", help: "Enter a positive weight no greater than the initial weight.", error: trimmedWeightError })}
          ${textField({ id: "seasonings", field: "seasonings", label: "Seasonings", value: draft.seasonings, help: "Optional. Separate seasonings with commas; leave blank for none.", required: false, error: seasoningsError })}
        </div>
        <fieldset class="ordered-fieldset">
          <legend>Preparation steps <span>(at least one required; order is preserved)</span></legend>
          <ol class="ordered-entries">${orderedRows({ items: draft.preparationSteps, kind: "preparation", state })}</ol>
          <button type="button" data-action="add-preparation">Add preparation step</button>
        </fieldset>
        <fieldset class="ordered-fieldset">
          <legend>Intermediate cook events <span>(optional; order is preserved)</span></legend>
          <ol class="ordered-entries">${orderedRows({ items: draft.cookEvents, kind: "event", state })}</ol>
          <button type="button" data-action="add-event">Add cook event</button>
        </fieldset>
        <div class="form-grid">
          ${textField({ id: "totalCookMinutes", field: "totalCookMinutes", label: "Total cook time (minutes)", value: draft.totalCookMinutes, type: "number", help: "Enter a positive duration in minutes.", error: cookTimeError })}
          ${textareaField({ id: "finalObservations", field: "finalObservations", label: "Final observations", value: draft.finalObservations, help: "Describe the finished cook.", error: finalObservationsError })}
        </div>
        <fieldset class="ratings">
          <legend>Rate the finished cook <span>(each score from 1 to 5)</span></legend>
          <div class="form-grid">
            ${ratingField("appearanceRating", "Appearance rating", draft.appearanceRating, ratingError("appearanceRating"))}
            ${ratingField("tasteRating", "Taste rating", draft.tasteRating, ratingError("tasteRating"))}
            ${ratingField("textureRating", "Texture rating", draft.textureRating, ratingError("textureRating"))}
          </div>
        </fieldset>
        <button class="primary-button" type="submit" ${state.saveStatus === "saving" ? "disabled" : ""}>${state.saveStatus === "saving" ? "Saving…" : "Save cook log"}</button>
      </form>
    </section>
    <section class="panel" aria-labelledby="saved-heading">
      <h2 id="saved-heading" tabindex="-1">Saved cook logs</h2>
      ${renderSavedLogs(state)}
    </section>
  </main>
  <footer><p>Your log captures one cook attempt; no reusable recipe is created.</p></footer>`;
}
