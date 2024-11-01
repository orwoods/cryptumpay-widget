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

  // _rcljc6pwq:/Volumes/Projects/cryptumpay/widget/src/style/styles.css
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
    #clientOrderId;
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
    setClientOrderId(value) {
      if (this.#clientOrderId === value) {
        return;
      }
      this.#clientOrderId = value;
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
        clientOrderId: this.#clientOrderId,
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
          clientOrderId: settings.clientOrderId || ""
        });
        console.warn("order result:");
        console.warn(data);
        const orderId = data.orderId;
        this.locked = true;
        await auth.refreshToken();
        this.addChild(await this.openOrderPopup(orderId), this.getContainer());
      } catch {
        const oldText = this.button.textContent;
        this.button.textContent = "\u{1F61E}";
        setTimeout(() => {
          this.button.textContent = oldText;
          this.locked = false;
        }, 3e3);
      }
    }
    async openOrderPopup(orderId) {
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
      config: widget.getConfig()
    };
  };
  return __toCommonJS(app_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9hdXRoLnRzIiwgIl9yY2xqYzZwd3E6L1ZvbHVtZXMvUHJvamVjdHMvY3J5cHR1bXBheS93aWRnZXQvc3JjL3N0eWxlL3N0eWxlcy5jc3MiLCAiLi4vc3JjL3N0eWxlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9kb20udHMiLCAiLi4vc3JjL2N1cnJlbmNpZXMvdXRpbHMudHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9jb25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2VsZW1lbnQudHMiLCAiLi4vc3JjL2FwaS9pbmRleC50cyIsICIuLi9zcmMvZWxlbWVudHMvb3JkZXJQb3B1cC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2J1dHRvbi5jb21tb24udHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9idXR0b24uYW5vbnltb3VzLnRzIiwgIi4uL3NyYy9lbGVtZW50cy93aWRnZXQvYnV0dG9uLmxvZ2dlZC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2luZGV4LnRzIiwgIi4uL3NyYy9lbGVtZW50cy9yb290LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IGRvbSB9IGZyb20gJy4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IFdpZGdldCB9IGZyb20gJy4vZWxlbWVudHMvd2lkZ2V0JztcbmltcG9ydCB7IFJvb3QgfSBmcm9tICcuL2VsZW1lbnRzL3Jvb3QnO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlID0gYXN5bmMgKGlkOiBzdHJpbmcpID0+IHtcbiAgY29uc3Qgcm9vdCA9IG5ldyBSb290KGlkKTtcbiAgY29uc3Qgd2lkZ2V0ID0gbmV3IFdpZGdldCgpO1xuXG4gIGRvbS5pbmplY3RTdHlsZXMoKTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChbcm9vdC5pbml0KCksIHdpZGdldC5pbml0KCldKTtcblxuICByb290LmFkZENoaWxkKHdpZGdldCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHJvb3QuY2FzY2FkZVVubG9hZCgpO1xuICAgICAgZG9tLnVubG9hZCgpO1xuICAgICAgYXV0aC51bmxvYWQoKTtcbiAgICB9LFxuICAgIGNvbmZpZzogd2lkZ2V0LmdldENvbmZpZygpLFxuICB9O1xufTtcbiIsICJpbXBvcnQgeyBJQ29uZmlnIH0gZnJvbSAnLi90eXBlcyc7XG5cbmNsYXNzIENvbmZpZyBpbXBsZW1lbnRzIElDb25maWcge1xuICBnZXRBcGlCYXNlVXJsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnaHR0cDovL2FwaS5jcnlwdHVtcGF5LmxvY2FsJztcbiAgfVxuXG4gIGdldEp3dFJlZnJlc2hJbnRlcnZhbCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMzAgKiAxMDAwO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBuZXcgQ29uZmlnKCk7XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IHN0b3JlIH0gZnJvbSAnLi4vc3RvcmUnO1xuaW1wb3J0IHsgSUNvbmZpZywgSVN0b3JlLCBJQXV0aCB9IGZyb20gJy4uL3R5cGVzJztcblxuY2xhc3MgQXV0aCBpbXBsZW1lbnRzIElBdXRoIHtcbiAgcHJpdmF0ZSBjb25maWc6IElDb25maWc7XG4gIHByaXZhdGUgc3RvcmU6IElTdG9yZTtcblxuICBwcml2YXRlIGxvZ2dlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIG9uUmVhZHk6ICgodmFsdWU6IHZvaWQpID0+IHZvaWQpW107XG4gIHByaXZhdGUgYXV0b1JlZnJlc2hUb2tlbj86IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IgKGNvbmZpZzogSUNvbmZpZywgc3RvcmU6IElTdG9yZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLm9uUmVhZHkgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNMb2dnZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxvZ2dlZDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVhZHkgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLm9uUmVhZHkucHVzaChyZXNvbHZlKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemF0aW9uKSB7XG4gICAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSB0cnVlO1xuXG4gICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zdG9yZS5mb3JnZXRTZW5zaXRpdmVEYXRhKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFRva2VuKCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcmVzb2x2ZSBvZiB0aGlzLm9uUmVhZHkpIHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaFRva2VuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9L2F1dGgvcmVmcmVzaC10b2tlbmA7XG5cbiAgICBpZiAodGhpcy5hdXRvUmVmcmVzaFRva2VuKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuYXV0b1JlZnJlc2hUb2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmZXRjaCh1cmwsIHsgbWV0aG9kOiAnUE9TVCcsIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmUuZm9yZ2V0U2Vuc2l0aXZlRGF0YSgpO1xuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKCFkYXRhLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zdG9yZS5zZXRBY2Nlc3NUb2tlbihkYXRhLmFjY2Vzc1Rva2VuKTtcblxuICAgICAgICAgIHRoaXMuYXV0b1JlZnJlc2hUb2tlbiA9IHNldEludGVydmFsKCgpID0+IHRoaXMucmVmcmVzaFRva2VuKCksIHRoaXMuY29uZmlnLmdldEp3dFJlZnJlc2hJbnRlcnZhbCgpKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxvZ291dCAoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5jb25maWcuZ2V0QXBpQmFzZVVybCgpfS9hdXRoL2xvZ291dGA7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcblxuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuXG4gICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdXRoID0gbmV3IEF1dGgoY29uZmlnLCBzdG9yZSk7XG4iLCAiI3dpZGdldHt3aWR0aDozMDBweDttYXJnaW46MjBweDtib3JkZXI6MXB4IHNvbGlkICNhZWFlYWU7Ym9yZGVyLXJhZGl1czo2cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtib3gtc2l6aW5nOmJvcmRlci1ib3g7YWxpZ24taXRlbXM6c3RyZXRjaH0jd2lkZ2V0X3BheXtmbGV4LWdyb3c6MTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Zm9udC1zaXplOjE1cHg7Zm9udC1mYW1pbHk6VmVyZGFuYSxHZW5ldmEsVGFob21hLHNhbnMtc2VyaWY7YmFja2dyb3VuZDojNjFjM2ZmO2NvbG9yOiNmZmY7Y3Vyc29yOnBvaW50ZXJ9I3dpZGdldF9wYXkud2lkZXtwYWRkaW5nOjE1cHggMH0jd2lkZ2V0X3BheTpob3ZlcntiYWNrZ3JvdW5kOiMzOGIzZmZ9I3dpZGdldF9zZXR0aW5nc3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO3RleHQtYWxpZ246Y2VudGVyO21heC13aWR0aDo1MCU7YmFja2dyb3VuZDojYWRlMGZmO2NvbG9yOiM2ZjZmNmY7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldHtjdXJzb3I6cG9pbnRlcjt0ZXh0LWFsaWduOnJpZ2h0fSN3aWRnZXRfd2FsbGV0OmhvdmVye2JhY2tncm91bmQ6Izk4ZDdmZn0jd2lkZ2V0X3NldHRpbmdzPmRpdntwYWRkaW5nOjNweCAyMHB4fSIsICIvLyBAdHMtaWdub3JlXG5pbXBvcnQgc3R5bGVzIGZyb20gJ3Nhc3M6Li9zdHlsZXMuY3NzJztcblxuZXhwb3J0IGNvbnN0IGdldFN0eWxlcyA9ICgpOiBzdHJpbmcgPT4gc3R5bGVzO1xuIiwgImltcG9ydCB7IGdldFN0eWxlcyB9IGZyb20gJy4uL3N0eWxlJztcblxuY2xhc3MgRG9tIHtcbiAgcHJpdmF0ZSBzdHlsZXM/OiBIVE1MRWxlbWVudDtcblxuICBwdWJsaWMgaW5qZWN0RWxlbWVudCAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gIH1cblxuICBwdWJsaWMgaW5qZWN0U3R5bGVzICgpOiB2b2lkIHtcbiAgICBjb25zdCB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHRhZy50ZXh0Q29udGVudCA9IGdldFN0eWxlcygpO1xuXG4gICAgdGhpcy5pbmplY3RFbGVtZW50KGRvY3VtZW50LmhlYWQsIHRhZyk7XG5cbiAgICB0aGlzLnN0eWxlcyA9IHRhZztcbiAgfVxuXG4gIHB1YmxpYyBmaW5kRWxlbWVudCAoZWxlbWVudElkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbiAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBlbGVtZW50ICR7ZWxlbWVudElkfS5gKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIGlmICh0aGlzLnN0eWxlcykge1xuICAgICAgdGhpcy5zdHlsZXMucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkb20gPSBuZXcgRG9tKCk7XG4iLCAiZXhwb3J0IGNvbnN0IGdldEN1cnJlbmN5SGFzaCA9ICh7IGlkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdCB9OiB7XG4gIGlkOiBzdHJpbmc7XG4gIG5ldHdvcms6IHN0cmluZztcbiAgdGlja2VyOiBzdHJpbmc7XG4gIGNoYWluOiBzdHJpbmc7XG4gIGNvbnRyYWN0OiBzdHJpbmc7XG59KTogc3RyaW5nID0+IHtcbiAgY29uc3QgYXJyID0gW2lkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdF07XG4gIGlmICghYXJyLmV2ZXJ5KChwYXJ0KSA9PiBwYXJ0Lmxlbmd0aCA+IDApKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYWxmb3JtZWQgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IHN0ciA9IGFyci5qb2luKCc6Jyk7XG4gIGNvbnN0IGhhc2ggPSBCdWZmZXIuZnJvbShzdHIpLnRvU3RyaW5nKCdoZXgnKS5zdWJzdHJpbmcoMCwgNDAgLSAxIC0gc3RyLmxlbmd0aCk7XG5cbiAgcmV0dXJuIGhhc2g7XG59O1xuXG5leHBvcnQgY29uc3QgY2hlY2tDdXJyZW5jeSA9IChjdXJyZW5jeTogc3RyaW5nKSA9PiB7XG4gIGlmICghY3VycmVuY3kgfHwgdHlwZW9mIGN1cnJlbmN5ICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjdXJyZW5jeScpO1xuICB9XG5cbiAgY29uc3QgcGFydHMgPSBjdXJyZW5jeS5zcGxpdCgnOicpO1xuICBpZiAocGFydHMubGVuZ3RoICE9PSA2IHx8IGN1cnJlbmN5Lmxlbmd0aCAhPT0gNDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGZvcm1hdCBvZiB0aGUgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IFtpZCwgbmV0d29yaywgdGlja2VyLCBjaGFpbiwgY29udHJhY3QsIGhhc2hdID0gcGFydHM7XG5cbiAgY29uc3QgY3VycmVuY3lIYXNoID0gZ2V0Q3VycmVuY3lIYXNoKHsgaWQsIG5ldHdvcmssIHRpY2tlciwgY2hhaW4sIGNvbnRyYWN0IH0pO1xuXG4gIGlmIChjdXJyZW5jeUhhc2ggIT09IGhhc2gpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGN1cnJlbmN5IGhhc2gnKTtcbiAgfVxufTtcbiIsICJpbXBvcnQgeyBjaGVja0N1cnJlbmN5IH0gZnJvbSAnLi4vLi4vY3VycmVuY2llcy91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBXaWRnZXRDb25maWcge1xuICAjY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG5cbiAgI29yZGVySWQ/OiBzdHJpbmc7XG4gICNjdXN0b21lcklkPzogc3RyaW5nO1xuICAjbWVyY2hhbnRJZD86IHN0cmluZztcbiAgI2NsaWVudE9yZGVySWQ/OiBzdHJpbmc7XG4gICNhbW91bnQ/OiBudW1iZXI7XG4gICNjYW5FZGl0QW1vdW50PzogYm9vbGVhbjtcbiAgI2N1cnJlbmN5Pzogc3RyaW5nO1xuICAjZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy4jY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgfVxuXG4gIHB1YmxpYyBzZXRPcmRlcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI29yZGVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jb3JkZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRDdXN0b21lcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2N1c3RvbWVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jY3VzdG9tZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRNZXJjaGFudElkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI21lcmNoYW50SWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jbWVyY2hhbnRJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRDbGllbnRPcmRlcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2NsaWVudE9yZGVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jY2xpZW50T3JkZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRQcmljZSAoYW1vdW50OiBudW1iZXIsIGN1cnJlbmN5OiBzdHJpbmcsIGNhbkVkaXRBbW91bnQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy4jYW1vdW50ID09PSBhbW91bnQgJiYgdGhpcy4jY3VycmVuY3kgPT09IGN1cnJlbmN5ICYmIHRoaXMuI2NhbkVkaXRBbW91bnQgPT09IGNhbkVkaXRBbW91bnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaGVja0N1cnJlbmN5KGN1cnJlbmN5KTtcblxuICAgIHRoaXMuI2Ftb3VudCA9IGFtb3VudDtcbiAgICB0aGlzLiNjdXJyZW5jeSA9IGN1cnJlbmN5O1xuICAgIHRoaXMuI2NhbkVkaXRBbW91bnQgPSBjYW5FZGl0QW1vdW50O1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXREZXNjcmlwdGlvbiAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNkZXNjcmlwdGlvbiA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNkZXNjcmlwdGlvbiA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRTZXR0aW5ncyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9yZGVySWQ6IHRoaXMuI29yZGVySWQsXG4gICAgICBjdXN0b21lcklkOiB0aGlzLiNjdXN0b21lcklkLFxuICAgICAgbWVyY2hhbnRJZDogdGhpcy4jbWVyY2hhbnRJZCxcbiAgICAgIGNsaWVudE9yZGVySWQ6IHRoaXMuI2NsaWVudE9yZGVySWQsXG4gICAgICBhbW91bnQ6IHRoaXMuI2Ftb3VudCxcbiAgICAgIGNhbkVkaXRBbW91bnQ6IHRoaXMuI2NhbkVkaXRBbW91bnQsXG4gICAgICBjdXJyZW5jeTogdGhpcy4jY3VycmVuY3ksXG4gICAgICBkZXNjcmlwdGlvbjogdGhpcy4jZGVzY3JpcHRpb24sXG4gICAgfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGRvbSB9IGZyb20gJy4uL3NlcnZpY2VzL2RvbSc7XG5cbmV4cG9ydCBjbGFzcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgc3RhdGljIG1heElkID0gMDtcblxuICBwcml2YXRlIHJlYWRvbmx5IGlkID0gKytDUGF5RWxlbWVudC5tYXhJZDtcbiAgcHJvdGVjdGVkIGNvbnRhaW5lcj86IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgcm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdID0gW107XG4gIHByb3RlY3RlZCBwYXJlbnQ/OiBDUGF5RWxlbWVudDtcbiAgcHJpdmF0ZSBjaGlsZHMgPSBuZXcgTWFwPG51bWJlciwgQ1BheUVsZW1lbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IgKGNvbnRhaW5lcj86IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpIHtcbiAgfVxuXG4gIHB1YmxpYyBjYXNjYWRlVW5sb2FkICgpIHtcbiAgICB0aGlzLmNoaWxkcy5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5yZW1vdmVDaGlsZChjaGlsZCkpO1xuXG4gICAgdGhpcy51bmxvYWQoKTtcblxuICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29udGFpbmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucm9vdEl0ZW1zID0gW107XG4gIH1cblxuICBwdWJsaWMgc2V0UGFyZW50IChwYXJlbnQ/OiBDUGF5RWxlbWVudCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldENvbnRhaW5lciAoY29udGFpbmVyPzogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIHByb3RlY3RlZCByZWdpc3RlclJvb3RJdGVtcyAocm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdKSB7XG4gICAgdGhpcy5yb290SXRlbXMgPSByb290SXRlbXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0UGFyZW50ICgpOiBDUGF5RWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICB9XG5cbiAgcHVibGljIGdldENvbnRhaW5lciAoKTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXRSb290SXRlbXMgKCk6IEhUTUxFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLnJvb3RJdGVtcztcbiAgfVxuXG4gIHB1YmxpYyBhZGRDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50LCBjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCB0aGlzLmNvbnRhaW5lcjtcbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb250YWluZXIgd2FzIG5vdCBzZXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuY2hpbGRzLnNldChjaGlsZC5pZCwgY2hpbGQpO1xuXG4gICAgY2hpbGQuc2V0UGFyZW50KHRoaXMpO1xuICAgIGNoaWxkLnNldENvbnRhaW5lcihjb250YWluZXIpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHJvb3RJdGVtcykge1xuICAgICAgZG9tLmluamVjdEVsZW1lbnQoY29udGFpbmVyLCBpdGVtKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYmVmb3JlUmVtb3ZlQ2hpbGQgKGNoaWxkOiBDUGF5RWxlbWVudCkge1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUNoaWxkIChjaGlsZDogQ1BheUVsZW1lbnQpIHtcbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuYmVmb3JlUmVtb3ZlQ2hpbGQoY2hpbGQpO1xuXG4gICAgY2hpbGQuY2FzY2FkZVVubG9hZCgpO1xuICAgIGNoaWxkLnNldFBhcmVudCgpO1xuICAgIGNoaWxkLnNldENvbnRhaW5lcigpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHJvb3RJdGVtcykge1xuICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkcy5kZWxldGUoY2hpbGQuaWQpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoKSB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgc3RvcmUgfSBmcm9tICcuLi9zdG9yZSc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHsgSUNvbmZpZywgSVN0b3JlLCBUSnVzdENyZWF0ZWRPcmRlciwgVE9yZGVyUmVxdWVzdCB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IHR5cGUgVFJlcXVlc3RQYXJhbXMgPSB7XG4gIGVuZHBvaW50OiBzdHJpbmc7XG4gIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICBtZXRob2Q/OiAnUE9TVCcgfCAnR0VUJyB8ICdQVVQnIHwgJ0RFTEVURSc7XG4gIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW47XG4gIHdpdGhBdXRob3JpemF0aW9uPzogYm9vbGVhbjtcbn07XG5cbmNsYXNzIEFwaSB7XG4gIHByaXZhdGUgY29uZmlnOiBJQ29uZmlnO1xuICBwcml2YXRlIHN0b3JlOiBJU3RvcmU7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yIChjb25maWc6IElDb25maWcsIHN0b3JlOiBJU3RvcmUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlcXVlc3QgPFQ+ICh7XG4gICAgZW5kcG9pbnQsXG4gICAgbWV0aG9kID0gJ0dFVCcsXG4gICAgZGF0YSA9IHt9LFxuICAgIHdpdGhDcmVkZW50aWFscyA9IGZhbHNlLFxuICAgIHdpdGhBdXRob3JpemF0aW9uID0gdHJ1ZSxcbiAgfTogVFJlcXVlc3RQYXJhbXMpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGAke3RoaXMuY29uZmlnLmdldEFwaUJhc2VVcmwoKX0ke2VuZHBvaW50fWApO1xuXG4gICAgY29uc3QgcmVxdWVzdFBhcmFtczogUmVxdWVzdEluaXQgPSB7XG4gICAgICBtZXRob2QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBpZiAobWV0aG9kID09PSAnR0VUJykge1xuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaCgoa2V5KSA9PiB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZChrZXksIGRhdGFba2V5XSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0UGFyYW1zLmJvZHkgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICB9XG5cbiAgICBpZiAod2l0aENyZWRlbnRpYWxzKSB7XG4gICAgICByZXF1ZXN0UGFyYW1zLmNyZWRlbnRpYWxzID0gJ2luY2x1ZGUnO1xuICAgIH1cblxuICAgIGlmICh3aXRoQXV0aG9yaXphdGlvbikge1xuICAgICAgcmVxdWVzdFBhcmFtcy5oZWFkZXJzID0ge1xuICAgICAgICAuLi5yZXF1ZXN0UGFyYW1zLmhlYWRlcnMsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0aGlzLnN0b3JlLmdldEFjY2Vzc1Rva2VuKCl9YCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCByZXF1ZXN0UGFyYW1zKTtcblxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hdXRob3JpemVkIHJlcXVlc3QnKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXNwb25zZSBjb2RlIGlzIG5vdCAyMDAnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcblxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIGVycm9yJyk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGNyZWF0ZU9yZGVyIChvcmRlcjogVE9yZGVyUmVxdWVzdCkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlcXVlc3Q8VEp1c3RDcmVhdGVkT3JkZXI+KHtcbiAgICAgIGVuZHBvaW50OiAnL29yZGVyJyxcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgZGF0YTogb3JkZXIsXG4gICAgICB3aXRoQXV0aG9yaXphdGlvbjogdHJ1ZSxcbiAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRVc2VyICgpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXF1ZXN0PFRKdXN0Q3JlYXRlZE9yZGVyPih7XG4gICAgICBlbmRwb2ludDogJy91c2VyJyxcbiAgICAgIHdpdGhBdXRob3JpemF0aW9uOiB0cnVlLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhcGkgPSBuZXcgQXBpKGNvbmZpZywgc3RvcmUpO1xuIiwgImltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi9lbGVtZW50JztcblxuZXhwb3J0IGNsYXNzIE9yZGVyUG9wdXAgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwb3B1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHBvcHVwLmlkID0gJ29yZGVyX3BvcHVwJztcblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbXMoW3BvcHVwXSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi8uLi9hcGknO1xuaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2F1dGgnO1xuaW1wb3J0IHsgQ1BheUVsZW1lbnQgfSBmcm9tICcuLi9lbGVtZW50JztcbmltcG9ydCB7IE9yZGVyUG9wdXAgfSBmcm9tICcuLi9vcmRlclBvcHVwJztcbmltcG9ydCB7IFdpZGdldENvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJ1dHRvbkNvbW1vbiBleHRlbmRzIENQYXlFbGVtZW50IHtcbiAgcHJvdGVjdGVkIGJ1dHRvbiE6IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgY2xpY2tlZCA9IGZhbHNlO1xuICBwcml2YXRlIGxvY2tlZCA9IGZhbHNlO1xuICBwcml2YXRlIGNvbmZpZzogV2lkZ2V0Q29uZmlnO1xuXG4gIGNvbnN0cnVjdG9yIChjb25maWc6IFdpZGdldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBjbGljayAoKSB7XG4gICAgaWYgKHRoaXMuY2xpY2tlZCB8fCB0aGlzLmxvY2tlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xpY2tlZCA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jcmVhdGVPcmRlcigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0J1dHRvbkNvbW1vbiBlcnJvcicsIGVycm9yKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWNrZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlT3JkZXIgKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBhcGkuY3JlYXRlT3JkZXIoe1xuICAgICAgICBjdXJyZW5jeTogc2V0dGluZ3MuY3VycmVuY3kgfHwgJycsXG4gICAgICAgIGFtb3VudDogc2V0dGluZ3MuYW1vdW50IHx8IDAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzZXR0aW5ncy5kZXNjcmlwdGlvbiB8fCAnJyxcbiAgICAgICAgbWVyY2hhbnRJZDogc2V0dGluZ3MubWVyY2hhbnRJZCB8fCAnJyxcbiAgICAgICAgY3VzdG9tZXJJZDogc2V0dGluZ3MuY3VzdG9tZXJJZCB8fCAnJyxcbiAgICAgICAgY2xpZW50T3JkZXJJZDogc2V0dGluZ3MuY2xpZW50T3JkZXJJZCB8fCAnJyxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLndhcm4oJ29yZGVyIHJlc3VsdDonKTtcbiAgICAgIGNvbnNvbGUud2FybihkYXRhKTtcblxuICAgICAgY29uc3Qgb3JkZXJJZCA9IGRhdGEub3JkZXJJZDtcblxuICAgICAgdGhpcy5sb2NrZWQgPSB0cnVlO1xuXG4gICAgICBhd2FpdCBhdXRoLnJlZnJlc2hUb2tlbigpO1xuXG4gICAgICB0aGlzLmFkZENoaWxkKGF3YWl0IHRoaXMub3Blbk9yZGVyUG9wdXAob3JkZXJJZCksIHRoaXMuZ2V0Q29udGFpbmVyKCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29uc3Qgb2xkVGV4dCA9IHRoaXMuYnV0dG9uLnRleHRDb250ZW50O1xuICAgICAgdGhpcy5idXR0b24udGV4dENvbnRlbnQgPSAnXHVEODNEXHVERTFFJztcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuYnV0dG9uLnRleHRDb250ZW50ID0gb2xkVGV4dDtcbiAgICAgICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcbiAgICAgIH0sIDMwMDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3Blbk9yZGVyUG9wdXAgKG9yZGVySWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHBvcHVwID0gbmV3IE9yZGVyUG9wdXAoKTtcbiAgICBhd2FpdCBwb3B1cC5pbml0KCk7XG5cbiAgICByZXR1cm4gcG9wdXA7XG4gIH1cblxuICBwdWJsaWMgYmVmb3JlUmVtb3ZlQ2hpbGQgKGNoaWxkOiBDUGF5RWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMubG9ja2VkID0gZmFsc2U7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCdXR0b25Db21tb24gfSBmcm9tICcuL2J1dHRvbi5jb21tb24nO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uQW5vbnltb3VzIGV4dGVuZHMgQnV0dG9uQ29tbW9uIHtcbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHdpZGdldFBheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFBheS5pZCA9ICd3aWRnZXRfcGF5JztcbiAgICB3aWRnZXRQYXkuY2xhc3NOYW1lID0gJ3dpZGUnO1xuICAgIHdpZGdldFBheS50ZXh0Q29udGVudCA9ICdQYXkgd2l0aCBDcnlwdHVtUGF5JztcblxuICAgIHRoaXMuYnV0dG9uID0gd2lkZ2V0UGF5O1xuXG4gICAgd2lkZ2V0UGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jbGljay5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbXMoW3dpZGdldFBheV0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXBpIH0gZnJvbSAnLi4vLi4vYXBpJztcbmltcG9ydCB7IEJ1dHRvbkNvbW1vbiB9IGZyb20gJy4vYnV0dG9uLmNvbW1vbic7XG5cbmV4cG9ydCBjbGFzcyBCdXR0b25Mb2dnZWQgZXh0ZW5kcyBCdXR0b25Db21tb24ge1xuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgd2lkZ2V0UGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0UGF5LmlkID0gJ3dpZGdldF9wYXknO1xuICAgIHdpZGdldFBheS50ZXh0Q29udGVudCA9ICdQYXknO1xuXG4gICAgY29uc3Qgd2lkZ2V0U2V0dGluZ3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRTZXR0aW5ncy5pZCA9ICd3aWRnZXRfc2V0dGluZ3MnO1xuXG4gICAgY29uc3Qgd2lkZ2V0UHJpY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRQcmljZS5pZCA9ICd3aWRnZXRfcHJpY2UnO1xuICAgIHdpZGdldFByaWNlLnRleHRDb250ZW50ID0gJzEwMDUwMCBVU0RUJztcblxuICAgIGNvbnN0IHdpZGdldFdhbGxldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFdhbGxldC5pZCA9ICd3aWRnZXRfd2FsbGV0JztcblxuICAgIGNvbnN0IHdhbGxldFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgd2FsbGV0U3Bhbi50ZXh0Q29udGVudCA9ICczVE5cdTIwMjY5RkEnO1xuXG4gICAgY29uc3QgYXJyb3dTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGFycm93U3Bhbi5pbm5lckhUTUwgPSAnJiM5NjYyOyc7XG5cbiAgICB3aWRnZXRXYWxsZXQuYXBwZW5kQ2hpbGQod2FsbGV0U3Bhbik7XG4gICAgd2lkZ2V0V2FsbGV0LmFwcGVuZENoaWxkKGFycm93U3Bhbik7XG5cbiAgICB3aWRnZXRTZXR0aW5ncy5hcHBlbmRDaGlsZCh3aWRnZXRQcmljZSk7XG4gICAgd2lkZ2V0U2V0dGluZ3MuYXBwZW5kQ2hpbGQod2lkZ2V0V2FsbGV0KTtcblxuICAgIHdpZGdldFdhbGxldC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhcGkuZ2V0VXNlcigpO1xuICAgICAgY29uc29sZS53YXJuKHVzZXIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZWdpc3RlclJvb3RJdGVtcyhbd2lkZ2V0UGF5LCB3aWRnZXRTZXR0aW5nc10pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2F1dGgnO1xuaW1wb3J0IHsgV2lkZ2V0Q29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgQ1BheUVsZW1lbnQgfSBmcm9tICcuLi9lbGVtZW50JztcbmltcG9ydCB7IEJ1dHRvbkFub255bW91cyB9IGZyb20gJy4vYnV0dG9uLmFub255bW91cyc7XG5pbXBvcnQgeyBCdXR0b25Mb2dnZWQgfSBmcm9tICcuL2J1dHRvbi5sb2dnZWQnO1xuXG5leHBvcnQgY2xhc3MgV2lkZ2V0IGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwcml2YXRlIGNvbmZpZzogV2lkZ2V0Q29uZmlnO1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb25maWcgPSBuZXcgV2lkZ2V0Q29uZmlnKCgpID0+IHRoaXMudXBkYXRlKCkpO1xuICB9XG5cbiAgcHVibGljIGdldENvbmZpZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGF1dGgucmVhZHkoKTtcblxuICAgIC8vIFRPRE86IFx1MDQzRVx1MDQ0NFx1MDQzRVx1MDQ0MFx1MDQzQ1x1MDQzQlx1MDQ0Rlx1MDQzNVx1MDQzQyBcdTA0MzIgXHUwNDM3XHUwNDMwXHUwNDMyXHUwNDM4XHUwNDQxXHUwNDM4XHUwNDNDXHUwNDNFXHUwNDQxXHUwNDQyXHUwNDM4IFx1MDQzRVx1MDQ0MiBcdTA0M0ZcdTA0MzVcdTA0NDBcdTA0MzJcdTA0MzhcdTA0NDdcdTA0M0RcdTA0NEJcdTA0NDUgXHUwNDNEXHUwNDMwXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM1XHUwNDNBXG4gICAgLy8gY29uc29sZS53YXJuKCd1cGRhdGUnLCB0aGlzLmNvbmZpZy5nZXRTZXR0aW5ncygpKTtcblxuICAgIGNvbnN0IHdpZGdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldC5pZCA9ICd3aWRnZXQnO1xuXG4gICAgaWYgKGF1dGguaXNMb2dnZWQpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoYXdhaXQgdGhpcy5jcmVhdGVMb2dnZWRCdXR0b24oKSwgd2lkZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRDaGlsZChhd2FpdCB0aGlzLmNyZWF0ZUFub255bW91c0J1dHRvbigpLCB3aWRnZXQpO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbXMoW3dpZGdldF0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVMb2dnZWRCdXR0b24gKCkge1xuICAgIGNvbnN0IGJ1dHRvbiA9IG5ldyBCdXR0b25Mb2dnZWQodGhpcy5jb25maWcpO1xuICAgIGF3YWl0IGJ1dHRvbi5pbml0KCk7XG5cbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVBbm9ueW1vdXNCdXR0b24gKCkge1xuICAgIGNvbnN0IGJ1dHRvbiA9IG5ldyBCdXR0b25Bbm9ueW1vdXModGhpcy5jb25maWcpO1xuICAgIGF3YWl0IGJ1dHRvbi5pbml0KCk7XG5cbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGUgKCk6IHZvaWQge1xuICAgIGlmICghYXV0aC5pc1JlYWR5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVE9ETzogXHUwNDNFXHUwNDMxXHUwNDNEXHUwNDNFXHUwNDMyXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMlx1MDQzRFx1MDQzNVx1MDQ0OFx1MDQzQVx1MDQ0MyBcdTA0MzVcdTA0NDFcdTA0M0JcdTA0MzggXHUwNDM4XHUwNDM3XHUwNDNDXHUwNDM1XHUwNDNEXHUwNDM4XHUwNDNCXHUwNDM4IFx1MDQzRFx1MDQzMFx1MDQ0MVx1MDQ0Mlx1MDQ0MFx1MDQzRVx1MDQzOVx1MDQzQVx1MDQzOCBcdTA0MzIgXHUwNDQwXHUwNDM1XHUwNDMwXHUwNDNCXHUwNDQyXHUwNDMwXHUwNDM5XHUwNDNDXHUwNDM1XG4gICAgLy8gY29uc29sZS53YXJuKCd1cGRhdGUnLCB0aGlzLmNvbmZpZy5nZXRTZXR0aW5ncygpKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGF1dGggfSBmcm9tICcuLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IGRvbSB9IGZyb20gJy4uL3NlcnZpY2VzL2RvbSc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4vZWxlbWVudCc7XG5cbmV4cG9ydCBjbGFzcyBSb290IGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwcml2YXRlIHN0YXRpYyBSZWdpc3RlcmVkSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHByaXZhdGUgcm9vdElkOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKHJvb3RJZDogc3RyaW5nKSB7XG4gICAgaWYgKFJvb3QuUmVnaXN0ZXJlZElkcy5oYXMocm9vdElkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJZCAke3Jvb3RJZH0gaXMgYWxyZWFkeSBpbiB1c2VgKTtcbiAgICB9XG5cbiAgICBzdXBlcihkb20uZmluZEVsZW1lbnQocm9vdElkKSk7XG5cbiAgICBSb290LlJlZ2lzdGVyZWRJZHMuYWRkKHJvb3RJZCk7XG5cbiAgICB0aGlzLnJvb3RJZCA9IHJvb3RJZDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBpbml0ICgpIHtcbiAgICBhd2FpdCBhdXRoLnJlYWR5KCk7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICBSb290LlJlZ2lzdGVyZWRJZHMuZGVsZXRlKHRoaXMucm9vdElkKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0VBLE1BQU0sU0FBTixNQUFnQztBQUFBLElBQzlCLGdCQUF5QjtBQUN2QixhQUFP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QjtBQUFBLElBRUEsTUFBYSxPQUFRO0FBQ25CLFlBQU0sS0FBSyxNQUFNO0FBQUEsSUFDbkI7QUFBQSxJQUVPLFNBQWdCO0FBQ3JCLFlBQUssY0FBYyxPQUFPLEtBQUssTUFBTTtBQUFBLElBQ3ZDO0FBQUEsRUFDRjs7O0FsQnRCTyxNQUFNLFNBQVMsT0FBTyxPQUFlO0FBQzFDLFVBQU0sT0FBTyxJQUFJLEtBQUssRUFBRTtBQUN4QixVQUFNLFNBQVMsSUFBSSxPQUFPO0FBRTFCLFFBQUksYUFBYTtBQUVqQixVQUFNLFFBQVEsSUFBSSxDQUFDLEtBQUssS0FBSyxHQUFHLE9BQU8sS0FBSyxDQUFDLENBQUM7QUFFOUMsU0FBSyxTQUFTLE1BQU07QUFFcEIsV0FBTztBQUFBLE1BQ0wsUUFBUSxNQUFNO0FBQ1osYUFBSyxjQUFjO0FBQ25CLFlBQUksT0FBTztBQUNYLGFBQUssT0FBTztBQUFBLE1BQ2Q7QUFBQSxNQUNBLFFBQVEsT0FBTyxVQUFVO0FBQUEsSUFDM0I7QUFBQSxFQUNGOyIsCiAgIm5hbWVzIjogWyJjb25maWciLCAic3RvcmUiLCAiY29uZmlnIiwgInN0b3JlIiwgImNvbmZpZyJdCn0K
