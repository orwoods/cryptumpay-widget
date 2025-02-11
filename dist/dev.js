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

  // src/errors/basicError.ts
  var BasicError = class extends Error {
  };

  // src/errors/accessDenied.ts
  var AccessDeniedError = class extends BasicError {
  };

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

  // src/config.ts
  var Config = class {
    getApiBaseUrl() {
      return "https://api.home.cryptumpay.com";
    }
    getJwtRefreshInterval() {
      return 30 * 1e3;
    }
  };
  var config = new Config();

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
      if (withAuthorization && this.store.getAccessToken()) {
        requestParams.headers = {
          ...requestParams.headers,
          Authorization: `Bearer ${this.store.getAccessToken()}`
        };
      }
      try {
        const response = await fetch(url, requestParams);
        if (response.status === 401) {
          throw new AccessDeniedError("Unauthorized request");
        } else if (response.status !== 200) {
          throw new BasicError("Response code is not 200");
        }
        return await response.json();
      } catch (err) {
        if (err instanceof BasicError) {
          throw err;
        }
        console.warn(err);
        throw new BasicError("Unexpected error");
      }
    }
    async refreshJwtToken() {
      return await this.request({
        endpoint: "/auth/refresh-token",
        method: "POST",
        withAuthorization: false,
        withCredentials: true
      });
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
      if (this.autoRefreshToken) {
        clearInterval(this.autoRefreshToken);
      }
      try {
        const data = await api.refreshJwtToken();
        if (!data?.accessToken) {
          throw new BasicError("Invalid response");
        }
        this.logged = true;
        this.store.setAccessToken(data.accessToken);
        this.autoRefreshToken = setInterval(() => this.refreshToken(), this.config.getJwtRefreshInterval());
      } catch (err) {
        if (err instanceof AccessDeniedError) {
          this.logged = false;
          this.store.forgetSensitiveData();
        } else {
          console.warn(err);
        }
      }
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

  // _42n57m5tl:/Volumes/Projects/cryptumpay/widget/src/style/styles.css
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
    #orderType;
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
    setOrderType(type) {
      if (this.#orderType === type) {
        return;
      }
      if (isNaN(Number(type)) || type < 0) {
        console.warn("Invalid order type");
        return;
      }
      this.#orderType = type;
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
        description: this.#description,
        orderType: this.#orderType
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
          orderId: settings.orderId || "",
          orderType: settings.orderType || 1
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvZXJyb3JzL2Jhc2ljRXJyb3IudHMiLCAiLi4vc3JjL2Vycm9ycy9hY2Nlc3NEZW5pZWQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JlVW5pdC50cyIsICIuLi9zcmMvc3RvcmUvc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdC50cyIsICIuLi9zcmMvc3RvcmUvaW5kZXgudHMiLCAiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvYXBpL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9hdXRoLnRzIiwgIl80Mm41N201dGw6L1ZvbHVtZXMvUHJvamVjdHMvY3J5cHR1bXBheS93aWRnZXQvc3JjL3N0eWxlL3N0eWxlcy5jc3MiLCAiLi4vc3JjL3N0eWxlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9kb20udHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9jb25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2VsZW1lbnQudHMiLCAiLi4vc3JjL2VsZW1lbnRzL29yZGVyUG9wdXAudHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9idXR0b24uY29tbW9uLnRzIiwgIi4uL3NyYy9lbGVtZW50cy93aWRnZXQvYnV0dG9uLmFub255bW91cy50cyIsICIuLi9zcmMvZWxlbWVudHMvd2lkZ2V0L2J1dHRvbi5sb2dnZWQudHMiLCAiLi4vc3JjL2VsZW1lbnRzL3dpZGdldC9pbmRleC50cyIsICIuLi9zcmMvZWxlbWVudHMvcm9vdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBkb20gfSBmcm9tICcuL3NlcnZpY2VzL2RvbSc7XG5pbXBvcnQgeyBXaWRnZXQgfSBmcm9tICcuL2VsZW1lbnRzL3dpZGdldCc7XG5pbXBvcnQgeyBSb290IH0gZnJvbSAnLi9lbGVtZW50cy9yb290JztcbmltcG9ydCB7IGFwaSB9IGZyb20gJy4vYXBpJztcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IGFzeW5jIChpZDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHJvb3QgPSBuZXcgUm9vdChpZCk7XG4gIGNvbnN0IHdpZGdldCA9IG5ldyBXaWRnZXQoKTtcblxuICBkb20uaW5qZWN0U3R5bGVzKCk7XG5cbiAgYXdhaXQgUHJvbWlzZS5hbGwoW3Jvb3QuaW5pdCgpLCB3aWRnZXQuaW5pdCgpXSk7XG5cbiAgcm9vdC5hZGRDaGlsZCh3aWRnZXQpO1xuXG4gIHJldHVybiB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICByb290LmNhc2NhZGVVbmxvYWQoKTtcbiAgICAgIGRvbS51bmxvYWQoKTtcbiAgICAgIGF1dGgudW5sb2FkKCk7XG4gICAgfSxcbiAgICBjb25maWc6IHdpZGdldC5nZXRDb25maWcoKSxcbiAgICBhcGk6IHtcbiAgICAgIGdldEN1cnJlbmNpZXM6ICgpID0+IGFwaS5nZXRDdXJyZW5jaWVzKCksXG4gICAgfSxcbiAgfTtcbn07XG4iLCAiZXhwb3J0IGNsYXNzIEJhc2ljRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuIiwgImltcG9ydCB7IEJhc2ljRXJyb3IgfSBmcm9tICcuL2Jhc2ljRXJyb3InO1xuXG5leHBvcnQgY2xhc3MgQWNjZXNzRGVuaWVkRXJyb3IgZXh0ZW5kcyBCYXNpY0Vycm9yIHt9XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgSUNvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xuXG5jbGFzcyBDb25maWcgaW1wbGVtZW50cyBJQ29uZmlnIHtcbiAgZ2V0QXBpQmFzZVVybCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ2h0dHBzOi8vYXBpLmhvbWUuY3J5cHR1bXBheS5jb20nO1xuICB9XG5cbiAgZ2V0Snd0UmVmcmVzaEludGVydmFsICgpOiBudW1iZXIge1xuICAgIHJldHVybiAzMCAqIDEwMDA7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IG5ldyBDb25maWcoKTtcbiIsICJpbXBvcnQgeyBzdG9yZSB9IGZyb20gJy4uL3N0b3JlJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgeyBJQ29uZmlnLCBJU3RvcmUsIFRKdXN0Q3JlYXRlZE9yZGVyLCBUTmV3Snd0VG9rZW4sIFRPcmRlclJlcXVlc3QgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBCYXNpY0Vycm9yIH0gZnJvbSAnLi4vZXJyb3JzL2Jhc2ljRXJyb3InO1xuaW1wb3J0IHsgQWNjZXNzRGVuaWVkRXJyb3IgfSBmcm9tICcuLi9lcnJvcnMvYWNjZXNzRGVuaWVkJztcblxuZXhwb3J0IHR5cGUgVFJlcXVlc3RQYXJhbXMgPSB7XG4gIGVuZHBvaW50OiBzdHJpbmc7XG4gIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICBtZXRob2Q/OiAnUE9TVCcgfCAnR0VUJyB8ICdQVVQnIHwgJ0RFTEVURSc7XG4gIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW47XG4gIHdpdGhBdXRob3JpemF0aW9uPzogYm9vbGVhbjtcbn07XG5cbmNsYXNzIEFwaSB7XG4gIHByaXZhdGUgY29uZmlnOiBJQ29uZmlnO1xuICBwcml2YXRlIHN0b3JlOiBJU3RvcmU7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yIChjb25maWc6IElDb25maWcsIHN0b3JlOiBJU3RvcmUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlcXVlc3QgPFQ+ICh7XG4gICAgZW5kcG9pbnQsXG4gICAgbWV0aG9kID0gJ0dFVCcsXG4gICAgZGF0YSA9IHt9LFxuICAgIHdpdGhDcmVkZW50aWFscyA9IGZhbHNlLFxuICAgIHdpdGhBdXRob3JpemF0aW9uID0gdHJ1ZSxcbiAgfTogVFJlcXVlc3RQYXJhbXMpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGAke3RoaXMuY29uZmlnLmdldEFwaUJhc2VVcmwoKX0ke2VuZHBvaW50fWApO1xuXG4gICAgY29uc3QgcmVxdWVzdFBhcmFtczogUmVxdWVzdEluaXQgPSB7XG4gICAgICBtZXRob2QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBpZiAobWV0aG9kID09PSAnR0VUJykge1xuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaCgoa2V5KSA9PiB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZChrZXksIGRhdGFba2V5XSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0UGFyYW1zLmJvZHkgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICB9XG5cbiAgICBpZiAod2l0aENyZWRlbnRpYWxzKSB7XG4gICAgICByZXF1ZXN0UGFyYW1zLmNyZWRlbnRpYWxzID0gJ2luY2x1ZGUnO1xuICAgIH1cblxuICAgIGlmICh3aXRoQXV0aG9yaXphdGlvbiAmJiB0aGlzLnN0b3JlLmdldEFjY2Vzc1Rva2VuKCkpIHtcbiAgICAgIHJlcXVlc3RQYXJhbXMuaGVhZGVycyA9IHtcbiAgICAgICAgLi4ucmVxdWVzdFBhcmFtcy5oZWFkZXJzLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGhpcy5zdG9yZS5nZXRBY2Nlc3NUb2tlbigpfWAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgcmVxdWVzdFBhcmFtcyk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICB0aHJvdyBuZXcgQWNjZXNzRGVuaWVkRXJyb3IoJ1VuYXV0aG9yaXplZCByZXF1ZXN0Jyk7XG4gICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIHRocm93IG5ldyBCYXNpY0Vycm9yKCdSZXNwb25zZSBjb2RlIGlzIG5vdCAyMDAnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBCYXNpY0Vycm9yKSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS53YXJuKGVycik7XG5cbiAgICAgIHRocm93IG5ldyBCYXNpY0Vycm9yKCdVbmV4cGVjdGVkIGVycm9yJyk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlZnJlc2hKd3RUb2tlbiAoKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVxdWVzdDxUTmV3Snd0VG9rZW4+KHtcbiAgICAgIGVuZHBvaW50OiAnL2F1dGgvcmVmcmVzaC10b2tlbicsXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHdpdGhBdXRob3JpemF0aW9uOiBmYWxzZSxcbiAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBjcmVhdGVPcmRlciAob3JkZXI6IFRPcmRlclJlcXVlc3QpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXF1ZXN0PFRKdXN0Q3JlYXRlZE9yZGVyPih7XG4gICAgICBlbmRwb2ludDogJy9vcmRlcicsXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGRhdGE6IG9yZGVyLFxuICAgICAgd2l0aEF1dGhvcml6YXRpb246IHRydWUsXG4gICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0VXNlciAoKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVxdWVzdCh7XG4gICAgICBlbmRwb2ludDogJy91c2VyJyxcbiAgICAgIHdpdGhBdXRob3JpemF0aW9uOiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGdldEN1cnJlbmNpZXMgKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmVxdWVzdDx7IGN1cnJlbmNpZXM6IHN0cmluZ1tdIH0+KHtcbiAgICAgIGVuZHBvaW50OiAnL2N1cnJlbmNpZXMnLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdD8uY3VycmVuY2llcyB8fCBbXTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgYXBpID0gbmV3IEFwaShjb25maWcsIHN0b3JlKTtcbiIsICJpbXBvcnQgeyBBY2Nlc3NEZW5pZWRFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9hY2Nlc3NEZW5pZWQnO1xuaW1wb3J0IHsgQmFzaWNFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9iYXNpY0Vycm9yJztcbmltcG9ydCB7IGFwaSB9IGZyb20gJy4uL2FwaSc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHsgc3RvcmUgfSBmcm9tICcuLi9zdG9yZSc7XG5pbXBvcnQgeyBJQ29uZmlnLCBJU3RvcmUsIElBdXRoIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5jbGFzcyBBdXRoIGltcGxlbWVudHMgSUF1dGgge1xuICBwcml2YXRlIGNvbmZpZzogSUNvbmZpZztcbiAgcHJpdmF0ZSBzdG9yZTogSVN0b3JlO1xuXG4gIHByaXZhdGUgbG9nZ2VkID0gZmFsc2U7XG4gIHByaXZhdGUgaXNJbml0aWFsaXphdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHByaXZhdGUgb25SZWFkeTogKCh2YWx1ZTogdm9pZCkgPT4gdm9pZClbXTtcbiAgcHJpdmF0ZSBhdXRvUmVmcmVzaFRva2VuPzogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciAoY29uZmlnOiBJQ29uZmlnLCBzdG9yZTogSVN0b3JlKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5zdG9yZSA9IHN0b3JlO1xuICAgIHRoaXMub25SZWFkeSA9IFtdO1xuICB9XG5cbiAgcHVibGljIGdldCBpc0xvZ2dlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubG9nZ2VkO1xuICB9XG5cbiAgcHVibGljIGdldCBpc1JlYWR5ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pbml0aWFsaXplZDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZWFkeSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMub25SZWFkeS5wdXNoKHJlc29sdmUpO1xuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6YXRpb24pIHtcbiAgICAgIHRoaXMuaXNJbml0aWFsaXphdGlvbiA9IHRydWU7XG5cbiAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgcHVibGljIHVubG9hZCAoKSB7XG4gICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICB0aGlzLmlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoVG9rZW4oKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHRoaXMuaXNJbml0aWFsaXphdGlvbiA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCByZXNvbHZlIG9mIHRoaXMub25SZWFkeSkge1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZWZyZXNoVG9rZW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmF1dG9SZWZyZXNoVG9rZW4pIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5hdXRvUmVmcmVzaFRva2VuKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGFwaS5yZWZyZXNoSnd0VG9rZW4oKTtcbiAgICAgIGlmICghZGF0YT8uYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEJhc2ljRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2dnZWQgPSB0cnVlO1xuICAgICAgdGhpcy5zdG9yZS5zZXRBY2Nlc3NUb2tlbihkYXRhLmFjY2Vzc1Rva2VuKTtcbiAgICAgIHRoaXMuYXV0b1JlZnJlc2hUb2tlbiA9IHNldEludGVydmFsKCgpID0+IHRoaXMucmVmcmVzaFRva2VuKCksIHRoaXMuY29uZmlnLmdldEp3dFJlZnJlc2hJbnRlcnZhbCgpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBBY2Nlc3NEZW5pZWRFcnJvcikge1xuICAgICAgICB0aGlzLmxvZ2dlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybihlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBsb2dvdXQgKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHVybCA9IGAke3RoaXMuY29uZmlnLmdldEFwaUJhc2VVcmwoKX0vYXV0aC9sb2dvdXRgO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmZXRjaCh1cmwsIHsgbWV0aG9kOiAnUE9TVCcsIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5zdG9yZS5mb3JnZXRTZW5zaXRpdmVEYXRhKCk7XG5cbiAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcblxuICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgYXV0aCA9IG5ldyBBdXRoKGNvbmZpZywgc3RvcmUpO1xuIiwgIiN3aWRnZXR7d2lkdGg6MzAwcHg7bWFyZ2luOjIwcHg7Ym9yZGVyOjFweCBzb2xpZCAjYWVhZWFlO2JvcmRlci1yYWRpdXM6NnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Ym94LXNpemluZzpib3JkZXItYm94O2FsaWduLWl0ZW1zOnN0cmV0Y2h9I3dpZGdldF9wYXl7ZmxleC1ncm93OjE7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2ZvbnQtc2l6ZToxNXB4O2ZvbnQtZmFtaWx5OlZlcmRhbmEsR2VuZXZhLFRhaG9tYSxzYW5zLXNlcmlmO2JhY2tncm91bmQ6IzYxYzNmZjtjb2xvcjojZmZmO2N1cnNvcjpwb2ludGVyfSN3aWRnZXRfcGF5LndpZGV7cGFkZGluZzoxNXB4IDB9I3dpZGdldF9wYXk6aG92ZXJ7YmFja2dyb3VuZDojMzhiM2ZmfSN3aWRnZXRfc2V0dGluZ3N7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt0ZXh0LWFsaWduOmNlbnRlcjttYXgtd2lkdGg6NTAlO2JhY2tncm91bmQ6I2FkZTBmZjtjb2xvcjojNmY2ZjZmO3RleHQtYWxpZ246cmlnaHR9I3dpZGdldF93YWxsZXR7Y3Vyc29yOnBvaW50ZXI7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldDpob3ZlcntiYWNrZ3JvdW5kOiM5OGQ3ZmZ9I3dpZGdldF9zZXR0aW5ncz5kaXZ7cGFkZGluZzozcHggMjBweH0iLCAiLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHN0eWxlcyBmcm9tICdzYXNzOi4vc3R5bGVzLmNzcyc7XG5cbmV4cG9ydCBjb25zdCBnZXRTdHlsZXMgPSAoKTogc3RyaW5nID0+IHN0eWxlcztcbiIsICJpbXBvcnQgeyBnZXRTdHlsZXMgfSBmcm9tICcuLi9zdHlsZSc7XG5cbmNsYXNzIERvbSB7XG4gIHByaXZhdGUgc3R5bGVzPzogSFRNTEVsZW1lbnQ7XG5cbiAgcHVibGljIGluamVjdEVsZW1lbnQgKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICB9XG5cbiAgcHVibGljIGluamVjdFN0eWxlcyAoKTogdm9pZCB7XG4gICAgY29uc3QgdGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICB0YWcudGV4dENvbnRlbnQgPSBnZXRTdHlsZXMoKTtcblxuICAgIHRoaXMuaW5qZWN0RWxlbWVudChkb2N1bWVudC5oZWFkLCB0YWcpO1xuXG4gICAgdGhpcy5zdHlsZXMgPSB0YWc7XG4gIH1cblxuICBwdWJsaWMgZmluZEVsZW1lbnQgKGVsZW1lbnRJZDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsZW1lbnRJZCk7XG4gICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gZWxlbWVudCAke2VsZW1lbnRJZH0uYCk7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpIHtcbiAgICBpZiAodGhpcy5zdHlsZXMpIHtcbiAgICAgIHRoaXMuc3R5bGVzLnJlbW92ZSgpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZG9tID0gbmV3IERvbSgpO1xuIiwgImV4cG9ydCBjbGFzcyBXaWRnZXRDb25maWcge1xuICAjY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG5cbiAgI29yZGVySWQ/OiBzdHJpbmc7XG4gICNjdXN0b21lcklkPzogc3RyaW5nO1xuICAjbWVyY2hhbnRJZD86IHN0cmluZztcbiAgI2Ftb3VudD86IG51bWJlcjtcbiAgI2NhbkVkaXRBbW91bnQ/OiBib29sZWFuO1xuICAjY3VycmVuY3k/OiBzdHJpbmc7XG4gICNkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgI29yZGVyVHlwZT86IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvciAoY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLiNjYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9XG5cbiAgcHVibGljIHNldE9yZGVySWQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy4jb3JkZXJJZCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNvcmRlcklkID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldEN1c3RvbWVySWQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy4jY3VzdG9tZXJJZCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNjdXN0b21lcklkID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldE1lcmNoYW50SWQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy4jbWVyY2hhbnRJZCA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNtZXJjaGFudElkID0gdmFsdWU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIHNldFByaWNlIChhbW91bnQ6IG51bWJlciwgY3VycmVuY3k6IHN0cmluZywgY2FuRWRpdEFtb3VudDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLiNhbW91bnQgPT09IGFtb3VudCAmJiB0aGlzLiNjdXJyZW5jeSA9PT0gY3VycmVuY3kgJiYgdGhpcy4jY2FuRWRpdEFtb3VudCA9PT0gY2FuRWRpdEFtb3VudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI2Ftb3VudCA9IGFtb3VudDtcbiAgICB0aGlzLiNjdXJyZW5jeSA9IGN1cnJlbmN5O1xuICAgIHRoaXMuI2NhbkVkaXRBbW91bnQgPSBjYW5FZGl0QW1vdW50O1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXREZXNjcmlwdGlvbiAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNkZXNjcmlwdGlvbiA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNkZXNjcmlwdGlvbiA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRPcmRlclR5cGUgKHR5cGU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLiNvcmRlclR5cGUgPT09IHR5cGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoaXNOYU4oTnVtYmVyKHR5cGUpKSB8fCB0eXBlIDwgMCkge1xuICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIG9yZGVyIHR5cGUnKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI29yZGVyVHlwZSA9IHR5cGU7XG5cbiAgICB0aGlzLiNjYWxsYmFjaygpO1xuICB9XG5cbiAgcHVibGljIGdldFNldHRpbmdzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3JkZXJJZDogdGhpcy4jb3JkZXJJZCxcbiAgICAgIGN1c3RvbWVySWQ6IHRoaXMuI2N1c3RvbWVySWQsXG4gICAgICBtZXJjaGFudElkOiB0aGlzLiNtZXJjaGFudElkLFxuICAgICAgYW1vdW50OiB0aGlzLiNhbW91bnQsXG4gICAgICBjYW5FZGl0QW1vdW50OiB0aGlzLiNjYW5FZGl0QW1vdW50LFxuICAgICAgY3VycmVuY3k6IHRoaXMuI2N1cnJlbmN5LFxuICAgICAgZGVzY3JpcHRpb246IHRoaXMuI2Rlc2NyaXB0aW9uLFxuICAgICAgb3JkZXJUeXBlOiB0aGlzLiNvcmRlclR5cGUsXG4gICAgfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGRvbSB9IGZyb20gJy4uL3NlcnZpY2VzL2RvbSc7XG5cbmV4cG9ydCBjbGFzcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgc3RhdGljIG1heElkID0gMDtcblxuICBwcml2YXRlIHJlYWRvbmx5IGlkID0gKytDUGF5RWxlbWVudC5tYXhJZDtcbiAgcHJvdGVjdGVkIGNvbnRhaW5lcj86IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgcm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdID0gW107XG4gIHByb3RlY3RlZCBwYXJlbnQ/OiBDUGF5RWxlbWVudDtcbiAgcHJpdmF0ZSBjaGlsZHMgPSBuZXcgTWFwPG51bWJlciwgQ1BheUVsZW1lbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IgKGNvbnRhaW5lcj86IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpIHtcbiAgfVxuXG4gIHB1YmxpYyBjYXNjYWRlVW5sb2FkICgpIHtcbiAgICB0aGlzLmNoaWxkcy5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5yZW1vdmVDaGlsZChjaGlsZCkpO1xuXG4gICAgdGhpcy51bmxvYWQoKTtcblxuICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29udGFpbmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucm9vdEl0ZW1zID0gW107XG4gIH1cblxuICBwdWJsaWMgc2V0UGFyZW50IChwYXJlbnQ/OiBDUGF5RWxlbWVudCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldENvbnRhaW5lciAoY29udGFpbmVyPzogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIHByb3RlY3RlZCByZWdpc3RlclJvb3RJdGVtcyAocm9vdEl0ZW1zOiBIVE1MRWxlbWVudFtdKSB7XG4gICAgdGhpcy5yb290SXRlbXMgPSByb290SXRlbXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0UGFyZW50ICgpOiBDUGF5RWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICB9XG5cbiAgcHVibGljIGdldENvbnRhaW5lciAoKTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXRSb290SXRlbXMgKCk6IEhUTUxFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLnJvb3RJdGVtcztcbiAgfVxuXG4gIHB1YmxpYyBhZGRDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50LCBjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCB0aGlzLmNvbnRhaW5lcjtcbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb250YWluZXIgd2FzIG5vdCBzZXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuY2hpbGRzLnNldChjaGlsZC5pZCwgY2hpbGQpO1xuXG4gICAgY2hpbGQuc2V0UGFyZW50KHRoaXMpO1xuICAgIGNoaWxkLnNldENvbnRhaW5lcihjb250YWluZXIpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHJvb3RJdGVtcykge1xuICAgICAgZG9tLmluamVjdEVsZW1lbnQoY29udGFpbmVyLCBpdGVtKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYmVmb3JlUmVtb3ZlQ2hpbGQgKGNoaWxkOiBDUGF5RWxlbWVudCkge1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUNoaWxkIChjaGlsZDogQ1BheUVsZW1lbnQpIHtcbiAgICBjb25zdCByb290SXRlbXMgPSBjaGlsZC5nZXRSb290SXRlbXMoKTtcbiAgICBpZiAoIXJvb3RJdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtcyB3YXMgbm90IHNldCcpO1xuICAgIH1cblxuICAgIHRoaXMuYmVmb3JlUmVtb3ZlQ2hpbGQoY2hpbGQpO1xuXG4gICAgY2hpbGQuY2FzY2FkZVVubG9hZCgpO1xuICAgIGNoaWxkLnNldFBhcmVudCgpO1xuICAgIGNoaWxkLnNldENvbnRhaW5lcigpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHJvb3RJdGVtcykge1xuICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkcy5kZWxldGUoY2hpbGQuaWQpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoKSB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQ1BheUVsZW1lbnQgfSBmcm9tICcuL2VsZW1lbnQnO1xuXG5leHBvcnQgY2xhc3MgT3JkZXJQb3B1cCBleHRlbmRzIENQYXlFbGVtZW50IHtcbiAgcHVibGljIGFzeW5jIGluaXQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHBvcHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcG9wdXAuaWQgPSAnb3JkZXJfcG9wdXAnO1xuXG4gICAgdGhpcy5yZWdpc3RlclJvb3RJdGVtcyhbcG9wdXBdKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGFwaSB9IGZyb20gJy4uLy4uL2FwaSc7XG5pbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4uL2VsZW1lbnQnO1xuaW1wb3J0IHsgT3JkZXJQb3B1cCB9IGZyb20gJy4uL29yZGVyUG9wdXAnO1xuaW1wb3J0IHsgV2lkZ2V0Q29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQnV0dG9uQ29tbW9uIGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwcm90ZWN0ZWQgYnV0dG9uITogSFRNTEVsZW1lbnQ7XG4gIHByb3RlY3RlZCBjbGlja2VkID0gZmFsc2U7XG4gIHByaXZhdGUgbG9ja2VkID0gZmFsc2U7XG4gIHByaXZhdGUgY29uZmlnOiBXaWRnZXRDb25maWc7XG5cbiAgY29uc3RydWN0b3IgKGNvbmZpZzogV2lkZ2V0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGNsaWNrICgpIHtcbiAgICBpZiAodGhpcy5jbGlja2VkIHx8IHRoaXMubG9ja2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jbGlja2VkID0gdHJ1ZTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yZGVyKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybignQnV0dG9uQ29tbW9uIGVycm9yJywgZXJyb3IpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpY2tlZCA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVPcmRlciAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5jb25maWcuZ2V0U2V0dGluZ3MoKTtcblxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGFwaS5jcmVhdGVPcmRlcih7XG4gICAgICAgIGN1cnJlbmN5OiBzZXR0aW5ncy5jdXJyZW5jeSB8fCAnJyxcbiAgICAgICAgYW1vdW50OiBzZXR0aW5ncy5hbW91bnQgfHwgMCxcbiAgICAgICAgZGVzY3JpcHRpb246IHNldHRpbmdzLmRlc2NyaXB0aW9uIHx8ICcnLFxuICAgICAgICBtZXJjaGFudElkOiBzZXR0aW5ncy5tZXJjaGFudElkIHx8ICcnLFxuICAgICAgICBjdXN0b21lcklkOiBzZXR0aW5ncy5jdXN0b21lcklkIHx8ICcnLFxuICAgICAgICBvcmRlcklkOiBzZXR0aW5ncy5vcmRlcklkIHx8ICcnLFxuICAgICAgICBvcmRlclR5cGU6IHNldHRpbmdzLm9yZGVyVHlwZSB8fCAxLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUud2Fybignb3JkZXIgcmVzdWx0OicpO1xuICAgICAgY29uc29sZS53YXJuKGRhdGEpO1xuXG4gICAgICBjb25zdCB7IGlkIH0gPSBkYXRhO1xuXG4gICAgICB0aGlzLmxvY2tlZCA9IHRydWU7XG5cbiAgICAgIGF3YWl0IGF1dGgucmVmcmVzaFRva2VuKCk7XG5cbiAgICAgIHRoaXMuYWRkQ2hpbGQoYXdhaXQgdGhpcy5vcGVuT3JkZXJQb3B1cChpZCksIHRoaXMuZ2V0Q29udGFpbmVyKCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29uc3Qgb2xkVGV4dCA9IHRoaXMuYnV0dG9uLnRleHRDb250ZW50O1xuICAgICAgdGhpcy5idXR0b24udGV4dENvbnRlbnQgPSAnXHVEODNEXHVERTFFJztcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuYnV0dG9uLnRleHRDb250ZW50ID0gb2xkVGV4dDtcbiAgICAgICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcbiAgICAgIH0sIDMwMDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3Blbk9yZGVyUG9wdXAgKGlkOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLndhcm4oJ29wZW5PcmRlclBvcHVwJywgaWQpO1xuXG4gICAgY29uc3QgcG9wdXAgPSBuZXcgT3JkZXJQb3B1cCgpO1xuICAgIGF3YWl0IHBvcHVwLmluaXQoKTtcblxuICAgIHJldHVybiBwb3B1cDtcbiAgfVxuXG4gIHB1YmxpYyBiZWZvcmVSZW1vdmVDaGlsZCAoY2hpbGQ6IENQYXlFbGVtZW50KTogdm9pZCB7XG4gICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJ1dHRvbkNvbW1vbiB9IGZyb20gJy4vYnV0dG9uLmNvbW1vbic7XG5cbmV4cG9ydCBjbGFzcyBCdXR0b25Bbm9ueW1vdXMgZXh0ZW5kcyBCdXR0b25Db21tb24ge1xuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgd2lkZ2V0UGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0UGF5LmlkID0gJ3dpZGdldF9wYXknO1xuICAgIHdpZGdldFBheS5jbGFzc05hbWUgPSAnd2lkZSc7XG4gICAgd2lkZ2V0UGF5LnRleHRDb250ZW50ID0gJ1BheSB3aXRoIENyeXB0dW1QYXknO1xuXG4gICAgdGhpcy5idXR0b24gPSB3aWRnZXRQYXk7XG5cbiAgICB3aWRnZXRQYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5yZWdpc3RlclJvb3RJdGVtcyhbd2lkZ2V0UGF5XSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi8uLi9hcGknO1xuaW1wb3J0IHsgQnV0dG9uQ29tbW9uIH0gZnJvbSAnLi9idXR0b24uY29tbW9uJztcblxuZXhwb3J0IGNsYXNzIEJ1dHRvbkxvZ2dlZCBleHRlbmRzIEJ1dHRvbkNvbW1vbiB7XG4gIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB3aWRnZXRQYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRQYXkuaWQgPSAnd2lkZ2V0X3BheSc7XG4gICAgd2lkZ2V0UGF5LnRleHRDb250ZW50ID0gJ1BheSc7XG5cbiAgICBjb25zdCB3aWRnZXRTZXR0aW5ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFNldHRpbmdzLmlkID0gJ3dpZGdldF9zZXR0aW5ncyc7XG5cbiAgICBjb25zdCB3aWRnZXRQcmljZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdpZGdldFByaWNlLmlkID0gJ3dpZGdldF9wcmljZSc7XG4gICAgd2lkZ2V0UHJpY2UudGV4dENvbnRlbnQgPSAnMTAwNTAwIFVTRFQnO1xuXG4gICAgY29uc3Qgd2lkZ2V0V2FsbGV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0V2FsbGV0LmlkID0gJ3dpZGdldF93YWxsZXQnO1xuXG4gICAgY29uc3Qgd2FsbGV0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB3YWxsZXRTcGFuLnRleHRDb250ZW50ID0gJzNUTlx1MjAyNjlGQSc7XG5cbiAgICBjb25zdCBhcnJvd1NwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgYXJyb3dTcGFuLmlubmVySFRNTCA9ICcmIzk2NjI7JztcblxuICAgIHdpZGdldFdhbGxldC5hcHBlbmRDaGlsZCh3YWxsZXRTcGFuKTtcbiAgICB3aWRnZXRXYWxsZXQuYXBwZW5kQ2hpbGQoYXJyb3dTcGFuKTtcblxuICAgIHdpZGdldFNldHRpbmdzLmFwcGVuZENoaWxkKHdpZGdldFByaWNlKTtcbiAgICB3aWRnZXRTZXR0aW5ncy5hcHBlbmRDaGlsZCh3aWRnZXRXYWxsZXQpO1xuXG4gICAgd2lkZ2V0V2FsbGV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdXNlciA9IGF3YWl0IGFwaS5nZXRVc2VyKCk7XG4gICAgICBjb25zb2xlLndhcm4odXNlcik7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyUm9vdEl0ZW1zKFt3aWRnZXRQYXksIHdpZGdldFNldHRpbmdzXSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBXaWRnZXRDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4uL2VsZW1lbnQnO1xuaW1wb3J0IHsgQnV0dG9uQW5vbnltb3VzIH0gZnJvbSAnLi9idXR0b24uYW5vbnltb3VzJztcbmltcG9ydCB7IEJ1dHRvbkxvZ2dlZCB9IGZyb20gJy4vYnV0dG9uLmxvZ2dlZCc7XG5cbmV4cG9ydCBjbGFzcyBXaWRnZXQgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgY29uZmlnOiBXaWRnZXRDb25maWc7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IG5ldyBXaWRnZXRDb25maWcoKCkgPT4gdGhpcy51cGRhdGUoKSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q29uZmlnICgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWc7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuXG4gICAgLy8gVE9ETzogXHUwNDNFXHUwNDQ0XHUwNDNFXHUwNDQwXHUwNDNDXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMiBcdTA0MzdcdTA0MzBcdTA0MzJcdTA0MzhcdTA0NDFcdTA0MzhcdTA0M0NcdTA0M0VcdTA0NDFcdTA0NDJcdTA0MzggXHUwNDNFXHUwNDQyIFx1MDQzRlx1MDQzNVx1MDQ0MFx1MDQzMlx1MDQzOFx1MDQ0N1x1MDQzRFx1MDQ0Qlx1MDQ0NSBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzVcdTA0M0FcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuXG4gICAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgICBpZiAoYXV0aC5pc0xvZ2dlZCkge1xuICAgICAgdGhpcy5hZGRDaGlsZChhd2FpdCB0aGlzLmNyZWF0ZUxvZ2dlZEJ1dHRvbigpLCB3aWRnZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZENoaWxkKGF3YWl0IHRoaXMuY3JlYXRlQW5vbnltb3VzQnV0dG9uKCksIHdpZGdldCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3RlclJvb3RJdGVtcyhbd2lkZ2V0XSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUxvZ2dlZEJ1dHRvbiAoKSB7XG4gICAgY29uc3QgYnV0dG9uID0gbmV3IEJ1dHRvbkxvZ2dlZCh0aGlzLmNvbmZpZyk7XG4gICAgYXdhaXQgYnV0dG9uLmluaXQoKTtcblxuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUFub255bW91c0J1dHRvbiAoKSB7XG4gICAgY29uc3QgYnV0dG9uID0gbmV3IEJ1dHRvbkFub255bW91cyh0aGlzLmNvbmZpZyk7XG4gICAgYXdhaXQgYnV0dG9uLmluaXQoKTtcblxuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZSAoKTogdm9pZCB7XG4gICAgaWYgKCFhdXRoLmlzUmVhZHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBcdTA0M0VcdTA0MzFcdTA0M0RcdTA0M0VcdTA0MzJcdTA0M0JcdTA0NEZcdTA0MzVcdTA0M0MgXHUwNDMyXHUwNDNEXHUwNDM1XHUwNDQ4XHUwNDNBXHUwNDQzIFx1MDQzNVx1MDQ0MVx1MDQzQlx1MDQzOCBcdTA0MzhcdTA0MzdcdTA0M0NcdTA0MzVcdTA0M0RcdTA0MzhcdTA0M0JcdTA0MzggXHUwNDNEXHUwNDMwXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDNBXHUwNDM4IFx1MDQzMiBcdTA0NDBcdTA0MzVcdTA0MzBcdTA0M0JcdTA0NDJcdTA0MzBcdTA0MzlcdTA0M0NcdTA0MzVcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4uL3NlcnZpY2VzL2F1dGgnO1xuaW1wb3J0IHsgZG9tIH0gZnJvbSAnLi4vc2VydmljZXMvZG9tJztcbmltcG9ydCB7IENQYXlFbGVtZW50IH0gZnJvbSAnLi9lbGVtZW50JztcblxuZXhwb3J0IGNsYXNzIFJvb3QgZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHByaXZhdGUgc3RhdGljIFJlZ2lzdGVyZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcHJpdmF0ZSByb290SWQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvciAocm9vdElkOiBzdHJpbmcpIHtcbiAgICBpZiAoUm9vdC5SZWdpc3RlcmVkSWRzLmhhcyhyb290SWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYElkICR7cm9vdElkfSBpcyBhbHJlYWR5IGluIHVzZWApO1xuICAgIH1cblxuICAgIHN1cGVyKGRvbS5maW5kRWxlbWVudChyb290SWQpKTtcblxuICAgIFJvb3QuUmVnaXN0ZXJlZElkcy5hZGQocm9vdElkKTtcblxuICAgIHRoaXMucm9vdElkID0gcm9vdElkO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCkge1xuICAgIGF3YWl0IGF1dGgucmVhZHkoKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgIFJvb3QuUmVnaXN0ZXJlZElkcy5kZWxldGUodGhpcy5yb290SWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDQU8sTUFBTSxhQUFOLGNBQXlCLE1BQU07QUFBQSxFQUFDOzs7QUNFaEMsTUFBTSxvQkFBTixjQUFnQyxXQUFXO0FBQUEsRUFBQzs7O0FDRjVDLE1BQWUsWUFBZixNQUF5QjtBQUFBLElBQ3BCO0FBQUEsSUFFVixZQUFhLE1BQWM7QUFDekIsV0FBSyxPQUFPO0FBQUEsSUFDZDtBQUFBLElBRVUsSUFBSyxLQUFxQjtBQUNsQyxhQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRztBQUFBLElBQzVCO0FBQUEsRUFDRjs7O0FDUE8sTUFBTSx5QkFBTixjQUFxQyxVQUFnQztBQUFBLElBQ2xFLFFBQWdDLENBQUM7QUFBQSxJQUVsQyxJQUFLLEtBQWEsT0FBcUI7QUFDNUMsV0FBSyxNQUFNLEdBQUcsSUFBSTtBQUFBLElBQ3BCO0FBQUEsSUFFTyxJQUFLLEtBQTRCO0FBQ3RDLGFBQU8sS0FBSyxNQUFNLEdBQUcsS0FBSztBQUFBLElBQzVCO0FBQUEsSUFFTyxPQUFRLEtBQW1CO0FBQ2hDLGFBQU8sS0FBSyxNQUFNLEdBQUc7QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7OztBQ2RBLE1BQU0sUUFBTixNQUE4QjtBQUFBLElBQ3BCO0FBQUEsSUFFUixjQUFlO0FBQ2IsV0FBSyxPQUFPLElBQUksdUJBQXVCLE1BQU07QUFBQSxJQUMvQztBQUFBLElBRUEsZUFBZ0IsYUFBMkI7QUFDekMsV0FBSyxLQUFLLElBQUksa0JBQWtCLFdBQVc7QUFBQSxJQUM3QztBQUFBLElBRUEsaUJBQWlDO0FBQy9CLGFBQU8sS0FBSyxLQUFLLElBQUksZ0JBQWdCO0FBQUEsSUFDdkM7QUFBQSxJQUVBLHNCQUE2QjtBQUMzQixXQUFLLEtBQUssT0FBTyxnQkFBZ0I7QUFBQSxJQUNuQztBQUFBLEVBQ0Y7QUFFTyxNQUFNLFFBQVEsSUFBSSxNQUFNOzs7QUNyQi9CLE1BQU0sU0FBTixNQUFnQztBQUFBLElBQzlCLGdCQUF5QjtBQUN2QixhQUFPO0FBQUEsSUFDVDtBQUFBLElBRUEsd0JBQWlDO0FBQy9CLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBRU8sTUFBTSxTQUFTLElBQUksT0FBTzs7O0FDRWpDLE1BQU0sTUFBTixNQUFVO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUVELFlBQWFBLFNBQWlCQyxRQUFlO0FBQ2xELFdBQUssU0FBU0Q7QUFDZCxXQUFLLFFBQVFDO0FBQUEsSUFDZjtBQUFBLElBRUEsTUFBYyxRQUFhO0FBQUEsTUFDekI7QUFBQSxNQUNBLFNBQVM7QUFBQSxNQUNULE9BQU8sQ0FBQztBQUFBLE1BQ1Isa0JBQWtCO0FBQUEsTUFDbEIsb0JBQW9CO0FBQUEsSUFDdEIsR0FBK0I7QUFDN0IsWUFBTSxNQUFNLElBQUksSUFBSSxHQUFHLEtBQUssT0FBTyxjQUFjLENBQUMsR0FBRyxRQUFRLEVBQUU7QUFFL0QsWUFBTSxnQkFBNkI7QUFBQSxRQUNqQztBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBRUEsVUFBSSxXQUFXLE9BQU87QUFDcEIsZUFBTyxLQUFLLElBQUksRUFBRSxRQUFRLENBQUMsUUFBUSxJQUFJLGFBQWEsT0FBTyxLQUFLLEtBQUssR0FBRyxDQUFDLENBQUM7QUFBQSxNQUM1RSxPQUFPO0FBQ0wsc0JBQWMsT0FBTyxLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzFDO0FBRUEsVUFBSSxpQkFBaUI7QUFDbkIsc0JBQWMsY0FBYztBQUFBLE1BQzlCO0FBRUEsVUFBSSxxQkFBcUIsS0FBSyxNQUFNLGVBQWUsR0FBRztBQUNwRCxzQkFBYyxVQUFVO0FBQUEsVUFDdEIsR0FBRyxjQUFjO0FBQUEsVUFDakIsZUFBZSxVQUFVLEtBQUssTUFBTSxlQUFlLENBQUM7QUFBQSxRQUN0RDtBQUFBLE1BQ0Y7QUFFQSxVQUFJO0FBQ0YsY0FBTSxXQUFXLE1BQU0sTUFBTSxLQUFLLGFBQWE7QUFFL0MsWUFBSSxTQUFTLFdBQVcsS0FBSztBQUMzQixnQkFBTSxJQUFJLGtCQUFrQixzQkFBc0I7QUFBQSxRQUNwRCxXQUFXLFNBQVMsV0FBVyxLQUFLO0FBQ2xDLGdCQUFNLElBQUksV0FBVywwQkFBMEI7QUFBQSxRQUNqRDtBQUVBLGVBQU8sTUFBTSxTQUFTLEtBQUs7QUFBQSxNQUM3QixTQUFTLEtBQUs7QUFDWixZQUFJLGVBQWUsWUFBWTtBQUM3QixnQkFBTTtBQUFBLFFBQ1I7QUFFQSxnQkFBUSxLQUFLLEdBQUc7QUFFaEIsY0FBTSxJQUFJLFdBQVcsa0JBQWtCO0FBQUEsTUFDekM7QUFBQSxJQUNGO0FBQUEsSUFFQSxNQUFhLGtCQUFtQjtBQUM5QixhQUFPLE1BQU0sS0FBSyxRQUFzQjtBQUFBLFFBQ3RDLFVBQVU7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLG1CQUFtQjtBQUFBLFFBQ25CLGlCQUFpQjtBQUFBLE1BQ25CLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFhLFlBQWEsT0FBc0I7QUFDOUMsYUFBTyxNQUFNLEtBQUssUUFBMkI7QUFBQSxRQUMzQyxVQUFVO0FBQUEsUUFDVixRQUFRO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixtQkFBbUI7QUFBQSxRQUNuQixpQkFBaUI7QUFBQSxNQUNuQixDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsTUFBYSxVQUFXO0FBQ3RCLGFBQU8sTUFBTSxLQUFLLFFBQVE7QUFBQSxRQUN4QixVQUFVO0FBQUEsUUFDVixtQkFBbUI7QUFBQSxNQUNyQixDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsTUFBYSxnQkFBaUI7QUFDNUIsWUFBTSxTQUFTLE1BQU0sS0FBSyxRQUFrQztBQUFBLFFBQzFELFVBQVU7QUFBQSxNQUNaLENBQUM7QUFFRCxhQUFPLFFBQVEsY0FBYyxDQUFDO0FBQUEsSUFDaEM7QUFBQSxFQUNGO0FBRU8sTUFBTSxNQUFNLElBQUksSUFBSSxRQUFRLEtBQUs7OztBQ3pHeEMsTUFBTSxPQUFOLE1BQTRCO0FBQUEsSUFDbEI7QUFBQSxJQUNBO0FBQUEsSUFFQSxTQUFTO0FBQUEsSUFDVCxtQkFBbUI7QUFBQSxJQUNuQixjQUFjO0FBQUEsSUFDZDtBQUFBLElBQ0E7QUFBQSxJQUVELFlBQWFDLFNBQWlCQyxRQUFlO0FBQ2xELFdBQUssU0FBU0Q7QUFDZCxXQUFLLFFBQVFDO0FBQ2IsV0FBSyxVQUFVLENBQUM7QUFBQSxJQUNsQjtBQUFBLElBRUEsSUFBVyxXQUFxQjtBQUM5QixhQUFPLEtBQUs7QUFBQSxJQUNkO0FBQUEsSUFFQSxJQUFXLFVBQW9CO0FBQzdCLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUVBLE1BQWEsUUFBd0I7QUFDbkMsVUFBSSxLQUFLLGFBQWE7QUFDcEI7QUFBQSxNQUNGO0FBRUEsWUFBTSxVQUFVLElBQUksUUFBYyxDQUFDLFlBQVk7QUFDN0MsYUFBSyxRQUFRLEtBQUssT0FBTztBQUFBLE1BQzNCLENBQUM7QUFFRCxVQUFJLENBQUMsS0FBSyxrQkFBa0I7QUFDMUIsYUFBSyxtQkFBbUI7QUFFeEIsYUFBSyxLQUFLO0FBQUEsTUFDWjtBQUVBLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFTyxTQUFVO0FBQ2YsV0FBSyxTQUFTO0FBQ2QsV0FBSyxtQkFBbUI7QUFDeEIsV0FBSyxjQUFjO0FBRW5CLFdBQUssTUFBTSxvQkFBb0I7QUFBQSxJQUNqQztBQUFBLElBRUEsTUFBYyxPQUF1QjtBQUNuQyxZQUFNLEtBQUssYUFBYTtBQUV4QixXQUFLLGNBQWM7QUFDbkIsV0FBSyxtQkFBbUI7QUFFeEIsaUJBQVcsV0FBVyxLQUFLLFNBQVM7QUFDbEMsZ0JBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLElBRUEsTUFBYSxlQUErQjtBQUMxQyxVQUFJLEtBQUssa0JBQWtCO0FBQ3pCLHNCQUFjLEtBQUssZ0JBQWdCO0FBQUEsTUFDckM7QUFFQSxVQUFJO0FBQ0YsY0FBTSxPQUFPLE1BQU0sSUFBSSxnQkFBZ0I7QUFDdkMsWUFBSSxDQUFDLE1BQU0sYUFBYTtBQUN0QixnQkFBTSxJQUFJLFdBQVcsa0JBQWtCO0FBQUEsUUFDekM7QUFFQSxhQUFLLFNBQVM7QUFDZCxhQUFLLE1BQU0sZUFBZSxLQUFLLFdBQVc7QUFDMUMsYUFBSyxtQkFBbUIsWUFBWSxNQUFNLEtBQUssYUFBYSxHQUFHLEtBQUssT0FBTyxzQkFBc0IsQ0FBQztBQUFBLE1BQ3BHLFNBQVMsS0FBSztBQUNaLFlBQUksZUFBZSxtQkFBbUI7QUFDcEMsZUFBSyxTQUFTO0FBQ2QsZUFBSyxNQUFNLG9CQUFvQjtBQUFBLFFBQ2pDLE9BQU87QUFDTCxrQkFBUSxLQUFLLEdBQUc7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxNQUFhLFNBQTRCO0FBQ3ZDLFlBQU0sTUFBTSxHQUFHLEtBQUssT0FBTyxjQUFjLENBQUM7QUFFMUMsYUFBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzlCLGNBQU0sS0FBSyxFQUFFLFFBQVEsUUFBUSxhQUFhLFVBQVUsQ0FBQyxFQUNsRCxLQUFLLGNBQVksU0FBUyxLQUFLLENBQUMsRUFDaEMsS0FBSyxDQUFDLFNBQVM7QUFDZCxlQUFLLFNBQVM7QUFDZCxlQUFLLE1BQU0sb0JBQW9CO0FBRS9CLGtCQUFRLElBQUk7QUFBQSxRQUNkLENBQUMsRUFDQSxNQUFNLENBQUMsVUFBVTtBQUNoQixrQkFBUSxLQUFLLEtBQUs7QUFFbEIsa0JBQVEsS0FBSztBQUFBLFFBQ2YsQ0FBQztBQUFBLE1BQ0wsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBRU8sTUFBTSxPQUFPLElBQUksS0FBSyxRQUFRLEtBQUs7OztBQ2pIMUM7OztBQ0dPLE1BQU0sWUFBWSxNQUFjOzs7QUNEdkMsTUFBTSxNQUFOLE1BQVU7QUFBQSxJQUNBO0FBQUEsSUFFRCxjQUFlLFdBQXdCLFNBQTRCO0FBQ3hFLGdCQUFVLFlBQVksT0FBTztBQUFBLElBQy9CO0FBQUEsSUFFTyxlQUFzQjtBQUMzQixZQUFNLE1BQU0sU0FBUyxjQUFjLE9BQU87QUFDMUMsVUFBSSxjQUFjLFVBQVU7QUFFNUIsV0FBSyxjQUFjLFNBQVMsTUFBTSxHQUFHO0FBRXJDLFdBQUssU0FBUztBQUFBLElBQ2hCO0FBQUEsSUFFTyxZQUFhLFdBQWdDO0FBQ2xELFlBQU0sWUFBWSxTQUFTLGVBQWUsU0FBUztBQUNuRCxVQUFJLFdBQVc7QUFDYixlQUFPO0FBQUEsTUFDVDtBQUVBLFlBQU0sSUFBSSxNQUFNLG1CQUFtQixTQUFTLEdBQUc7QUFBQSxJQUNqRDtBQUFBLElBRU8sU0FBVTtBQUNmLFVBQUksS0FBSyxRQUFRO0FBQ2YsYUFBSyxPQUFPLE9BQU87QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRU8sTUFBTSxNQUFNLElBQUksSUFBSTs7O0FDbENwQixNQUFNLGVBQU4sTUFBbUI7QUFBQSxJQUN4QjtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQSxZQUFhLFVBQXNCO0FBQ2pDLFdBQUssWUFBWTtBQUFBLElBQ25CO0FBQUEsSUFFTyxXQUFZLE9BQWU7QUFDaEMsVUFBSSxLQUFLLGFBQWEsT0FBTztBQUMzQjtBQUFBLE1BQ0Y7QUFFQSxXQUFLLFdBQVc7QUFFaEIsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFBQSxJQUVPLGNBQWUsT0FBZTtBQUNuQyxVQUFJLEtBQUssZ0JBQWdCLE9BQU87QUFDOUI7QUFBQSxNQUNGO0FBRUEsV0FBSyxjQUFjO0FBRW5CLFdBQUssVUFBVTtBQUFBLElBQ2pCO0FBQUEsSUFFTyxjQUFlLE9BQWU7QUFDbkMsVUFBSSxLQUFLLGdCQUFnQixPQUFPO0FBQzlCO0FBQUEsTUFDRjtBQUVBLFdBQUssY0FBYztBQUVuQixXQUFLLFVBQVU7QUFBQSxJQUNqQjtBQUFBLElBRU8sU0FBVSxRQUFnQixVQUFrQixlQUF3QjtBQUN6RSxVQUFJLEtBQUssWUFBWSxVQUFVLEtBQUssY0FBYyxZQUFZLEtBQUssbUJBQW1CLGVBQWU7QUFDbkc7QUFBQSxNQUNGO0FBRUEsV0FBSyxVQUFVO0FBQ2YsV0FBSyxZQUFZO0FBQ2pCLFdBQUssaUJBQWlCO0FBRXRCLFdBQUssVUFBVTtBQUFBLElBQ2pCO0FBQUEsSUFFTyxlQUFnQixPQUFlO0FBQ3BDLFVBQUksS0FBSyxpQkFBaUIsT0FBTztBQUMvQjtBQUFBLE1BQ0Y7QUFFQSxXQUFLLGVBQWU7QUFFcEIsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFBQSxJQUVPLGFBQWMsTUFBYztBQUNqQyxVQUFJLEtBQUssZUFBZSxNQUFNO0FBQzVCO0FBQUEsTUFDRjtBQUVBLFVBQUksTUFBTSxPQUFPLElBQUksQ0FBQyxLQUFLLE9BQU8sR0FBRztBQUNuQyxnQkFBUSxLQUFLLG9CQUFvQjtBQUVqQztBQUFBLE1BQ0Y7QUFFQSxXQUFLLGFBQWE7QUFFbEIsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFBQSxJQUVPLGNBQWU7QUFDcEIsYUFBTztBQUFBLFFBQ0wsU0FBUyxLQUFLO0FBQUEsUUFDZCxZQUFZLEtBQUs7QUFBQSxRQUNqQixZQUFZLEtBQUs7QUFBQSxRQUNqQixRQUFRLEtBQUs7QUFBQSxRQUNiLGVBQWUsS0FBSztBQUFBLFFBQ3BCLFVBQVUsS0FBSztBQUFBLFFBQ2YsYUFBYSxLQUFLO0FBQUEsUUFDbEIsV0FBVyxLQUFLO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjs7O0FDOUZPLE1BQU0sY0FBTixNQUFNLGFBQVk7QUFBQSxJQUN2QixPQUFlLFFBQVE7QUFBQSxJQUVOLEtBQUssRUFBRSxhQUFZO0FBQUEsSUFDMUI7QUFBQSxJQUNBLFlBQTJCLENBQUM7QUFBQSxJQUM1QjtBQUFBLElBQ0YsU0FBUyxvQkFBSSxJQUF5QjtBQUFBLElBRTlDLFlBQWEsV0FBeUI7QUFDcEMsV0FBSyxZQUFZO0FBQUEsSUFDbkI7QUFBQSxJQUVBLE1BQWEsT0FBdUI7QUFBQSxJQUNwQztBQUFBLElBRU8sU0FBVTtBQUFBLElBQ2pCO0FBQUEsSUFFTyxnQkFBaUI7QUFDdEIsV0FBSyxPQUFPLFFBQVEsQ0FBQyxVQUFVLEtBQUssWUFBWSxLQUFLLENBQUM7QUFFdEQsV0FBSyxPQUFPO0FBRVosV0FBSyxTQUFTO0FBQ2QsV0FBSyxZQUFZO0FBQ2pCLFdBQUssWUFBWSxDQUFDO0FBQUEsSUFDcEI7QUFBQSxJQUVPLFVBQVcsUUFBc0I7QUFDdEMsV0FBSyxTQUFTO0FBQUEsSUFDaEI7QUFBQSxJQUVVLGFBQWMsV0FBeUI7QUFDL0MsV0FBSyxZQUFZO0FBQUEsSUFDbkI7QUFBQSxJQUVVLGtCQUFtQixXQUEwQjtBQUNyRCxXQUFLLFlBQVk7QUFBQSxJQUNuQjtBQUFBLElBRU8sWUFBc0M7QUFDM0MsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLElBRU8sZUFBeUM7QUFDOUMsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLElBRU8sZUFBK0I7QUFDcEMsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLElBRU8sU0FBVSxPQUFvQixXQUF5QjtBQUM1RCxrQkFBWSxhQUFhLEtBQUs7QUFDOUIsVUFBSSxDQUFDLFdBQVc7QUFDZCxjQUFNLElBQUksTUFBTSx1QkFBdUI7QUFBQSxNQUN6QztBQUVBLFlBQU0sWUFBWSxNQUFNLGFBQWE7QUFDckMsVUFBSSxDQUFDLFVBQVUsUUFBUTtBQUNyQixjQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxNQUMxQztBQUVBLFdBQUssT0FBTyxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBRS9CLFlBQU0sVUFBVSxJQUFJO0FBQ3BCLFlBQU0sYUFBYSxTQUFTO0FBRTVCLGlCQUFXLFFBQVEsV0FBVztBQUM1QixZQUFJLGNBQWMsV0FBVyxJQUFJO0FBQUEsTUFDbkM7QUFBQSxJQUNGO0FBQUEsSUFFTyxrQkFBbUIsT0FBb0I7QUFBQSxJQUM5QztBQUFBLElBRU8sWUFBYSxPQUFvQjtBQUN0QyxZQUFNLFlBQVksTUFBTSxhQUFhO0FBQ3JDLFVBQUksQ0FBQyxVQUFVLFFBQVE7QUFDckIsY0FBTSxJQUFJLE1BQU0sd0JBQXdCO0FBQUEsTUFDMUM7QUFFQSxXQUFLLGtCQUFrQixLQUFLO0FBRTVCLFlBQU0sY0FBYztBQUNwQixZQUFNLFVBQVU7QUFDaEIsWUFBTSxhQUFhO0FBRW5CLGlCQUFXLFFBQVEsV0FBVztBQUM1QixhQUFLLE9BQU87QUFBQSxNQUNkO0FBRUEsV0FBSyxPQUFPLE9BQU8sTUFBTSxFQUFFO0FBQUEsSUFDN0I7QUFBQSxJQUVPLFNBQVU7QUFDZixZQUFNLFNBQVMsS0FBSyxVQUFVO0FBQzlCLFVBQUksUUFBUTtBQUNWLGVBQU8sWUFBWSxJQUFJO0FBQUEsTUFDekI7QUFBQSxJQUNGO0FBQUEsRUFDRjs7O0FDdEdPLE1BQU0sYUFBTixjQUF5QixZQUFZO0FBQUEsSUFDMUMsTUFBYSxPQUF1QjtBQUNsQyxZQUFNLFFBQVEsU0FBUyxjQUFjLEtBQUs7QUFDMUMsWUFBTSxLQUFLO0FBRVgsV0FBSyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7QUFBQSxJQUNoQztBQUFBLEVBQ0Y7OztBQ0hPLE1BQWUsZUFBZixjQUFvQyxZQUFZO0FBQUEsSUFDM0M7QUFBQSxJQUNBLFVBQVU7QUFBQSxJQUNaLFNBQVM7QUFBQSxJQUNUO0FBQUEsSUFFUixZQUFhQyxTQUFzQjtBQUNqQyxZQUFNO0FBRU4sV0FBSyxTQUFTQTtBQUFBLElBQ2hCO0FBQUEsSUFFQSxNQUFnQixRQUFTO0FBQ3ZCLFVBQUksS0FBSyxXQUFXLEtBQUssUUFBUTtBQUMvQjtBQUFBLE1BQ0Y7QUFFQSxXQUFLLFVBQVU7QUFFZixVQUFJO0FBQ0YsY0FBTSxLQUFLLFlBQVk7QUFBQSxNQUN6QixTQUFTLE9BQU87QUFDZCxnQkFBUSxLQUFLLHNCQUFzQixLQUFLO0FBQUEsTUFDMUM7QUFFQSxXQUFLLFVBQVU7QUFBQSxJQUNqQjtBQUFBLElBRUEsTUFBYyxjQUFlO0FBQzNCLFVBQUk7QUFDRixjQUFNLFdBQVcsS0FBSyxPQUFPLFlBQVk7QUFFekMsY0FBTSxPQUFPLE1BQU0sSUFBSSxZQUFZO0FBQUEsVUFDakMsVUFBVSxTQUFTLFlBQVk7QUFBQSxVQUMvQixRQUFRLFNBQVMsVUFBVTtBQUFBLFVBQzNCLGFBQWEsU0FBUyxlQUFlO0FBQUEsVUFDckMsWUFBWSxTQUFTLGNBQWM7QUFBQSxVQUNuQyxZQUFZLFNBQVMsY0FBYztBQUFBLFVBQ25DLFNBQVMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsV0FBVyxTQUFTLGFBQWE7QUFBQSxRQUNuQyxDQUFDO0FBRUQsZ0JBQVEsS0FBSyxlQUFlO0FBQzVCLGdCQUFRLEtBQUssSUFBSTtBQUVqQixjQUFNLEVBQUUsR0FBRyxJQUFJO0FBRWYsYUFBSyxTQUFTO0FBRWQsY0FBTSxLQUFLLGFBQWE7QUFFeEIsYUFBSyxTQUFTLE1BQU0sS0FBSyxlQUFlLEVBQUUsR0FBRyxLQUFLLGFBQWEsQ0FBQztBQUFBLE1BQ2xFLFFBQVE7QUFDTixjQUFNLFVBQVUsS0FBSyxPQUFPO0FBQzVCLGFBQUssT0FBTyxjQUFjO0FBRTFCLG1CQUFXLE1BQU07QUFDZixlQUFLLE9BQU8sY0FBYztBQUMxQixlQUFLLFNBQVM7QUFBQSxRQUNoQixHQUFHLEdBQUk7QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLElBRUEsTUFBYyxlQUFnQixJQUFZO0FBQ3hDLGNBQVEsS0FBSyxrQkFBa0IsRUFBRTtBQUVqQyxZQUFNLFFBQVEsSUFBSSxXQUFXO0FBQzdCLFlBQU0sTUFBTSxLQUFLO0FBRWpCLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFTyxrQkFBbUIsT0FBMEI7QUFDbEQsV0FBSyxTQUFTO0FBQUEsSUFDaEI7QUFBQSxFQUNGOzs7QUMvRU8sTUFBTSxrQkFBTixjQUE4QixhQUFhO0FBQUEsSUFDaEQsTUFBYSxPQUF1QjtBQUNsQyxZQUFNLFlBQVksU0FBUyxjQUFjLEtBQUs7QUFDOUMsZ0JBQVUsS0FBSztBQUNmLGdCQUFVLFlBQVk7QUFDdEIsZ0JBQVUsY0FBYztBQUV4QixXQUFLLFNBQVM7QUFFZCxnQkFBVSxpQkFBaUIsU0FBUyxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUM7QUFFekQsV0FBSyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7OztBQ1pPLE1BQU0sZUFBTixjQUEyQixhQUFhO0FBQUEsSUFDN0MsTUFBYSxPQUF1QjtBQUNsQyxZQUFNLFlBQVksU0FBUyxjQUFjLEtBQUs7QUFDOUMsZ0JBQVUsS0FBSztBQUNmLGdCQUFVLGNBQWM7QUFFeEIsWUFBTSxpQkFBaUIsU0FBUyxjQUFjLEtBQUs7QUFDbkQscUJBQWUsS0FBSztBQUVwQixZQUFNLGNBQWMsU0FBUyxjQUFjLEtBQUs7QUFDaEQsa0JBQVksS0FBSztBQUNqQixrQkFBWSxjQUFjO0FBRTFCLFlBQU0sZUFBZSxTQUFTLGNBQWMsS0FBSztBQUNqRCxtQkFBYSxLQUFLO0FBRWxCLFlBQU0sYUFBYSxTQUFTLGNBQWMsTUFBTTtBQUNoRCxpQkFBVyxjQUFjO0FBRXpCLFlBQU0sWUFBWSxTQUFTLGNBQWMsTUFBTTtBQUMvQyxnQkFBVSxZQUFZO0FBRXRCLG1CQUFhLFlBQVksVUFBVTtBQUNuQyxtQkFBYSxZQUFZLFNBQVM7QUFFbEMscUJBQWUsWUFBWSxXQUFXO0FBQ3RDLHFCQUFlLFlBQVksWUFBWTtBQUV2QyxtQkFBYSxpQkFBaUIsU0FBUyxZQUFZO0FBQ2pELGNBQU0sT0FBTyxNQUFNLElBQUksUUFBUTtBQUMvQixnQkFBUSxLQUFLLElBQUk7QUFBQSxNQUNuQixDQUFDO0FBRUQsV0FBSyxrQkFBa0IsQ0FBQyxXQUFXLGNBQWMsQ0FBQztBQUFBLElBQ3BEO0FBQUEsRUFDRjs7O0FDaENPLE1BQU0sU0FBTixjQUFxQixZQUFZO0FBQUEsSUFDOUI7QUFBQSxJQUVSLGNBQWU7QUFDYixZQUFNO0FBRU4sV0FBSyxTQUFTLElBQUksYUFBYSxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDcEQ7QUFBQSxJQUVPLFlBQWE7QUFDbEIsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLElBRUEsTUFBYSxPQUF1QjtBQUNsQyxZQUFNLEtBQUssTUFBTTtBQUtqQixZQUFNLFNBQVMsU0FBUyxjQUFjLEtBQUs7QUFDM0MsYUFBTyxLQUFLO0FBRVosVUFBSSxLQUFLLFVBQVU7QUFDakIsYUFBSyxTQUFTLE1BQU0sS0FBSyxtQkFBbUIsR0FBRyxNQUFNO0FBQUEsTUFDdkQsT0FBTztBQUNMLGFBQUssU0FBUyxNQUFNLEtBQUssc0JBQXNCLEdBQUcsTUFBTTtBQUFBLE1BQzFEO0FBRUEsV0FBSyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQztBQUFBLElBRUEsTUFBYyxxQkFBc0I7QUFDbEMsWUFBTSxTQUFTLElBQUksYUFBYSxLQUFLLE1BQU07QUFDM0MsWUFBTSxPQUFPLEtBQUs7QUFFbEIsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUVBLE1BQWMsd0JBQXlCO0FBQ3JDLFlBQU0sU0FBUyxJQUFJLGdCQUFnQixLQUFLLE1BQU07QUFDOUMsWUFBTSxPQUFPLEtBQUs7QUFFbEIsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUVRLFNBQWdCO0FBQ3RCLFVBQUksQ0FBQyxLQUFLLFNBQVM7QUFDakI7QUFBQSxNQUNGO0FBQUEsSUFJRjtBQUFBLEVBQ0Y7OztBQ3ZETyxNQUFNLE9BQU4sTUFBTSxjQUFhLFlBQVk7QUFBQSxJQUNwQyxPQUFlLGdCQUFnQixvQkFBSSxJQUFZO0FBQUEsSUFDdkM7QUFBQSxJQUVSLFlBQWEsUUFBZ0I7QUFDM0IsVUFBSSxNQUFLLGNBQWMsSUFBSSxNQUFNLEdBQUc7QUFDbEMsY0FBTSxJQUFJLE1BQU0sTUFBTSxNQUFNLG9CQUFvQjtBQUFBLE1BQ2xEO0FBRUEsWUFBTSxJQUFJLFlBQVksTUFBTSxDQUFDO0FBRTdCLFlBQUssY0FBYyxJQUFJLE1BQU07QUFFN0IsV0FBSyxTQUFTO0FBQUEsSUFDaEI7QUFBQSxJQUVBLE1BQWEsT0FBUTtBQUNuQixZQUFNLEtBQUssTUFBTTtBQUFBLElBQ25CO0FBQUEsSUFFTyxTQUFnQjtBQUNyQixZQUFLLGNBQWMsT0FBTyxLQUFLLE1BQU07QUFBQSxJQUN2QztBQUFBLEVBQ0Y7OztBbkJyQk8sTUFBTSxTQUFTLE9BQU8sT0FBZTtBQUMxQyxVQUFNLE9BQU8sSUFBSSxLQUFLLEVBQUU7QUFDeEIsVUFBTSxTQUFTLElBQUksT0FBTztBQUUxQixRQUFJLGFBQWE7QUFFakIsVUFBTSxRQUFRLElBQUksQ0FBQyxLQUFLLEtBQUssR0FBRyxPQUFPLEtBQUssQ0FBQyxDQUFDO0FBRTlDLFNBQUssU0FBUyxNQUFNO0FBRXBCLFdBQU87QUFBQSxNQUNMLFFBQVEsTUFBTTtBQUNaLGFBQUssY0FBYztBQUNuQixZQUFJLE9BQU87QUFDWCxhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsTUFDQSxRQUFRLE9BQU8sVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxRQUNILGVBQWUsTUFBTSxJQUFJLGNBQWM7QUFBQSxNQUN6QztBQUFBLElBQ0Y7QUFBQSxFQUNGOyIsCiAgIm5hbWVzIjogWyJjb25maWciLCAic3RvcmUiLCAiY29uZmlnIiwgInN0b3JlIiwgImNvbmZpZyJdCn0K
