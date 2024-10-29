"use strict";var CPayV3=(()=>{var l=Object.defineProperty;var S=Object.getOwnPropertyDescriptor;var C=Object.getOwnPropertyNames;var E=Object.prototype.hasOwnProperty;var T=(r,t)=>{for(var e in t)l(r,e,{get:t[e],enumerable:!0})},P=(r,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of C(t))!E.call(r,n)&&n!==e&&l(r,n,{get:()=>t[n],enumerable:!(i=S(t,n))||i.enumerable});return r};var z=r=>P(l({},"__esModule",{value:!0}),r);var j={};T(j,{button:()=>_});var p=class{getApiBaseUrl(){return"http://api.cryptumpay.local"}},b=new p;var a=class{name;constructor(t){this.name=t}key(t){return`${this.name}:${t}`}};var c=class extends a{items={};set(t,e){this.items[t]=e}get(t){return this.items[t]||null}remove(t){delete this.items[t]}};var u=class{auth;constructor(){this.auth=new c("auth")}setAccessToken(t){this.auth.set("jwtAccessToken",t)}getAccessToken(){return this.auth.get("jwtAccessToken")}forgetSensitiveData(){this.auth.remove("jwtAccessToken")}},v=new u;var f=class{config;store;logged=!1;isInitialization=!1;initialized=!1;onReady;constructor(t,e){this.config=t,this.store=e,this.onReady=[]}get isLogged(){return this.logged}get isReady(){return this.initialized}async ready(){if(this.initialized)return;let t=new Promise(e=>{this.onReady.push(e)});return this.isInitialization||(this.isInitialization=!0,this.init()),t}async init(){await this.refreshToken(),this.initialized=!0,this.isInitialization=!1;for(let t of this.onReady)t()}async refreshToken(){let t=`${this.config.getApiBaseUrl()}/user/refresh-token`;return new Promise(e=>{fetch(t,{method:"POST",credentials:"include"}).then(i=>{if(i.status===401)throw new Error("Unauthorized");return i.json()}).then(i=>{if(!i.accessToken)throw new Error("Invalid response");this.logged=!0,this.store.setAccessToken(i.accessToken),e()}).catch(i=>{i.message!=="Unauthorized"&&console.warn(i),e()})})}async logout(){let t=`${this.config.getApiBaseUrl()}/user/logout`;return new Promise(e=>{fetch(t,{method:"POST",credentials:"include"}).then(i=>i.json()).then(i=>{this.logged=!1,this.store.forgetSensitiveData(),e(!0)}).catch(i=>{console.warn(i),e(!1)})})}},m=new f(b,v);var A=({id:r,network:t,ticker:e,chain:i,contract:n})=>{let s=[r,t,e,i,n];if(!s.every(y=>y.length>0))throw new Error("Malformed currency");let o=s.join(":");return Buffer.from(o).toString("hex").substring(0,39-o.length)},x=r=>{if(!r||typeof r!="string")throw new Error("Invalid currency");let t=r.split(":");if(t.length!==6||r.length!==40)throw new Error("Wrong format of the currency");let[e,i,n,s,o,w]=t;if(A({id:e,network:i,ticker:n,chain:s,contract:o})!==w)throw new Error("Wrong currency hash")};var h=class{#t;#e;#i;#r;#n;#s;#o;#a;constructor(t){this.#t=t}setOrderId(t){this.#e!==t&&(this.#e=t,this.#t())}setCustomerId(t){this.#i!==t&&(this.#i=t,this.#t())}setMerchantId(t){this.#r!==t&&(this.#r=t,this.#t())}setPrice(t,e,i){this.#n===t&&this.#o===e&&this.#s===i||(x(e),this.#n=t,this.#o=e,this.#s=i,this.#t())}setDescription(t){this.#a!==t&&(this.#a=t,this.#t())}getSettings(){return{orderId:this.#e,customerId:this.#i,merchantId:this.#r,amount:this.#n,canEditAmount:this.#s,currency:this.#o,description:this.#a}}};var d=class{findElement(t){let e=document.getElementById(t);if(e)return e;throw new Error(`Unknown element ${t}.`)}};var g=class extends d{config;constructor(){super(),this.config=new h(()=>this.update())}getConfig(){return this.config}async create(t){await m.ready(),this.createNew(this.findElement(t))}update(){m.isReady&&console.warn("update",this.config.getSettings())}createNew(t){console.warn("createNew",this.config.getSettings());let e=document.createElement("div");e.id="widget";let i=document.createElement("div");i.id="widget_pay",i.className="wide",i.textContent="Pay with CryptumPay",e.appendChild(i),t.appendChild(e)}};var I="#widget{width:300px;margin:20px;border:1px solid #aeaeae;border-radius:6px;display:flex;align-items:center;box-sizing:border-box;align-items:stretch}#widget_pay{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-family:Verdana,Geneva,Tahoma,sans-serif;background:#61c3ff;color:#fff;cursor:pointer}#widget_pay.wide{padding:15px 0}#widget_pay:hover{background:#38b3ff}#widget_settings{display:flex;flex-direction:column;text-align:center;max-width:50%;background:#ade0ff;color:#6f6f6f;text-align:right}#widget_wallet{cursor:pointer;text-align:right}#widget_wallet:hover{background:#98d7ff}#widget_settings>div{padding:3px 20px}";var k=()=>{let r=document.createElement("style");r.textContent=I,document.head.appendChild(r)};k();var _=r=>{let t=new g;return t.create(r),t.getConfig()};return z(j);})();
