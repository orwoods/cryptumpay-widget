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
    create: () => create
  });

  // src/config.ts
  var Config = class {
    getApiBaseUrl() {
      return "http://api.cryptumpay.local";
    }
    getJwtRefreshInterval() {
      return 30 * 1e3;
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

  // src/services/auth.ts
  var Auth = class {
    config;
    store;
    logged = false;
    isInitialization = false;
    initialized = false;
    onReady;
    autoRefreshToken;
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
    unload() {
      this.logged = false;
      this.isInitialization = false;
      this.initialized = false;
      this.store.forgetSensitiveData();
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
      if (this.autoRefreshToken) {
        clearInterval(this.autoRefreshToken);
      }
      return new Promise((resolve) => {
        fetch(url, { method: "POST", credentials: "include" }).then((response) => {
          if (response.status === 401) {
            this.logged = false;
            this.store.forgetSensitiveData();
            throw new Error("Unauthorized");
          }
          return response.json();
        }).then((data) => {
          if (!data.accessToken) {
            throw new Error("Invalid response");
          }
          this.logged = true;
          this.store.setAccessToken(data.accessToken);
          this.autoRefreshToken = setInterval(() => this.refreshToken(), this.config.getJwtRefreshInterval());
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

  // _3irhos5o8:/Volumes/Projects/cryptumpay/widget/src/style/styles.css
  var styles_default = "#widget{width:300px;margin:20px;border:1px solid #aeaeae;border-radius:6px;display:flex;align-items:center;box-sizing:border-box;align-items:stretch}#widget_pay{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-family:Verdana,Geneva,Tahoma,sans-serif;background:#61c3ff;color:#fff;cursor:pointer}#widget_pay.wide{padding:15px 0}#widget_pay:hover{background:#38b3ff}#widget_settings{display:flex;flex-direction:column;text-align:center;max-width:50%;background:#ade0ff;color:#6f6f6f;text-align:right}#widget_wallet{cursor:pointer;text-align:right}#widget_wallet:hover{background:#98d7ff}#widget_settings>div{padding:3px 20px}";

  // src/style/index.ts
  var getStyles = () => styles_default;

  // src/services/dom.ts
  var Dom = class {
    injectedTags = [];
    injectElement(container, element) {
      container.appendChild(element);
      this.injectedTags.push(element);
    }
    injectStyles() {
      const tag = document.createElement("style");
      tag.textContent = getStyles();
      this.injectElement(document.head, tag);
    }
    findElement(elementId) {
      const container = document.getElementById(elementId);
      if (container) {
        return container;
      }
      throw new Error(`Unknown element ${elementId}.`);
    }
    unload() {
      for (const tag of this.injectedTags.reverse()) {
        if (tag) {
          tag.remove();
        }
      }
      this.injectedTags = [];
    }
  };
  var dom = new Dom();

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

  // src/elements/widget/config.ts
  var WidgetConfig = class {
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

  // src/elements/element.ts
  var CPayElement = class {
    container;
    rootItems = [];
    parent;
    childs = [];
    constructor(container) {
      this.container = container;
    }
    async init() {
      return this;
    }
    unload() {
    }
    cascadeUnload() {
      this.childs.forEach((child) => child.cascadeUnload());
      this.childs = [];
      this.unload();
      this.parent = void 0;
      this.container = void 0;
      this.rootItems = [];
    }
    setParent(parent) {
      this.parent = parent;
    }
    setContainer(container) {
      this.container = container;
    }
    registerRootItems(rootItems) {
      this.rootItems = rootItems;
    }
    getParent() {
      return this.parent;
    }
    getContainer() {
      return this.container;
    }
    getRootItems() {
      return this.rootItems;
    }
    addChild(child, container) {
      container = container || this.container;
      if (!container) {
        throw new Error("Container was not set");
      }
      const rootItems = child.getRootItems();
      if (!rootItems.length) {
        throw new Error("Root items was not set");
      }
      this.childs.push(child);
      child.setParent(this);
      for (const rootItem of rootItems) {
        dom.injectElement(container, rootItem);
      }
    }
  };

  // src/elements/widget/button.anonymous.ts
  var ButtonAnonymous = class extends CPayElement {
    async init() {
      const widgetPay = document.createElement("div");
      widgetPay.id = "widget_pay";
      widgetPay.className = "wide";
      widgetPay.textContent = "Pay with CryptumPay";
      this.registerRootItem(widgetPay);
      return this;
    }
  };

  // src/elements/widget/button.logged.ts
  var ButtonLogged = class extends CPayElement {
    async init() {
      const widgetPay = document.createElement("div");
      widgetPay.id = "widget_pay";
      widgetPay.textContent = "Pay";
      const widgetSettings = document.createElement("div");
      widgetSettings.id = "widget_settings";
      const widgetPrice = document.createElement("div");
      widgetPrice.id = "widget_price";
      widgetPrice.textContent = "100500 USDT";
      const widgetWallet = document.createElement("div");
      widgetWallet.id = "widget_wallet";
      const walletSpan = document.createElement("span");
      walletSpan.textContent = "3TN\u20269FA";
      const arrowSpan = document.createElement("span");
      arrowSpan.innerHTML = "&#9662;";
      widgetWallet.appendChild(walletSpan);
      widgetWallet.appendChild(arrowSpan);
      widgetSettings.appendChild(widgetPrice);
      widgetSettings.appendChild(widgetWallet);
      this.registerRootItems([widgetPay, widgetSettings]);
      return this;
    }
  };

  // src/elements/widget/index.ts
  var Widget = class extends CPayElement {
    config;
    constructor() {
      super();
      this.config = new WidgetConfig(() => this.update());
    }
    getConfig() {
      return this.config;
    }
    async init() {
      await auth.ready();
      const widget = document.createElement("div");
      widget.id = "widget";
      if (!auth.isLogged) {
        this.addChild(await new ButtonLogged(widget).init(), widget);
      } else {
        this.addChild(await new ButtonAnonymous(widget).init(), widget);
      }
      this.registerRootItems([widget]);
      return this;
    }
    update() {
      if (!auth.isReady) {
        return;
      }
    }
  };

  // src/elements/root.ts
  var Root = class _Root extends CPayElement {
    static RegisteredIds = /* @__PURE__ */ new Set();
    id;
    constructor(id) {
      if (_Root.RegisteredIds.has(id)) {
        throw new Error(`Id ${id} is already in use`);
      }
      super(dom.findElement(id));
      _Root.RegisteredIds.add(id);
      this.id = id;
    }
    async init() {
      await auth.ready();
      return this;
    }
    unload() {
      _Root.RegisteredIds.delete(this.id);
    }
  };

  // src/app.ts
  var create = async (id) => {
    const root = new Root(id);
    const widget = new Widget();
    dom.injectStyles();
    await Promise.all([root.init(), widget.init()]);
    root.addChild(widget);
    return {
      remove: () => {
        root.cascadeUnload();
        dom.unload();
        auth.unload();
      },
      config: widget.getConfig()
    };
  };
  return __toCommonJS(app_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9hdXRoLnRzIiwgIl8zaXJob3M1bzg6L1ZvbHVtZXMvUHJvamVjdHMvY3J5cHR1bXBheS93aWRnZXQvc3JjL3N0eWxlL3N0eWxlcy5jc3MiLCAiLi4vc3JjL3N0eWxlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9kb20udHMiLCAiLi4vc3JjL2N1cnJlbmNpZXMvdXRpbHMudHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9jb25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2VsZW1lbnQudHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9idXR0b24uYW5vbnltb3VzLnRzIiwgIi4uL3NyYy9lbGVtZW50cy93aWRnZXQvYnV0dG9uLmxvZ2dlZC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2luZGV4LnRzIiwgIi4uL3NyYy9lbGVtZW50cy9yb290LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IGRvbSB9IGZyb20gJy4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IFdpZGdldCB9IGZyb20gJy4vZWxlbWVudHMvd2lkZ2V0JztcbmltcG9ydCB7IFJvb3QgfSBmcm9tICcuL2VsZW1lbnRzL3Jvb3QnO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlID0gYXN5bmMgKGlkOiBzdHJpbmcpID0+IHtcbiAgY29uc3Qgcm9vdCA9IG5ldyBSb290KGlkKTtcbiAgY29uc3Qgd2lkZ2V0ID0gbmV3IFdpZGdldCgpO1xuXG4gIGRvbS5pbmplY3RTdHlsZXMoKTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChbcm9vdC5pbml0KCksIHdpZGdldC5pbml0KCldKTtcblxuICByb290LmFkZENoaWxkKHdpZGdldCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHJvb3QuY2FzY2FkZVVubG9hZCgpO1xuICAgICAgZG9tLnVubG9hZCgpO1xuICAgICAgYXV0aC51bmxvYWQoKTtcbiAgICB9LFxuICAgIGNvbmZpZzogd2lkZ2V0LmdldENvbmZpZygpLFxuICB9O1xufTtcbiIsICJpbXBvcnQgeyBJQ29uZmlnIH0gZnJvbSAnLi90eXBlcyc7XG5cbmNsYXNzIENvbmZpZyBpbXBsZW1lbnRzIElDb25maWcge1xuICBnZXRBcGlCYXNlVXJsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnaHR0cDovL2FwaS5jcnlwdHVtcGF5LmxvY2FsJztcbiAgfVxuXG4gIGdldEp3dFJlZnJlc2hJbnRlcnZhbCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMzAgKiAxMDAwO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBuZXcgQ29uZmlnKCk7XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IHN0b3JlIH0gZnJvbSAnLi4vc3RvcmUnO1xuaW1wb3J0IHsgSUNvbmZpZywgSVN0b3JlLCBJQXV0aCB9IGZyb20gJy4uL3R5cGVzJztcblxuY2xhc3MgQXV0aCBpbXBsZW1lbnRzIElBdXRoIHtcbiAgcHJpdmF0ZSBjb25maWc6IElDb25maWc7XG4gIHByaXZhdGUgc3RvcmU6IElTdG9yZTtcblxuICBwcml2YXRlIGxvZ2dlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIG9uUmVhZHk6ICgodmFsdWU6IHZvaWQpID0+IHZvaWQpW107XG4gIHByaXZhdGUgYXV0b1JlZnJlc2hUb2tlbj86IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IgKGNvbmZpZzogSUNvbmZpZywgc3RvcmU6IElTdG9yZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLm9uUmVhZHkgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNMb2dnZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxvZ2dlZDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVhZHkgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLm9uUmVhZHkucHVzaChyZXNvbHZlKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemF0aW9uKSB7XG4gICAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSB0cnVlO1xuXG4gICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zdG9yZS5mb3JnZXRTZW5zaXRpdmVEYXRhKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFRva2VuKCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcmVzb2x2ZSBvZiB0aGlzLm9uUmVhZHkpIHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaFRva2VuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9L3VzZXIvcmVmcmVzaC10b2tlbmA7XG5cbiAgICBpZiAodGhpcy5hdXRvUmVmcmVzaFRva2VuKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuYXV0b1JlZnJlc2hUb2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmZXRjaCh1cmwsIHsgbWV0aG9kOiAnUE9TVCcsIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmUuZm9yZ2V0U2Vuc2l0aXZlRGF0YSgpO1xuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKCFkYXRhLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zdG9yZS5zZXRBY2Nlc3NUb2tlbihkYXRhLmFjY2Vzc1Rva2VuKTtcblxuICAgICAgICAgIHRoaXMuYXV0b1JlZnJlc2hUb2tlbiA9IHNldEludGVydmFsKCgpID0+IHRoaXMucmVmcmVzaFRva2VuKCksIHRoaXMuY29uZmlnLmdldEp3dFJlZnJlc2hJbnRlcnZhbCgpKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxvZ291dCAoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5jb25maWcuZ2V0QXBpQmFzZVVybCgpfS91c2VyL2xvZ291dGA7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcblxuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuXG4gICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdXRoID0gbmV3IEF1dGgoY29uZmlnLCBzdG9yZSk7XG4iLCAiI3dpZGdldHt3aWR0aDozMDBweDttYXJnaW46MjBweDtib3JkZXI6MXB4IHNvbGlkICNhZWFlYWU7Ym9yZGVyLXJhZGl1czo2cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtib3gtc2l6aW5nOmJvcmRlci1ib3g7YWxpZ24taXRlbXM6c3RyZXRjaH0jd2lkZ2V0X3BheXtmbGV4LWdyb3c6MTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Zm9udC1zaXplOjE1cHg7Zm9udC1mYW1pbHk6VmVyZGFuYSxHZW5ldmEsVGFob21hLHNhbnMtc2VyaWY7YmFja2dyb3VuZDojNjFjM2ZmO2NvbG9yOiNmZmY7Y3Vyc29yOnBvaW50ZXJ9I3dpZGdldF9wYXkud2lkZXtwYWRkaW5nOjE1cHggMH0jd2lkZ2V0X3BheTpob3ZlcntiYWNrZ3JvdW5kOiMzOGIzZmZ9I3dpZGdldF9zZXR0aW5nc3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO3RleHQtYWxpZ246Y2VudGVyO21heC13aWR0aDo1MCU7YmFja2dyb3VuZDojYWRlMGZmO2NvbG9yOiM2ZjZmNmY7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldHtjdXJzb3I6cG9pbnRlcjt0ZXh0LWFsaWduOnJpZ2h0fSN3aWRnZXRfd2FsbGV0OmhvdmVye2JhY2tncm91bmQ6Izk4ZDdmZn0jd2lkZ2V0X3NldHRpbmdzPmRpdntwYWRkaW5nOjNweCAyMHB4fSIsICIvLyBAdHMtaWdub3JlXG5pbXBvcnQgc3R5bGVzIGZyb20gJ3Nhc3M6Li9zdHlsZXMuY3NzJztcblxuZXhwb3J0IGNvbnN0IGdldFN0eWxlcyA9ICgpOiBzdHJpbmcgPT4gc3R5bGVzO1xuIiwgImltcG9ydCB7IGdldFN0eWxlcyB9IGZyb20gJy4uL3N0eWxlJztcblxuY2xhc3MgRG9tIHtcbiAgcHJpdmF0ZSBpbmplY3RlZFRhZ3M6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICBwdWJsaWMgaW5qZWN0RWxlbWVudCAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG5cbiAgICB0aGlzLmluamVjdGVkVGFncy5wdXNoKGVsZW1lbnQpO1xuICB9XG5cbiAgcHVibGljIGluamVjdFN0eWxlcyAoKTogdm9pZCB7XG4gICAgY29uc3QgdGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICB0YWcudGV4dENvbnRlbnQgPSBnZXRTdHlsZXMoKTtcblxuICAgIHRoaXMuaW5qZWN0RWxlbWVudChkb2N1bWVudC5oZWFkLCB0YWcpO1xuICB9XG5cbiAgcHVibGljIGZpbmRFbGVtZW50IChlbGVtZW50SWQ6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGVsZW1lbnQgJHtlbGVtZW50SWR9LmApO1xuICB9XG5cbiAgcHVibGljIHVubG9hZCAoKSB7XG4gICAgZm9yIChjb25zdCB0YWcgb2YgdGhpcy5pbmplY3RlZFRhZ3MucmV2ZXJzZSgpKSB7XG4gICAgICBpZiAodGFnKSB7XG4gICAgICAgIHRhZy5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmluamVjdGVkVGFncyA9IFtdO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkb20gPSBuZXcgRG9tKCk7XG4iLCAiZXhwb3J0IGNvbnN0IGdldEN1cnJlbmN5SGFzaCA9ICh7IGlkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdCB9OiB7XG4gIGlkOiBzdHJpbmc7XG4gIG5ldHdvcms6IHN0cmluZztcbiAgdGlja2VyOiBzdHJpbmc7XG4gIGNoYWluOiBzdHJpbmc7XG4gIGNvbnRyYWN0OiBzdHJpbmc7XG59KTogc3RyaW5nID0+IHtcbiAgY29uc3QgYXJyID0gW2lkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdF07XG4gIGlmICghYXJyLmV2ZXJ5KChwYXJ0KSA9PiBwYXJ0Lmxlbmd0aCA+IDApKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYWxmb3JtZWQgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IHN0ciA9IGFyci5qb2luKCc6Jyk7XG4gIGNvbnN0IGhhc2ggPSBCdWZmZXIuZnJvbShzdHIpLnRvU3RyaW5nKCdoZXgnKS5zdWJzdHJpbmcoMCwgNDAgLSAxIC0gc3RyLmxlbmd0aCk7XG5cbiAgcmV0dXJuIGhhc2g7XG59O1xuXG5leHBvcnQgY29uc3QgY2hlY2tDdXJyZW5jeSA9IChjdXJyZW5jeTogc3RyaW5nKSA9PiB7XG4gIGlmICghY3VycmVuY3kgfHwgdHlwZW9mIGN1cnJlbmN5ICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjdXJyZW5jeScpO1xuICB9XG5cbiAgY29uc3QgcGFydHMgPSBjdXJyZW5jeS5zcGxpdCgnOicpO1xuICBpZiAocGFydHMubGVuZ3RoICE9PSA2IHx8IGN1cnJlbmN5Lmxlbmd0aCAhPT0gNDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGZvcm1hdCBvZiB0aGUgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IFtpZCwgbmV0d29yaywgdGlja2VyLCBjaGFpbiwgY29udHJhY3QsIGhhc2hdID0gcGFydHM7XG5cbiAgY29uc3QgY3VycmVuY3lIYXNoID0gZ2V0Q3VycmVuY3lIYXNoKHsgaWQsIG5ldHdvcmssIHRpY2tlciwgY2hhaW4sIGNvbnRyYWN0IH0pO1xuXG4gIGlmIChjdXJyZW5jeUhhc2ggIT09IGhhc2gpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGN1cnJlbmN5IGhhc2gnKTtcbiAgfVxufTtcbiIsICJpbXBvcnQgeyBjaGVja0N1cnJlbmN5IH0gZnJvbSAnLi4vLi4vY3VycmVuY2llcy91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBXaWRnZXRDb25maWcge1xuICAjY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG5cbiAgI29yZGVySWQ/OiBzdHJpbmc7XG4gICNjdXN0b21lcklkPzogc3RyaW5nO1xuICAjbWVyY2hhbnRJZD86IHN0cmluZztcbiAgI2Ftb3VudD86IG51bWJlcjtcbiAgI2NhbkVkaXRBbW91bnQ/OiBib29sZWFuO1xuICAjY3VycmVuY3k/OiBzdHJpbmc7XG4gICNkZXNjcmlwdGlvbj86IHN0cmluZztcblxuICBjb25zdHJ1Y3RvciAoY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLiNjYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9XG5cbiAgcHVibGljIHNldE9yZGVySWQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy4jb3JkZXJJZCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNvcmRlcklkID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldEN1c3RvbWVySWQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy4jY3VzdG9tZXJJZCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNjdXN0b21lcklkID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldE1lcmNoYW50SWQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy4jbWVyY2hhbnRJZCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNtZXJjaGFudElkID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldFByaWNlIChhbW91bnQ6IG51bWJlciwgY3VycmVuY3k6IHN0cmluZywgY2FuRWRpdEFtb3VudDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLiNhbW91bnQgPT09IGFtb3VudCAmJiB0aGlzLiNjdXJyZW5jeSA9PT0gY3VycmVuY3kgJiYgdGhpcy4jY2FuRWRpdEFtb3VudCA9PT0gY2FuRWRpdEFtb3VudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNoZWNrQ3VycmVuY3koY3VycmVuY3kpO1xuXG4gICAgdGhpcy4jYW1vdW50ID0gYW1vdW50O1xuICAgIHRoaXMuI2N1cnJlbmN5ID0gY3VycmVuY3k7XG4gICAgdGhpcy4jY2FuRWRpdEFtb3VudCA9IGNhbkVkaXRBbW91bnQ7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldERlc2NyaXB0aW9uICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2Rlc2NyaXB0aW9uID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI2Rlc2NyaXB0aW9uID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIGdldFNldHRpbmdzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3JkZXJJZDogdGhpcy4jb3JkZXJJZCxcbiAgICAgIGN1c3RvbWVySWQ6IHRoaXMuI2N1c3RvbWVySWQsXG4gICAgICBtZXJjaGFudElkOiB0aGlzLiNtZXJjaGFudElkLFxuICAgICAgYW1vdW50OiB0aGlzLiNhbW91bnQsXG4gICAgICBjYW5FZGl0QW1vdW50OiB0aGlzLiNjYW5FZGl0QW1vdW50LFxuICAgICAgY3VycmVuY3k6IHRoaXMuI2N1cnJlbmN5LFxuICAgICAgZGVzY3JpcHRpb246IHRoaXMuI2Rlc2NyaXB0aW9uLFxuICAgIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBkb20gfSBmcm9tICcuLi9zZXJ2aWNlcy9kb20nO1xuXG5leHBvcnQgY2xhc3MgQ1BheUVsZW1lbnQge1xuICBwcm90ZWN0ZWQgY29udGFpbmVyPzogSFRNTEVsZW1lbnQ7XG4gIHByb3RlY3RlZCByb290SXRlbXM6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgcHJvdGVjdGVkIHBhcmVudD86IENQYXlFbGVtZW50O1xuICBwcml2YXRlIGNoaWxkczogQ1BheUVsZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yIChjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8Q1BheUVsZW1lbnQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICB9XG5cbiAgcHVibGljIGNhc2NhZGVVbmxvYWQgKCkge1xuICAgIHRoaXMuY2hpbGRzLmZvckVhY2goKGNoaWxkKSA9PiBjaGlsZC5jYXNjYWRlVW5sb2FkKCkpO1xuICAgIHRoaXMuY2hpbGRzID0gW107XG5cbiAgICB0aGlzLnVubG9hZCgpO1xuXG4gICAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jb250YWluZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5yb290SXRlbXMgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRQYXJlbnQgKHBhcmVudDogQ1BheUVsZW1lbnQpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgfVxuXG4gIHByb3RlY3RlZCBzZXRDb250YWluZXIgKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIHByb3RlY3RlZCByZWdpc3RlclJvb3RJdGVtcyAocm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdKSB7XG4gICAgdGhpcy5yb290SXRlbXMgPSByb290SXRlbXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0UGFyZW50ICgpOiBDUGF5RWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICB9XG5cbiAgcHVibGljIGdldENvbnRhaW5lciAoKTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXRSb290SXRlbXMgKCk6IEhUTUxFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLnJvb3RJdGVtcztcbiAgfVxuXG4gIHB1YmxpYyBhZGRDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50LCBjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCB0aGlzLmNvbnRhaW5lcjtcbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb250YWluZXIgd2FzIG5vdCBzZXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuY2hpbGRzLnB1c2goY2hpbGQpO1xuICAgIGNoaWxkLnNldFBhcmVudCh0aGlzKTtcblxuICAgIGZvciAoY29uc3Qgcm9vdEl0ZW0gb2Ygcm9vdEl0ZW1zKSB7XG4gICAgICBkb20uaW5qZWN0RWxlbWVudChjb250YWluZXIsIHJvb3RJdGVtKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4uL2VsZW1lbnQnO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uQW5vbnltb3VzIGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTxDUGF5RWxlbWVudD4ge1xuICAgIGNvbnN0IHdpZGdldFBheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFBheS5pZCA9ICd3aWRnZXRfcGF5JztcbiAgICB3aWRnZXRQYXkuY2xhc3NOYW1lID0gJ3dpZGUnO1xuICAgIHdpZGdldFBheS50ZXh0Q29udGVudCA9ICdQYXkgd2l0aCBDcnlwdHVtUGF5JztcblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbSh3aWRnZXRQYXkpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4uL2VsZW1lbnQnO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uTG9nZ2VkIGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTxDUGF5RWxlbWVudD4ge1xuICAgIGNvbnN0IHdpZGdldFBheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFBheS5pZCA9ICd3aWRnZXRfcGF5JztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5JztcblxuICAgIGNvbnN0IHdpZGdldFNldHRpbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0U2V0dGluZ3MuaWQgPSAnd2lkZ2V0X3NldHRpbmdzJztcblxuICAgIGNvbnN0IHdpZGdldFByaWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0UHJpY2UuaWQgPSAnd2lkZ2V0X3ByaWNlJztcbiAgICB3aWRnZXRQcmljZS50ZXh0Q29udGVudCA9ICcxMDA1MDAgVVNEVCc7XG5cbiAgICBjb25zdCB3aWRnZXRXYWxsZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRXYWxsZXQuaWQgPSAnd2lkZ2V0X3dhbGxldCc7XG5cbiAgICBjb25zdCB3YWxsZXRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHdhbGxldFNwYW4udGV4dENvbnRlbnQgPSAnM1ROXHUyMDI2OUZBJztcblxuICAgIGNvbnN0IGFycm93U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBhcnJvd1NwYW4uaW5uZXJIVE1MID0gJyYjOTY2MjsnO1xuXG4gICAgd2lkZ2V0V2FsbGV0LmFwcGVuZENoaWxkKHdhbGxldFNwYW4pO1xuICAgIHdpZGdldFdhbGxldC5hcHBlbmRDaGlsZChhcnJvd1NwYW4pO1xuXG4gICAgd2lkZ2V0U2V0dGluZ3MuYXBwZW5kQ2hpbGQod2lkZ2V0UHJpY2UpO1xuICAgIHdpZGdldFNldHRpbmdzLmFwcGVuZENoaWxkKHdpZGdldFdhbGxldCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyUm9vdEl0ZW1zKFt3aWRnZXRQYXksIHdpZGdldFNldHRpbmdzXSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIiwgImltcG9ydCB7IGF1dGggfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IFdpZGdldENvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi4vZWxlbWVudCc7XG5pbXBvcnQgeyBCdXR0b25Bbm9ueW1vdXMgfSBmcm9tICcuL2J1dHRvbi5hbm9ueW1vdXMnO1xuaW1wb3J0IHsgQnV0dG9uTG9nZ2VkIH0gZnJvbSAnLi9idXR0b24ubG9nZ2VkJztcblxuZXhwb3J0IGNsYXNzIFdpZGdldCBleHRlbmRzIENQYXlFbGVtZW50IHtcbiAgcHJpdmF0ZSBjb25maWc6IFdpZGdldENvbmZpZztcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY29uZmlnID0gbmV3IFdpZGdldENvbmZpZygoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRDb25maWcgKCkge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZztcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPENQYXlFbGVtZW50PiB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuXG4gICAgLy8gVE9ETzogXHUwNDNFXHUwNDQ0XHUwNDNFXHUwNDQwXHUwNDNDXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMiBcdTA0MzdcdTA0MzBcdTA0MzJcdTA0MzhcdTA0NDFcdTA0MzhcdTA0M0NcdTA0M0VcdTA0NDFcdTA0NDJcdTA0MzggXHUwNDNFXHUwNDQyIFx1MDQzRlx1MDQzNVx1MDQ0MFx1MDQzMlx1MDQzOFx1MDQ0N1x1MDQzRFx1MDQ0Qlx1MDQ0NSBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzVcdTA0M0FcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuXG4gICAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgICAvLyBUT0RPOiByZXZlcnRcbiAgICBpZiAoIWF1dGguaXNMb2dnZWQpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoYXdhaXQgbmV3IEJ1dHRvbkxvZ2dlZCh3aWRnZXQpLmluaXQoKSwgd2lkZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRDaGlsZChhd2FpdCBuZXcgQnV0dG9uQW5vbnltb3VzKHdpZGdldCkuaW5pdCgpLCB3aWRnZXQpO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbXMoW3dpZGdldF0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZSAoKTogdm9pZCB7XG4gICAgaWYgKCFhdXRoLmlzUmVhZHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBcdTA0M0VcdTA0MzFcdTA0M0RcdTA0M0VcdTA0MzJcdTA0M0JcdTA0NEZcdTA0MzVcdTA0M0MgXHUwNDMyXHUwNDNEXHUwNDM1XHUwNDQ4XHUwNDNBXHUwNDQzIFx1MDQzNVx1MDQ0MVx1MDQzQlx1MDQzOCBcdTA0MzhcdTA0MzdcdTA0M0NcdTA0MzVcdTA0M0RcdTA0MzhcdTA0M0JcdTA0MzggXHUwNDNEXHUwNDMwXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDNBXHUwNDM4IFx1MDQzMiBcdTA0NDBcdTA0MzVcdTA0MzBcdTA0M0JcdTA0NDJcdTA0MzBcdTA0MzlcdTA0M0NcdTA0MzVcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4uL3NlcnZpY2VzL2F1dGgnO1xuaW1wb3J0IHsgZG9tIH0gZnJvbSAnLi4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi9lbGVtZW50JztcblxuZXhwb3J0IGNsYXNzIFJvb3QgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgc3RhdGljIFJlZ2lzdGVyZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBpZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yIChpZDogc3RyaW5nKSB7XG4gICAgaWYgKFJvb3QuUmVnaXN0ZXJlZElkcy5oYXMoaWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYElkICR7aWR9IGlzIGFscmVhZHkgaW4gdXNlYCk7XG4gICAgfVxuXG4gICAgc3VwZXIoZG9tLmZpbmRFbGVtZW50KGlkKSk7XG5cbiAgICBSb290LlJlZ2lzdGVyZWRJZHMuYWRkKGlkKTtcblxuICAgIHRoaXMuaWQgPSBpZDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPENQYXlFbGVtZW50PiB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICBSb290LlJlZ2lzdGVyZWRJZHMuZGVsZXRlKHRoaXMuaWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDRUEsTUFBTSxTQUFOLE1BQWdDO0FBQUEsSUFDOUIsZ0JBQXlCO0FBQ3ZCLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFQSx3QkFBaUM7QUFDL0IsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFFTyxNQUFNLFNBQVMsSUFBSSxPQUFPOzs7QUNaMUIsTUFBZSxZQUFmLE1BQXlCO0FBQUEsSUFDcEI7QUFBQSxJQUVWLFlBQWEsTUFBYztBQUN6QixXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUEsSUFFVSxJQUFLLEtBQXFCO0FBQ2xDLGFBQU8sR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHO0FBQUEsSUFDNUI7QUFBQSxFQUNGOzs7QUNQTyxNQUFNLHlCQUFOLGNBQXFDLFVBQWdDO0FBQUEsSUFDbEUsUUFBZ0MsQ0FBQztBQUFBLElBRWxDLElBQUssS0FBYSxPQUFxQjtBQUM1QyxXQUFLLE1BQU0sR0FBRyxJQUFJO0FBQUEsSUFDcEI7QUFBQSxJQUVPLElBQUssS0FBNEI7QUFDdEMsYUFBTyxLQUFLLE1BQU0sR0FBRyxLQUFLO0FBQUEsSUFDNUI7QUFBQSxJQUVPLE9BQVEs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QSxJQUNwRDtBQUFBLElBRU8sWUFBYTtBQUNsQixhQUFPLEtBQUs7QUFBQSxJQUNkO0FBQUEsSUFFQSxNQUFhLE9BQThCO0FBQ3pDLFlBQU0sS0FBSyxNQUFNO0FBS2pCLFlBQU0sU0FBUyxTQUFTLGNBQWMsS0FBSztBQUMzQyxhQUFPLEtBQUs7QUFHWixVQUFJLENBQUMsS0FBSyxVQUFVO0FBQ2xCLGFBQUssU0FBUyxNQUFNLElBQUksYUFBYSxNQUFNLEVBQUUsS0FBSyxHQUFHLE1BQU07QUFBQSxNQUM3RCxPQUFPO0FBQ0wsYUFBSyxTQUFTLE1BQU0sSUFBSSxnQkFBZ0IsTUFBTSxFQUFFLEtBQUssR0FBRyxNQUFNO0FBQUEsTUFDaEU7QUFFQSxXQUFLLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztBQUUvQixhQUFPO0FBQUEsSUFDVDtBQUFBLElBRVEsU0FBZ0I7QUFDdEIsVUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUlGO0FBQUEsRUFDRjs7O0FDNUNPLE1BQU0sT0FBTixNQUFNLGNBQWEsWUFBWTtBQUFBLElBQ3BDLE9BQWUsZ0JBQWdCLG9CQUFJLElBQVk7QUFBQSxJQUN2QztBQUFBLElBRVIsWUFBYSxJQUFZO0FBQ3ZCLFVBQUksTUFBSyxjQUFjLElBQUksRUFBRSxHQUFHO0FBQzlCLGNBQU0sSUFBSSxNQUFNLE1BQU0sRUFBRSxvQkFBb0I7QUFBQSxNQUM5QztBQUVBLFlBQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUV6QixZQUFLLGNBQWMsSUFBSSxFQUFFO0FBRXpCLFdBQUssS0FBSztBQUFBLElBQ1o7QUFBQSxJQUVBLE1BQWEsT0FBOEI7QUFDekMsWUFBTSxLQUFLLE1BQU07QUFFakIsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUVPLFNBQWdCO0FBQ3JCLFlBQUssY0FBYyxPQUFPLEtBQUssRUFBRTtBQUFBLElBQ25DO0FBQUEsRUFDRjs7O0FmeEJPLE1BQU0sU0FBUyxPQUFPLE9BQWU7QUFDMUMsVUFBTSxPQUFPLElBQUksS0FBSyxFQUFFO0FBQ3hCLFVBQU0sU0FBUyxJQUFJLE9BQU87QUFFMUIsUUFBSSxhQUFhO0FBRWpCLFVBQU0sUUFBUSxJQUFJLENBQUMsS0FBSyxLQUFLLEdBQUcsT0FBTyxLQUFLLENBQUMsQ0FBQztBQUU5QyxTQUFLLFNBQVMsTUFBTTtBQUVwQixXQUFPO0FBQUEsTUFDTCxRQUFRLE1BQU07QUFDWixhQUFLLGNBQWM7QUFDbkIsWUFBSSxPQUFPO0FBQ1gsYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUFBLE1BQ0EsUUFBUSxPQUFPLFVBQVU7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7IiwKICAibmFtZXMiOiBbImNvbmZpZyIsICJzdG9yZSJdCn0K
