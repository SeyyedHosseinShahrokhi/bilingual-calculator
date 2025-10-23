/**
 * وضعیت داخلی (state) برنامه را مقداردهی اولیه می‌کند.
 */
export function initState() {
    return {
        isOn: true,
        expr: '',
        lastResult: 0,
        justEvaluated: false,
        history: [],
        defaultLang: 'fa',
        keyActionMap: null
    };
}

export function initI18n() {
    return {
        supported: ['fa', 'en'],
        storageKey: 'calc_lang',
        translationsCache: new Map(),
        endpoint: "/assets/i18n/lang-api.json",
        reloadIntervalMs: 24 * 60 * 60 * 1000, // 24h
        datasetCache: null, // کل مجموعهٔ ترجمه‌ها (اختیاری)
        inflight: null, // جلوگیری از چند fetch همزمان برای یک منبع
        metaKey: "i18n_meta", // فقط متادیتا: etag, lastModified, lastFetched
        faDigits: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
        arDigits: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
        enDigits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    };
}
