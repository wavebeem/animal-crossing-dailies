class ACDailyElement extends HTMLElement {
  connectedCallback() {
    switch (this.dataset.type) {
      case "number": {
        copyTemplate(this, "template-ac-daily-number");
        this.label = this.querySelector("[data-name='label']");
        this.current = this.querySelector("[data-name='current']");
        this.max = this.querySelector("[data-name='max']");
        this.increment = this.querySelector("[data-name='increment']");
        this.decrement = this.querySelector("[data-name='decrement']");
        this.value = +this.dataset.initialValue || 0;
        this.label.textContent = this.dataset.name;
        this.label.htmlFor = this.dataset.key;
        this.current.id = this.dataset.key;
        this.max.textContent = this.dataset.max;
        this.increment.addEventListener("click", () => {
          this.value = Math.min(+this.dataset.max, +this.value + 1);
        });
        this.decrement.addEventListener("click", () => {
          this.value = Math.max(0, +this.value - 1);
        });
        break;
      }
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
    this._value = value;
    this.current.value = value;
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

function main() {
  const state = new State();
  for (const daily of document.querySelectorAll("ac-daily")) {
    daily.dataset.initialValue = state.get(daily.dataset.key);
    daily.addEventListener("change", (event) => {
      state.update(daily.dataset.key, event.detail);
    });
  }
  customElements.define("ac-daily", ACDailyElement);
}

main();
