/**
 * نگاشت‌ها و RegExp های مورد نیاز برای تبدیل کاراکترها را می‌سازد.
 */
export function initNormalizationMaps(i18n) {
    const faMap = Object.fromEntries(i18n.faDigits.map((d, i) => [d, String(i)]));
    const arMap = Object.fromEntries(i18n.arDigits.map((d, i) => [d, String(i)]));
    const normalizationMap = {
        ...faMap,
        ...arMap,
        '٬': '', '،': '', ',': '', '÷': '/', '×': '*', '−': '-',
    };
    const normalizationRegex = new RegExp(Object.keys(normalizationMap).join('|'), 'g');
    return { normalizationMap, normalizationRegex };
}

export function normalizeInput(str, normalizationRegex, normalizationMap) {
    return String(str).replace(normalizationRegex, match => normalizationMap[match]);
}

export function normalizeInputChar(ch, normalizationMap) {
    return normalizationMap[ch] || ch;
}

export function localizeDigits(str, state, i18n) {
    if (state.defaultLang !== 'fa') return String(str);
    return String(str).replace(/[0-9]/g, d => i18n.faDigits[Number(d)]);
}

export function formatToThreeDigits(input) {
    if (input === null || input === undefined || isNaN(parseFloat(input))) {
        return '0';
    }
    let numStr = String(input);
    const [integerPart, decimalPart] = numStr.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

export function formatNumber(num) {
    if (!isFinite(num)) return 'Infinity';
    const rounded = Number(num.toPrecision(12));
    const roundedStr = String(rounded);
    return roundedStr.length > 14 ? rounded.toExponential(8).replace('+', '') : roundedStr;
}

export function isExpressionTerminalValid(expr) {
    if (!expr) return '';
    const sanitized = expr.trim();
    return sanitized && /[0-9)]$/.test(sanitized.slice(-1));
}

export function findCurrentNumberBounds(s) {
    if (!s) return { start: s.length, end: s.length };
    let i = s.length - 1;
    while (i >= 0 && /[0-9.]/.test(s[i])) {
        i--;
    }
    const isUnary = (i >= 0 && s[i] === '-' && (i === 0 || /[+\-*/]/.test(s[i - 1])));
    const start = isUnary ? i : i + 1;
    return { start, end: s.length };
}
