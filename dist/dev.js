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
    isReady = false;
    onReady;
    constructor(config2, store2) {
      this.config = config2;
      this.store = store2;
      this.onReady = [];
    }
    get isLogged() {
      return this.logged;
    }
    async ready() {
      if (this.isReady) {
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
    setReady() {
      this.isReady = true;
      this.isInitialization = false;
      for (const resolve of this.onReady) {
        resolve();
      }
    }
    async init() {
      await this.refreshToken();
      await this.setReady();
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
    async create(elementId) {
      await auth.ready();
      this.createNew(this.findElement(elementId));
    }
    createNew(container) {
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

  // _2mfbfhtxy:/Volumes/Projects/cryptumpay/widget/src/styles.css
  var styles_default = "#widget{width:300px;margin:20px;border:1px solid #aeaeae;border-radius:6px;display:flex;align-items:center;box-sizing:border-box;align-items:stretch}#widget_pay{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-family:Verdana,Geneva,Tahoma,sans-serif;background:#61c3ff;color:#fff;cursor:pointer}#widget_pay.wide{padding:15px 0}#widget_pay:hover{background:#38b3ff}#widget_settings{display:flex;flex-direction:column;text-align:center;max-width:50%;background:#ade0ff;color:#6f6f6f;text-align:right}#widget_wallet{cursor:pointer;text-align:right}#widget_wallet:hover{background:#98d7ff}#widget_settings>div{padding:3px 20px}";

  // src/style.ts
  var addStyles = () => {
    const style = document.createElement("style");
    style.textContent = styles_default;
    document.head.appendChild(style);
  };

  // src/app.ts
  addStyles();
  var button = async (id) => {
    const button2 = new Button();
    await button2.create(id);
  };
  return __toCommonJS(app_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zdG9yZS9zdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL3N0b3JhZ2VzL21lbW9yeVN0b3JhZ2VTdG9yZVVuaXQudHMiLCAiLi4vc3JjL3N0b3JlL2luZGV4LnRzIiwgIi4uL3NyYy9hdXRoLnRzIiwgIi4uL3NyYy9lbGVtZW50LnRzIiwgIi4uL3NyYy9idXR0b24udHMiLCAiXzJtZmJmaHR4eTovVm9sdW1lcy9Qcm9qZWN0cy9jcnlwdHVtcGF5L3dpZGdldC9zcmMvc3R5bGVzLmNzcyIsICIuLi9zcmMvc3R5bGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4vYnV0dG9uJztcbmltcG9ydCB7IGFkZFN0eWxlcyB9IGZyb20gJy4vc3R5bGUnO1xuXG5hZGRTdHlsZXMoKTtcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbiA9IGFzeW5jIChpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIGNvbnN0IGJ1dHRvbiA9IG5ldyBCdXR0b24oKTtcbiAgYXdhaXQgYnV0dG9uLmNyZWF0ZShpZCk7XG59O1xuIiwgImltcG9ydCB7IElDb25maWcgfSBmcm9tICcuL3R5cGVzJztcblxuY2xhc3MgQ29uZmlnIGltcGxlbWVudHMgSUNvbmZpZyB7XG4gIGdldEFwaUJhc2VVcmwgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdodHRwOi8vYXBpLmNyeXB0dW1wYXkubG9jYWwnO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBuZXcgQ29uZmlnKCk7XG4iLCAiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JlVW5pdCB7XG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQga2V5IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX06JHtrZXl9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlVW5pdCB9IGZyb20gJy4uL3N0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmVVbml0IH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCBleHRlbmRzIFN0b3JlVW5pdCBpbXBsZW1lbnRzIElTdG9yZVVuaXQge1xuICBwcml2YXRlIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgcHVibGljIHNldCAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNba2V5XSB8fCBudWxsO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZSAoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5pdGVtc1trZXldO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCB9IGZyb20gJy4vc3RvcmFnZXMvbWVtb3J5U3RvcmFnZVN0b3JlVW5pdCc7XG5pbXBvcnQgeyBJU3RvcmUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNsYXNzIFN0b3JlIGltcGxlbWVudHMgSVN0b3JlIHtcbiAgcHJpdmF0ZSBhdXRoOiBNZW1vcnlTdG9yYWdlU3RvcmVVbml0O1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgTWVtb3J5U3RvcmFnZVN0b3JlVW5pdCgnYXV0aCcpO1xuICB9XG5cbiAgc2V0QWNjZXNzVG9rZW4gKGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGguc2V0KCdqd3RBY2Nlc3NUb2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgfVxuXG4gIGdldEFjY2Vzc1Rva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmdldCgnand0QWNjZXNzVG9rZW4nKTtcbiAgfVxuXG4gIGZvcmdldFNlbnNpdGl2ZURhdGEgKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0aC5yZW1vdmUoJ2p3dEFjY2Vzc1Rva2VuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG4iLCAiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgc3RvcmUgfSBmcm9tICcuL3N0b3JlJztcbmltcG9ydCB7IElDb25maWcsIElTdG9yZSwgSUF1dGggfSBmcm9tICcuL3R5cGVzJztcblxuY2xhc3MgQXV0aCBpbXBsZW1lbnRzIElBdXRoIHtcbiAgcHJpdmF0ZSBjb25maWc6IElDb25maWc7XG4gIHByaXZhdGUgc3RvcmU6IElTdG9yZTtcblxuICBwcml2YXRlIGxvZ2dlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6YXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1JlYWR5ID0gZmFsc2U7XG4gIHByaXZhdGUgb25SZWFkeTogKCh2YWx1ZTogdm9pZCkgPT4gdm9pZClbXTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IgKGNvbmZpZzogSUNvbmZpZywgc3RvcmU6IElTdG9yZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLm9uUmVhZHkgPSBbXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaXNMb2dnZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxvZ2dlZDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZWFkeSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuaXNSZWFkeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5vblJlYWR5LnB1c2gocmVzb2x2ZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXphdGlvbikge1xuICAgICAgdGhpcy5pc0luaXRpYWxpemF0aW9uID0gdHJ1ZTtcblxuICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBwcml2YXRlIHNldFJlYWR5ICgpIHtcbiAgICB0aGlzLmlzUmVhZHkgPSB0cnVlO1xuICAgIHRoaXMuaXNJbml0aWFsaXphdGlvbiA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCByZXNvbHZlIG9mIHRoaXMub25SZWFkeSkge1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5pdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoVG9rZW4oKTtcblxuICAgIGF3YWl0IHRoaXMuc2V0UmVhZHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaFRva2VuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmNvbmZpZy5nZXRBcGlCYXNlVXJsKCl9L3VzZXIvcmVmcmVzaC10b2tlbmA7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKCFkYXRhLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zdG9yZS5zZXRBY2Nlc3NUb2tlbihkYXRhLmFjY2Vzc1Rva2VuKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxvZ291dCAoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5jb25maWcuZ2V0QXBpQmFzZVVybCgpfS91c2VyL2xvZ291dGA7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN0b3JlLmZvcmdldFNlbnNpdGl2ZURhdGEoKTtcblxuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuXG4gICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdXRoID0gbmV3IEF1dGgoY29uZmlnLCBzdG9yZSk7XG4iLCAiZXhwb3J0IGNsYXNzIENQYXlFbGVtZW50IHtcbiAgcHVibGljIGZpbmRFbGVtZW50IChlbGVtZW50SWQ6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGVsZW1lbnQgJHtlbGVtZW50SWR9LmApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4vYXV0aCc7XG5pbXBvcnQgeyBDUGF5RWxlbWVudCB9IGZyb20gJy4vZWxlbWVudCc7XG5cbmV4cG9ydCBjbGFzcyBCdXR0b24gZXh0ZW5kcyBDUGF5RWxlbWVudCB7XG4gIHB1YmxpYyBhc3luYyBjcmVhdGUgKGVsZW1lbnRJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgYXV0aC5yZWFkeSgpO1xuXG4gICAgdGhpcy5jcmVhdGVOZXcodGhpcy5maW5kRWxlbWVudChlbGVtZW50SWQpKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlTmV3IChjb250YWluZXI6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgICBjb25zdCB3aWRnZXRQYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB3aWRnZXRQYXkuaWQgPSAnd2lkZ2V0X3BheSc7XG4gICAgd2lkZ2V0UGF5LmNsYXNzTmFtZSA9ICd3aWRlJztcbiAgICB3aWRnZXRQYXkudGV4dENvbnRlbnQgPSAnUGF5IHdpdGggQ3J5cHR1bVBheSc7XG5cbiAgICB3aWRnZXQuYXBwZW5kQ2hpbGQod2lkZ2V0UGF5KTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQod2lkZ2V0KTtcbiAgfVxufVxuIiwgIiN3aWRnZXR7d2lkdGg6MzAwcHg7bWFyZ2luOjIwcHg7Ym9yZGVyOjFweCBzb2xpZCAjYWVhZWFlO2JvcmRlci1yYWRpdXM6NnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Ym94LXNpemluZzpib3JkZXItYm94O2FsaWduLWl0ZW1zOnN0cmV0Y2h9I3dpZGdldF9wYXl7ZmxleC1ncm93OjE7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2ZvbnQtc2l6ZToxNXB4O2ZvbnQtZmFtaWx5OlZlcmRhbmEsR2VuZXZhLFRhaG9tYSxzYW5zLXNlcmlmO2JhY2tncm91bmQ6IzYxYzNmZjtjb2xvcjojZmZmO2N1cnNvcjpwb2ludGVyfSN3aWRnZXRfcGF5LndpZGV7cGFkZGluZzoxNXB4IDB9I3dpZGdldF9wYXk6aG92ZXJ7YmFja2dyb3VuZDojMzhiM2ZmfSN3aWRnZXRfc2V0dGluZ3N7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt0ZXh0LWFsaWduOmNlbnRlcjttYXgtd2lkdGg6NTAlO2JhY2tncm91bmQ6I2FkZTBmZjtjb2xvcjojNmY2ZjZmO3RleHQtYWxpZ246cmlnaHR9I3dpZGdldF93YWxsZXR7Y3Vyc29yOnBvaW50ZXI7dGV4dC1hbGlnbjpyaWdodH0jd2lkZ2V0X3dhbGxldDpob3ZlcntiYWNrZ3JvdW5kOiM5OGQ3ZmZ9I3dpZGdldF9zZXR0aW5ncz5kaXZ7cGFkZGluZzozcHggMjBweH0iLCAiLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHN0eWxlcyBmcm9tICdzYXNzOi4vc3R5bGVzLmNzcyc7XG5cbmV4cG9ydCBjb25zdCBhZGRTdHlsZXMgPSAoKTogdm9pZCA9PiB7XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBzdHlsZXM7XG5cbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0VBLE1BQU0sU0FBTixNQUFnQztBQUFBLElBQzlCLGdCQUF5QjtBQUN2QixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFTyxNQUFNLFNBQVMsSUFBSSxPQUFPOzs7QUNSMUIsTUFBZSxZQUFmLE1BQXlCO0FBQUEsSUFDcEI7QUFBQSxJQUVWLFlBQWEsTUFBYztBQUN6QixXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUEsSUFFVSxJQUFLLEtBQXFCO0FBQ2xDLGFBQU8sR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHO0FBQUEsSUFDNUI7QUFBQSxFQUNGOzs7QUNQTyxNQUFNLHlCQUFOLGNBQXFDLFVBQWdDO0FBQUEsSUFDbEUsUUFBZ0MsQ0FBQztBQUFBLElBRWxDLElBQUssS0FBYSxPQUFxQjtBQUM1QyxXQUFLLE1BQU0sR0FBRyxJQUFJO0FBQUEsSUFDcEI7QUFBQSxJQUVPLElBQUssS0FBNEI7QUFDdEMsYUFBTyxLQUFLLE1BQU0sR0FBRyxLQUFLO0FBQUEsSUFDNUI7QUFBQSxJQUVPLE9BQVEsS0FBbUI7QUFDaEMsYUFBTyxLQUFLLE1BQU0sR0FBRztBQUFBLElBQ3ZCO0FBQUEsRUFDRjs7O0FDZEEsTUFBTSxRQUFOLE1BQThCO0FBQUEsSUFDcEI7QUFBQSxJQUVSLGNBQWU7QUFDYixXQUFLLE9BQU8sSUFBSSx1QkFBdUIsTUFBTTtBQUFBLElBQy9DO0FBQUEsSUFFQSxlQUFnQixhQUEyQjtBQUN6QyxXQUFLLEtBQUssSUFBSSxrQkFBa0IsV0FBVztBQUFBLElBQzdDO0FBQUEsSUFFQSxpQkFBaUM7QUFDL0IsYUFBTyxLQUFLLEtBQUssSUFBSSxnQkFBZ0I7QUFBQSxJQUN2QztBQUFBLElBRUEsc0JBQTZCO0FBQzNCLFdBQUssS0FBSyxPQUFPLGdCQUFnQjtBQUFBLElBQ25DO0FBQUEsRUFDRjtBQUVPLE1BQU0sUUFBUSxJQUFJLE1BQU07OztBQ25CL0IsTUFBTSxPQUFOLE1BQTRCO0FBQUEsSUFDbEI7QUFBQSxJQUNBO0FBQUEsSUFFQSxTQUFTO0FBQUEsSUFDVCxtQkFBbUI7QUFBQSxJQUNuQixVQUFVO0FBQUEsSUFDVjtBQUFBLElBRUQsWUFBYUEsU0FBaUJDLFFBQWU7QUFDbEQsV0FBSyxTQUFTRDtBQUNkLFdBQUssUUFBUUM7QUFDYixXQUFLLFVBQVUsQ0FBQztBQUFBLElBQ2xCO0FBQUEsSUFFQSxJQUFXLFdBQXFCO0FBQzlCLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUVBLE1BQWEsUUFBd0I7QUFDbkMsVUFBSSxLQUFLLFNBQVM7QUFDaEI7QUFBQSxNQUNGO0FBRUEsWUFBTSxVQUFVLElBQUksUUFBYyxDQUFDLFlBQVk7QUFDN0MsYUFBSyxRQUFRLEtBQUssT0FBTztBQUFBLE1BQzNCLENBQUM7QUFFRCxVQUFJLENBQUMsS0FBSyxrQkFBa0I7QUFDMUIsYUFBSyxtQkFBbUI7QUFFeEIsYUFBSyxLQUFLO0FBQUEsTUFDWjtBQUVBLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFUSxXQUFZO0FBQ2xCLFdBQUssVUFBVTtBQUNmLFdBQUssbUJBQW1CO0FBRXhCLGlCQUFXLFdBQVcsS0FBSyxTQUFTO0FBQ2xDLGdCQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxJQUVBLE1BQWMsT0FBdUI7QUFDbkMsWUFBTSxLQUFLLGFBQWE7QUFFeEIsWUFBTSxLQUFLLFNBQVM7QUFBQSxJQUN0QjtBQUFBLElBRUEsTUFBYyxlQUErQjtBQUMzQyxZQUFNLE1BQU0sR0FBRyxLQUFLLE9BQU8sY0FBYyxDQUFDO0FBRTFDLGFBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixjQUFNLEtBQUssRUFBRSxRQUFRLFFBQVEsYUFBYSxVQUFVLENBQUMsRUFDbEQsS0FBSyxjQUFZO0FBQ2hCLGNBQUksU0FBUyxXQUFXLEtBQUs7QUFDM0Isa0JBQU0sSUFBSSxNQUFNLGNBQWM7QUFBQSxVQUNoQztBQUVBLGlCQUFPLFNBQVMsS0FBSztBQUFBLFFBQ3ZCLENBQUMsRUFDQSxLQUFLLENBQUMsU0FBUztBQUNkLGNBQUksQ0FBQyxLQUFLLGFBQWE7QUFDckIsa0JBQU0sSUFBSSxNQUFNLGtCQUFrQjtBQUFBLFVBQ3BDO0FBRUEsZUFBSyxTQUFTO0FBQ2QsZUFBSyxNQUFNLGVBQWUsS0FBSyxXQUFXO0FBRTFDLGtCQUFRO0FBQUEsUUFDVixDQUFDLEVBQ0EsTUFBTSxDQUFDLFVBQVU7QUFDaEIsY0FBSSxNQUFNLFlBQVksZ0JBQWdCO0FBQ3BDLG9CQUFRLEtBQUssS0FBSztBQUFBLFVBQ3BCO0FBRUEsa0JBQVE7QUFBQSxRQUNWLENBQUM7QUFBQSxNQUNMLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFhLFNBQTRCO0FBQ3ZDLFlBQU0sTUFBTSxHQUFHLEtBQUssT0FBTyxjQUFjLENBQUM7QUFFMUMsYUFBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzlCLGNBQU0sS0FBSyxFQUFFLFFBQVEsUUFBUSxhQUFhLFVBQVUsQ0FBQyxFQUNsRCxLQUFLLGNBQVksU0FBUyxLQUFLLENBQUMsRUFDaEMsS0FBSyxDQUFDLFNBQVM7QUFDZCxlQUFLLFNBQVM7QUFDZCxlQUFLLE1BQU0sb0JBQW9CO0FBRS9CLGtCQUFRLElBQUk7QUFBQSxRQUNkLENBQUMsRUFDQSxNQUFNLENBQUMsVUFBVTtBQUNoQixrQkFBUSxLQUFLLEtBQUs7QUFFbEIsa0JBQVEsS0FBSztBQUFBLFFBQ2YsQ0FBQztBQUFBLE1BQ0wsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBRU8sTUFBTSxPQUFPLElBQUksS0FBSyxRQUFRLEtBQUs7OztBQzdHbkMsTUFBTSxjQUFOLE1BQWtCO0FBQUEsSUFDaEIsWUFBYSxXQUFnQztBQUNsRCxZQUFNLFlBQVksU0FBUyxlQUFlLFNBQVM7QUFDbkQsVUFBSSxXQUFXO0FBQ2IsZUFBTztBQUFBLE1BQ1Q7QUFFQSxZQUFNLElBQUksTUFBTSxtQkFBbUIsU0FBUyxHQUFHO0FBQUEsSUFDakQ7QUFBQSxFQUNGOzs7QUNOTyxNQUFNLFNBQU4sY0FBcUIsWUFBWTtBQUFBLElBQ3RDLE1BQWEsT0FBUSxXQUFrQztBQUNyRCxZQUFNLEtBQUssTUFBTTtBQUVqQixXQUFLLFVBQVUsS0FBSyxZQUFZLFNBQVMsQ0FBQztBQUFBLElBQzVDO0FBQUEsSUFFUSxVQUFXLFdBQThCO0FBQy9DLFlBQU0sU0FBUyxTQUFTLGNBQWMsS0FBSztBQUMzQyxhQUFPLEtBQUs7QUFFWixZQUFNLFlBQVksU0FBUyxjQUFjLEtBQUs7QUFDOUMsZ0JBQVUsS0FBSztBQUNmLGdCQUFVLFlBQVk7QUFDdEIsZ0JBQVUsY0FBYztBQUV4QixhQUFPLFlBQVksU0FBUztBQUM1QixnQkFBVSxZQUFZLE1BQU07QUFBQSxJQUM5QjtBQUFBLEVBQ0Y7OztBQ3RCQTs7O0FDR08sTUFBTSxZQUFZLE1BQVk7QUFDbkMsVUFBTSxRQUFRLFNBQVMsY0FBYyxPQUFPO0FBQzVDLFVBQU0sY0FBYztBQUVwQixhQUFTLEtBQUssWUFBWSxLQUFLO0FBQUEsRUFDakM7OztBVExBLFlBQVU7QUFFSCxNQUFNLFNBQVMsT0FBTyxPQUE4QjtBQUN6RCxVQUFNQyxVQUFTLElBQUksT0FBTztBQUMxQixVQUFNQSxRQUFPLE9BQU8sRUFBRTtBQUFBLEVBQ3hCOyIsCiAgIm5hbWVzIjogWyJjb25maWciLCAic3RvcmUiLCAiYnV0dG9uIl0KfQo=
