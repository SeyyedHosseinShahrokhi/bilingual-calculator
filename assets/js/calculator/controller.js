
import {
    initNormalizationMaps, normalizeInput, normalizeInputChar,
    localizeDigits, formatToThreeDigits, formatNumber,
    isExpressionTerminalValid, findCurrentNumberBounds
} from './utils.js';
import { safeEvaluate } from './math.js';
import { getTranslations, loadLang as loadLangImpl } from './i18n.js';

export function initController(dom, state, i18n) {
    const { normalizationMap, normalizationRegex } = initNormalizationMaps(i18n);

    function toggleLoader(show) {
        if (dom.loader) dom.loader.classList.toggle('hidden', !show);
    }

    /**
     * نتیجه نمایش داده شده را در کلیپ‌بورد کاربر کپی می‌کند.
     * این تابع اکنون قابل پیش‌بینی است و همیشه چیزی را کپی می‌کند که کاربر در نمایشگر نتیجه می‌بیند.
     */
    async function copyResultToClipboard() {
        if (!navigator.clipboard) {
            console.warn("Clipboard API not available.");
            return;
        }
        const resultTextFromDOM = dom.result.textContent;
        if (!resultTextFromDOM || resultTextFromDOM === "Error") {
            console.log("No valid result to copy.");
            return;
        }
        const normalizedText = normalizeInput(resultTextFromDOM, normalizationRegex, normalizationMap);
        try {
            await navigator.clipboard.writeText(normalizedText);
            const originalIcon = dom.copyButton.innerHTML;
            dom.copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
            setTimeout(() => {
                if (dom.copyButton) dom.copyButton.innerHTML = originalIcon;
            }, 1500);
        } catch (err) {
            console.error('Failed to copy text to clipboard:', err);
        }
    }

    function triggerHapticFeedback() {
        if (navigator.vibrate) navigator.vibrate(50);
    }

    /**
     * نمایشگر اصلی و نتیجه را به‌روزرسانی می‌کند.
     */
    function updateDisplay() {
        if (!state.isOn) {
            dom.display.textContent = '';
            dom.result.textContent = localizeDigits('0', state, i18n);
            return;
        }

        dom.display.textContent = localizeDigits(state.expr, state, i18n);

        const previewReady = isExpressionTerminalValid(state.expr);
        const val = previewReady ? safeEvaluate(state.expr, normalizationRegex, normalizationMap) : state.lastResult;
        state.lastResult = val;

        console.log(state.expr, previewReady, state.lastResult, val);

        dom.result.textContent = localizeDigits(formatToThreeDigits(val), state, i18n);
    }

    /**
     * UI دکمه پاور را به‌روزرسانی می‌کند.
     * @param {HTMLElement} btnEl
     */
    async function updatePowerButtonUI(btnEl) {
        if (!btnEl) return;
        btnEl.setAttribute('aria-pressed', String(state.isOn));
        const dict = await getTranslations(i18n, state, state.defaultLang);
        const textKey = state.isOn ? 'on' : 'off';
        const text = dict[textKey];

        const textEl = btnEl.querySelector('.calc-end');
        if (textEl) {
            textEl.textContent = text;
            textEl.setAttribute('data-i18n', textKey);
        }
        btnEl.children[0].classList.toggle('calc-off', !state.isOn);
    }

    /**
     * UI دکمه‌های زبان را به‌روزرسانی می‌کند.
     * @param {string} lang - زبان فعال.
     */
    function updateLangButtons(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
        });
    }

    /**
     * وضعیت ماشین حساب را به حالت اولیه بازنشانی می‌کند.
     */
    function resetCalculator() {
        state.expr = '';
        state.lastResult = 0;
        state.justEvaluated = false;
        updateDisplay();
    }

    /**
     * ماشین حساب را روشن یا خاموش می‌کند.
     * @param {HTMLElement} btnEl - دکمه پاور که کلیک شده.
     */
    async function OffAndOn(btnEl) {
        state.isOn = !state.isOn;
        await updatePowerButtonUI(btnEl);

        if (!state.isOn) {
            resetCalculator();
            state.history = [];
            try {
                await updateHistoryUI();
            } catch (error) {
                console.error("خطا در به‌روزرسانی UI تاریخچه هنگام خاموش کردن:", error);
            }
        } else {
            updateDisplay();
        }
    }

    function DeleteAll() {
        if (state.isOn) resetCalculator();
    }

    /**
     * آخرین کاراکتر ورودی را حذف می‌کند.
     */
    function BackSpace() {
        if (!state.isOn) return;

        if (state.justEvaluated) {
            state.expr = '';
            state.justEvaluated = false;
        } else if (state.expr) {
            state.expr = state.expr.slice(0, -1);
        }
        updateDisplay();
    }

    /**
     * منطق وارد کردن عدد را مدیریت می‌کند.
     * @param {string} v - کاراکتر عددی یا نقطه.
     */
    function handleNumberInput(v) {
        const { start } = findCurrentNumberBounds(state.expr);
        const current = state.expr.slice(start);

        if (v === '.') {
            if (current.includes('.')) return;
            if (current === '' || /[+\-*/]$/.test(state.expr.slice(-1)) || state.expr === '') {
                state.expr += '0';
            }
        } else if (current === '0') {
            state.expr = state.expr.slice(0, -1);
        }
        state.expr += v;
    }

    /**
     * ورودی عدد یا نقطه را پردازش می‌کند.
     * @param {string} value
     */
    function showNumber(value) {
        if (!state.isOn) return;
        const raw = String(value).trim();
        const v = normalizeInputChar(raw, normalizationMap);
        if (!/^[0-9.]$/.test(v)) return;

        if (state.justEvaluated) {
            state.expr = '';
            state.justEvaluated = false;
        }

        handleNumberInput(v);
        updateDisplay();
    }

    /**
     * عبارت ریاضی را محاسبه می‌کند.
     */
    function _evaluateExpression() {
        if (!state.expr || state.justEvaluated || !isExpressionTerminalValid(state.expr)) return;

        const originalExpr = state.expr;
        const val = safeEvaluate(originalExpr, normalizationRegex, normalizationMap);
        state.lastResult = val;

        const formattedResult = formatNumber(val);
        state.justEvaluated = true;

        addToHistory(originalExpr, formattedResult);

        state.expr = formattedResult;
        updateDisplay();
    }

    /**
     * ورودی عملگرها و دکمه مساوی را پردازش می‌کند.
     * @param {string} value - دکمه‌ای که کلیک شده.
     */
    function operator(value) {
        if (!state.isOn) return;
        const raw = String(value).trim();
        const op = normalizeInputChar(raw, normalizationMap);

        if (op === '=') {
            _evaluateExpression();
            return;
        }
        if (!/[+\-*/]/.test(op)) return;
        if (!state.expr) return;

        const lastChar = state.expr.slice(-1);
        if (/[+\-*/.]/.test(lastChar)) {
            state.expr = state.expr.slice(0, -1) + op;
        } else {
            state.expr += op;
        }

        state.justEvaluated = false;
        updateDisplay();
    }

    /**
     * علامت عدد فعلی را مثبت/منفی
     */
    function AddNegative() {
        if (!state.isOn) return;
        if (String(state.expr).trim().length <= 0) return;
        if (state.justEvaluated) {
            state.expr = String(state.lastResult);
            state.justEvaluated = false;
        }

        const { start, end } = findCurrentNumberBounds(state.expr);
        const currentNum = state.expr.slice(start, end);
        console.log('expr: ' + state.expr, 'start: ' + start, 'end: ' + end, 'currentNum: ' + currentNum);

        const toggledNum = currentNum.startsWith('-') ? currentNum.slice(1) : '-' + currentNum;
        state.expr = state.expr.slice(0, start) + toggledNum + state.expr.slice(end);
        console.log('expr: ' + state.expr, 'start: ' + start, 'end: ' + end, 'currentNum: ' + currentNum);
        updateDisplay();
    }

    /**
     * تاریخچه محاسبات را به UI اضافه می‌کند.
     * @param {string} expr - عبارت محاسبه شده.
     * @param {string|number} result - نتیجه محاسبه.
     */
    function addToHistory(expr, result) {
        if (!expr || typeof result === 'undefined') return;
        state.history.push({ expr, result: String(result) });
        if (state.history.length > 50) {
            state.history.shift();
        }
        updateHistoryUI().catch(console.error);
    }

    /**
     * رابط کاربری بخش تاریخچه را به‌روزرسانی می‌کند.
     */
    async function updateHistoryUI() {
        if (!dom.historyItems) return;

        dom.historyItems.replaceChildren();

        if (state.history.length === 0) {
            const dict = await getTranslations(i18n, state, state.defaultLang);
            const p = document.createElement('p');
            p.textContent = dict['historyArticle'] || 'No history yet.';
            dom.historyItems.appendChild(p);
            return;
        }

        const fragment = document.createDocumentFragment();
        state.history.slice().reverse().forEach((item, index) => {
            const el = document.createElement('p');
            el.className = 'history-item';
            el.textContent = `${item.expr} = ${item.result}`;
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', index.toString());
            el.dir = 'ltr';
            el.dataset.action = 'load-from-history';
            el.dataset.expression = item.expr;
            fragment.appendChild(el);
        });
        dom.historyItems.appendChild(fragment);
    }

    /**
     * یک عبارت را از تاریخچه در نمایشگر بارگذاری می‌کند.
     * @param {string} expression - عبارتی که باید بارگذاری شود.
     */
    function loadFromHistory(expression) {
        if (typeof expression !== 'string') return;
        state.expr = expression;
        state.justEvaluated = false;
        updateDisplay();
        dom.display.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * زبان برنامه را بارگذاری و اعمال می‌کند.
     * @param {string} lang - کد زبان (مثلاً 'fa' یا 'en').
     */
    async function loadLang(lang) {
        await loadLangImpl(lang, dom, state, i18n, toggleLoader, updateDisplay, updateHistoryUI, updateLangButtons);
    }

    function updateKeyMap(i18n) {
        const mainActions = {
            ...Object.fromEntries(i18n.enDigits.map(d => [d, () => showNumber(d)])),
            '.': () => showNumber('.'),
            '+': () => operator('+'),
            '-': () => operator('-'),
            '*': () => operator('*'),
            '/': () => operator('/'),
            'enter': () => operator('='),
            'escape': () => DeleteAll(),
            'backspace': () => BackSpace(),
            'n': () => AddNegative()
        };

        const aliasActions = {
            '=': mainActions['enter'],
            'c': mainActions['escape'],
            'numpadadd': mainActions['+'],
            'numpadsubtract': mainActions['-'],
            'numpadmultiply': mainActions['*'],
            'numpaddivide': mainActions['/'],
            'numpaddecimal': mainActions['.'],
            'numpadenter': mainActions['enter'],
            'a': mainActions['+'],
            's': mainActions['-'],
            'm': mainActions['*'],
            'd': mainActions['/']
        };

        state.keyActionMap = { ...mainActions, ...aliasActions };
    }

    /**
     * انیمیشن فشردن کلید را روی دکمه متناظر اجرا می‌کند.
     * @param {string} key - کلید نرمال‌شده (مثلاً '5', '*', 'enter').
     */
    function animateKeyPress(key) {
        const keyMap = {
            '=': 'enter',
            'c': 'escape',
            'numpadadd': '+',
            'numpadsubtract': '-',
            'numpadmultiply': '*',
            'numpaddivide': '/',
            'numpaddecimal': '.',
            'numpadenter': 'enter',
            'a': '+',
            's': '-',
            'm': '*',
            'd': '/'
        };
        const targetKey = keyMap[key] || key;
        const button = dom.calculatorElement?.querySelector?.(`[data-key="${targetKey}"]`);
        if (button) {
            button.classList.add('key-pressed');
            setTimeout(() => { button.classList.remove('key-pressed'); }, 150);
        }
    }

    function handleKeyDown(e) {
        if (!state.isOn) return;

        let key = e.key;
        if (key.startsWith("Numpad") && !isNaN(parseInt(key.slice(-1)))) {
            key = key.slice(-1);
        }
        const normalizedKey = normalizeInput(key, normalizationRegex, normalizationMap).toLowerCase();
        const action = state.keyActionMap?.[normalizedKey];

        if (action) {
            e.preventDefault();
            animateKeyPress(normalizedKey);
            action();
        }
    }

    /**
     * کلیک‌های روی بخش اصلی دکمه‌ها (keypad) را مدیریت می‌کند.
     * @param {HTMLElement} button
     */
    function handleKeypadClick(button) {
        if (button.classList.contains('number') || button.classList.contains('dot')) {
            showNumber(button?.dataset?.value ?? button?.textContent ?? '');
        } else if (button.classList.contains('operator')) {
            operator(button?.dataset?.value ?? button?.textContent ?? '');
        } else if (button.id === 'btn-negate') {
            AddNegative();
        }
    }

    /**
     * کلیک‌های روی بخش کنترلی (controls) را مدیریت می‌کند.
     * @param {HTMLElement} button
     */
    function handleControlsClick(button) {
        if (button.id === 'btn-clear') {
            DeleteAll();
        } else if (button.id === 'btn-backspace') {
            BackSpace();
        } else if (button.classList.contains('operator')) {
            operator(button?.dataset?.value ?? button?.textContent ?? '');
        } else if (button.id === 'btn-power') {
            OffAndOn(button).catch(console.error);
        }
    }

    /**
     * مدیریت مرکزی رویداد کلیک با استفاده از Delegation.
     * این متد به عنوان تنها نقطه ورودی برای تمام کلیک‌ها عمل می‌کند.
     * @param {MouseEvent} event - آبجکت رویداد کلیک.
     */
    function handleGlobalClick(event) {
        const target = event.target;
        const calcButton = target.closest('.item');
        if (calcButton) {
            if (!state.isOn && calcButton.id !== 'btn-power') return;
            triggerHapticFeedback();

            const keypad = calcButton.closest('.keypad');
            const controls = calcButton.closest('.controls');
            const buttonId = calcButton.id;
            const buttonClassList = calcButton.classList;

            if (keypad) {
                handleKeypadClick(calcButton);
            } else if (controls) {
                handleControlsClick(calcButton);
            } else if (buttonClassList.contains('lang-btn')) {
                loadLang(calcButton.dataset.lang).catch(console.error);
            } else if (buttonId === 'btn-copy') {
                copyResultToClipboard().catch(console.error);
            }
            return;
        }

        const langButton = target.closest('.lang-btn');
        if (langButton) {
            const lang = langButton.dataset.lang;
            if (lang && lang !== state.defaultLang) {
                loadLang(lang).catch(error => {
                    console.error(`خطا در پردازش کلیک روی دکمه زبان '${lang}':`, error);
                });
            }
            return;
        }

        const historyItem = target.closest('.history-item');
        if (historyItem && historyItem.dataset.action === 'load-from-history') {
            if (!state.isOn) return;
            const expression = historyItem.dataset.expression;
            loadFromHistory(expression);
        }
    }

    /**
     * Event Listener های اصلی برنامه را ثبت می‌کند.
     */
    function initListeners() {
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * برنامه را با تشخیص زبان و بارگذاری ترجمه‌ها راه‌اندازی می‌کند.
     */
    async function initApp() {
        const lang = detectDefaultLang();
        try {
            await loadLang(lang);
        } catch (error) {
            console.error(`راه‌اندازی اولیه با زبان '${lang}' شکست خورد. استفاده از زبان پیش‌فرض.`, error);
            if (lang !== 'en') {
                await loadLang('en').catch(console.error);
            }
        }
        updateDisplay();
    }

    function detectDefaultLang() {
        const saved = localStorage.getItem(i18n.storageKey);
        if (saved && i18n.supported.includes(saved)) return saved;
        const base = navigator.language?.toLowerCase().split('-')[0] || state.defaultLang;
        return i18n.supported.includes(base) ? base : state.defaultLang;
    }

    function initKeyMap() {
        updateKeyMap(i18n);
    }

    // API کنترلر
    return {
        initListeners,
        initApp,
        initKeyMap,
        updateDisplay,
        updateHistoryUI,
        updateLangButtons,
        toggleLoader,
        copyResultToClipboard,
        showNumber,
        operator,
        AddNegative,
        DeleteAll,
        BackSpace,
        OffAndOn
    };
}
