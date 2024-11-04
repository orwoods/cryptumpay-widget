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
      const url = `${this.config.getApiBaseUrl()}/auth/refresh-token`;
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
      const url = `${this.config.getApiBaseUrl()}/auth/logout`;
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

  // _8h4tmkicy:/Volumes/Projects/cryptumpay/widget/src/style/styles.css
  var styles_default = "#widget{width:300px;margin:20px;border:1px solid #aeaeae;border-radius:6px;display:flex;align-items:center;box-sizing:border-box;align-items:stretch}#widget_pay{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-family:Verdana,Geneva,Tahoma,sans-serif;background:#61c3ff;color:#fff;cursor:pointer}#widget_pay.wide{padding:15px 0}#widget_pay:hover{background:#38b3ff}#widget_settings{display:flex;flex-direction:column;text-align:center;max-width:50%;background:#ade0ff;color:#6f6f6f;text-align:right}#widget_wallet{cursor:pointer;text-align:right}#widget_wallet:hover{background:#98d7ff}#widget_settings>div{padding:3px 20px}";

  // src/style/index.ts
  var getStyles = () => styles_default;

  // src/services/dom.ts
  var Dom = class {
    styles;
    injectElement(container, element) {
      container.appendChild(element);
    }
    injectStyles() {
      const tag = document.createElement("style");
      tag.textContent = getStyles();
      this.injectElement(document.head, tag);
      this.styles = tag;
    }
    findElement(elementId) {
      const container = document.getElementById(elementId);
      if (container) {
        return container;
      }
      throw new Error(`Unknown element ${elementId}.`);
    }
    unload() {
      if (this.styles) {
        this.styles.remove();
      }
    }
  };
  var dom = new Dom();

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
  var CPayElement = class _CPayElement {
    static maxId = 0;
    id = ++_CPayElement.maxId;
    container;
    rootItems = [];
    parent;
    childs = /* @__PURE__ */ new Map();
    constructor(container) {
      this.container = container;
    }
    async init() {
    }
    unload() {
    }
    cascadeUnload() {
      this.childs.forEach((child) => this.removeChild(child));
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
      this.childs.set(child.id, child);
      child.setParent(this);
      child.setContainer(container);
      for (const item of rootItems) {
        dom.injectElement(container, item);
      }
    }
    beforeRemoveChild(child) {
    }
    removeChild(child) {
      const rootItems = child.getRootItems();
      if (!rootItems.length) {
        throw new Error("Root items was not set");
      }
      this.beforeRemoveChild(child);
      child.cascadeUnload();
      child.setParent();
      child.setContainer();
      for (const item of rootItems) {
        item.remove();
      }
      this.childs.delete(child.id);
    }
    remove() {
      const parent = this.getParent();
      if (parent) {
        parent.removeChild(this);
      }
    }
  };

  // src/api/index.ts
  var Api = class {
    config;
    store;
    constructor(config2, store2) {
      this.config = config2;
      this.store = store2;
    }
    async request({
      endpoint,
      method = "GET",
      data = {},
      withCredentials = false,
      withAuthorization = true
    }) {
      const url = new URL(`${this.config.getApiBaseUrl()}${endpoint}`);
      const requestParams = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      };
      if (method === "GET") {
        Object.keys(data).forEach((key) => url.searchParams.append(key, data[key]));
      } else {
        requestParams.body = JSON.stringify(data);
      }
      if (withCredentials) {
        requestParams.credentials = "include";
      }
      if (withAuthorization) {
        requestParams.headers = {
          ...requestParams.headers,
          Authorization: `Bearer ${this.store.getAccessToken()}`
        };
      }
      try {
        const response = await fetch(url, requestParams);
        if (response.status === 401) {
          throw new Error("Unauthorized request");
        } else if (response.status !== 200) {
          throw new Error("Response code is not 200");
        }
        return await response.json();
      } catch (error) {
        console.warn(error);
        throw new Error("Unexpected error");
      }
    }
    async createOrder(order) {
      return await this.request({
        endpoint: "/order",
        method: "POST",
        data: order,
        withAuthorization: true,
        withCredentials: true
      });
    }
    async getUser() {
      return await this.request({
        endpoint: "/user",
        withAuthorization: true
      });
    }
    async getCurrencies() {
      const result = await this.request({
        endpoint: "/currencies"
      });
      return result?.currencies || [];
    }
  };
  var api = new Api(config, store);

  // src/elements/orderPopup.ts
  var OrderPopup = class extends CPayElement {
    async init() {
      const popup = document.createElement("div");
      popup.id = "order_popup";
      this.registerRootItems([popup]);
    }
  };

  // src/elements/widget/button.common.ts
  var ButtonCommon = class extends CPayElement {
    button;
    clicked = false;
    locked = false;
    config;
    constructor(config2) {
      super();
      this.config = config2;
    }
    async click() {
      if (this.clicked || this.locked) {
        return;
      }
      this.clicked = true;
      try {
        await this.createOrder();
      } catch (error) {
        console.warn("ButtonCommon error", error);
      }
      this.clicked = false;
    }
    async createOrder() {
      try {
        const settings = this.config.getSettings();
        const data = await api.createOrder({
          currency: settings.currency || "",
          amount: settings.amount || 0,
          description: settings.description || "",
          merchantId: settings.merchantId || "",
          customerId: settings.customerId || "",
          orderId: settings.orderId || ""
        });
        console.warn("order result:");
        console.warn(data);
        const { id } = data;
        this.locked = true;
        await auth.refreshToken();
        this.addChild(await this.openOrderPopup(id), this.getContainer());
      } catch {
        const oldText = this.button.textContent;
        this.button.textContent = "\u{1F61E}";
        setTimeout(() => {
          this.button.textContent = oldText;
          this.locked = false;
        }, 3e3);
      }
    }
    async openOrderPopup(id) {
      console.warn("openOrderPopup", id);
      const popup = new OrderPopup();
      await popup.init();
      return popup;
    }
    beforeRemoveChild(child) {
      this.locked = false;
    }
  };

  // src/elements/widget/button.anonymous.ts
  var ButtonAnonymous = class extends ButtonCommon {
    async init() {
      const widgetPay = document.createElement("div");
      widgetPay.id = "widget_pay";
      widgetPay.className = "wide";
      widgetPay.textContent = "Pay with CryptumPay";
      this.button = widgetPay;
      widgetPay.addEventListener("click", this.click.bind(this));
      this.registerRootItems([widgetPay]);
    }
  };

  // src/elements/widget/button.logged.ts
  var ButtonLogged = class extends ButtonCommon {
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
      widgetWallet.addEventListener("click", async () => {
        const user = await api.getUser();
        console.warn(user);
      });
      this.registerRootItems([widgetPay, widgetSettings]);
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
      if (auth.isLogged) {
        this.addChild(await this.createLoggedButton(), widget);
      } else {
        this.addChild(await this.createAnonymousButton(), widget);
      }
      this.registerRootItems([widget]);
    }
    async createLoggedButton() {
      const button = new ButtonLogged(this.config);
      await button.init();
      return button;
    }
    async createAnonymousButton() {
      const button = new ButtonAnonymous(this.config);
      await button.init();
      return button;
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
    rootId;
    constructor(rootId) {
      if (_Root.RegisteredIds.has(rootId)) {
        throw new Error(`Id ${rootId} is already in use`);
      }
      super(dom.findElement(rootId));
      _Root.RegisteredIds.add(rootId);
      this.rootId = rootId;
    }
    async init() {
      await auth.ready();
    }
    unload() {
      _Root.RegisteredIds.delete(this.rootId);
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
      config: widget.getConfig(),
      api: {
        getCurrencies: () => api.getCurrencies()
      }
    };
  };
  return __toCommonJS(app_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9hdXRoLnRzIiwgIl84aDR0bWtpY3k6L1ZvbHVtZXMvUHJvamVjdHMvY3J5cHR1bXBheS93aWRnZXQvc3JjL3N0eWxlL3N0eWxlcy5jc3MiLCAiLi4vc3JjL3N0eWxlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9kb20udHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9jb25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2VsZW1lbnQudHMiLCAiLi4vc3JjL2FwaS9pbmRleC50cyIsICIuLi9zcmMvZWxlbWVudHMvb3JkZXJQb3B1cC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2J1dHRvbi5jb21tb24udHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9idXR0b24uYW5vbnltb3VzLnRzIiwgIi4uL3NyYy9lbGVtZW50cy93aWRnZXQvYnV0dG9uLmxvZ2dlZC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2luZGV4LnRzIiwgIi4uL3NyYy9lbGVtZW50cy9yb290LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IGRvbSB9IGZyb20gJy4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IFdpZGdldCB9IGZyb20gJy4vZWxlbWVudHMvd2lkZ2V0JztcbmltcG9ydCB7IFJvb3QgfSBmcm9tICcuL2VsZW1lbnRzL3Jvb3QnO1xuaW1wb3J0IHsgYXBpIH0gZnJvbSAnLi9hcGknO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlID0gYXN5bmMgKGlkOiBzdHJpbmcpID0+IHtcbiAgY29uc3Qgcm9vdCA9IG5ldyBSb290KGlkKTtcbiAgY29uc3Qgd2lkZ2V0ID0gbmV3IFdpZGdldCgpO1xuXG4gIGRvbS5pbmplY3RTdHlsZXMoKTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChbcm9vdC5pbml0KCksIHdpZGdldC5pbml0KCldKTtcblxuICByb290LmFkZENoaWxkKHdpZGdldCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHJvb3QuY2FzY2FkZVVubG9hZCgpO1xuICAgICAgZG9tLnVubG9hZCgpO1xuICAgICAgYXV0aC51bmxvYWQoKTtcbiAgICB9LFxuICAgIGNvbmZpZzogd2lkZ2V0LmdldENvbmZpZygpLFxuICAgIGFwaToge1xuICAgICAgZ2V0Q3VycmVuY2llczogKCkgPT4gYXBpLmdldEN1cnJlbmNpZXMoKSxcbiAgICB9LFxuICB9O1xufTtcbiIsICJpbXBvcnQgeyBJQ29uZmlnIH0gZnJvbSAnLi90eXBlcyc7XG5cbmNsYXNzIENvbmZpZyBpbXBsZW1lbnRzIElDb25maWcge1xuICBnZXRBcGlCYXNlVXJsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnaHR0cDovL2FwaS5jcnlwdHVtcGF5LmxvY2FsJztcbiAgfVxuXG4gIGdldEp3dFJlZnJlc2hJbnRlcnZhbCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMzAgKiAxMDAwO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBuZXcgQ29uZmlnKCk7XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IHN0b3JlIH0gZnJvbSAnLi4vc3RvcmUnO1xuaW1wb3J0IHsgSUNvbmZpZywgSVN0b3JlLCBJQXV0aCB9IGZyb20gJy4uL3R5cGVzJztcblxuY2xhc3MgQXV0aCBpbXBsZW1lbnRzIElBdXRoIHtcbiAgcHJpdmF0ZSBjb25maWc6IElDb25maWc7XG4gIHByaXZhdGUgc3RvcmU6IElTdG9yZTtcblxuICBwcml2YXRlIGxvZ2dlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIG9uUmVhZHk6ICgodmFsdWU6IHZvaWQpID0+IHZvaWQpW107XG4gIHByaXZhdGUgYXV0b1JlZnJlc2hUb2tlbj86IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IgKGNvbmZpZzogSUNvbmZpZywgc3RvcmU6IElTdG9yZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLm9uUmVhZHkgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNMb2dnZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxvZ2dlZDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVhZHkgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLm9uUmVhZHkucHVzaChyZXNvbHZlKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemF0aW9uKSB7XG4gICAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSB0cnVlO1xuXG4gICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zdG9yZS5mb3JnZXRTZW5zaXRpdmVEYXRhKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFRva2VuKCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcmVzb2x2ZSBvZiB0aGlzLm9uUmVhZHkpIHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaFRva2VuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9L2F1dGgvcmVmcmVzaC10b2tlbmA7XG5cbiAgICBpZiAodGhpcy5hdXRvUmVmcmVzaFRva2VuKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuYXV0b1JlZnJlc2hUb2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmZXRjaCh1cmwsIHsgbWV0aG9kOiAnUE9TVCcsIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmUuZm9yZ2V0U2Vuc2l0aXZlRGF0YSgpO1xuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKCFkYXRhLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zdG9yZS5zZXRBY2Nlc3NUb2tlbihkYXRhLmFjY2Vzc1Rva2VuKTtcblxuICAgICAgICAgIHRoaXMuYXV0b1JlZnJlc2hUb2tlbiA9IHNldEludGVydmFsKCgpID0+IHRoaXMucmVmcmVzaFRva2VuKCksIHRoaXMuY29uZmlnLmdldEp3dFJlZnJlc2hJbnRlcnZhbCgpKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxvZ291dCAoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5jb25maWcuZ2V0QXBpQmFzZVVybCgpfS9hdXRoL2xvZ291dGA7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcblxuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuXG4gICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdXRoID0gbmV3IEF1dGgoY29uZmlnLCBzdG9yZSk7XG4iLCAiI3dpZGdldHt3aWR0aDozMDBweDttYXJnaW46MjBweDtib3JkZXI6MXB4IHNvbGlkICNhZWFlYWU7Ym9yZGVyLXJhZGl1czo2cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtib3gtc2l6aW5nOmJvcmRlci1ib3g7YWxpZ24taXRlbXM6c3RyZXRjaH0jd2lkZ2V0X3BheXtmbGV4LWdyb3c6MTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Zm9udC1zaXplOjE1cHg7Zm9udC1mYW1pbHk6VmVyZGFuYSxHZW5ldmEsVGFob21hLHNhbnMtc2VyaWY7YmFja2dyb3VuZDojNjFjM2ZmO2NvbG9yOiNmZmY7Y3Vyc29yOnBvaW50ZXJ9I3dpZGdldF9wYXkud2lkZXtwYWRkaW5nOjE1cHggMH0jd2lkZ2V0X3BheTpob3ZlcntiYWNrZ3JvdW5kOiMzOGIzZmZ9I3dpZGdldF9zZXR0aW5nc3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO3RleHQtYWxpZ246Y2VudGVyO21heC13aWR0aDo1MCU7YmFja2dyb3VuZDojYWRlMGZmO2NvbG9yOiM2ZjZmNmY7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldHtjdXJzb3I6cG9pbnRlcjt0ZXh0LWFsaWduOnJpZ2h0fSN3aWRnZXRfd2FsbGV0OmhvdmVye2JhY2tncm91bmQ6Izk4ZDdmZn0jd2lkZ2V0X3NldHRpbmdzPmRpdntwYWRkaW5nOjNweCAyMHB4fSIsICIvLyBAdHMtaWdub3JlXG5pbXBvcnQgc3R5bGVzIGZyb20gJ3Nhc3M6Li9zdHlsZXMuY3NzJztcblxuZXhwb3J0IGNvbnN0IGdldFN0eWxlcyA9ICgpOiBzdHJpbmcgPT4gc3R5bGVzO1xuIiwgImltcG9ydCB7IGdldFN0eWxlcyB9IGZyb20gJy4uL3N0eWxlJztcblxuY2xhc3MgRG9tIHtcbiAgcHJpdmF0ZSBzdHlsZXM/OiBIVE1MRWxlbWVudDtcblxuICBwdWJsaWMgaW5qZWN0RWxlbWVudCAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gIH1cblxuICBwdWJsaWMgaW5qZWN0U3R5bGVzICgpOiB2b2lkIHtcbiAgICBjb25zdCB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHRhZy50ZXh0Q29udGVudCA9IGdldFN0eWxlcygpO1xuXG4gICAgdGhpcy5pbmplY3RFbGVtZW50KGRvY3VtZW50LmhlYWQsIHRhZyk7XG5cbiAgICB0aGlzLnN0eWxlcyA9IHRhZztcbiAgfVxuXG4gIHB1YmxpYyBmaW5kRWxlbWVudCAoZWxlbWVudElkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbiAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBlbGVtZW50ICR7ZWxlbWVudElkfS5gKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIGlmICh0aGlzLnN0eWxlcykge1xuICAgICAgdGhpcy5zdHlsZXMucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkb20gPSBuZXcgRG9tKCk7XG4iLCAiZXhwb3J0IGNsYXNzIFdpZGdldENvbmZpZyB7XG4gICNjYWxsYmFjazogKCkgPT4gdm9pZDtcblxuICAjb3JkZXJJZD86IHN0cmluZztcbiAgI2N1c3RvbWVySWQ/OiBzdHJpbmc7XG4gICNtZXJjaGFudElkPzogc3RyaW5nO1xuICAjYW1vdW50PzogbnVtYmVyO1xuICAjY2FuRWRpdEFtb3VudD86IGJvb2xlYW47XG4gICNjdXJyZW5jeT86IHN0cmluZztcbiAgI2Rlc2NyaXB0aW9uPzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yIChjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuI2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gIH1cblxuICBwdWJsaWMgc2V0T3JkZXJJZCAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNvcmRlcklkID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI29yZGVySWQgPSB2YWx1ZTtcblxuICAgIHRoaXMuI2NhbGxiYWNrKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0Q3VzdG9tZXJJZCAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNjdXN0b21lcklkID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI2N1c3RvbWVySWQgPSB2YWx1ZTtcblxuICAgIHRoaXMuI2NhbGxiYWNrKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0TWVyY2hhbnRJZCAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNtZXJjaGFudElkID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI21lcmNoYW50SWQgPSB2YWx1ZTtcblxuICAgIHRoaXMuI2NhbGxiYWNrKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0UHJpY2UgKGFtb3VudDogbnVtYmVyLCBjdXJyZW5jeTogc3RyaW5nLCBjYW5FZGl0QW1vdW50OiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuI2Ftb3VudCA9PT0gYW1vdW50ICYmIHRoaXMuI2N1cnJlbmN5ID09PSBjdXJyZW5jeSAmJiB0aGlzLiNjYW5FZGl0QW1vdW50ID09PSBjYW5FZGl0QW1vdW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jYW1vdW50ID0gYW1vdW50O1xuICAgIHRoaXMuI2N1cnJlbmN5ID0gY3VycmVuY3k7XG4gICAgdGhpcy4jY2FuRWRpdEFtb3VudCA9IGNhbkVkaXRBbW91bnQ7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldERlc2NyaXB0aW9uICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2Rlc2NyaXB0aW9uID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI2Rlc2NyaXB0aW9uID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIGdldFNldHRpbmdzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3JkZXJJZDogdGhpcy4jb3JkZXJJZCxcbiAgICAgIGN1c3RvbWVySWQ6IHRoaXMuI2N1c3RvbWVySWQsXG4gICAgICBtZXJjaGFudElkOiB0aGlzLiNtZXJjaGFudElkLFxuICAgICAgYW1vdW50OiB0aGlzLiNhbW91bnQsXG4gICAgICBjYW5FZGl0QW1vdW50OiB0aGlzLiNjYW5FZGl0QW1vdW50LFxuICAgICAgY3VycmVuY3k6IHRoaXMuI2N1cnJlbmN5LFxuICAgICAgZGVzY3JpcHRpb246IHRoaXMuI2Rlc2NyaXB0aW9uLFxuICAgIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBkb20gfSBmcm9tICcuLi9zZXJ2aWNlcy9kb20nO1xuXG5leHBvcnQgY2xhc3MgQ1BheUVsZW1lbnQge1xuICBwcml2YXRlIHN0YXRpYyBtYXhJZCA9IDA7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBpZCA9ICsrQ1BheUVsZW1lbnQubWF4SWQ7XG4gIHByb3RlY3RlZCBjb250YWluZXI/OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIHJvb3RJdGVtczogSFRNTEVsZW1lbnRbXSA9IFtdO1xuICBwcm90ZWN0ZWQgcGFyZW50PzogQ1BheUVsZW1lbnQ7XG4gIHByaXZhdGUgY2hpbGRzID0gbmV3IE1hcDxudW1iZXIsIENQYXlFbGVtZW50PigpO1xuXG4gIGNvbnN0cnVjdG9yIChjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICB9XG5cbiAgcHVibGljIHVubG9hZCAoKSB7XG4gIH1cblxuICBwdWJsaWMgY2FzY2FkZVVubG9hZCAoKSB7XG4gICAgdGhpcy5jaGlsZHMuZm9yRWFjaCgoY2hpbGQpID0+IHRoaXMucmVtb3ZlQ2hpbGQoY2hpbGQpKTtcblxuICAgIHRoaXMudW5sb2FkKCk7XG5cbiAgICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJvb3RJdGVtcyA9IFtdO1xuICB9XG5cbiAgcHVibGljIHNldFBhcmVudCAocGFyZW50PzogQ1BheUVsZW1lbnQpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgfVxuXG4gIHByb3RlY3RlZCBzZXRDb250YWluZXIgKGNvbnRhaW5lcj86IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVnaXN0ZXJSb290SXRlbXMgKHJvb3RJdGVtczogSFRNTEVsZW1lbnRbXSkge1xuICAgIHRoaXMucm9vdEl0ZW1zID0gcm9vdEl0ZW1zO1xuICB9XG5cbiAgcHVibGljIGdldFBhcmVudCAoKTogQ1BheUVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnBhcmVudDtcbiAgfVxuXG4gIHB1YmxpYyBnZXRDb250YWluZXIgKCk6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jb250YWluZXI7XG4gIH1cblxuICBwdWJsaWMgZ2V0Um9vdEl0ZW1zICgpOiBIVE1MRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5yb290SXRlbXM7XG4gIH1cblxuICBwdWJsaWMgYWRkQ2hpbGQgKGNoaWxkOiBDUGF5RWxlbWVudCwgY29udGFpbmVyPzogSFRNTEVsZW1lbnQpIHtcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgdGhpcy5jb250YWluZXI7XG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ29udGFpbmVyIHdhcyBub3Qgc2V0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdEl0ZW1zID0gY2hpbGQuZ2V0Um9vdEl0ZW1zKCk7XG4gICAgaWYgKCFyb290SXRlbXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jvb3QgaXRlbXMgd2FzIG5vdCBzZXQnKTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkcy5zZXQoY2hpbGQuaWQsIGNoaWxkKTtcblxuICAgIGNoaWxkLnNldFBhcmVudCh0aGlzKTtcbiAgICBjaGlsZC5zZXRDb250YWluZXIoY29udGFpbmVyKTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiByb290SXRlbXMpIHtcbiAgICAgIGRvbS5pbmplY3RFbGVtZW50KGNvbnRhaW5lciwgaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGJlZm9yZVJlbW92ZUNoaWxkIChjaGlsZDogQ1BheUVsZW1lbnQpIHtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50KSB7XG4gICAgY29uc3Qgcm9vdEl0ZW1zID0gY2hpbGQuZ2V0Um9vdEl0ZW1zKCk7XG4gICAgaWYgKCFyb290SXRlbXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jvb3QgaXRlbXMgd2FzIG5vdCBzZXQnKTtcbiAgICB9XG5cbiAgICB0aGlzLmJlZm9yZVJlbW92ZUNoaWxkKGNoaWxkKTtcblxuICAgIGNoaWxkLmNhc2NhZGVVbmxvYWQoKTtcbiAgICBjaGlsZC5zZXRQYXJlbnQoKTtcbiAgICBjaGlsZC5zZXRDb250YWluZXIoKTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiByb290SXRlbXMpIHtcbiAgICAgIGl0ZW0ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jaGlsZHMuZGVsZXRlKGNoaWxkLmlkKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmUgKCkge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50KCk7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IHN0b3JlIH0gZnJvbSAnLi4vc3RvcmUnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IElDb25maWcsIElTdG9yZSwgVEp1c3RDcmVhdGVkT3JkZXIsIFRPcmRlclJlcXVlc3QgfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCB0eXBlIFRSZXF1ZXN0UGFyYW1zID0ge1xuICBlbmRwb2ludDogc3RyaW5nO1xuICBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgbWV0aG9kPzogJ1BPU1QnIHwgJ0dFVCcgfCAnUFVUJyB8ICdERUxFVEUnO1xuICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFuO1xuICB3aXRoQXV0aG9yaXphdGlvbj86IGJvb2xlYW47XG59O1xuXG5jbGFzcyBBcGkge1xuICBwcml2YXRlIGNvbmZpZzogSUNvbmZpZztcbiAgcHJpdmF0ZSBzdG9yZTogSVN0b3JlO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciAoY29uZmlnOiBJQ29uZmlnLCBzdG9yZTogSVN0b3JlKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5zdG9yZSA9IHN0b3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXF1ZXN0IDxUPiAoe1xuICAgIGVuZHBvaW50LFxuICAgIG1ldGhvZCA9ICdHRVQnLFxuICAgIGRhdGEgPSB7fSxcbiAgICB3aXRoQ3JlZGVudGlhbHMgPSBmYWxzZSxcbiAgICB3aXRoQXV0aG9yaXphdGlvbiA9IHRydWUsXG4gIH06IFRSZXF1ZXN0UGFyYW1zKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9JHtlbmRwb2ludH1gKTtcblxuICAgIGNvbnN0IHJlcXVlc3RQYXJhbXM6IFJlcXVlc3RJbml0ID0ge1xuICAgICAgbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgaWYgKG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgIE9iamVjdC5rZXlzKGRhdGEpLmZvckVhY2goKGtleSkgPT4gdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoa2V5LCBkYXRhW2tleV0pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWVzdFBhcmFtcy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgfVxuXG4gICAgaWYgKHdpdGhDcmVkZW50aWFscykge1xuICAgICAgcmVxdWVzdFBhcmFtcy5jcmVkZW50aWFscyA9ICdpbmNsdWRlJztcbiAgICB9XG5cbiAgICBpZiAod2l0aEF1dGhvcml6YXRpb24pIHtcbiAgICAgIHJlcXVlc3RQYXJhbXMuaGVhZGVycyA9IHtcbiAgICAgICAgLi4ucmVxdWVzdFBhcmFtcy5oZWFkZXJzLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGhpcy5zdG9yZS5nZXRBY2Nlc3NUb2tlbigpfWAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgcmVxdWVzdFBhcmFtcyk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCByZXF1ZXN0Jyk7XG4gICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVzcG9uc2UgY29kZSBpcyBub3QgMjAwJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBlcnJvcicpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBjcmVhdGVPcmRlciAob3JkZXI6IFRPcmRlclJlcXVlc3QpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXF1ZXN0PFRKdXN0Q3JlYXRlZE9yZGVyPih7XG4gICAgICBlbmRwb2ludDogJy9vcmRlcicsXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGRhdGE6IG9yZGVyLFxuICAgICAgd2l0aEF1dGhvcml6YXRpb246IHRydWUsXG4gICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0VXNlciAoKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVxdWVzdCh7XG4gICAgICBlbmRwb2ludDogJy91c2VyJyxcbiAgICAgIHdpdGhBdXRob3JpemF0aW9uOiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGdldEN1cnJlbmNpZXMgKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmVxdWVzdDx7IGN1cnJlbmNpZXM6IHN0cmluZ1tdIH0+KHtcbiAgICAgIGVuZHBvaW50OiAnL2N1cnJlbmNpZXMnLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdD8uY3VycmVuY2llcyB8fCBbXTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgYXBpID0gbmV3IEFwaShjb25maWcsIHN0b3JlKTtcbiIsICJpbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4vZWxlbWVudCc7XG5cbmV4cG9ydCBjbGFzcyBPcmRlclBvcHVwIGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcG9wdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwb3B1cC5pZCA9ICdvcmRlcl9wb3B1cCc7XG5cbiAgICB0aGlzLnJlZ2lzdGVyUm9vdEl0ZW1zKFtwb3B1cF0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXBpIH0gZnJvbSAnLi4vLi4vYXBpJztcbmltcG9ydCB7IGF1dGggfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi4vZWxlbWVudCc7XG5pbXBvcnQgeyBPcmRlclBvcHVwIH0gZnJvbSAnLi4vb3JkZXJQb3B1cCc7XG5pbXBvcnQgeyBXaWRnZXRDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCdXR0b25Db21tb24gZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByb3RlY3RlZCBidXR0b24hOiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIGNsaWNrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBsb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjb25maWc6IFdpZGdldENvbmZpZztcblxuICBjb25zdHJ1Y3RvciAoY29uZmlnOiBXaWRnZXRDb25maWcpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgY2xpY2sgKCkge1xuICAgIGlmICh0aGlzLmNsaWNrZWQgfHwgdGhpcy5sb2NrZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWNrZWQgPSB0cnVlO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY3JlYXRlT3JkZXIoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKCdCdXR0b25Db21tb24gZXJyb3InLCBlcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5jbGlja2VkID0gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU9yZGVyICgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLmNvbmZpZy5nZXRTZXR0aW5ncygpO1xuXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgYXBpLmNyZWF0ZU9yZGVyKHtcbiAgICAgICAgY3VycmVuY3k6IHNldHRpbmdzLmN1cnJlbmN5IHx8ICcnLFxuICAgICAgICBhbW91bnQ6IHNldHRpbmdzLmFtb3VudCB8fCAwLFxuICAgICAgICBkZXNjcmlwdGlvbjogc2V0dGluZ3MuZGVzY3JpcHRpb24gfHwgJycsXG4gICAgICAgIG1lcmNoYW50SWQ6IHNldHRpbmdzLm1lcmNoYW50SWQgfHwgJycsXG4gICAgICAgIGN1c3RvbWVySWQ6IHNldHRpbmdzLmN1c3RvbWVySWQgfHwgJycsXG4gICAgICAgIG9yZGVySWQ6IHNldHRpbmdzLm9yZGVySWQgfHwgJycsXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS53YXJuKCdvcmRlciByZXN1bHQ6Jyk7XG4gICAgICBjb25zb2xlLndhcm4oZGF0YSk7XG5cbiAgICAgIGNvbnN0IHsgaWQgfSA9IGRhdGE7XG5cbiAgICAgIHRoaXMubG9ja2VkID0gdHJ1ZTtcblxuICAgICAgYXdhaXQgYXV0aC5yZWZyZXNoVG9rZW4oKTtcblxuICAgICAgdGhpcy5hZGRDaGlsZChhd2FpdCB0aGlzLm9wZW5PcmRlclBvcHVwKGlkKSwgdGhpcy5nZXRDb250YWluZXIoKSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb25zdCBvbGRUZXh0ID0gdGhpcy5idXR0b24udGV4dENvbnRlbnQ7XG4gICAgICB0aGlzLmJ1dHRvbi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdURFMUUnO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5idXR0b24udGV4dENvbnRlbnQgPSBvbGRUZXh0O1xuICAgICAgICB0aGlzLmxvY2tlZCA9IGZhbHNlO1xuICAgICAgfSwgMzAwMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuT3JkZXJQb3B1cCAoaWQ6IHN0cmluZykge1xuICAgIGNvbnNvbGUud2Fybignb3Blbk9yZGVyUG9wdXAnLCBpZCk7XG5cbiAgICBjb25zdCBwb3B1cCA9IG5ldyBPcmRlclBvcHVwKCk7XG4gICAgYXdhaXQgcG9wdXAuaW5pdCgpO1xuXG4gICAgcmV0dXJuIHBvcHVwO1xuICB9XG5cbiAgcHVibGljIGJlZm9yZVJlbW92ZUNoaWxkIChjaGlsZDogQ1BheUVsZW1lbnQpOiB2b2lkIHtcbiAgICB0aGlzLmxvY2tlZCA9IGZhbHNlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnV0dG9uQ29tbW9uIH0gZnJvbSAnLi9idXR0b24uY29tbW9uJztcblxuZXhwb3J0IGNsYXNzIEJ1dHRvbkFub255bW91cyBleHRlbmRzIEJ1dHRvbkNvbW1vbiB7XG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB3aWRnZXRQYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRQYXkuaWQgPSAnd2lkZ2V0X3BheSc7XG4gICAgd2lkZ2V0UGF5LmNsYXNzTmFtZSA9ICd3aWRlJztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5IHdpdGggQ3J5cHR1bVBheSc7XG5cbiAgICB0aGlzLmJ1dHRvbiA9IHdpZGdldFBheTtcblxuICAgIHdpZGdldFBheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY2xpY2suYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyUm9vdEl0ZW1zKFt3aWRnZXRQYXldKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGFwaSB9IGZyb20gJy4uLy4uL2FwaSc7XG5pbXBvcnQgeyBCdXR0b25Db21tb24gfSBmcm9tICcuL2J1dHRvbi5jb21tb24nO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uTG9nZ2VkIGV4dGVuZHMgQnV0dG9uQ29tbW9uIHtcbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHdpZGdldFBheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFBheS5pZCA9ICd3aWRnZXRfcGF5JztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5JztcblxuICAgIGNvbnN0IHdpZGdldFNldHRpbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0U2V0dGluZ3MuaWQgPSAnd2lkZ2V0X3NldHRpbmdzJztcblxuICAgIGNvbnN0IHdpZGdldFByaWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0UHJpY2UuaWQgPSAnd2lkZ2V0X3ByaWNlJztcbiAgICB3aWRnZXRQcmljZS50ZXh0Q29udGVudCA9ICcxMDA1MDAgVVNEVCc7XG5cbiAgICBjb25zdCB3aWRnZXRXYWxsZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRXYWxsZXQuaWQgPSAnd2lkZ2V0X3dhbGxldCc7XG5cbiAgICBjb25zdCB3YWxsZXRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHdhbGxldFNwYW4udGV4dENvbnRlbnQgPSAnM1ROXHUyMDI2OUZBJztcblxuICAgIGNvbnN0IGFycm93U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBhcnJvd1NwYW4uaW5uZXJIVE1MID0gJyYjOTY2MjsnO1xuXG4gICAgd2lkZ2V0V2FsbGV0LmFwcGVuZENoaWxkKHdhbGxldFNwYW4pO1xuICAgIHdpZGdldFdhbGxldC5hcHBlbmRDaGlsZChhcnJvd1NwYW4pO1xuXG4gICAgd2lkZ2V0U2V0dGluZ3MuYXBwZW5kQ2hpbGQod2lkZ2V0UHJpY2UpO1xuICAgIHdpZGdldFNldHRpbmdzLmFwcGVuZENoaWxkKHdpZGdldFdhbGxldCk7XG5cbiAgICB3aWRnZXRXYWxsZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB1c2VyID0gYXdhaXQgYXBpLmdldFVzZXIoKTtcbiAgICAgIGNvbnNvbGUud2Fybih1c2VyKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbXMoW3dpZGdldFBheSwgd2lkZ2V0U2V0dGluZ3NdKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGF1dGggfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IFdpZGdldENvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi4vZWxlbWVudCc7XG5pbXBvcnQgeyBCdXR0b25Bbm9ueW1vdXMgfSBmcm9tICcuL2J1dHRvbi5hbm9ueW1vdXMnO1xuaW1wb3J0IHsgQnV0dG9uTG9nZ2VkIH0gZnJvbSAnLi9idXR0b24ubG9nZ2VkJztcblxuZXhwb3J0IGNsYXNzIFdpZGdldCBleHRlbmRzIENQYXlFbGVtZW50IHtcbiAgcHJpdmF0ZSBjb25maWc6IFdpZGdldENvbmZpZztcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY29uZmlnID0gbmV3IFdpZGdldENvbmZpZygoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRDb25maWcgKCkge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZztcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBhdXRoLnJlYWR5KCk7XG5cbiAgICAvLyBUT0RPOiBcdTA0M0VcdTA0NDRcdTA0M0VcdTA0NDBcdTA0M0NcdTA0M0JcdTA0NEZcdTA0MzVcdTA0M0MgXHUwNDMyIFx1MDQzN1x1MDQzMFx1MDQzMlx1MDQzOFx1MDQ0MVx1MDQzOFx1MDQzQ1x1MDQzRVx1MDQ0MVx1MDQ0Mlx1MDQzOCBcdTA0M0VcdTA0NDIgXHUwNDNGXHUwNDM1XHUwNDQwXHUwNDMyXHUwNDM4XHUwNDQ3XHUwNDNEXHUwNDRCXHUwNDQ1IFx1MDQzRFx1MDQzMFx1MDQ0MVx1MDQ0Mlx1MDQ0MFx1MDQzRVx1MDQzNVx1MDQzQVxuICAgIC8vIGNvbnNvbGUud2FybigndXBkYXRlJywgdGhpcy5jb25maWcuZ2V0U2V0dGluZ3MoKSk7XG5cbiAgICBjb25zdCB3aWRnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXQuaWQgPSAnd2lkZ2V0JztcblxuICAgIGlmIChhdXRoLmlzTG9nZ2VkKSB7XG4gICAgICB0aGlzLmFkZENoaWxkKGF3YWl0IHRoaXMuY3JlYXRlTG9nZ2VkQnV0dG9uKCksIHdpZGdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoYXdhaXQgdGhpcy5jcmVhdGVBbm9ueW1vdXNCdXR0b24oKSwgd2lkZ2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyUm9vdEl0ZW1zKFt3aWRnZXRdKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlTG9nZ2VkQnV0dG9uICgpIHtcbiAgICBjb25zdCBidXR0b24gPSBuZXcgQnV0dG9uTG9nZ2VkKHRoaXMuY29uZmlnKTtcbiAgICBhd2FpdCBidXR0b24uaW5pdCgpO1xuXG4gICAgcmV0dXJuIGJ1dHRvbjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlQW5vbnltb3VzQnV0dG9uICgpIHtcbiAgICBjb25zdCBidXR0b24gPSBuZXcgQnV0dG9uQW5vbnltb3VzKHRoaXMuY29uZmlnKTtcbiAgICBhd2FpdCBidXR0b24uaW5pdCgpO1xuXG4gICAgcmV0dXJuIGJ1dHRvbjtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlICgpOiB2b2lkIHtcbiAgICBpZiAoIWF1dGguaXNSZWFkeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IFx1MDQzRVx1MDQzMVx1MDQzRFx1MDQzRVx1MDQzMlx1MDQzQlx1MDQ0Rlx1MDQzNVx1MDQzQyBcdTA0MzJcdTA0M0RcdTA0MzVcdTA0NDhcdTA0M0FcdTA0NDMgXHUwNDM1XHUwNDQxXHUwNDNCXHUwNDM4IFx1MDQzOFx1MDQzN1x1MDQzQ1x1MDQzNVx1MDQzRFx1MDQzOFx1MDQzQlx1MDQzOCBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzlcdTA0M0FcdTA0MzggXHUwNDMyIFx1MDQ0MFx1MDQzNVx1MDQzMFx1MDQzQlx1MDQ0Mlx1MDQzMFx1MDQzOVx1MDQzQ1x1MDQzNVxuICAgIC8vIGNvbnNvbGUud2FybigndXBkYXRlJywgdGhpcy5jb25maWcuZ2V0U2V0dGluZ3MoKSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBkb20gfSBmcm9tICcuLi9zZXJ2aWNlcy9kb20nO1xuaW1wb3J0IHsgQ1BheUVsZW1lbnQgfSBmcm9tICcuL2VsZW1lbnQnO1xuXG5leHBvcnQgY2xhc3MgUm9vdCBleHRlbmRzIENQYXlFbGVtZW50IHtcbiAgcHJpdmF0ZSBzdGF0aWMgUmVnaXN0ZXJlZElkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBwcml2YXRlIHJvb3RJZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yIChyb290SWQ6IHN0cmluZykge1xuICAgIGlmIChSb290LlJlZ2lzdGVyZWRJZHMuaGFzKHJvb3RJZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSWQgJHtyb290SWR9IGlzIGFscmVhZHkgaW4gdXNlYCk7XG4gICAgfVxuXG4gICAgc3VwZXIoZG9tLmZpbmRFbGVtZW50KHJvb3RJZCkpO1xuXG4gICAgUm9vdC5SZWdpc3RlcmVkSWRzLmFkZChyb290SWQpO1xuXG4gICAgdGhpcy5yb290SWQgPSByb290SWQ7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKSB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuICB9XG5cbiAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgUm9vdC5SZWdpc3RlcmVkSWRzLmRlbGV0ZSh0aGlzLnJvb3RJZCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNFQSxNQUFNLFNBQU4sTUFBZ0M7QUFBQSxJQUM5QixnQkFBeUI7QUFDdkIsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUVBLHdCQUFpQztBQUMvQixhQUFPLEtBQUs7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUVPLE1BQU0sU0FBUyxJQUFJLE9BQU87OztBQ1oxQixNQUFlLFlBQWYsTUFBeUI7QUFBQSxJQUNwQjtBQUFBLElBRVYsWUFBYSxNQUFjO0FBQ3pCLFdBQUssT0FBTztBQUFBLElBQ2Q7QUFBQSxJQUVVLElBQUssS0FBcUI7QUFDbEMsYUFBTyxHQUFHLEtBQUssSUFB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Q25CO0FBQUEsSUFFTyxTQUFnQjtBQUNyQixZQUFLLGNBQWMsT0FBTyxLQUFLLE1BQU07QUFBQSxJQUN2QztBQUFBLEVBQ0Y7OztBakJyQk8sTUFBTSxTQUFTLE9BQU8sT0FBZTtBQUMxQyxVQUFNLE9BQU8sSUFBSSxLQUFLLEVBQUU7QUFDeEIsVUFBTSxTQUFTLElBQUksT0FBTztBQUUxQixRQUFJLGFBQWE7QUFFakIsVUFBTSxRQUFRLElBQUksQ0FBQyxLQUFLLEtBQUssR0FBRyxPQUFPLEtBQUssQ0FBQyxDQUFDO0FBRTlDLFNBQUssU0FBUyxNQUFNO0FBRXBCLFdBQU87QUFBQSxNQUNMLFFBQVEsTUFBTTtBQUNaLGFBQUssY0FBYztBQUNuQixZQUFJLE9BQU87QUFDWCxhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsTUFDQSxRQUFRLE9BQU8sVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxRQUNILGVBQWUsTUFBTSxJQUFJLGNBQWM7QUFBQSxNQUN6QztBQUFBLElBQ0Y7QUFBQSxFQUNGOyIsCiAgIm5hbWVzIjogWyJjb25maWciLCAic3RvcmUiLCAiY29uZmlnIiwgInN0b3JlIiwgImNvbmZpZyJdCn0K
