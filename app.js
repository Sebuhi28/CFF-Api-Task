const BASE_URL = 'https://api.exchangerate.host/live';
const API_KEY = '1827cdf0a13e278bc1527ed79d4ce9ed';

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
let globalQuotes = null; 

const leftInput = document.querySelectorAll('.exchange-input')[0];
const rightInput = document.querySelectorAll('.exchange-input')[1];
const leftRateInfo = document.querySelectorAll('.exchange-rate-info')[0];
const rightRateInfo = document.querySelectorAll('.exchange-rate-info')[1];
const buyRateDisplay = document.querySelectorAll('.rate-value')[0];
const sellRateDisplay = document.querySelectorAll('.rate-value')[1];

const leftBtns = document.querySelectorAll('.currency-btn-left');
const rightBtns = document.querySelectorAll('.currency-btn-right');
const bankBtns = document.querySelectorAll('.bank-tab-btn');

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
    let val = inputElement.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    if (parseFloat(val) > 10000) val = '10000';
    inputElement.value = val;
    return val === '' ? 0 : parseFloat(val);
}

function renderUI() {
    if (!globalQuotes) return;

    let fromUSD = leftCurrency === 'USD' ? 1 : globalQuotes['USD' + leftCurrency];
    let toUSD = rightCurrency === 'USD' ? 1 : globalQuotes['USD' + rightCurrency];
    let baseRate = toUSD / fromUSD;

    if (leftCurrency === rightCurrency) baseRate = 1;

    leftRateInfo.innerText = `1 ${leftCurrency} = ${baseRate.toFixed(4)} ${rightCurrency}`;
    rightRateInfo.innerText = `1 ${rightCurrency} = ${(1 / baseRate).toFixed(4)} ${leftCurrency}`;

    let amountLeft = validateInput(leftInput);
    let bankData = banks[activeBank];

    let totalBuy = (amountLeft * baseRate) * (1 + bankData.buy);
    let totalSell = (amountLeft * baseRate) * (1 + bankData.sell);

    buyRateDisplay.innerText = totalBuy.toFixed(2);
    sellRateDisplay.innerText = totalSell.toFixed(2);

    if (activeInput === 'left') {
        rightInput.value = leftInput.value === '' ? '' : (amountLeft * baseRate).toFixed(4);
    } else {
        let amountRight = validateInput(rightInput);
        leftInput.value = rightInput.value === '' ? '' : (amountRight / baseRate).toFixed(4);
    }
}

function fetchData() {
    fetch(`${BASE_URL}?access_key=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                globalQuotes = data.quotes;
                renderUI();
            }
        })
        .catch(err => console.log("Xəta baş verdi:", err));
}

leftBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        leftCurrency = this.innerText.trim();
        setActiveButton(leftBtns, leftCurrency);
        renderUI();
    });
});

rightBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        rightCurrency = this.innerText.trim();
        setActiveButton(rightBtns, rightCurrency);
        renderUI();
    });
});

bankBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        activeBank = this.innerText.trim();
        setActiveButton(bankBtns, activeBank);
        renderUI();
    });
});

leftInput.addEventListener('input', () => {
    activeInput = 'left';
    renderUI();
});

rightInput.addEventListener('input', () => {
    activeInput = 'right';
    renderUI();
});

window.onload = () => {
    leftInput.value = "1";
    setActiveButton(leftBtns, leftCurrency);
    setActiveButton(rightBtns, rightCurrency);
    setActiveButton(bankBtns, activeBank);
    fetchData();
};
