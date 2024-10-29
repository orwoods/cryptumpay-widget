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

  // _pzns37j5l:/Volumes/Projects/cryptumpay/widget/src/style/styles.css
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

  // src/elements/button/config.ts
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

  // src/elements/element.ts
  var CPayElement = class {
    container;
    rootItem;
    parent;
    childs = [];
    constructor(container) {
      this.container = container;
    }
    async init() {
    }
    unload() {
    }
    cascadeUnload() {
      this.childs.forEach((child) => child.cascadeUnload());
      this.childs = [];
      this.unload();
      this.parent = void 0;
      this.container = void 0;
      this.rootItem = void 0;
    }
    setParent(parent) {
      this.parent = parent;
    }
    setContainer(container) {
      this.container = container;
    }
    registerRootItem(rootItem) {
      this.rootItem = rootItem;
    }
    getParent() {
      return this.parent;
    }
    getContainer() {
      return this.container;
    }
    getRootItem() {
      return this.rootItem;
    }
    addChild(child, container) {
      container = container || this.container;
      if (!container) {
        throw new Error("Container was not set");
      }
      const rootItem = child.getRootItem();
      if (!rootItem) {
        throw new Error("Root item was not set");
      }
      this.childs.push(child);
      child.setParent(this);
      dom.injectElement(container, rootItem);
    }
  };

  // src/elements/button/index.ts
  var Button = class extends CPayElement {
    config;
    constructor() {
      super();
      this.config = new ButtonConfig(() => this.update());
    }
    async init() {
      await this.create();
    }
    getConfig() {
      return this.config;
    }
    async create() {
      const widget = document.createElement("div");
      widget.id = "widget";
      const widgetPay = document.createElement("div");
      widgetPay.id = "widget_pay";
      widgetPay.className = "wide";
      widgetPay.textContent = "Pay with CryptumPay";
      widget.appendChild(widgetPay);
      this.registerRootItem(widget);
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
    }
    unload() {
      _Root.RegisteredIds.delete(this.id);
    }
  };

  // src/app.ts
  var create = async (id) => {
    const root = new Root(id);
    const button = new Button();
    dom.injectStyles();
    await Promise.all([root.init(), button.init()]);
    root.addChild(button);
    return {
      remove: () => {
        root.cascadeUnload();
        dom.unload();
        auth.unload();
      },
      config: button.getConfig()
    };
  };
  return __toCommonJS(app_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9hdXRoLnRzIiwgIl9wem5zMzdqNWw6L1ZvbHVtZXMvUHJvamVjdHMvY3J5cHR1bXBheS93aWRnZXQvc3JjL3N0eWxlL3N0eWxlcy5jc3MiLCAiLi4vc3JjL3N0eWxlL2luZGV4LnRzIiwgIi4uL3NyYy9zZXJ2aWNlcy9kb20udHMiLCAiLi4vc3JjL2N1cnJlbmNpZXMvdXRpbHMudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2J1dHRvbi9jb25maWcudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2VsZW1lbnQudHMiLCAiLi4vc3JjL2VsZW1lbnRzL2J1dHRvbi9pbmRleC50cyIsICIuLi9zcmMvZWxlbWVudHMvcm9vdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBkb20gfSBmcm9tICcuL3NlcnZpY2VzL2RvbSc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuL2VsZW1lbnRzL2J1dHRvbic7XG5pbXBvcnQgeyBSb290IH0gZnJvbSAnLi9lbGVtZW50cy9yb290JztcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IGFzeW5jIChpZDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHJvb3QgPSBuZXcgUm9vdChpZCk7XG4gIGNvbnN0IGJ1dHRvbiA9IG5ldyBCdXR0b24oKTtcblxuICBkb20uaW5qZWN0U3R5bGVzKCk7XG5cbiAgYXdhaXQgUHJvbWlzZS5hbGwoW3Jvb3QuaW5pdCgpLCBidXR0b24uaW5pdCgpXSk7XG5cbiAgcm9vdC5hZGRDaGlsZChidXR0b24pO1xuXG4gIHJldHVybiB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICByb290LmNhc2NhZGVVbmxvYWQoKTtcbiAgICAgIGRvbS51bmxvYWQoKTtcbiAgICAgIGF1dGgudW5sb2FkKCk7XG4gICAgfSxcbiAgICBjb25maWc6IGJ1dHRvbi5nZXRDb25maWcoKSxcbiAgfTtcbn07XG4iLCAiaW1wb3J0IHsgSUNvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xuXG5jbGFzcyBDb25maWcgaW1wbGVtZW50cyBJQ29uZmlnIHtcbiAgZ2V0QXBpQmFzZVVybCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly9hcGkuY3J5cHR1bXBheS5sb2NhbCc7XG4gIH1cblxuICBnZXRKd3RSZWZyZXNoSW50ZXJ2YWwgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDMwICogMTAwMDtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29uZmlnID0gbmV3IENvbmZpZygpO1xuIiwgImV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdG9yZVVuaXQge1xuICBwcm90ZWN0ZWQgbmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yIChuYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICB9XG5cbiAgcHJvdGVjdGVkIGtleSAoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLm5hbWV9OiR7a2V5fWA7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBTdG9yZVVuaXQgfSBmcm9tICcuLi9zdG9yZVVuaXQnO1xuaW1wb3J0IHsgSVN0b3JlVW5pdCB9IGZyb20gJy4uLy4uL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JhZ2VTdG9yZVVuaXQgZXh0ZW5kcyBTdG9yZVVuaXQgaW1wbGVtZW50cyBJU3RvcmVVbml0IHtcbiAgcHJpdmF0ZSBpdGVtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIHB1YmxpYyBzZXQgKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5pdGVtc1trZXldID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IChrZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLml0ZW1zW2tleV0gfHwgbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmUgKGtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgZGVsZXRlIHRoaXMuaXRlbXNba2V5XTtcbiAgfVxufVxuIiwgImltcG9ydCB7IE1lbW9yeVN0b3JhZ2VTdG9yZVVuaXQgfSBmcm9tICcuL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQnO1xuaW1wb3J0IHsgSVN0b3JlIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5jbGFzcyBTdG9yZSBpbXBsZW1lbnRzIElTdG9yZSB7XG4gIHByaXZhdGUgYXV0aDogTWVtb3J5U3RvcmFnZVN0b3JlVW5pdDtcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5hdXRoID0gbmV3IE1lbW9yeVN0b3JhZ2VTdG9yZVVuaXQoJ2F1dGgnKTtcbiAgfVxuXG4gIHNldEFjY2Vzc1Rva2VuIChhY2Nlc3NUb2tlbjogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5hdXRoLnNldCgnand0QWNjZXNzVG9rZW4nLCBhY2Nlc3NUb2tlbik7XG4gIH1cblxuICBnZXRBY2Nlc3NUb2tlbiAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuYXV0aC5nZXQoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cblxuICBmb3JnZXRTZW5zaXRpdmVEYXRhICgpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGgucmVtb3ZlKCdqd3RBY2Nlc3NUb2tlbicpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzdG9yZSA9IG5ldyBTdG9yZSgpO1xuIiwgImltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgeyBzdG9yZSB9IGZyb20gJy4uL3N0b3JlJztcbmltcG9ydCB7IElDb25maWcsIElTdG9yZSwgSUF1dGggfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIEF1dGggaW1wbGVtZW50cyBJQXV0aCB7XG4gIHByaXZhdGUgY29uZmlnOiBJQ29uZmlnO1xuICBwcml2YXRlIHN0b3JlOiBJU3RvcmU7XG5cbiAgcHJpdmF0ZSBsb2dnZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBvblJlYWR5OiAoKHZhbHVlOiB2b2lkKSA9PiB2b2lkKVtdO1xuICBwcml2YXRlIGF1dG9SZWZyZXNoVG9rZW4/OiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRJbnRlcnZhbD47XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yIChjb25maWc6IElDb25maWcsIHN0b3JlOiBJU3RvcmUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gICAgdGhpcy5vblJlYWR5ID0gW107XG4gIH1cblxuICBwdWJsaWMgZ2V0IGlzTG9nZ2VkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5sb2dnZWQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGlzUmVhZHkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmluaXRpYWxpemVkO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlYWR5ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5vblJlYWR5LnB1c2gocmVzb2x2ZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXphdGlvbikge1xuICAgICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gdHJ1ZTtcblxuICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBwdWJsaWMgdW5sb2FkICgpIHtcbiAgICB0aGlzLmxvZ2dlZCA9IGZhbHNlO1xuICAgIHRoaXMuaXNJbml0aWFsaXphdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuc3RvcmUuZm9yZ2V0U2Vuc2l0aXZlRGF0YSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hUb2tlbigpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IHJlc29sdmUgb2YgdGhpcy5vblJlYWR5KSB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlZnJlc2hUb2tlbiAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5jb25maWcuZ2V0QXBpQmFzZVVybCgpfS91c2VyL3JlZnJlc2gtdG9rZW5gO1xuXG4gICAgaWYgKHRoaXMuYXV0b1JlZnJlc2hUb2tlbikge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmF1dG9SZWZyZXNoVG9rZW4pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgZmV0Y2godXJsLCB7IG1ldGhvZDogJ1BPU1QnLCBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcblxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmF1dGhvcml6ZWQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgIGlmICghZGF0YS5hY2Nlc3NUb2tlbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHJlc3BvbnNlJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5sb2dnZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuc3RvcmUuc2V0QWNjZXNzVG9rZW4oZGF0YS5hY2Nlc3NUb2tlbik7XG5cbiAgICAgICAgICB0aGlzLmF1dG9SZWZyZXNoVG9rZW4gPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnJlZnJlc2hUb2tlbigpLCB0aGlzLmNvbmZpZy5nZXRKd3RSZWZyZXNoSW50ZXJ2YWwoKSk7XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAoZXJyb3IubWVzc2FnZSAhPT0gJ1VuYXV0aG9yaXplZCcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBsb2dvdXQgKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHVybCA9IGAke3RoaXMuY29uZmlnLmdldEFwaUJhc2VVcmwoKX0vdXNlci9sb2dvdXRgO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmZXRjaCh1cmwsIHsgbWV0aG9kOiAnUE9TVCcsIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgIHRoaXMubG9nZ2VkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5zdG9yZS5mb3JnZXRTZW5zaXRpdmVEYXRhKCk7XG5cbiAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcblxuICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgYXV0aCA9IG5ldyBBdXRoKGNvbmZpZywgc3RvcmUpO1xuIiwgIiN3aWRnZXR7d2lkdGg6MzAwcHg7bWFyZ2luOjIwcHg7Ym9yZGVyOjFweCBzb2xpZCAjYWVhZWFlO2JvcmRlci1yYWRpdXM6NnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Ym94LXNpemluZzpib3JkZXItYm94O2FsaWduLWl0ZW1zOnN0cmV0Y2h9I3dpZGdldF9wYXl7ZmxleC1ncm93OjE7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2ZvbnQtc2l6ZToxNXB4O2ZvbnQtZmFtaWx5OlZlcmRhbmEsR2VuZXZhLFRhaG9tYSxzYW5zLXNlcmlmO2JhY2tncm91bmQ6IzYxYzNmZjtjb2xvcjojZmZmO2N1cnNvcjpwb2ludGVyfSN3aWRnZXRfcGF5LndpZGV7cGFkZGluZzoxNXB4IDB9I3dpZGdldF9wYXk6aG92ZXJ7YmFja2dyb3VuZDojMzhiM2ZmfSN3aWRnZXRfc2V0dGluZ3N7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt0ZXh0LWFsaWduOmNlbnRlcjttYXgtd2lkdGg6NTAlO2JhY2tncm91bmQ6I2FkZTBmZjtjb2xvcjojNmY2ZjZmO3RleHQtYWxpZ246cmlnaHR9I3dpZGdldF93YWxsZXR7Y3Vyc29yOnBvaW50ZXI7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldDpob3ZlcntiYWNrZ3JvdW5kOiM5OGQ3ZmZ9I3dpZGdldF9zZXR0aW5ncz5kaXZ7cGFkZGluZzozcHggMjBweH0iLCAiLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHN0eWxlcyBmcm9tICdzYXNzOi4vc3R5bGVzLmNzcyc7XG5cbmV4cG9ydCBjb25zdCBnZXRTdHlsZXMgPSAoKTogc3RyaW5nID0+IHN0eWxlcztcbiIsICJpbXBvcnQgeyBnZXRTdHlsZXMgfSBmcm9tICcuLi9zdHlsZSc7XG5cbmNsYXNzIERvbSB7XG4gIHByaXZhdGUgaW5qZWN0ZWRUYWdzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgcHVibGljIGluamVjdEVsZW1lbnQgKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXG4gICAgdGhpcy5pbmplY3RlZFRhZ3MucHVzaChlbGVtZW50KTtcbiAgfVxuXG4gIHB1YmxpYyBpbmplY3RTdHlsZXMgKCk6IHZvaWQge1xuICAgIGNvbnN0IHRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgdGFnLnRleHRDb250ZW50ID0gZ2V0U3R5bGVzKCk7XG5cbiAgICB0aGlzLmluamVjdEVsZW1lbnQoZG9jdW1lbnQuaGVhZCwgdGFnKTtcbiAgfVxuXG4gIHB1YmxpYyBmaW5kRWxlbWVudCAoZWxlbWVudElkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbiAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBlbGVtZW50ICR7ZWxlbWVudElkfS5gKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmxvYWQgKCkge1xuICAgIGZvciAoY29uc3QgdGFnIG9mIHRoaXMuaW5qZWN0ZWRUYWdzLnJldmVyc2UoKSkge1xuICAgICAgaWYgKHRhZykge1xuICAgICAgICB0YWcucmVtb3ZlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5pbmplY3RlZFRhZ3MgPSBbXTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZG9tID0gbmV3IERvbSgpO1xuIiwgImV4cG9ydCBjb25zdCBnZXRDdXJyZW5jeUhhc2ggPSAoeyBpZCwgbmV0d29yaywgdGlja2VyLCBjaGFpbiwgY29udHJhY3QgfToge1xuICBpZDogc3RyaW5nO1xuICBuZXR3b3JrOiBzdHJpbmc7XG4gIHRpY2tlcjogc3RyaW5nO1xuICBjaGFpbjogc3RyaW5nO1xuICBjb250cmFjdDogc3RyaW5nO1xufSk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IGFyciA9IFtpZCwgbmV0d29yaywgdGlja2VyLCBjaGFpbiwgY29udHJhY3RdO1xuICBpZiAoIWFyci5ldmVyeSgocGFydCkgPT4gcGFydC5sZW5ndGggPiAwKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignTWFsZm9ybWVkIGN1cnJlbmN5Jyk7XG4gIH1cblxuICBjb25zdCBzdHIgPSBhcnIuam9pbignOicpO1xuICBjb25zdCBoYXNoID0gQnVmZmVyLmZyb20oc3RyKS50b1N0cmluZygnaGV4Jykuc3Vic3RyaW5nKDAsIDQwIC0gMSAtIHN0ci5sZW5ndGgpO1xuXG4gIHJldHVybiBoYXNoO1xufTtcblxuZXhwb3J0IGNvbnN0IGNoZWNrQ3VycmVuY3kgPSAoY3VycmVuY3k6IHN0cmluZykgPT4ge1xuICBpZiAoIWN1cnJlbmN5IHx8IHR5cGVvZiBjdXJyZW5jeSAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3VycmVuY3knKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnRzID0gY3VycmVuY3kuc3BsaXQoJzonKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNiB8fCBjdXJyZW5jeS5sZW5ndGggIT09IDQwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBmb3JtYXQgb2YgdGhlIGN1cnJlbmN5Jyk7XG4gIH1cblxuICBjb25zdCBbaWQsIG5ldHdvcmssIHRpY2tlciwgY2hhaW4sIGNvbnRyYWN0LCBoYXNoXSA9IHBhcnRzO1xuXG4gIGNvbnN0IGN1cnJlbmN5SGFzaCA9IGdldEN1cnJlbmN5SGFzaCh7IGlkLCBuZXR3b3JrLCB0aWNrZXIsIGNoYWluLCBjb250cmFjdCB9KTtcblxuICBpZiAoY3VycmVuY3lIYXNoICE9PSBoYXNoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBjdXJyZW5jeSBoYXNoJyk7XG4gIH1cbn07XG4iLCAiaW1wb3J0IHsgY2hlY2tDdXJyZW5jeSB9IGZyb20gJy4uLy4uL2N1cnJlbmNpZXMvdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uQ29uZmlnIHtcbiAgI2NhbGxiYWNrOiAoKSA9PiB2b2lkO1xuXG4gICNvcmRlcklkPzogc3RyaW5nO1xuICAjY3VzdG9tZXJJZD86IHN0cmluZztcbiAgI21lcmNoYW50SWQ/OiBzdHJpbmc7XG4gICNhbW91bnQ/OiBudW1iZXI7XG4gICNjYW5FZGl0QW1vdW50PzogYm9vbGVhbjtcbiAgI2N1cnJlbmN5Pzogc3RyaW5nO1xuICAjZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy4jY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgfVxuXG4gIHB1YmxpYyBzZXRPcmRlcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI29yZGVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jb3JkZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRDdXN0b21lcklkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI2N1c3RvbWVySWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jY3VzdG9tZXJJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRNZXJjaGFudElkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuI21lcmNoYW50SWQgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4jbWVyY2hhbnRJZCA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRQcmljZSAoYW1vdW50OiBudW1iZXIsIGN1cnJlbmN5OiBzdHJpbmcsIGNhbkVkaXRBbW91bnQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy4jYW1vdW50ID09PSBhbW91bnQgJiYgdGhpcy4jY3VycmVuY3kgPT09IGN1cnJlbmN5ICYmIHRoaXMuI2NhbkVkaXRBbW91bnQgPT09IGNhbkVkaXRBbW91bnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaGVja0N1cnJlbmN5KGN1cnJlbmN5KTtcblxuICAgIHRoaXMuI2Ftb3VudCA9IGFtb3VudDtcbiAgICB0aGlzLiNjdXJyZW5jeSA9IGN1cnJlbmN5O1xuICAgIHRoaXMuI2NhbkVkaXRBbW91bnQgPSBjYW5FZGl0QW1vdW50O1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXREZXNjcmlwdGlvbiAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNkZXNjcmlwdGlvbiA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLiNkZXNjcmlwdGlvbiA9IHZhbHVlO1xuXG4gICAgdGhpcy4jY2FsbGJhY2soKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRTZXR0aW5ncyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9yZGVySWQ6IHRoaXMuI29yZGVySWQsXG4gICAgICBjdXN0b21lcklkOiB0aGlzLiNjdXN0b21lcklkLFxuICAgICAgbWVyY2hhbnRJZDogdGhpcy4jbWVyY2hhbnRJZCxcbiAgICAgIGFtb3VudDogdGhpcy4jYW1vdW50LFxuICAgICAgY2FuRWRpdEFtb3VudDogdGhpcy4jY2FuRWRpdEFtb3VudCxcbiAgICAgIGN1cnJlbmN5OiB0aGlzLiNjdXJyZW5jeSxcbiAgICAgIGRlc2NyaXB0aW9uOiB0aGlzLiNkZXNjcmlwdGlvbixcbiAgICB9O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgZG9tIH0gZnJvbSAnLi4vc2VydmljZXMvZG9tJztcblxuZXhwb3J0IGNsYXNzIENQYXlFbGVtZW50IHtcbiAgcHJvdGVjdGVkIGNvbnRhaW5lcj86IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgcm9vdEl0ZW0/OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIHBhcmVudD86IENQYXlFbGVtZW50O1xuICBwcml2YXRlIGNoaWxkczogQ1BheUVsZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yIChjb250YWluZXI/OiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCkge1xuICB9XG5cbiAgcHVibGljIHVubG9hZCAoKSB7XG4gIH1cblxuICBwdWJsaWMgY2FzY2FkZVVubG9hZCAoKSB7XG4gICAgdGhpcy5jaGlsZHMuZm9yRWFjaCgoY2hpbGQpID0+IGNoaWxkLmNhc2NhZGVVbmxvYWQoKSk7XG4gICAgdGhpcy5jaGlsZHMgPSBbXTtcblxuICAgIHRoaXMudW5sb2FkKCk7XG5cbiAgICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJvb3RJdGVtID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHVibGljIHNldFBhcmVudCAocGFyZW50OiBDUGF5RWxlbWVudCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldENvbnRhaW5lciAoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlZ2lzdGVyUm9vdEl0ZW0gKHJvb3RJdGVtOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMucm9vdEl0ZW0gPSByb290SXRlbTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRQYXJlbnQgKCk6IENQYXlFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q29udGFpbmVyICgpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyO1xuICB9XG5cbiAgcHVibGljIGdldFJvb3RJdGVtICgpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucm9vdEl0ZW07XG4gIH1cblxuICBwdWJsaWMgYWRkQ2hpbGQgKGNoaWxkOiBDUGF5RWxlbWVudCwgY29udGFpbmVyPzogSFRNTEVsZW1lbnQpIHtcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgdGhpcy5jb250YWluZXI7XG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ29udGFpbmVyIHdhcyBub3Qgc2V0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdEl0ZW0gPSBjaGlsZC5nZXRSb290SXRlbSgpO1xuICAgIGlmICghcm9vdEl0ZW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBpdGVtIHdhcyBub3Qgc2V0Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5jaGlsZHMucHVzaChjaGlsZCk7XG4gICAgY2hpbGQuc2V0UGFyZW50KHRoaXMpO1xuXG4gICAgZG9tLmluamVjdEVsZW1lbnQoY29udGFpbmVyLCByb290SXRlbSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBhdXRoIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXV0aCc7XG5pbXBvcnQgeyBCdXR0b25Db25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4uL2VsZW1lbnQnO1xuXG5leHBvcnQgY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwcml2YXRlIGNvbmZpZzogQnV0dG9uQ29uZmlnO1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb25maWcgPSBuZXcgQnV0dG9uQ29uZmlnKCgpID0+IHRoaXMudXBkYXRlKCkpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGluaXQgKCkge1xuICAgIGF3YWl0IHRoaXMuY3JlYXRlKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q29uZmlnICgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWc7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gVE9ETzogXHUwNDNFXHUwNDQ0XHUwNDNFXHUwNDQwXHUwNDNDXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMiBcdTA0MzdcdTA0MzBcdTA0MzJcdTA0MzhcdTA0NDFcdTA0MzhcdTA0M0NcdTA0M0VcdTA0NDFcdTA0NDJcdTA0MzggXHUwNDNFXHUwNDQyIFx1MDQzRlx1MDQzNVx1MDQ0MFx1MDQzMlx1MDQzOFx1MDQ0N1x1MDQzRFx1MDQ0Qlx1MDQ0NSBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzVcdTA0M0FcbiAgICAvLyBjb25zb2xlLndhcm4oJ3VwZGF0ZScsIHRoaXMuY29uZmlnLmdldFNldHRpbmdzKCkpO1xuXG4gICAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgICBjb25zdCB3aWRnZXRQYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRQYXkuaWQgPSAnd2lkZ2V0X3BheSc7XG4gICAgd2lkZ2V0UGF5LmNsYXNzTmFtZSA9ICd3aWRlJztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5IHdpdGggQ3J5cHR1bVBheSc7XG5cbiAgICB3aWRnZXQuYXBwZW5kQ2hpbGQod2lkZ2V0UGF5KTtcblxuICAgIHRoaXMucmVnaXN0ZXJSb290SXRlbSh3aWRnZXQpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGUgKCk6IHZvaWQge1xuICAgIGlmICghYXV0aC5pc1JlYWR5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVE9ETzogXHUwNDNFXHUwNDMxXHUwNDNEXHUwNDNFXHUwNDMyXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMlx1MDQzRFx1MDQzNVx1MDQ0OFx1MDQzQVx1MDQ0MyBcdTA0MzVcdTA0NDFcdTA0M0JcdTA0MzggXHUwNDM4XHUwNDM3XHUwNDNDXHUwNDM1XHUwNDNEXHUwNDM4XHUwNDNCXHUwNDM4IFx1MDQzRFx1MDQzMFx1MDQ0MVx1MDQ0Mlx1MDQ0MFx1MDQzRVx1MDQzOVx1MDQzQVx1MDQzOCBcdTA0MzIgXHUwNDQwXHUwNDM1XHUwNDMwXHUwNDNCXHUwNDQyXHUwNDMwXHUwNDM5XHUwNDNDXHUwNDM1XG4gICAgLy8gY29uc29sZS53YXJuKCd1cGRhdGUnLCB0aGlzLmNvbmZpZy5nZXRTZXR0aW5ncygpKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGF1dGggfSBmcm9tICcuLi9zZXJ2aWNlcy9hdXRoJztcbmltcG9ydCB7IGRvbSB9IGZyb20gJy4uL3NlcnZpY2VzL2RvbSc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4vZWxlbWVudCc7XG5cbmV4cG9ydCBjbGFzcyBSb290IGV4dGVuZHMgQ1BheUVsZW1lbnQge1xuICBwcml2YXRlIHN0YXRpYyBSZWdpc3RlcmVkSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHByaXZhdGUgaWQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvciAoaWQ6IHN0cmluZykge1xuICAgIGlmIChSb290LlJlZ2lzdGVyZWRJZHMuaGFzKGlkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJZCAke2lkfSBpcyBhbHJlYWR5IGluIHVzZWApO1xuICAgIH1cblxuICAgIHN1cGVyKGRvbS5maW5kRWxlbWVudChpZCkpO1xuXG4gICAgUm9vdC5SZWdpc3RlcmVkSWRzLmFkZChpZCk7XG5cbiAgICB0aGlzLmlkID0gaWQ7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaW5pdCAoKSB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuICB9XG5cbiAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgUm9vdC5SZWdpc3RlcmVkSWRzLmRlbGV0ZSh0aGlzLmlkKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0VBLE1BQU0sU0FBTixNQUFnQztBQUFBLElBQzlCLGdCQUF5QjtBQUN2QixhQUFPO0FBQUEsSUFDVDtBQUFBLElBRUEsd0JBQWlDO0FBQy9CLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBRU8sTUFBTSxTQUFTLElBQUksT0FBTzs7O0FDWjFCLE1BQWUsWUFBZixNQUF5QjtBQUFBLElBQ3BCO0FBQUEsSUFFVixZQUFhLE1BQWM7QUFDekIsV0FBSyxPQUFPO0FBQUEsSUFDZDtBQUFBLElBRVUsSUFBSyxLQUFxQjtBQUNsQyxhQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRztBQUFBLElBQzVCO0FBQUEsRUFDRjs7O0FDUE8sTUFBTSx5QkFBTixjQUFxQyxVQUFnQztBQUFBLElBQ2xFLFFBQWdDLENBQUM7QUFBQSxJQUVsQyxJQUFLLEtBQWEsT0FBcUI7QUFDNUMsV0FBSyxNQUFNLEdBQUcsSUFBSTtBQUFBLElBQ3BCO0FBQUEsSUFFTyxJQUFLLEtBQTRCO0FBQ3RDLGFBQU8sS0FBSyxNQUFNLEdBQUcsS0FBSztBQUFBLElBQzVCO0FBQUEsSUFFTyxPQUFRLEtBQW1C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O0FDakVPLE1BQU0sU0FBTixjQUFxQixZQUFZO0FBQUEsSUFDOUI7QUFBQSxJQUVSLGNBQWU7QUFDYixZQUFNO0FBRU4sV0FBSyxTQUFTLElBQUksYUFBYSxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDcEQ7QUFBQSxJQUVBLE1BQWEsT0FBUTtBQUNuQixZQUFNLEtBQUssT0FBTztBQUFBLElBQ3BCO0FBQUEsSUFFTyxZQUFhO0FBQ2xCLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUVBLE1BQWMsU0FBeUI7QUFJckMsWUFBTSxTQUFTLFNBQVMsY0FBYyxLQUFLO0FBQzNDLGFBQU8sS0FBSztBQUVaLFlBQU0sWUFBWSxTQUFTLGNBQWMsS0FBSztBQUM5QyxnQkFBVSxLQUFLO0FBQ2YsZ0JBQVUsWUFBWTtBQUN0QixnQkFBVSxjQUFjO0FBRXhCLGFBQU8sWUFBWSxTQUFTO0FBRTVCLFdBQUssaUJBQWlCLE1BQU07QUFBQSxJQUM5QjtBQUFBLElBRVEsU0FBZ0I7QUFDdEIsVUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUlGO0FBQUEsRUFDRjs7O0FDMUNPLE1BQU0sT0FBTixNQUFNLGNBQWEsWUFBWTtBQUFBLElBQ3BDLE9BQWUsZ0JBQWdCLG9CQUFJLElBQVk7QUFBQSxJQUN2QztBQUFBLElBRVIsWUFBYSxJQUFZO0FBQ3ZCLFVBQUksTUFBSyxjQUFjLElBQUksRUFBRSxHQUFHO0FBQzlCLGNBQU0sSUFBSSxNQUFNLE1BQU0sRUFBRSxvQkFBb0I7QUFBQSxNQUM5QztBQUVBLFlBQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUV6QixZQUFLLGNBQWMsSUFBSSxFQUFFO0FBRXpCLFdBQUssS0FBSztBQUFBLElBQ1o7QUFBQSxJQUVBLE1BQWEsT0FBUTtBQUNuQixZQUFNLEtBQUssTUFBTTtBQUFBLElBQ25CO0FBQUEsSUFFTyxTQUFnQjtBQUNyQixZQUFLLGNBQWMsT0FBTyxLQUFLLEVBQUU7QUFBQSxJQUNuQztBQUFBLEVBQ0Y7OztBYnRCTyxNQUFNLFNBQVMsT0FBTyxPQUFlO0FBQzFDLFVBQU0sT0FBTyxJQUFJLEtBQUssRUFBRTtBQUN4QixVQUFNLFNBQVMsSUFBSSxPQUFPO0FBRTFCLFFBQUksYUFBYTtBQUVqQixVQUFNLFFBQVEsSUFBSSxDQUFDLEtBQUssS0FBSyxHQUFHLE9BQU8sS0FBSyxDQUFDLENBQUM7QUFFOUMsU0FBSyxTQUFTLE1BQU07QUFFcEIsV0FBTztBQUFBLE1BQ0wsUUFBUSxNQUFNO0FBQ1osYUFBSyxjQUFjO0FBQ25CLFlBQUksT0FBTztBQUNYLGFBQUssT0FBTztBQUFBLE1BQ2Q7QUFBQSxNQUNBLFFBQVEsT0FBTyxVQUFVO0FBQUEsSUFDM0I7QUFBQSxFQUNGOyIsCiAgIm5hbWVzIjogWyJjb25maWciLCAic3RvcmUiXQp9Cg==
