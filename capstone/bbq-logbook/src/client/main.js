import { HttpCookLogService } from "./api.js";
import { createEmptyDraft, CookLogWorkflow, moveItem } from "./workflow.js";
import { renderCookLogbook } from "./view.js";

function readDraft(form, currentDraft) {
  const draft = {
    ...currentDraft,
    preparationSteps: [...currentDraft.preparationSteps],
    cookEvents: currentDraft.cookEvents.map((event) => ({ ...event })),
  };

  for (const control of form.querySelectorAll("[data-field]")) {
    const field = control.dataset.field;
    const index = Number(control.dataset.index);
    if (field === "preparationSteps") {
      draft.preparationSteps[index] = control.value;
    } else if (field === "cookEvents.event") {
      draft.cookEvents[index].event = control.value;
    } else if (field === "cookEvents.observation") {
      draft.cookEvents[index].observation = control.value;
    } else {
      draft[field] = control.value;
    }
  }

  return draft;
}

function focusWithin(root, selector) {
  root.querySelector(selector)?.focus();
}

export function mountCookLogbook(root, service = new HttpCookLogService()) {
  const workflow = new CookLogWorkflow(service);
  let draft = createEmptyDraft();
  const render = () => {
    root.innerHTML = renderCookLogbook(workflow.state, draft);
  };
  const unsubscribe = workflow.subscribe(render);

  root.addEventListener("input", (event) => {
    if (event.target.closest("#cook-log-form")) {
      draft = readDraft(root.querySelector("#cook-log-form"), draft);
    }
  });
  root.addEventListener("change", (event) => {
    if (event.target.closest("#cook-log-form")) {
      draft = readDraft(root.querySelector("#cook-log-form"), draft);
    }
  });
  root.addEventListener("submit", async (event) => {
    if (event.target.id !== "cook-log-form") {
      return;
    }
    event.preventDefault();
    draft = readDraft(event.target, draft);
    const saveRequest = workflow.save(draft);
    if (workflow.state.saveStatus === "saving") {
      focusWithin(root, "#save-status");
    }
    const saved = await saveRequest;
    if (saved) {
      draft = createEmptyDraft();
      render();
      focusWithin(root, "#log-review-0");
    } else {
      focusWithin(root, workflow.state.saveStatus === "failure" ? "#save-error" : ".validation-summary a");
    }
  });
  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const index = Number(button.dataset.index);
    switch (button.dataset.action) {
      case "retry-load":
        {
          const loadRequest = workflow.load();
          focusWithin(root, "#load-status");
          await loadRequest;
        }
        focusWithin(root, "#saved-heading");
        break;
      case "review-log":
        workflow.selectLog(index);
        focusWithin(root, "#review-heading");
        break;
      case "add-preparation":
        draft = readDraft(root.querySelector("#cook-log-form"), draft);
        draft.preparationSteps.push("");
        render();
        focusWithin(root, `[data-focus-key="preparation-${draft.preparationSteps.length - 1}"]`);
        break;
      case "remove-preparation":
        draft = readDraft(root.querySelector("#cook-log-form"), draft);
        draft.preparationSteps.splice(index, 1);
        if (draft.preparationSteps.length === 0) {
          draft.preparationSteps.push("");
        }
        render();
        focusWithin(root, `[data-focus-key="preparation-${Math.min(index, draft.preparationSteps.length - 1)}"]`);
        break;
      case "move-preparation":
        draft = readDraft(root.querySelector("#cook-log-form"), draft);
        draft.preparationSteps = moveItem(draft.preparationSteps, index, Number(button.dataset.direction));
        render();
        focusWithin(root, `[data-focus-key="preparation-${index + Number(button.dataset.direction)}"]`);
        break;
      case "add-event":
        draft = readDraft(root.querySelector("#cook-log-form"), draft);
        draft.cookEvents.push({ event: "", observation: "" });
        render();
        focusWithin(root, `[data-focus-key="cook-event-${draft.cookEvents.length - 1}"]`);
        break;
      case "remove-event":
        draft = readDraft(root.querySelector("#cook-log-form"), draft);
        draft.cookEvents.splice(index, 1);
        render();
        if (draft.cookEvents.length > 0) {
          focusWithin(root, `[data-focus-key="cook-event-${Math.min(index, draft.cookEvents.length - 1)}"]`);
        } else {
          focusWithin(root, '[data-action="add-event"]');
        }
        break;
      case "move-event":
        draft = readDraft(root.querySelector("#cook-log-form"), draft);
        draft.cookEvents = moveItem(draft.cookEvents, index, Number(button.dataset.direction));
        render();
        focusWithin(root, `[data-focus-key="cook-event-${index + Number(button.dataset.direction)}"]`);
        break;
      default:
        break;
    }
  });

  render();
  void workflow.load();
  return {
    workflow,
    getDraft: () => draft,
    destroy: () => {
      unsubscribe();
      root.replaceChildren();
    },
  };
}

if (typeof document !== "undefined") {
  const root = document.querySelector("#app");
  if (root) {
    mountCookLogbook(root);
  }
}
