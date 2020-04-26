class ACDailyElement extends HTMLElement {
  connectedCallback() {
    copyTemplate(this, "template-ac-daily");
    this.description = this.querySelector("[data-name='description']");
    this.checkbox = this.querySelector("[data-name='checkbox']");
    this.value = JSON.parse(this.dataset.initialValue);
    this.description.textContent = this.dataset.description;
    this.checkbox.addEventListener("change", (event) => {
      this.value = event.target.checked;
    });
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.checkbox.checked = value;
    this.dataset.state = value ? "complete" : "incomplete";
    dispatchEvent(this, "update", value);
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

function main() {
  const state = new State();
  const lastUpdated = document.querySelector("[data-name='last-updated']");
  for (const daily of document.querySelectorAll("ac-daily")) {
    daily.dataset.initialValue = state.get(daily.dataset.key, false);
    daily.addEventListener("update", (event) => {
      console.log(daily.dataset.key, event.detail);
      state.update(daily.dataset.key, event.detail);
      const date = new Date(state.data._last_updated);
      lastUpdated.textContent = formatDate(date);
    });
  }
  customElements.define("ac-daily", ACDailyElement);
}

main();
