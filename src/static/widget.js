// Добавляем стили для виджета через JavaScript
const style = document.createElement('style');
style.textContent = `
  #widget {
    width: 300px;
    margin: 20px;
    border: 1px solid #aeaeae;
    border-radius: 6px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    align-items: stretch;
  }
  #widget_pay {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    background: rgb(97, 195, 255);
    color: #fff;
    cursor: pointer;
  }
  #widget_pay:hover {
    background: rgb(56, 179, 255);
  }
  #widget_settings {
    display: flex;
    flex-direction: column;
    text-align: center;
    max-width: 50%;
    background: rgb(173, 224, 255);
    color: #6f6f6f;
    text-align: right;
  }
  #widget_wallet {
    cursor: pointer;
    text-align: right;
  }
  #widget_wallet:hover {
    background: rgb(152, 215, 255);
  }
  #widget_settings > div {
    padding: 3px 20px;
  }
`;
document.head.appendChild(style);

// Функция для создания и добавления виджета
function createWidget() {
  const container = document.getElementById('test');

  if (container) {
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
}

// Ждем загрузки DOM и затем вызываем createWidget
document.addEventListener('DOMContentLoaded', createWidget);
