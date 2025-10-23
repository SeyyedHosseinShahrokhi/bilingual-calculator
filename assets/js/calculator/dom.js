// src/calculator/dom.js
export function getCalculatorDOM() {
    const dom = {
        display: document.getElementById('txt_display'),
        result: document.getElementById('txt_result'),
        historyItems: document.getElementById('history-items'),
        copyButton: document.getElementById('btn-copy'),
        calculatorElement: document.querySelector('.calculator'),
        root: document.documentElement
    };
    if (!dom.display || !dom.result) {
        throw new Error("عناصر حیاتی ماشین حساب (نمایشگر) در DOM یافت نشدند.");
    }
    return dom;
}
