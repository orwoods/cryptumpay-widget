"use strict";
var CPayV3 = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/app.ts
  var app_exports = {};
  __export(app_exports, {
    button: () => button
  });

  // src/config.ts
  var Config = class {
    getApiBaseUrl() {
      return "http://api.cryptumpay.local";
    }
  };
  var config = new Config();

  // src/store/storeUnit.ts
  var StoreUnit = class {
    name;
    constructor(name) {
      this.name = name;
    }
    key(key) {
      return `${this.name}:${key}`;
    }
  };

  // src/store/storages/memoryStorageStoreUnit.ts
  var MemoryStorageStoreUnit = class extends StoreUnit {
    items = {};
    set(key, value) {
      this.items[key] = value;
    }
    get(key) {
      return this.items[key] || null;
    }
    remove(key) {
      delete this.items[key];
    }
  };

  // src/store/index.ts
  var Store = class {
    auth;
    constructor() {
      this.auth = new MemoryStorageStoreUnit("auth");
    }
    setAccessToken(accessToken) {
      this.auth.set("jwtAccessToken", accessToken);
    }
    getAccessToken() {
      return this.auth.get("jwtAccessToken");
    }
    forgetSensitiveData() {
      this.auth.remove("jwtAccessToken");
    }
  };
  var store = new Store();

  // src/auth.ts
  var Auth = class {
    config;
    store;
    logged = false;
    isInitialization = false;
    initialized = false;
    onReady;
    constructor(config2, store2) {
      this.config = config2;
      this.store = store2;
      this.onReady = [];
    }
    get isLogged() {
      return this.logged;
    }
    get isReady() {
      return this.initialized;
    }
    async ready() {
      if (this.initialized) {
        return;
      }
      const promise = new Promise((resolve) => {
        this.onReady.push(resolve);
      });
      if (!this.isInitialization) {
        this.isInitialization = true;
        this.init();
      }
      return promise;
    }
    async init() {
      await this.refreshToken();
      this.initialized = true;
      this.isInitialization = false;
      for (const resolve of this.onReady) {
        resolve();
      }
    }
    async refreshToken() {
      const url = `${this.config.getApiBaseUrl()}/user/refresh-token`;
      return new Promise((resolve) => {
        fetch(url, { method: "POST", credentials: "include" }).then((response) => {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          return response.json();
        }).then((data) => {
          if (!data.accessToken) {
            throw new Error("Invalid response");
          }
          this.logged = true;
          this.store.setAccessToken(data.accessToken);
          resolve();
        }).catch((error) => {
          if (error.message !== "Unauthorized") {
            console.warn(error);
          }
          resolve();
        });
      });
    }
    async logout() {
      const url = `${this.config.getApiBaseUrl()}/user/logout`;
      return new Promise((resolve) => {
        fetch(url, { method: "POST", credentials: "include" }).then((response) => response.json()).then((data) => {
          this.logged = false;
          this.store.forgetSensitiveData();
          resolve(true);
        }).catch((error) => {
          console.warn(error);
          resolve(false);
        });
      });
    }
  };
  var auth = new Auth(config, store);

  // src/currencies/utils.ts
  var getCurrencyHash = ({ id, network, ticker, chain, contract }) => {
    const arr = [id, network, ticker, chain, contract];
    if (!arr.every((part) => part.length > 0)) {
      throw new Error("Malformed currency");
    }
    const str = arr.join(":");
    const hash = Buffer.from(str).toString("hex").substring(0, 40 - 1 - str.length);
    return hash;
  };
  var checkCurrency = (currency) => {
    if (!currency || typeof currency !== "string") {
      throw new Error("Invalid currency");
    }
    const parts = currency.split(":");
    if (parts.length !== 6 || currency.length !== 40) {
      throw new Error("Wrong format of the currency");
    }
    const [id, network, ticker, chain, contract, hash] = parts;
    const currencyHash = getCurrencyHash({ id, network, ticker, chain, contract });
    if (currencyHash !== hash) {
      throw new Error("Wrong currency hash");
    }
  };

  // src/buttonConfig.ts
  var ButtonConfig = class {
    #callback;
    #orderId;
    #customerId;
    #merchantId;
    #amount;
    #canEditAmount;
    #currency;
    #description;
    constructor(callback) {
      this.#callback = callback;
    }
    setOrderId(value) {
      if (this.#orderId === value) {
        return;
      }
      this.#orderId = value;
      this.#callback();
    }
    setCustomerId(value) {
      if (this.#customerId === value) {
        return;
      }
      this.#customerId = value;
      this.#callback();
    }
    setMerchantId(value) {
      if (this.#merchantId === value) {
        return;
      }
      this.#merchantId = value;
      this.#callback();
    }
    setPrice(amount, currency, canEditAmount) {
      if (this.#amount === amount && this.#currency === currency && this.#canEditAmount === canEditAmount) {
        return;
      }
      checkCurrency(currency);
      this.#amount = amount;
      this.#currency = currency;
      this.#canEditAmount = canEditAmount;
      this.#callback();
    }
    setDescription(value) {
      if (this.#description === value) {
        return;
      }
      this.#description = value;
      this.#callback();
    }
    getSettings() {
      return {
        orderId: this.#orderId,
        customerId: this.#customerId,
        merchantId: this.#merchantId,
        amount: this.#amount,
        canEditAmount: this.#canEditAmount,
        currency: this.#currency,
        description: this.#description
      };
    }
  };

  // src/element.ts
  var CPayElement = class {
    findElement(elementId) {
      const container = document.getElementById(elementId);
      if (container) {
        return container;
      }
      throw new Error(`Unknown element ${elementId}.`);
    }
  };

  // src/button.ts
  var Button = class extends CPayElement {
    config;
    constructor() {
      super();
      this.config = new ButtonConfig(() => this.update());
    }
    getConfig() {
      return this.config;
    }
    async create(elementId) {
      await auth.ready();
      this.createNew(this.findElement(elementId));
    }
    update() {
      if (!auth.isReady) {
        return;
      }
      console.warn("update", this.config.getSettings());
    }
    createNew(container) {
      console.warn("createNew", this.config.getSettings());
      const widget = document.createElement("div");
      widget.id = "widget";
      const widgetPay = document.createElement("div");
      widgetPay.id = "widget_pay";
      widgetPay.className = "wide";
      widgetPay.textContent = "Pay with CryptumPay";
      widget.appendChild(widgetPay);
      container.appendChild(widget);
    }
  };

  // _13wlrd5yd:/Volumes/Projects/cryptumpay/widget/src/styles.css
  var styles_default = "#widget{width:300px;margin:20px;border:1px solid #aeaeae;border-radius:6px;display:flex;align-items:center;box-sizing:border-box;align-items:stretch}#widget_pay{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-family:Verdana,Geneva,Tahoma,sans-serif;background:#61c3ff;color:#fff;cursor:pointer}#widget_pay.wide{padding:15px 0}#widget_pay:hover{background:#38b3ff}#widget_settings{display:flex;flex-direction:column;text-align:center;max-width:50%;background:#ade0ff;color:#6f6f6f;text-align:right}#widget_wallet{cursor:pointer;text-align:right}#widget_wallet:hover{background:#98d7ff}#widget_settings>div{padding:3px 20px}";

  // src/style.ts
  var addStyles = () => {
    const style = document.createElement("style");
    style.textContent = styles_default;
    document.head.appendChild(style);
  };

  // src/app.ts
  addStyles();
  var button = (id) => {
    const button2 = new Button();
    button2.create(id);
    return button2.getConfig();
  };
  return __toCommonJS(app_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9hdXRoLnRzIiwgIi4uL3NyYy9jdXJyZW5jaWVzL3V0aWxzLnRzIiwgIi4uL3NyYy9idXR0b25Db25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnQudHMiLCAiLi4vc3JjL2J1dHRvbi50cyIsICJfMTN3bHJkNXlkOi9Wb2x1bWVzL1Byb2plY3RzL2NyeXB0dW1wYXkvd2lkZ2V0L3NyYy9zdHlsZXMuY3NzIiwgIi4uL3NyYy9zdHlsZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi9idXR0b24nO1xuaW1wb3J0IHsgYWRkU3R5bGVzIH0gZnJvbSAnLi9zdHlsZSc7XG5cbmFkZFN0eWxlcygpO1xuXG5leHBvcnQgY29uc3QgYnV0dG9uID0gKGlkOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgYnV0dG9uID0gbmV3IEJ1dHRvbigpO1xuXG4gIGJ1dHRvbi5jcmVhdGUoaWQpO1xuXG4gIHJldHVybiBidXR0b24uZ2V0Q29uZmlnKCk7XG59O1xuIiwgImltcG9ydCB7IElDb25maWcgfSBmcm9tICcuL3R5cGVzJztcblxuY2xhc3MgQ29uZmlnIGltcGxlbWVudHMgSUNvbmZpZyB7XG4gIGdldEFwaUJhc2VVcmwgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdodHRwOi8vYXBpLmNyeXB0dW1wYXkubG9jYWwnO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBuZXcgQ29uZmlnKCk7XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgc3RvcmUgfSBmcm9tICcuL3N0b3JlJztcbmltcG9ydCB7IElDb25maWcsIElTdG9yZSwgSUF1dGggfSBmcm9tICcuL3R5cGVzJztcblxuY2xhc3MgQXV0aCBpbXBsZW1lbnRzIElBdXRoIHtcbiAgcHJpdmF0ZSBjb25maWc6IElDb25maWc7XG4gIHByaXZhdGUgc3RvcmU6IElTdG9yZTtcblxuICBwcml2YXRlIGxvZ2dlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIG9uUmVhZHk6ICgodmFsdWU6IHZvaWQpID0+IHZvaWQpW107XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yIChjb25maWc6IElDb25maWcsIHN0b3JlOiBJU3RvcmUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gICAgdGhpcy5vblJlYWR5ID0gW107XG4gIH1cblxuICBwdWJsaWMgZ2V0IGlzTG9nZ2VkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5sb2dnZWQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGlzUmVhZHkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmluaXRpYWxpemVkO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlYWR5ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5vblJlYWR5LnB1c2gocmVzb2x2ZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXphdGlvbikge1xuICAgICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gdHJ1ZTtcblxuICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbiAgcHJpdmF0ZSBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hUb2tlbigpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IHJlc29sdmUgb2YgdGhpcy5vblJlYWR5KSB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoVG9rZW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHVybCA9IGAke3RoaXMuY29uZmlnLmdldEFwaUJhc2VVcmwoKX0vdXNlci9yZWZyZXNoLXRva2VuYDtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgZmV0Y2godXJsLCB7IG1ldGhvZDogJ1BPU1QnLCBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hdXRob3JpemVkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICBpZiAoIWRhdGEuYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCByZXNwb25zZScpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMubG9nZ2VkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnN0b3JlLnNldEFjY2Vzc1Rva2VuKGRhdGEuYWNjZXNzVG9rZW4pO1xuXG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yLm1lc3NhZ2UgIT09ICdVbmF1dGhvcml6ZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgbG9nb3V0ICgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9L3VzZXIvbG9nb3V0YDtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgZmV0Y2godXJsLCB7IG1ldGhvZDogJ1BPU1QnLCBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICB0aGlzLmxvZ2dlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuc3RvcmUuZm9yZ2V0U2Vuc2l0aXZlRGF0YSgpO1xuXG4gICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG5cbiAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGF1dGggPSBuZXcgQXV0aChjb25maWcsIHN0b3JlKTtcbiIsICJleHBvcnQgY29uc3QgZ2V0Q3VycmVuY3lIYXNoID0gKHsgaWQsIG5ldHdvcmssIHRpY2tlciwgY2hhaW4sIGNvbnRyYWN0IH06IHtcbiAgaWQ6IHN0cmluZztcbiAgbmV0d29yazogc3RyaW5nO1xuICB0aWNrZXI6IHN0cmluZztcbiAgY2hhaW46IHN0cmluZztcbiAgY29udHJhY3Q6IHN0cmluZztcbn0pOiBzdHJpbmcgPT4ge1xuICBjb25zdCBhcnIgPSBbaWQsIG5ldHdvcmssIHRpY2tlciwgY2hhaW4sIGNvbnRyYWN0XTtcbiAgaWYgKCFhcnIuZXZlcnkoKHBhcnQpID0+IHBhcnQubGVuZ3RoID4gMCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01hbGZvcm1lZCBjdXJyZW5jeScpO1xuICB9XG5cbiAgY29uc3Qgc3RyID0gYXJyLmpvaW4oJzonKTtcbiAgY29uc3QgaGFzaCA9IEJ1ZmZlci5mcm9tKHN0cikudG9TdHJpbmcoJ2hleCcpLnN1YnN0cmluZygwLCA0MCAtIDEgLSBzdHIubGVuZ3RoKTtcblxuICByZXR1cm4gaGFzaDtcbn07XG5cbmV4cG9ydCBjb25zdCBjaGVja0N1cnJlbmN5ID0gKGN1cnJlbmN5OiBzdHJpbmcpID0+IHtcbiAgaWYgKCFjdXJyZW5jeSB8fCB0eXBlb2YgY3VycmVuY3kgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGN1cnJlbmN5Jyk7XG4gIH1cblxuICBjb25zdCBwYXJ0cyA9IGN1cnJlbmN5LnNwbGl0KCc6Jyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggIT09IDYgfHwgY3VycmVuY3kubGVuZ3RoICE9PSA0MCkge1xuICAgIHRocm93IG5ldyBFcnJvcignV3JvbmcgZm9ybWF0IG9mIHRoZSBjdXJyZW5jeScpO1xuICB9XG5cbiAgY29uc3QgW2lkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdCwgaGFzaF0gPSBwYXJ0cztcblxuICBjb25zdCBjdXJyZW5jeUhhc2ggPSBnZXRDdXJyZW5jeUhhc2goeyBpZCwgbmV0d29yaywgdGlja2VyLCBjaGFpbiwgY29udHJhY3QgfSk7XG5cbiAgaWYgKGN1cnJlbmN5SGFzaCAhPT0gaGFzaCkge1xuICAgIHRocm93IG5ldyBFcnJvcignV3JvbmcgY3VycmVuY3kgaGFzaCcpO1xuICB9XG59O1xuIiwgImltcG9ydCB7IGNoZWNrQ3VycmVuY3kgfSBmcm9tICcuL2N1cnJlbmNpZXMvdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uQ29uZmlnIHtcbiAgI2NhbGxiYWNrOiAoKSA9PiB2b2lkO1xuXG4gICNvcmRlcklkPzogc3RyaW5nO1xuICAjY3VzdG9tZXJJZD86IHN0cmluZztcbiAgI21lcmNoYW50SWQ/OiBzdHJpbmc7XG4gICNhbW91bnQ/OiBudW1iZXI7XG4gICNjYW5FZGl0QW1vdW50PzogYm9vbGVhbjtcbiAgI2N1cnJlbmN5Pzogc3RyaW5nO1xuICAjZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy4jY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgfVxuXG4gIHB1YmxpYyBzZXRPcmRlcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI29yZGVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jb3JkZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRDdXN0b21lcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2N1c3RvbWVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jY3VzdG9tZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRNZXJjaGFudElkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI21lcmNoYW50SWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jbWVyY2hhbnRJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRQcmljZSAoYW1vdW50OiBudW1iZXIsIGN1cnJlbmN5OiBzdHJpbmcsIGNhbkVkaXRBbW91bnQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy4jYW1vdW50ID09PSBhbW91bnQgJiYgdGhpcy4jY3VycmVuY3kgPT09IGN1cnJlbmN5ICYmIHRoaXMuI2NhbkVkaXRBbW91bnQgPT09IGNhbkVkaXRBbW91bnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaGVja0N1cnJlbmN5KGN1cnJlbmN5KTtcblxuICAgIHRoaXMuI2Ftb3VudCA9IGFtb3VudDtcbiAgICB0aGlzLiNjdXJyZW5jeSA9IGN1cnJlbmN5O1xuICAgIHRoaXMuI2NhbkVkaXRBbW91bnQgPSBjYW5FZGl0QW1vdW50O1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXREZXNjcmlwdGlvbiAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNkZXNjcmlwdGlvbiA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNkZXNjcmlwdGlvbiA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRTZXR0aW5ncyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9yZGVySWQ6IHRoaXMuI29yZGVySWQsXG4gICAgICBjdXN0b21lcklkOiB0aGlzLiNjdXN0b21lcklkLFxuICAgICAgbWVyY2hhbnRJZDogdGhpcy4jbWVyY2hhbnRJZCxcbiAgICAgIGFtb3VudDogdGhpcy4jYW1vdW50LFxuICAgICAgY2FuRWRpdEFtb3VudDogdGhpcy4jY2FuRWRpdEFtb3VudCxcbiAgICAgIGN1cnJlbmN5OiB0aGlzLiNjdXJyZW5jeSxcbiAgICAgIGRlc2NyaXB0aW9uOiB0aGlzLiNkZXNjcmlwdGlvbixcbiAgICB9O1xuICB9XG59XG4iLCAiZXhwb3J0IGNsYXNzIENQYXlFbGVtZW50IHtcbiAgcHVibGljIGZpbmRFbGVtZW50IChlbGVtZW50SWQ6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGVsZW1lbnQgJHtlbGVtZW50SWR9LmApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4vYXV0aCc7XG5pbXBvcnQgeyBCdXR0b25Db25maWcgfSBmcm9tICcuL2J1dHRvbkNvbmZpZyc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4vZWxlbWVudCc7XG5cbmV4cG9ydCBjbGFzcyBCdXR0b24gZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgY29uZmlnOiBCdXR0b25Db25maWc7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IG5ldyBCdXR0b25Db25maWcoKCkgPT4gdGhpcy51cGRhdGUoKSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q29uZmlnICgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWc7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgY3JlYXRlIChlbGVtZW50SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGF1dGgucmVhZHkoKTtcblxuICAgIHRoaXMuY3JlYXRlTmV3KHRoaXMuZmluZEVsZW1lbnQoZWxlbWVudElkKSk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZSAoKTogdm9pZCB7XG4gICAgaWYgKCFhdXRoLmlzUmVhZHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVOZXcgKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zb2xlLndhcm4oJ2NyZWF0ZU5ldycsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuXG4gICAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgICBjb25zdCB3aWRnZXRQYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRQYXkuaWQgPSAnd2lkZ2V0X3BheSc7XG4gICAgd2lkZ2V0UGF5LmNsYXNzTmFtZSA9ICd3aWRlJztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5IHdpdGggQ3J5cHR1bVBheSc7XG5cbiAgICB3aWRnZXQuYXBwZW5kQ2hpbGQod2lkZ2V0UGF5KTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQod2lkZ2V0KTtcbiAgfVxufVxuIiwgIiN3aWRnZXR7d2lkdGg6MzAwcHg7bWFyZ2luOjIwcHg7Ym9yZGVyOjFweCBzb2xpZCAjYWVhZWFlO2JvcmRlci1yYWRpdXM6NnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Ym94LXNpemluZzpib3JkZXItYm94O2FsaWduLWl0ZW1zOnN0cmV0Y2h9I3dpZGdldF9wYXl7ZmxleC1ncm93OjE7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2ZvbnQtc2l6ZToxNXB4O2ZvbnQtZmFtaWx5OlZlcmRhbmEsR2VuZXZhLFRhaG9tYSxzYW5zLXNlcmlmO2JhY2tncm91bmQ6IzYxYzNmZjtjb2xvcjojZmZmO2N1cnNvcjpwb2ludGVyfSN3aWRnZXRfcGF5LndpZGV7cGFkZGluZzoxNXB4IDB9I3dpZGdldF9wYXk6aG92ZXJ7YmFja2dyb3VuZDojMzhiM2ZmfSN3aWRnZXRfc2V0dGluZ3N7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt0ZXh0LWFsaWduOmNlbnRlcjttYXgtd2lkdGg6NTAlO2JhY2tncm91bmQ6I2FkZTBmZjtjb2xvcjojNmY2ZjZmO3RleHQtYWxpZ246cmlnaHR9I3dpZGdldF93YWxsZXR7Y3Vyc29yOnBvaW50ZXI7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldDpob3ZlcntiYWNrZ3JvdW5kOiM5OGQ3ZmZ9I3dpZGdldF9zZXR0aW5ncz5kaXZ7cGFkZGluZzozcHggMjBweH0iLCAiLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHN0eWxlcyBmcm9tICdzYXNzOi4vc3R5bGVzLmNzcyc7XG5cbmV4cG9ydCBjb25zdCBhZGRTdHlsZXMgPSAoKTogdm9pZCA9PiB7XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBzdHlsZXM7XG5cbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0VBLE1BQU0sU0FBTixNQUFnQztBQUFBLElBQzlCLGdCQUF5QjtBQUN2QixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFTyxNQUFNLFNBQVMsSUFBSSxPQUFPOzs7QUNSMUIsTUFBZSxZQUFmLE1BQXlCO0FBQUEsSUFDcEI7QUFBQSxJQUVWLFlBQWEsTUFBYztB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
