"use strict";
(() => {
  // _pffdidbwk:/Volumes/Projects/cryptumpay/widget/src/styles.css
  var styles_default = "#widget{width:300px;margin:20px;border:1px solid #aeaeae;border-radius:6px;display:flex;align-items:center;box-sizing:border-box;align-items:stretch}#widget_pay{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-family:Verdana,Geneva,Tahoma,sans-serif;background:#61c3ff;color:#fff;cursor:pointer}#widget_pay.wide{padding:15px 0}#widget_pay:hover{background:#38b3ff}#widget_settings{display:flex;flex-direction:column;text-align:center;max-width:50%;background:#ade0ff;color:#6f6f6f;text-align:right}#widget_wallet{cursor:pointer;text-align:right}#widget_wallet:hover{background:#98d7ff}#widget_settings>div{padding:3px 20px}";

  // src/app.ts
  var style = document.createElement("style");
  style.textContent = styles_default;
  document.head.appendChild(style);
  function createNew(container) {
    const widget = document.createElement("div");
    widget.id = "widget";
    const widgetPay = document.createElement("div");
    widgetPay.id = "widget_pay";
    widgetPay.className = "wide";
    widgetPay.textContent = "Pay with CryptumPay";
    widget.appendChild(widgetPay);
    container.appendChild(widget);
  }
  function createLogged(container) {
    const widget = document.createElement("div");
    widget.id = "widget";
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
    widget.appendChild(widgetPay);
    widget.appendChild(widgetSettings);
    container.appendChild(widget);
  }
  function createWidget(id, type) {
    const container = document.getElementById(id);
    if (!container) {
      console.warn(`Unknown container ${id}`);
      return;
    }
    if (type === "logged") {
      createLogged(container);
    } else {
      createNew(container);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    createWidget("cpay_instant_button", "new");
  });
  var CPayInitButton = (id, type) => {
    createWidget(id, type);
  };
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiX3BmZmRpZGJ3azovVm9sdW1lcy9Qcm9qZWN0cy9jcnlwdHVtcGF5L3dpZGdldC9zcmMvc3R5bGVzLmNzcyIsICIuLi9zcmMvYXBwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIjd2lkZ2V0e3dpZHRoOjMwMHB4O21hcmdpbjoyMHB4O2JvcmRlcjoxcHggc29saWQgI2FlYWVhZTtib3JkZXItcmFkaXVzOjZweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2JveC1zaXppbmc6Ym9yZGVyLWJveDthbGlnbi1pdGVtczpzdHJldGNofSN3aWRnZXRfcGF5e2ZsZXgtZ3JvdzoxO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtmb250LXNpemU6MTVweDtmb250LWZhbWlseTpWZXJkYW5hLEdlbmV2YSxUYWhvbWEsc2Fucy1zZXJpZjtiYWNrZ3JvdW5kOiM2MWMzZmY7Y29sb3I6I2ZmZjtjdXJzb3I6cG9pbnRlcn0jd2lkZ2V0X3BheS53aWRle3BhZGRpbmc6MTVweCAwfSN3aWRnZXRfcGF5OmhvdmVye2JhY2tncm91bmQ6IzM4YjNmZn0jd2lkZ2V0X3NldHRpbmdze2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47dGV4dC1hbGlnbjpjZW50ZXI7bWF4LXdpZHRoOjUwJTtiYWNrZ3JvdW5kOiNhZGUwZmY7Y29sb3I6IzZmNmY2Zjt0ZXh0LWFsaWduOnJpZ2h0fSN3aWRnZXRfd2FsbGV0e2N1cnNvcjpwb2ludGVyO3RleHQtYWxpZ246cmlnaHR9I3dpZGdldF93YWxsZXQ6aG92ZXJ7YmFja2dyb3VuZDojOThkN2ZmfSN3aWRnZXRfc2V0dGluZ3M+ZGl2e3BhZGRpbmc6M3B4IDIwcHh9IiwgIi8vIEB0cy1pZ25vcmVcbmltcG9ydCBzdHlsZXMgZnJvbSAnc2FzczouL3N0eWxlcy5jc3MnO1xuXG5jb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5zdHlsZS50ZXh0Q29udGVudCA9IHN0eWxlcztcblxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZU5ldyhjb250YWluZXI6IEVsZW1lbnQpIHtcbiAgY29uc3Qgd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHdpZGdldC5pZCA9ICd3aWRnZXQnO1xuXG4gIGNvbnN0IHdpZGdldFBheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB3aWRnZXRQYXkuaWQgPSAnd2lkZ2V0X3BheSc7XG4gIHdpZGdldFBheS5jbGFzc05hbWUgPSAnd2lkZSc7XG4gIHdpZGdldFBheS50ZXh0Q29udGVudCA9ICdQYXkgd2l0aCBDcnlwdHVtUGF5JztcblxuICB3aWRnZXQuYXBwZW5kQ2hpbGQod2lkZ2V0UGF5KTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHdpZGdldCk7XG59XG5cbi8vIFx1MDQyNFx1MDQ0M1x1MDQzRFx1MDQzQVx1MDQ0Nlx1MDQzOFx1MDQ0RiBcdTA0MzRcdTA0M0JcdTA0NEYgXHUwNDQxXHUwNDNFXHUwNDM3XHUwNDM0XHUwNDMwXHUwNDNEXHUwNDM4XHUwNDRGIFx1MDQzOCBcdTA0MzRcdTA0M0VcdTA0MzFcdTA0MzBcdTA0MzJcdTA0M0JcdTA0MzVcdTA0M0RcdTA0MzhcdTA0NEYgXHUwNDMyXHUwNDM4XHUwNDM0XHUwNDM2XHUwNDM1XHUwNDQyXHUwNDMwXG5mdW5jdGlvbiBjcmVhdGVMb2dnZWQoY29udGFpbmVyOiBFbGVtZW50KSB7XG4gIC8vIFx1MDQyMVx1MDQzRVx1MDQzN1x1MDQzNFx1MDQzMFx1MDQ1MVx1MDQzQyBcdTA0M0VcdTA0NDFcdTA0M0RcdTA0M0VcdTA0MzJcdTA0M0RcdTA0M0VcdTA0MzkgXHUwNDNBXHUwNDNFXHUwNDNEXHUwNDQyXHUwNDM1XHUwNDM5XHUwNDNEXHUwNDM1XHUwNDQwIFx1MDQzMlx1MDQzOFx1MDQzNFx1MDQzNlx1MDQzNVx1MDQ0Mlx1MDQzMFxuICBjb25zdCB3aWRnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgd2lkZ2V0LmlkID0gJ3dpZGdldCc7XG5cbiAgLy8gXHUwNDIxXHUwNDNFXHUwNDM3XHUwNDM0XHUwNDMwXHUwNDUxXHUwNDNDIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0MiBcdTA0MzRcdTA0M0JcdTA0NEYgXHUwNDNBXHUwNDNEXHUwNDNFXHUwNDNGXHUwNDNBXHUwNDM4IFwiUGF5XCJcbiAgY29uc3Qgd2lkZ2V0UGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHdpZGdldFBheS5pZCA9ICd3aWRnZXRfcGF5JztcbiAgd2lkZ2V0UGF5LnRleHRDb250ZW50ID0gJ1BheSc7XG5cbiAgLy8gXHUwNDIxXHUwNDNFXHUwNDM3XHUwNDM0XHUwNDMwXHUwNDUxXHUwNDNDIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0MiBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzVcdTA0M0EgXHUwNDMyXHUwNDM4XHUwNDM0XHUwNDM2XHUwNDM1XHUwNDQyXHUwNDMwXG4gIGNvbnN0IHdpZGdldFNldHRpbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHdpZGdldFNldHRpbmdzLmlkID0gJ3dpZGdldF9zZXR0aW5ncyc7XG5cbiAgLy8gXHUwNDIxXHUwNDNFXHUwNDM3XHUwNDM0XHUwNDMwXHUwNDUxXHUwNDNDIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0MiBcdTA0MzRcdTA0M0JcdTA0NEYgXHUwNDNFXHUwNDQyXHUwNDNFXHUwNDMxXHUwNDQwXHUwNDMwXHUwNDM2XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDRGIFx1MDQ0Nlx1MDQzNVx1MDQzRFx1MDQ0QlxuICBjb25zdCB3aWRnZXRQcmljZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB3aWRnZXRQcmljZS5pZCA9ICd3aWRnZXRfcHJpY2UnO1xuICB3aWRnZXRQcmljZS50ZXh0Q29udGVudCA9ICcxMDA1MDAgVVNEVCc7XG5cbiAgLy8gXHUwNDIxXHUwNDNFXHUwNDM3XHUwNDM0XHUwNDMwXHUwNDUxXHUwNDNDIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0MiBcdTA0MzRcdTA0M0JcdTA0NEYgXHUwNDNFXHUwNDQyXHUwNDNFXHUwNDMxXHUwNDQwXHUwNDMwXHUwNDM2XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDRGIFx1MDQzQVx1MDQzRVx1MDQ0OFx1MDQzNVx1MDQzQlx1MDQ0Q1x1MDQzQVx1MDQzMFxuICBjb25zdCB3aWRnZXRXYWxsZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgd2lkZ2V0V2FsbGV0LmlkID0gJ3dpZGdldF93YWxsZXQnO1xuXG4gIGNvbnN0IHdhbGxldFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIHdhbGxldFNwYW4udGV4dENvbnRlbnQgPSAnM1ROXHUyMDI2OUZBJztcblxuICBjb25zdCBhcnJvd1NwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGFycm93U3Bhbi5pbm5lckhUTUwgPSAnJiM5NjYyOyc7IC8vIFx1MDQyMVx1MDQ0Mlx1MDQ0MFx1MDQzNVx1MDQzQlx1MDQzRVx1MDQ0N1x1MDQzQVx1MDQzMCBcdTA0MzJcdTA0M0RcdTA0MzhcdTA0MzdcblxuICAvLyBcdTA0MTRcdTA0M0VcdTA0MzFcdTA0MzBcdTA0MzJcdTA0M0JcdTA0NEZcdTA0MzVcdTA0M0MgXHUwNDREXHUwNDNCXHUwNDM1XHUwNDNDXHUwNDM1XHUwNDNEXHUwNDQyXHUwNDRCIFx1MDQzQVx1MDQzRVx1MDQ0OFx1MDQzNVx1MDQzQlx1MDQ0Q1x1MDQzQVx1MDQzMCBcdTA0MzJcdTA0M0RcdTA0NDNcdTA0NDJcdTA0NDBcdTA0NEMgXHUwNDNBXHUwNDNFXHUwNDNEXHUwNDQyXHUwNDM1XHUwNDM5XHUwNDNEXHUwNDM1XHUwNDQwXHUwNDMwIFx1MDQzQVx1MDQzRVx1MDQ0OFx1MDQzNVx1MDQzQlx1MDQ0Q1x1MDQzQVx1MDQzMFxuICB3aWRnZXRXYWxsZXQuYXBwZW5kQ2hpbGQod2FsbGV0U3Bhbik7XG4gIHdpZGdldFdhbGxldC5hcHBlbmRDaGlsZChhcnJvd1NwYW4pO1xuXG4gIC8vIFx1MDQxNFx1MDQzRVx1MDQzMVx1MDQzMFx1MDQzMlx1MDQzQlx1MDQ0Rlx1MDQzNVx1MDQzQyBcdTA0NERcdTA0M0JcdTA0MzVcdTA0M0NcdTA0MzVcdTA0M0RcdTA0NDJcdTA0NEIgXHUwNDQ2XHUwNDM1XHUwNDNEXHUwNDRCIFx1MDQzOCBcdTA0M0FcdTA0M0VcdTA0NDhcdTA0MzVcdTA0M0JcdTA0NENcdTA0M0FcdTA0MzAgXHUwNDMyXHUwNDNEXHUwNDQzXHUwNDQyXHUwNDQwXHUwNDRDIFx1MDQzRFx1MDQzMFx1MDQ0MVx1MDQ0Mlx1MDQ0MFx1MDQzRVx1MDQzNVx1MDQzQVxuICB3aWRnZXRTZXR0aW5ncy5hcHBlbmRDaGlsZCh3aWRnZXRQcmljZSk7XG4gIHdpZGdldFNldHRpbmdzLmFwcGVuZENoaWxkKHdpZGdldFdhbGxldCk7XG5cbiAgLy8gXHUwNDE0XHUwNDNFXHUwNDMxXHUwNDMwXHUwNDMyXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0Mlx1MDQ0QiBcdTA0M0FcdTA0M0RcdTA0M0VcdTA0M0ZcdTA0M0FcdTA0MzggXHUwNDM4IFx1MDQzRFx1MDQzMFx1MDQ0MVx1MDQ0Mlx1MDQ0MFx1MDQzRVx1MDQzNVx1MDQzQSBcdTA0MzIgXHUwNDNFXHUwNDQxXHUwNDNEXHUwNDNFXHUwNDMyXHUwNDNEXHUwNDNFXHUwNDM5IFx1MDQzQVx1MDQzRVx1MDQzRFx1MDQ0Mlx1MDQzNVx1MDQzOVx1MDQzRFx1MDQzNVx1MDQ0MCBcdTA0MzJcdTA0MzhcdTA0MzRcdTA0MzZcdTA0MzVcdTA0NDJcdTA0MzBcbiAgd2lkZ2V0LmFwcGVuZENoaWxkKHdpZGdldFBheSk7XG4gIHdpZGdldC5hcHBlbmRDaGlsZCh3aWRnZXRTZXR0aW5ncyk7XG5cbiAgLy8gXHUwNDE0XHUwNDNFXHUwNDMxXHUwNDMwXHUwNDMyXHUwNDNCXHUwNDRGXHUwNDM1XHUwNDNDIFx1MDQzMlx1MDQzOFx1MDQzNFx1MDQzNlx1MDQzNVx1MDQ0MiBcdTA0MzIgXHUwNDNBXHUwNDNFXHUwNDNEXHUwNDQyXHUwNDM1XHUwNDM5XHUwNDNEXHUwNDM1XHUwNDQwICN0ZXN0XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh3aWRnZXQpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVXaWRnZXQoaWQ6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFjb250YWluZXIpIHtcbiAgICBjb25zb2xlLndhcm4oYFVua25vd24gY29udGFpbmVyICR7aWR9YCk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodHlwZSA9PT0gJ2xvZ2dlZCcpIHtcbiAgICBjcmVhdGVMb2dnZWQoY29udGFpbmVyKTtcbiAgfSBlbHNlIHtcbiAgICBjcmVhdGVOZXcoY29udGFpbmVyKTtcbiAgfVxufVxuXG4vLyBcdTA0MTZcdTA0MzRcdTA0MzVcdTA0M0MgXHUwNDM3XHUwNDMwXHUwNDMzXHUwNDQwXHUwNDQzXHUwNDM3XHUwNDNBXHUwNDM4IERPTSBcdTA0MzggXHUwNDM3XHUwNDMwXHUwNDQyXHUwNDM1XHUwNDNDIFx1MDQzMlx1MDQ0Qlx1MDQzN1x1MDQ0Qlx1MDQzMlx1MDQzMFx1MDQzNVx1MDQzQyBjcmVhdGVXaWRnZXRcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIGNyZWF0ZVdpZGdldCgnY3BheV9pbnN0YW50X2J1dHRvbicsICduZXcnKTtcbn0pO1xuXG5leHBvcnQgY29uc3QgQ1BheUluaXRCdXR0b24gPSAoaWQ6IHN0cmluZywgdHlwZTogc3RyaW5nKSA9PiB7XG4gIGNyZWF0ZVdpZGdldChpZCwgdHlwZSk7XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBQUE7OztBQ0dBLE1BQU0sUUFBUSxTQUFTLGNBQWMsT0FBTztBQUM1QyxRQUFNLGNBQWM7QUFFcEIsV0FBUyxLQUFLLFlBQVksS0FBSztBQUUvQixXQUFTLFVBQVUsV0FBb0I7QUFDckMsVUFBTSxTQUFTLFNBQVMsY0FBYyxLQUFLO0FBQzNDLFdBQU8sS0FBSztBQUVaLFVBQU0sWUFBWSxTQUFTLGNBQWMsS0FBSztBQUM5QyxjQUFVLEtBQUs7QUFDZixjQUFVLFlBQVk7QUFDdEIsY0FBVSxjQUFjO0FBRXhCLFdBQU8sWUFBWSxTQUFTO0FBQzVCLGNBQVUsWUFBWSxNQUFNO0FBQUEsRUFDOUI7QUFHQSxXQUFTLGFBQWEsV0FBb0I7QUFFeEMsVUFBTSxTQUFTLFNBQVMsY0FBYyxLQUFLO0FBQzNDLFdBQU8sS0FBSztBQUdaLFVBQU0sWUFBWSxTQUFTLGNBQWMsS0FBSztBQUM5QyxjQUFVLEtBQUs7QUFDZixjQUFVLGNBQWM7QUFHeEIsVUFBTSxpQkFBaUIsU0FBUyxjQUFjLEtBQUs7QUFDbkQsbUJBQWUsS0FBSztBQUdwQixVQUFNLGNBQWMsU0FBUyxjQUFjLEtBQUs7QUFDaEQsZ0JBQVksS0FBSztBQUNqQixnQkFBWSxjQUFjO0FBRzFCLFVBQU0sZUFBZSxTQUFTLGNBQWMsS0FBSztBQUNqRCxpQkFBYSxLQUFLO0FBRWxCLFVBQU0sYUFBYSxTQUFTLGNBQWMsTUFBTTtBQUNoRCxlQUFXLGNBQWM7QUFFekIsVUFBTSxZQUFZLFNBQVMsY0FBYyxNQUFNO0FBQy9DLGNBQVUsWUFBWTtBQUd0QixpQkFBYSxZQUFZLFVBQVU7QUFDbkMsaUJBQWEsWUFBWSxTQUFTO0FBR2xDLG1CQUFlLFlBQVksV0FBVztBQUN0QyxtQkFBZSxZQUFZLFlBQVk7QUFHdkMsV0FBTyxZQUFZLFNBQVM7QUFDNUIsV0FBTyxZQUFZLGNBQWM7QUFHakMsY0FBVSxZQUFZLE1BQU07QUFBQSxFQUM5QjtBQUVBLFdBQVMsYUFBYSxJQUFZLE1BQWM7QUFDOUMsVUFBTSxZQUFZLFNBQVMsZUFBZSxFQUFFO0FBQzVDLFFBQUksQ0FBQyxXQUFXO0FBQ2QsY0FBUSxLQUFLLHFCQUFxQixFQUFFLEVBQUU7QUFFdEM7QUFBQSxJQUNGO0FBRUEsUUFBSSxTQUFTLFVBQVU7QUFDckIsbUJBQWEsU0FBUztBQUFBLElBQ3hCLE9BQU87QUFDTCxnQkFBVSxTQUFTO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBR0EsV0FBUyxpQkFBaUIsb0JBQW9CLE1BQU07QUFDbEQsaUJBQWEsdUJBQXVCLEtBQUs7QUFBQSxFQUMzQyxDQUFDO0FBRU0sTUFBTSxpQkFBaUIsQ0FBQyxJQUFZLFNBQWlCO0FBQzFELGlCQUFhLElBQUksSUFBSTtBQUFBLEVBQ3ZCOyIsCiAgIm5hbWVzIjogW10KfQo=