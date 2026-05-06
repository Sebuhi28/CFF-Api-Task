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
        header.appendChild(banner);
    }
    
    if (isOffline === true) {
        banner.innerText = "İnternet bağlantısı yoxdur - Oflayn rejimdə işləyir";
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

function setActiveButton(buttons, activeValue) {
    for (let i = 0; i < buttons.length; i++) {
        let btn = buttons[i];
        
        if (btn.innerText.trim() === activeValue) {
            btn.style.backgroundColor = '#7c3aed';
            btn.style.color = '#fff';
        } else {
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.color = '#666';
        }
    }
}

function validateInput(inputElement) {
    let val = inputElement.value;
    
    val = val.replace(/,/g, '.'); 
    
    val = val.replace(/[^0-9.]/g, ''); 

    let parts = val.split('.');
    if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
    }

    let numberValue = parseFloat(val);
    if (numberValue > 10000) {
        val = '10000';
        numberValue = 10000;
    }

    inputElement.value = val;

    if (isNaN(numberValue)) {
        return 0;
    } else {
        return numberValue;
    }
}

function calculateRate(quotes) {
    let fromUSD;
    let toUSD;

    if (leftCurrency === 'USD') {
        fromUSD = 1;
    } else {
        fromUSD = quotes['USD' + leftCurrency];
    }

    if (rightCurrency === 'USD') {
        toUSD = 1;
    } else {
        toUSD = quotes['USD' + rightCurrency];
    }

    return toUSD / fromUSD;
}

function renderUI(baseRate) {
    let bank = banks[activeBank];
    let buyPrice = baseRate * (1 + bank.buy);
    let sellPrice = baseRate * (1 + bank.sell);

    leftRateInfo.innerText = "1 " + leftCurrency + " = " + baseRate.toFixed(4) + " " + rightCurrency;
    rightRateInfo.innerText = "1 " + rightCurrency + " = " + (1 / baseRate).toFixed(4) + " " + leftCurrency;

    buyRateDisplay.innerText = buyPrice.toFixed(4);
    sellRateDisplay.innerText = sellPrice.toFixed(4);

    let amountLeft = validateInput(leftInput);
    let amountRight = validateInput(rightInput);

    if (activeInput === 'left') {
        if (leftInput.value === '') {
            rightInput.value = '';
        } else {
            rightInput.value = (amountLeft * buyPrice).toFixed(4);
        }
    } else if (activeInput === 'right') {
        if (rightInput.value === '') {
            leftInput.value = '';
        } else {
            leftInput.value = (amountRight / sellPrice).toFixed(4);
        }
    }
}

function loadFromCache() {
    if (navigator.onLine === false) {
        toggleStatusBanner(true);
    } else {
        toggleStatusBanner(false);
    }

    let cachedData = localStorage.getItem('rates_cache');
    if (cachedData !== null) {
        let parsedData = JSON.parse(cachedData);
        let rate = calculateRate(parsedData);
        renderUI(rate);
    }
}

function updateConversion() {
    if (leftCurrency === rightCurrency) {
        renderUI(1);
        return;
    }

    let url = BASE_URL + "?access_key=" + API_KEY;

    fetch(url)
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            if (data.success === true) {
                toggleStatusBanner(false);
                
                let dataString = JSON.stringify(data.quotes);
                localStorage.setItem('rates_cache', dataString);
                
                let rate = calculateRate(data.quotes);
                renderUI(rate);
            } else {
                console.log("API Xətası");
                loadFromCache();
            }
        })
        .catch(function(error) {
            loadFromCache();
        });
}

for (let i = 0; i < leftBtns.length; i++) {
    leftBtns[i].addEventListener('click', function() {
        leftCurrency = this.innerText.trim();
        setActiveButton(leftBtns, leftCurrency);
        updateConversion();
    });
}

for (let i = 0; i < rightBtns.length; i++) {
    rightBtns[i].addEventListener('click', function() {
        rightCurrency = this.innerText.trim();
        setActiveButton(rightBtns, rightCurrency);
        updateConversion();
    });
}

for (let i = 0; i < bankBtns.length; i++) {
    bankBtns[i].addEventListener('click', function() {
        activeBank = this.innerText.trim();
        setActiveButton(bankBtns, activeBank);
        updateConversion();
    });
}

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

window.addEventListener('online', function() {
    toggleStatusBanner(false);
    updateConversion(); 
});

window.addEventListener('offline', function() {
    toggleStatusBanner(true);
});