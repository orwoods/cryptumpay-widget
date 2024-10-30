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

  // _xr5ef5wif:/Volumes/Projects/cryptumpay/widget/src/style/styles.css
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
    async post(endpoint, data) {
      const url = `${this.config.getApiBaseUrl()}${endpoint}`;
      return new Promise((resolve, reject) => {
        fetch(url, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.store.getAccessToken()}`
          },
          body: JSON.stringify(data)
        }).then((response) => {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          } else if (response.status !== 200) {
            throw response;
          }
          return response.json();
        }).then((data2) => {
          resolve(data2);
        }).catch((error) => {
          console.warn(error);
          reject();
        });
      });
    }
    async createOrder(order) {
      return await this.post("/order", order);
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
        const orderId = "100500";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9hdXRoLnRzIiwgIl94cjVlZjV3aWY6L1ZvbHVtZXMvUHJvamVjdHMvY3J5cHR1bXBheS93aWRnZXQvc3JjL3N0eWxlL3N0eWxlcy5jc3MiLCAiLi4vc3JjL3N0eWxlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9kb20udHMiLCAiLi4vc3JjL2N1cnJlbmNpZXMvdXRpbHMudHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9jb25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2VsZW1lbnQudHMiLCAiLi4vc3JjL2FwaS9pbmRleC50cyIsICIuLi9zcmMvZWxlbWVudHMvb3JkZXJQb3B1cC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2J1dHRvbi5jb21tb24udHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9idXR0b24uYW5vbnltb3VzLnRzIiwgIi4uL3NyYy9lbGVtZW50cy93aWRnZXQvYnV0dG9uLmxvZ2dlZC50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2luZGV4LnRzIiwgIi4uL3NyYy9lbGVtZW50cy9yb290LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IGRvbSB9IGZyb20gJy4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IFdpZGdldCB9IGZyb20gJy4vZWxlbWVudHMvd2lkZ2V0JztcbmltcG9ydCB7IFJvb3QgfSBmcm9tICcuL2VsZW1lbnRzL3Jvb3QnO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlID0gYXN5bmMgKGlkOiBzdHJpbmcpID0+IHtcbiAgY29uc3Qgcm9vdCA9IG5ldyBSb290KGlkKTtcbiAgY29uc3Qgd2lkZ2V0ID0gbmV3IFdpZGdldCgpO1xuXG4gIGRvbS5pbmplY3RTdHlsZXMoKTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChbcm9vdC5pbml0KCksIHdpZGdldC5pbml0KCldKTtcblxuICByb290LmFkZENoaWxkKHdpZGdldCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHJvb3QuY2FzY2FkZVVubG9hZCgpO1xuICAgICAgZG9tLnVubG9hZCgpO1xuICAgICAgYXV0aC51bmxvYWQoKTtcbiAgICB9LFxuICAgIGNvbmZpZzogd2lkZ2V0LmdldENvbmZpZygpLFxuICB9O1xufTtcbiIsICJpbXBvcnQgeyBJQ29uZmlnIH0gZnJvbSAnLi90eXBlcyc7XG5cbmNsYXNzIENvbmZpZyBpbXBsZW1lbnRzIElDb25maWcge1xuICBnZXRBcGlCYXNlVXJsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnaHR0cDovL2FwaS5jcnlwdHVtcGF5LmxvY2FsJztcbiAgfVxuXG4gIGdldEp3dFJlZnJlc2hJbnRlcnZhbCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMzAgKiAxMDAwO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBuZXcgQ29uZmlnKCk7XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IHN0b3JlIH0gZnJvbSAnLi4vc3RvcmUnO1xuaW1wb3J0IHsgSUNvbmZpZywgSVN0b3JlLCBJQXV0aCB9IGZyb20gJy4uL3R5cGVzJztcblxuY2xhc3MgQXV0aCBpbXBsZW1lbnRzIElBdXRoIHtcbiAgcHJpdmF0ZSBjb25maWc6IElDb25maWc7XG4gIHByaXZhdGUgc3RvcmU6IElTdG9yZTtcblxuICBwcml2YXRlIGxvZ2dlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIG9uUmVhZHk6ICgodmFsdWU6IHZvaWQpID0+IHZvaWQpW107XG4gIHByaXZhdGUgYXV0b1JlZnJlc2hUb2tlbj86IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IgKGNvbmZpZzogSUNvbmZpZywgc3RvcmU6IElTdG9yZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLm9uUmVhZHkgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNMb2dnZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxvZ2dlZDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVhZHkgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLm9uUmVhZHkucHVzaChyZXNvbHZlKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemF0aW9uKSB7XG4gICAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSB0cnVlO1xuXG4gICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zdG9yZS5mb3JnZXRTZW5zaXRpdmVEYXRhKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFRva2VuKCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcmVzb2x2ZSBvZiB0aGlzLm9uUmVhZHkpIHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaFRva2VuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9L3VzZXIvcmVmcmVzaC10b2tlbmA7XG5cbiAgICBpZiAodGhpcy5hdXRvUmVmcmVzaFRva2VuKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuYXV0b1JlZnJlc2hUb2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmZXRjaCh1cmwsIHsgbWV0aG9kOiAnUE9TVCcsIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmUuZm9yZ2V0U2Vuc2l0aXZlRGF0YSgpO1xuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKCFkYXRhLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zdG9yZS5zZXRBY2Nlc3NUb2tlbihkYXRhLmFjY2Vzc1Rva2VuKTtcblxuICAgICAgICAgIHRoaXMuYXV0b1JlZnJlc2hUb2tlbiA9IHNldEludGVydmFsKCgpID0+IHRoaXMucmVmcmVzaFRva2VuKCksIHRoaXMuY29uZmlnLmdldEp3dFJlZnJlc2hJbnRlcnZhbCgpKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxvZ291dCAoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5jb25maWcuZ2V0QXBpQmFzZVVybCgpfS91c2VyL2xvZ291dGA7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcblxuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuXG4gICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdXRoID0gbmV3IEF1dGgoY29uZmlnLCBzdG9yZSk7XG4iLCAiI3dpZGdldHt3aWR0aDozMDBweDttYXJnaW46MjBweDtib3JkZXI6MXB4IHNvbGlkICNhZWFlYWU7Ym9yZGVyLXJhZGl1czo2cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtib3gtc2l6aW5nOmJvcmRlci1ib3g7YWxpZ24taXRlbXM6c3RyZXRjaH0jd2lkZ2V0X3BheXtmbGV4LWdyb3c6MTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Zm9udC1zaXplOjE1cHg7Zm9udC1mYW1pbHk6VmVyZGFuYSxHZW5ldmEsVGFob21hLHNhbnMtc2VyaWY7YmFja2dyb3VuZDojNjFjM2ZmO2NvbG9yOiNmZmY7Y3Vyc29yOnBvaW50ZXJ9I3dpZGdldF9wYXkud2lkZXtwYWRkaW5nOjE1cHggMH0jd2lkZ2V0X3BheTpob3ZlcntiYWNrZ3JvdW5kOiMzOGIzZmZ9I3dpZGdldF9zZXR0aW5nc3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO3RleHQtYWxpZ246Y2VudGVyO21heC13aWR0aDo1MCU7YmFja2dyb3VuZDojYWRlMGZmO2NvbG9yOiM2ZjZmNmY7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldHtjdXJzb3I6cG9pbnRlcjt0ZXh0LWFsaWduOnJpZ2h0fSN3aWRnZXRfd2FsbGV0OmhvdmVye2JhY2tncm91bmQ6Izk4ZDdmZn0jd2lkZ2V0X3NldHRpbmdzPmRpdntwYWRkaW5nOjNweCAyMHB4fSIsICIvLyBAdHMtaWdub3JlXG5pbXBvcnQgc3R5bGVzIGZyb20gJ3Nhc3M6Li9zdHlsZXMuY3NzJztcblxuZXhwb3J0IGNvbnN0IGdldFN0eWxlcyA9ICgpOiBzdHJpbmcgPT4gc3R5bGVzO1xuIiwgImltcG9ydCB7IGdldFN0eWxlcyB9IGZyb20gJy4uL3N0eWxlJztcblxuY2xhc3MgRG9tIHtcbiAgcHJpdmF0ZSBzdHlsZXM/OiBIVE1MRWxlbWVudDtcblxuICBwdWJsaWMgaW5qZWN0RWxlbWVudCAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gIH1cblxuICBwdWJsaWMgaW5qZWN0U3R5bGVzICgpOiB2b2lkIHtcbiAgICBjb25zdCB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHRhZy50ZXh0Q29udGVudCA9IGdldFN0eWxlcygpO1xuXG4gICAgdGhpcy5pbmplY3RFbGVtZW50KGRvY3VtZW50LmhlYWQsIHRhZyk7XG5cbiAgICB0aGlzLnN0eWxlcyA9IHRhZztcbiAgfVxuXG4gIHB1YmxpYyBmaW5kRWxlbWVudCAoZWxlbWVudElkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbiAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBlbGVtZW50ICR7ZWxlbWVudElkfS5gKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIGlmICh0aGlzLnN0eWxlcykge1xuICAgICAgdGhpcy5zdHlsZXMucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkb20gPSBuZXcgRG9tKCk7XG4iLCAiZXhwb3J0IGNvbnN0IGdldEN1cnJlbmN5SGFzaCA9ICh7IGlkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdCB9OiB7XG4gIGlkOiBzdHJpbmc7XG4gIG5ldHdvcms6IHN0cmluZztcbiAgdGlja2VyOiBzdHJpbmc7XG4gIGNoYWluOiBzdHJpbmc7XG4gIGNvbnRyYWN0OiBzdHJpbmc7XG59KTogc3RyaW5nID0+IHtcbiAgY29uc3QgYXJyID0gW2lkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdF07XG4gIGlmICghYXJyLmV2ZXJ5KChwYXJ0KSA9PiBwYXJ0Lmxlbmd0aCA+IDApKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYWxmb3JtZWQgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IHN0ciA9IGFyci5qb2luKCc6Jyk7XG4gIGNvbnN0IGhhc2ggPSBCdWZmZXIuZnJvbShzdHIpLnRvU3RyaW5nKCdoZXgnKS5zdWJzdHJpbmcoMCwgNDAgLSAxIC0gc3RyLmxlbmd0aCk7XG5cbiAgcmV0dXJuIGhhc2g7XG59O1xuXG5leHBvcnQgY29uc3QgY2hlY2tDdXJyZW5jeSA9IChjdXJyZW5jeTogc3RyaW5nKSA9PiB7XG4gIGlmICghY3VycmVuY3kgfHwgdHlwZW9mIGN1cnJlbmN5ICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjdXJyZW5jeScpO1xuICB9XG5cbiAgY29uc3QgcGFydHMgPSBjdXJyZW5jeS5zcGxpdCgnOicpO1xuICBpZiAocGFydHMubGVuZ3RoICE9PSA2IHx8IGN1cnJlbmN5Lmxlbmd0aCAhPT0gNDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGZvcm1hdCBvZiB0aGUgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IFtpZCwgbmV0d29yaywgdGlja2VyLCBjaGFpbiwgY29udHJhY3QsIGhhc2hdID0gcGFydHM7XG5cbiAgY29uc3QgY3VycmVuY3lIYXNoID0gZ2V0Q3VycmVuY3lIYXNoKHsgaWQsIG5ldHdvcmssIHRpY2tlciwgY2hhaW4sIGNvbnRyYWN0IH0pO1xuXG4gIGlmIChjdXJyZW5jeUhhc2ggIT09IGhhc2gpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGN1cnJlbmN5IGhhc2gnKTtcbiAgfVxufTtcbiIsICJpbXBvcnQgeyBjaGVja0N1cnJlbmN5IH0gZnJvbSAnLi4vLi4vY3VycmVuY2llcy91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBXaWRnZXRDb25maWcge1xuICAjY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG5cbiAgI29yZGVySWQ/OiBzdHJpbmc7XG4gICNjdXN0b21lcklkPzogc3RyaW5nO1xuICAjbWVyY2hhbnRJZD86IHN0cmluZztcbiAgI2NsaWVudE9yZGVySWQ/OiBzdHJpbmc7XG4gICNhbW91bnQ/OiBudW1iZXI7XG4gICNjYW5FZGl0QW1vdW50PzogYm9vbGVhbjtcbiAgI2N1cnJlbmN5Pzogc3RyaW5nO1xuICAjZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy4jY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgfVxuXG4gIHB1YmxpYyBzZXRPcmRlcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI29yZGVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jb3JkZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRDdXN0b21lcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2N1c3RvbWVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jY3VzdG9tZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRNZXJjaGFudElkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI21lcmNoYW50SWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jbWVyY2hhbnRJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRDbGllbnRPcmRlcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2NsaWVudE9yZGVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jY2xpZW50T3JkZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRQcmljZSAoYW1vdW50OiBudW1iZXIsIGN1cnJlbmN5OiBzdHJpbmcsIGNhbkVkaXRBbW91bnQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy4jYW1vdW50ID09PSBhbW91bnQgJiYgdGhpcy4jY3VycmVuY3kgPT09IGN1cnJlbmN5ICYmIHRoaXMuI2NhbkVkaXRBbW91bnQgPT09IGNhbkVkaXRBbW91bnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaGVja0N1cnJlbmN5KGN1cnJlbmN5KTtcblxuICAgIHRoaXMuI2Ftb3VudCA9IGFtb3VudDtcbiAgICB0aGlzLiNjdXJyZW5jeSA9IGN1cnJlbmN5O1xuICAgIHRoaXMuI2NhbkVkaXRBbW91bnQgPSBjYW5FZGl0QW1vdW50O1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXREZXNjcmlwdGlvbiAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNkZXNjcmlwdGlvbiA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNkZXNjcmlwdGlvbiA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRTZXR0aW5ncyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9yZGVySWQ6IHRoaXMuI29yZGVySWQsXG4gICAgICBjdXN0b21lcklkOiB0aGlzLiNjdXN0b21lcklkLFxuICAgICAgbWVyY2hhbnRJZDogdGhpcy4jbWVyY2hhbnRJZCxcbiAgICAgIGNsaWVudE9yZGVySWQ6IHRoaXMuI2NsaWVudE9yZGVySWQsXG4gICAgICBhbW91bnQ6IHRoaXMuI2Ftb3VudCxcbiAgICAgIGNhbkVkaXRBbW91bnQ6IHRoaXMuI2NhbkVkaXRBbW91bnQsXG4gICAgICBjdXJyZW5jeTogdGhpcy4jY3VycmVuY3ksXG4gICAgICBkZXNjcmlwdGlvbjogdGhpcy4jZGVzY3JpcHRpb24sXG4gICAgfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGRvbSB9IGZyb20gJy4uL3NlcnZpY2VzL2RvbSc7XG5cbmV4cG9ydCBjbGFzcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgc3RhdGljIG1heElkID0gMDtcblxuICBwcml2YXRlIHJlYWRvbmx5IGlkID0gKytDUGF5RWxlbWVudC5tYXhJZDtcbiAgcHJvdGVjdGVkIGNvbnRhaW5lcj86IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgcm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdID0gW107XG4gIHByb3RlY3RlZCBwYXJlbnQ/OiBDUGF5RWxlbWVudDtcbiAgcHJpdmF0ZSBjaGlsZHMgPSBuZXcgTWFwPG51bWJlciwgQ1BheUVsZW1lbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IgKGNvbnRhaW5lcj86IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpIHtcbiAgfVxuXG4gIHB1YmxpYyBjYXNjYWRlVW5sb2FkICgpIHtcbiAgICB0aGlzLmNoaWxkcy5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5yZW1vdmVDaGlsZChjaGlsZCkpO1xuXG4gICAgdGhpcy51bmxvYWQoKTtcblxuICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29udGFpbmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucm9vdEl0ZW1zID0gW107XG4gIH1cblxuICBwdWJsaWMgc2V0UGFyZW50IChwYXJlbnQ/OiBDUGF5RWxlbWVudCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldENvbnRhaW5lciAoY29udGFpbmVyPzogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIHByb3RlY3RlZCByZWdpc3RlclJvb3RJdGVtcyAocm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdKSB7XG4gICAgdGhpcy5yb290SXRlbXMgPSByb290SXRlbXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0UGFyZW50ICgpOiBDUGF5RWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICB9XG5cbiAgcHVibGljIGdldENvbnRhaW5lciAoKTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXRSb290SXRlbXMgKCk6IEhUTUxFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLnJvb3RJdGVtcztcbiAgfVxuXG4gIHB1YmxpYyBhZGRDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50LCBjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCB0aGlzLmNvbnRhaW5lcjtcbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb250YWluZXIgd2FzIG5vdCBzZXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuY2hpbGRzLnNldChjaGlsZC5pZCwgY2hpbGQpO1xuXG4gICAgY2hpbGQuc2V0UGFyZW50KHRoaXMpO1xuICAgIGNoaWxkLnNldENvbnRhaW5lcihjb250YWluZXIpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHJvb3RJdGVtcykge1xuICAgICAgZG9tLmluamVjdEVsZW1lbnQoY29udGFpbmVyLCBpdGVtKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYmVmb3JlUmVtb3ZlQ2hpbGQgKGNoaWxkOiBDUGF5RWxlbWVudCkge1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUNoaWxkIChjaGlsZDogQ1BheUVsZW1lbnQpIHtcbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuYmVmb3JlUmVtb3ZlQ2hpbGQoY2hpbGQpO1xuXG4gICAgY2hpbGQuY2FzY2FkZVVubG9hZCgpO1xuICAgIGNoaWxkLnNldFBhcmVudCgpO1xuICAgIGNoaWxkLnNldENvbnRhaW5lcigpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHJvb3RJdGVtcykge1xuICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkcy5kZWxldGUoY2hpbGQuaWQpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoKSB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgc3RvcmUgfSBmcm9tICcuLi9zdG9yZSc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHsgSUNvbmZpZywgSVN0b3JlLCBUT3JkZXJSZXF1ZXN0IH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5jbGFzcyBBcGkge1xuICBwcml2YXRlIGNvbmZpZzogSUNvbmZpZztcbiAgcHJpdmF0ZSBzdG9yZTogSVN0b3JlO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciAoY29uZmlnOiBJQ29uZmlnLCBzdG9yZTogSVN0b3JlKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5zdG9yZSA9IHN0b3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0IChlbmRwb2ludDogc3RyaW5nLCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9JHtlbmRwb2ludH1gO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5zdG9yZS5nZXRBY2Nlc3NUb2tlbigpfWAsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgfSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgIHRocm93IHJlc3BvbnNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG5cbiAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgY3JlYXRlT3JkZXIgKG9yZGVyOiBUT3JkZXJSZXF1ZXN0KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucG9zdCgnL29yZGVyJywgb3JkZXIpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhcGkgPSBuZXcgQXBpKGNvbmZpZywgc3RvcmUpO1xuIiwgImltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi9lbGVtZW50JztcblxuZXhwb3J0IGNsYXNzIE9yZGVyUG9wdXAgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwb3B1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHBvcHVwLmlkID0gJ29yZGVyX3BvcHVwJztcblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbXMoW3BvcHVwXSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi8uLi9hcGknO1xuaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2F1dGgnO1xuaW1wb3J0IHsgQ1BheUVsZW1lbnQgfSBmcm9tICcuLi9lbGVtZW50JztcbmltcG9ydCB7IE9yZGVyUG9wdXAgfSBmcm9tICcuLi9vcmRlclBvcHVwJztcbmltcG9ydCB7IFdpZGdldENvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJ1dHRvbkNvbW1vbiBleHRlbmRzIENQYXlFbGVtZW50IHtcbiAgcHJvdGVjdGVkIGJ1dHRvbiE6IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgY2xpY2tlZCA9IGZhbHNlO1xuICBwcml2YXRlIGxvY2tlZCA9IGZhbHNlO1xuICBwcml2YXRlIGNvbmZpZzogV2lkZ2V0Q29uZmlnO1xuXG4gIGNvbnN0cnVjdG9yIChjb25maWc6IFdpZGdldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBjbGljayAoKSB7XG4gICAgaWYgKHRoaXMuY2xpY2tlZCB8fCB0aGlzLmxvY2tlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xpY2tlZCA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jcmVhdGVPcmRlcigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0J1dHRvbkNvbW1vbiBlcnJvcicsIGVycm9yKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWNrZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlT3JkZXIgKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBhcGkuY3JlYXRlT3JkZXIoe1xuICAgICAgICBjdXJyZW5jeTogc2V0dGluZ3MuY3VycmVuY3kgfHwgJycsXG4gICAgICAgIGFtb3VudDogc2V0dGluZ3MuYW1vdW50IHx8IDAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzZXR0aW5ncy5kZXNjcmlwdGlvbiB8fCAnJyxcbiAgICAgICAgbWVyY2hhbnRJZDogc2V0dGluZ3MubWVyY2hhbnRJZCB8fCAnJyxcbiAgICAgICAgY3VzdG9tZXJJZDogc2V0dGluZ3MuY3VzdG9tZXJJZCB8fCAnJyxcbiAgICAgICAgY2xpZW50T3JkZXJJZDogc2V0dGluZ3MuY2xpZW50T3JkZXJJZCB8fCAnJyxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLndhcm4oJ29yZGVyIHJlc3VsdDonKTtcbiAgICAgIGNvbnNvbGUud2FybihkYXRhKTtcblxuICAgICAgY29uc3Qgb3JkZXJJZCA9ICcxMDA1MDAnO1xuXG4gICAgICB0aGlzLmxvY2tlZCA9IHRydWU7XG5cbiAgICAgIGF3YWl0IGF1dGgucmVmcmVzaFRva2VuKCk7XG5cbiAgICAgIHRoaXMuYWRkQ2hpbGQoYXdhaXQgdGhpcy5vcGVuT3JkZXJQb3B1cChvcmRlcklkKSwgdGhpcy5nZXRDb250YWluZXIoKSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb25zdCBvbGRUZXh0ID0gdGhpcy5idXR0b24udGV4dENvbnRlbnQ7XG4gICAgICB0aGlzLmJ1dHRvbi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdURFMUUnO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5idXR0b24udGV4dENvbnRlbnQgPSBvbGRUZXh0O1xuICAgICAgICB0aGlzLmxvY2tlZCA9IGZhbHNlO1xuICAgICAgfSwgMzAwMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuT3JkZXJQb3B1cCAob3JkZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgcG9wdXAgPSBuZXcgT3JkZXJQb3B1cCgpO1xuICAgIGF3YWl0IHBvcHVwLmluaXQoKTtcblxuICAgIHJldHVybiBwb3B1cDtcbiAgfVxuXG4gIHB1YmxpYyBiZWZvcmVSZW1vdmVDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50KTogdm9pZCB7XG4gICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJ1dHRvbkNvbW1vbiB9IGZyb20gJy4vYnV0dG9uLmNvbW1vbic7XG5cbmV4cG9ydCBjbGFzcyBCdXR0b25Bbm9ueW1vdXMgZXh0ZW5kcyBCdXR0b25Db21tb24ge1xuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgd2lkZ2V0UGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0UGF5LmlkID0gJ3dpZGdldF9wYXknO1xuICAgIHdpZGdldFBheS5jbGFzc05hbWUgPSAnd2lkZSc7XG4gICAgd2lkZ2V0UGF5LnRleHRDb250ZW50ID0gJ1BheSB3aXRoIENyeXB0dW1QYXknO1xuXG4gICAgdGhpcy5idXR0b24gPSB3aWRnZXRQYXk7XG5cbiAgICB3aWRnZXRQYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5yZWdpc3RlclJvb3RJdGVtcyhbd2lkZ2V0UGF5XSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCdXR0b25Db21tb24gfSBmcm9tICcuL2J1dHRvbi5jb21tb24nO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uTG9nZ2VkIGV4dGVuZHMgQnV0dG9uQ29tbW9uIHtcbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHdpZGdldFBheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFBheS5pZCA9ICd3aWRnZXRfcGF5JztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5JztcblxuICAgIGNvbnN0IHdpZGdldFNldHRpbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0U2V0dGluZ3MuaWQgPSAnd2lkZ2V0X3NldHRpbmdzJztcblxuICAgIGNvbnN0IHdpZGdldFByaWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0UHJpY2UuaWQgPSAnd2lkZ2V0X3ByaWNlJztcbiAgICB3aWRnZXRQcmljZS50ZXh0Q29udGVudCA9ICcxMDA1MDAgVVNEVCc7XG5cbiAgICBjb25zdCB3aWRnZXRXYWxsZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRXYWxsZXQuaWQgPSAnd2lkZ2V0X3dhbGxldCc7XG5cbiAgICBjb25zdCB3YWxsZXRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHdhbGxldFNwYW4udGV4dENvbnRlbnQgPSAnM1ROXHUyMDI2OUZBJztcblxuICAgIGNvbnN0IGFycm93U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBhcnJvd1NwYW4uaW5uZXJIVE1MID0gJyYjOTY2MjsnO1xuXG4gICAgd2lkZ2V0V2FsbGV0LmFwcGVuZENoaWxkKHdhbGxldFNwYW4pO1xuICAgIHdpZGdldFdhbGxldC5hcHBlbmRDaGlsZChhcnJvd1NwYW4pO1xuXG4gICAgd2lkZ2V0U2V0dGluZ3MuYXBwZW5kQ2hpbGQod2lkZ2V0UHJpY2UpO1xuICAgIHdpZGdldFNldHRpbmdzLmFwcGVuZENoaWxkKHdpZGdldFdhbGxldCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyUm9vdEl0ZW1zKFt3aWRnZXRQYXksIHdpZGdldFNldHRpbmdzXSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBXaWRnZXRDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4uL2VsZW1lbnQnO1xuaW1wb3J0IHsgQnV0dG9uQW5vbnltb3VzIH0gZnJvbSAnLi9idXR0b24uYW5vbnltb3VzJztcbmltcG9ydCB7IEJ1dHRvbkxvZ2dlZCB9IGZyb20gJy4vYnV0dG9uLmxvZ2dlZCc7XG5cbmV4cG9ydCBjbGFzcyBXaWRnZXQgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgY29uZmlnOiBXaWRnZXRDb25maWc7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IG5ldyBXaWRnZXRDb25maWcoKCkgPT4gdGhpcy51cGRhdGUoKSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q29uZmlnICgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWc7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuXG4gICAgLy8gVE9ETzogXHUwNDNFXHUwNDQ0XHUwNDNFXHUwNDQwXHUwNDNDXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMiBcdTA0MzdcdTA0MzBcdTA0MzJcdTA0MzhcdTA0NDFcdTA0MzhcdTA0M0NcdTA0M0VcdTA0NDFcdTA0NDJcdTA0MzggXHUwNDNFXHUwNDQyIFx1MDQzRlx1MDQzNVx1MDQ0MFx1MDQzMlx1MDQzOFx1MDQ0N1x1MDQzRFx1MDQ0Qlx1MDQ0NSBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzVcdTA0M0FcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuXG4gICAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgICBpZiAoYXV0aC5pc0xvZ2dlZCkge1xuICAgICAgdGhpcy5hZGRDaGlsZChhd2FpdCB0aGlzLmNyZWF0ZUxvZ2dlZEJ1dHRvbigpLCB3aWRnZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZENoaWxkKGF3YWl0IHRoaXMuY3JlYXRlQW5vbnltb3VzQnV0dG9uKCksIHdpZGdldCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3RlclJvb3RJdGVtcyhbd2lkZ2V0XSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUxvZ2dlZEJ1dHRvbiAoKSB7XG4gICAgY29uc3QgYnV0dG9uID0gbmV3IEJ1dHRvbkxvZ2dlZCh0aGlzLmNvbmZpZyk7XG4gICAgYXdhaXQgYnV0dG9uLmluaXQoKTtcblxuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUFub255bW91c0J1dHRvbiAoKSB7XG4gICAgY29uc3QgYnV0dG9uID0gbmV3IEJ1dHRvbkFub255bW91cyh0aGlzLmNvbmZpZyk7XG4gICAgYXdhaXQgYnV0dG9uLmluaXQoKTtcblxuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZSAoKTogdm9pZCB7XG4gICAgaWYgKCFhdXRoLmlzUmVhZHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBcdTA0M0VcdTA0MzFcdTA0M0RcdTA0M0VcdTA0MzJcdTA0M0JcdTA0NEZcdTA0MzVcdTA0M0MgXHUwNDMyXHUwNDNEXHUwNDM1XHUwNDQ4XHUwNDNBXHUwNDQzIFx1MDQzNVx1MDQ0MVx1MDQzQlx1MDQzOCBcdTA0MzhcdTA0MzdcdTA0M0NcdTA0MzVcdTA0M0RcdTA0MzhcdTA0M0JcdTA0MzggXHUwNDNEXHUwNDMwXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDNBXHUwNDM4IFx1MDQzMiBcdTA0NDBcdTA0MzVcdTA0MzBcdTA0M0JcdTA0NDJcdTA0MzBcdTA0MzlcdTA0M0NcdTA0MzVcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4uL3NlcnZpY2VzL2F1dGgnO1xuaW1wb3J0IHsgZG9tIH0gZnJvbSAnLi4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi9lbGVtZW50JztcblxuZXhwb3J0IGNsYXNzIFJvb3QgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgc3RhdGljIFJlZ2lzdGVyZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcHJpdmF0ZSByb290SWQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvciAocm9vdElkOiBzdHJpbmcpIHtcbiAgICBpZiAoUm9vdC5SZWdpc3RlcmVkSWRzLmhhcyhyb290SWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYElkICR7cm9vdElkfSBpcyBhbHJlYWR5IGluIHVzZWApO1xuICAgIH1cblxuICAgIHN1cGVyKGRvbS5maW5kRWxlbWVudChyb290SWQpKTtcblxuICAgIFJvb3QuUmVnaXN0ZXJlZElkcy5hZGQocm9vdElkKTtcblxuICAgIHRoaXMucm9vdElkID0gcm9vdElkO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCkge1xuICAgIGF3YWl0IGF1dGgucmVhZHkoKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgIFJvb3QuUmVnaXN0ZXJlZElkcy5kZWxldGUodGhpcy5yb290SWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDRUEsTUFBTSxTQUFOLE1BQWdDO0FBQUEsSUFDOUIsZ0JBQXlCO0FBQ3ZCLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFQSx3QkFBaUM7QUFDL0IsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFFTyxNQUFNLFNBQVMsSUFBSSxPQUFPOzs7QUNaMUIsTUFBZSxZQUFmLE1BQXlCO0FBQUEsSUFDcEI7QUFBQSxJQUVWLFlBQWEsTUFBYztBQUN6QixX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QUFBQSxJQUVSLFlBQWEsUUFBZ0I7QUFDM0IsVUFBSSxNQUFLLGNBQWMsSUFBSSxNQUFNLEdBQUc7QUFDbEMsY0FBTSxJQUFJLE1BQU0sTUFBTSxNQUFNLG9CQUFvQjtBQUFBLE1BQ2xEO0FBRUEsWUFBTSxJQUFJLFlBQVksTUFBTSxDQUFDO0FBRTdCLFlBQUssY0FBYyxJQUFJLE1BQU07QUFFN0IsV0FBSyxTQUFTO0FBQUEsSUFDaEI7QUFBQSxJQUVBLE1BQWEsT0FBUTtBQUNuQixZQUFNLEtBQUssTUFBTTtBQUFBLElBQ25CO0FBQUEsSUFFTyxTQUFnQjtBQUNyQixZQUFLLGNBQWMsT0FBTyxLQUFLLE1BQU07QUFBQSxJQUN2QztBQUFBLEVBQ0Y7OztBbEJ0Qk8sTUFBTSxTQUFTLE9BQU8sT0FBZTtBQUMxQyxVQUFNLE9BQU8sSUFBSSxLQUFLLEVBQUU7QUFDeEIsVUFBTSxTQUFTLElBQUksT0FBTztBQUUxQixRQUFJLGFBQWE7QUFFakIsVUFBTSxRQUFRLElBQUksQ0FBQyxLQUFLLEtBQUssR0FBRyxPQUFPLEtBQUssQ0FBQyxDQUFDO0FBRTlDLFNBQUssU0FBUyxNQUFNO0FBRXBCLFdBQU87QUFBQSxNQUNMLFFBQVEsTUFBTTtBQUNaLGFBQUssY0FBYztBQUNuQixZQUFJLE9BQU87QUFDWCxhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsTUFDQSxRQUFRLE9BQU8sVUFBVTtBQUFBLElBQzNCO0FBQUEsRUFDRjsiLAogICJuYW1lcyI6IFsiY29uZmlnIiwgInN0b3JlIiwgImNvbmZpZyIsICJzdG9yZSIsICJkYXRhIiwgImNvbmZpZyJdCn0K
