class ACDailyElement extends HTMLElement {
  connectedCallback() {
    switch (this.dataset.type) {
      case "number": {
        copyTemplate(this, "template-ac-daily-number");
        this.description = this.querySelector("[data-name='description']");
        this.current = this.querySelector("[data-name='current']");
        this.increment = this.querySelector("[data-name='increment']");
        this.decrement = this.querySelector("[data-name='decrement']");
        this.value = +this.dataset.initialValue || 0;
        this.description.textContent = this.dataset.description;
        this.description.htmlFor = this.dataset.key;
        this.current.id = this.dataset.key;
        this.increment.addEventListener("click", () => {
          this.value = Math.min(+this.dataset.max, +this.value + 1);
        });
        this.decrement.addEventListener("click", () => {
          this.value = Math.max(0, +this.value - 1);
        });
        break;
      }
      // case "boolean":
      default: {
        this.textContent = `TODO: type ${this.dataset.type}`;
        break;
      }
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    switch (this.dataset.type) {
      case "number": {
        this.current.value = `${value} / ${this.dataset.max}`;
        this.dataset.state =
          +value === +this.dataset.max ? "complete" : "incomplete";
        break;
      }
      case "boolean": {
        this.current.checked = value;
        this.dataset.state === value ? "complete" : "incomplete";
      }
      default: {
        throw new Error("TODO");
      }
    }
    this._value = value;
    dispatchEvent(this, "change", value);
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

  get(key) {
    return this.data[`dailies/${key}`];
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
  const lastUpdated = document.querySelector("[data-name=last-updated]");
  for (const daily of document.querySelectorAll("ac-daily")) {
    daily.dataset.initialValue = state.get(daily.dataset.key);
    daily.addEventListener("change", (event) => {
      state.update(daily.dataset.key, event.detail);
      const date = new Date(state.data._last_updated);
      lastUpdated.textContent = formatDate(date);
    });
  }
  customElements.define("ac-daily", ACDailyElement);
}

main();
