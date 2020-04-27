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
    this.data = this.storage.get(this.key, {
      _version: "1",
      _last_updated: new Date().toISOString(),
    });
  }

  get(key, fallback) {
    const path = `dailies/${key}`;
    if (path in this.data) {
      return this.data[path];
    }
    return fallback;
  }

  update(key, value) {
    this.data._version = "1";
    this.data._last_updated = new Date().toISOString();
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

function main() {
  const state = new State();
  updateTimestamp(state.data._last_updated);
  state.data._last_updated;
  for (const daily of document.querySelectorAll("ac-daily")) {
    daily.dataset.initialValue = state.get(daily.dataset.key, false);
    daily.addEventListener("update", (event) => {
      state.update(daily.dataset.key, event.detail);
      updateTimestamp(state.data._last_updated);
    });
  }
  customElements.define("ac-daily", ACDailyElement);
  document.querySelector("#reset").addEventListener("click", () => {
    for (const daily of document.querySelectorAll("ac-daily")) {
      daily.value = false;
    }
  });
  document.querySelector(
    "#copyright-year"
  ).textContent = new Date().getFullYear();
}

main();
