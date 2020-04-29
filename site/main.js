class ACDailyElement extends HTMLElement {
  connectedCallback() {
    this._isInitializing = true;
    copyTemplate(this, "template-ac-daily");
    this.description = this.querySelector("[data-name='description']");
    this.checkbox = this.querySelector("[data-name='checkbox']");
    this.value = JSON.parse(this.dataset.initialValue);
    this.description.textContent = this.dataset.description;
    this.checkbox.addEventListener("change", (event) => {
      this.value = event.target.checked;
      track(
        "dailies",
        event.target.checked ? "check" : "uncheck",
        this.dataset.key
      );
    });
    this._isInitializing = false;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.checkbox.checked = value;
    this.dataset.state = value ? "complete" : "incomplete";
    if (!this._isInitializing) {
      dispatchEvent(this, "update", value);
    }
  }
}

class Storage {
  get(key, fallback) {
    const value = localStorage.getItem(key);
    if (value === null) {
      return fallback;
    }
    return JSON.parse(value);
  }

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

class State {
  constructor() {
    this.storage = new Storage();
    this.key = "state";
    this.data = this.storage.get(this.key, {});
    for (const key of Object.keys(this.data)) {
      if (!(key.startsWith("meta/") || key.startsWith("dailies/"))) {
        delete this.data[key];
      }
    }
    if (!("meta/version" in this.data)) {
      this.data["meta/version"] = "1";
    }
    if (!("meta/last-updated" in this.data)) {
      this.data["meta/last-updated"] = new Date().toISOString();
    }
  }

  get(key, fallback) {
    const path = `dailies/${key}`;
    if (path in this.data) {
      return this.data[path];
    }
    return fallback;
  }

  update(key, value) {
    this.data["meta/version"] = "1";
    this.data["meta/last-updated"] = new Date().toISOString();
    this.data[`dailies/${key}`] = value;
    this.storage.set(this.key, this.data);
  }
}

function dispatchEvent(element, name, detail) {
  const event = new CustomEvent(name, { detail });
  element.dispatchEvent(event);
}

function copyTemplate(element, id) {
  element.innerHTML = "";
  element.appendChild(document.getElementById(id).content.cloneNode(true));
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function updateTimestamp(timestamp) {
  const lastUpdated = document.querySelector("[data-name='last-updated']");
  const date = new Date(timestamp);
  lastUpdated.textContent = formatDate(date);
}

function track(category, action, label) {
  gtag("event", action, {
    event_category: category,
    event_label: label,
  });
  console.log(category, action, label);
}

function main() {
  const state = new State();
  updateTimestamp(state.data["meta/last-updated"]);
  for (const daily of document.querySelectorAll("ac-daily")) {
    daily.dataset.initialValue = state.get(daily.dataset.key, false);
    daily.addEventListener("update", (event) => {
      state.update(daily.dataset.key, event.detail);
      updateTimestamp(state.data["meta/last-updated"]);
    });
  }
  customElements.define("ac-daily", ACDailyElement);
  document.querySelector("#reset").addEventListener("click", () => {
    for (const daily of document.querySelectorAll("ac-daily")) {
      daily.value = false;
    }
    track("reset", "click", "reset-dailies");
  });
  document.querySelector(
    "#copyright-year"
  ).textContent = new Date().getFullYear();
}

main();
