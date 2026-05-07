const BASE_URL = 'https://api.exchangerate.host/live';
const API_KEY = '77f49cfcf5e82b820743b23518348c20';

const banks = {
    'ABC': { buy: 0.01, sell: -0.005 },
    'NEW': { buy: 0.02, sell: -0.01 },
    'AME': { buy: 0.015, sell: -0.015 },
    'RED': { buy: 0.005, sell: -0.005 }
};

let leftCurrency = 'RUB';
let rightCurrency = 'USD';
let activeBank = 'ABC';
let activeInput = 'left';

const inputs = document.querySelectorAll('.exchange-input');
const leftInput = inputs[0];
const rightInput = inputs[1];

const rateInfos = document.querySelectorAll('.exchange-rate-info');
const leftRateInfo = rateInfos[0];
const rightRateInfo = rateInfos[1];

const leftBtns = document.querySelectorAll('.currency-btn-left');
const rightBtns = document.querySelectorAll('.currency-btn-right');
const bankBtns = document.querySelectorAll('.bank-tab-btn');

const rateValues = document.querySelectorAll('.rate-value');
const buyRateDisplay = rateValues[0];
const sellRateDisplay = rateValues[1];

function toggleStatusBanner(isOffline) {
    let banner = document.getElementById('offline-banner');

    if (banner === null) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.position = 'sticky';
        banner.style.top = '65px';
        banner.style.left = '0';
        banner.style.width = '100%';
        banner.style.backgroundColor = '#ff5252';
        banner.style.color = 'white';
        banner.style.textAlign = 'center';
        banner.style.padding = '14px 20px';
        banner.style.fontWeight = '600';
        banner.style.zIndex = '999';
        banner.style.borderBottom = '3px solid #ff4444';
        banner.style.display = 'none';

        const header = document.querySelector('.header');
        if (header) header.appendChild(banner);
    }
    
    if (isOffline) {
        banner.innerText = "İnternet bağlantısı yoxdur - Oflayn rejimdə işləyir";
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

function setActiveButton(buttons, activeValue) {
    buttons.forEach(btn => {
        if (btn.innerText.trim() === activeValue) {
            btn.style.backgroundColor = '#7c3aed';
            btn.style.color = '#fff';
        } else {
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.color = '#666';
        }
    });
}

function validateInput(inputElement) {
    let val = inputElement.value;
    
    val = val.replace(/,/g, '.').replace(/[^0-9.]/g, ''); 

    let parts = val.split('.');
    if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
        parts = val.split('.');
    }

    if (parts.length === 2 && parts[1].length > 4) {
        val = parts[0] + '.' + parts[1].slice(0, 4);
    }

    let numberValue = parseFloat(val);

    if (numberValue > 10000) {
        val = '10000';
        numberValue = 10000;
    }

    inputElement.value = val;
    return isNaN(numberValue) ? 0 : numberValue;
}

function calculateRate(quotes) {
    let fromUSD = leftCurrency === 'USD' ? 1 : quotes['USD' + leftCurrency];
    let toUSD = rightCurrency === 'USD' ? 1 : quotes['USD' + rightCurrency];
    return toUSD / fromUSD;
}

function renderUI(baseRate) {
    let bank = banks[activeBank];
    
    let bankBuyPrice = baseRate * (1 + bank.buy);
    let bankSellPrice = baseRate * (1 + bank.sell);

    leftRateInfo.innerText = `1 ${leftCurrency} = ${baseRate.toFixed(4)} ${rightCurrency}`;
    rightRateInfo.innerText = `1 ${rightCurrency} = ${(1 / baseRate).toFixed(4)} ${leftCurrency}`;

    if (buyRateDisplay) buyRateDisplay.innerText = bankBuyPrice.toFixed(4);
    if (sellRateDisplay) sellRateDisplay.innerText = bankSellPrice.toFixed(4);

    let amountLeft = validateInput(leftInput);
    let amountRight = validateInput(rightInput);

    if (activeInput === 'left') {
        rightInput.value = leftInput.value === '' ? '' : (amountLeft * baseRate).toFixed(4);
    } else if (activeInput === 'right') {
        leftInput.value = rightInput.value === '' ? '' : (amountRight / baseRate).toFixed(4);
    }
}

function loadFromCache() {
    toggleStatusBanner(!navigator.onLine);
    let cachedData = localStorage.getItem('rates_cache');
    if (cachedData !== null) {
        let rate = calculateRate(JSON.parse(cachedData));
        renderUI(rate);
    }
}

function updateConversion() {
    if (leftCurrency === rightCurrency) {
        renderUI(1);
        return;
    }

    let url = `${BASE_URL}?access_key=${API_KEY}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                toggleStatusBanner(false);
                localStorage.setItem('rates_cache', JSON.stringify(data.quotes));
                renderUI(calculateRate(data.quotes));
            } else {
                loadFromCache();
            }
        })
        .catch(() => loadFromCache());
}

leftBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        leftCurrency = this.innerText.trim();
        setActiveButton(leftBtns, leftCurrency);
        updateConversion();
    });
});

rightBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        rightCurrency = this.innerText.trim();
        setActiveButton(rightBtns, rightCurrency);
        updateConversion();
    });
});

bankBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        activeBank = this.innerText.trim();
        setActiveButton(bankBtns, activeBank);
        renderUI(parseFloat(localStorage.getItem('last_base_rate') || 1));
        updateConversion();
    });
});

leftInput.addEventListener('input', function() {
    activeInput = 'left';
    updateConversion();
});

rightInput.addEventListener('input', function() {
    activeInput = 'right';
    updateConversion();
});

window.onload = function() {
    leftInput.value = "1";
    setActiveButton(leftBtns, leftCurrency);
    setActiveButton(rightBtns, rightCurrency);
    setActiveButton(bankBtns, activeBank);
    updateConversion();
};

window.addEventListener('online', () => {
    toggleStatusBanner(false);
    updateConversion(); 
});

window.addEventListener('offline', () => toggleStatusBanner(true));
