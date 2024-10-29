// @ts-ignore
import styles from 'sass:./styles.css';

const style = document.createElement('style');
style.textContent = styles;

document.head.appendChild(style);

function createNew(container: Element) {
  const widget = document.createElement('div');
  widget.id = 'widget';

  const widgetPay = document.createElement('div');
  widgetPay.id = 'widget_pay';
  widgetPay.className = 'wide';
  widgetPay.textContent = 'Pay with CryptumPay';

  widget.appendChild(widgetPay);
  container.appendChild(widget);
}

// Функция для создания и добавления виджета
function createLogged(container: Element) {
  // Создаём основной контейнер виджета
  const widget = document.createElement('div');
  widget.id = 'widget';

  // Создаём элемент для кнопки "Pay"
  const widgetPay = document.createElement('div');
  widgetPay.id = 'widget_pay';
  widgetPay.textContent = 'Pay';

  // Создаём элемент настроек виджета
  const widgetSettings = document.createElement('div');
  widgetSettings.id = 'widget_settings';

  // Создаём элемент для отображения цены
  const widgetPrice = document.createElement('div');
  widgetPrice.id = 'widget_price';
  widgetPrice.textContent = '100500 USDT';

  // Создаём элемент для отображения кошелька
  const widgetWallet = document.createElement('div');
  widgetWallet.id = 'widget_wallet';

  const walletSpan = document.createElement('span');
  walletSpan.textContent = '3TN…9FA';

  const arrowSpan = document.createElement('span');
  arrowSpan.innerHTML = '&#9662;'; // Стрелочка вниз

  // Добавляем элементы кошелька внутрь контейнера кошелька
  widgetWallet.appendChild(walletSpan);
  widgetWallet.appendChild(arrowSpan);

  // Добавляем элементы цены и кошелька внутрь настроек
  widgetSettings.appendChild(widgetPrice);
  widgetSettings.appendChild(widgetWallet);

  // Добавляем элементы кнопки и настроек в основной контейнер виджета
  widget.appendChild(widgetPay);
  widget.appendChild(widgetSettings);

  // Добавляем виджет в контейнер #test
  container.appendChild(widget);
}

function createWidget(id: string, type: string) {
  const container = document.getElementById(id);
  if (!container) {
    console.warn(`Unknown container ${id}`);

    return;
  }

  if (type === 'logged') {
    createLogged(container);
  } else {
    createNew(container);
  }
}

// Ждем загрузки DOM и затем вызываем createWidget
document.addEventListener('DOMContentLoaded', () => {
  createWidget('cpay_instant_button', 'new');
});

export const button = (id: string, type: string) => {
  createWidget(id, type);
};
