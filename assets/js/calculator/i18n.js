
import { normalizeInput } from './utils.js';

export function normalizeLang(lang, state, i18n) {
    if (!lang || typeof lang !== "string") return state.defaultLang;
    const base = lang.toLowerCase().split("-")[0];
    return i18n.supported.includes(base) ? base : state.defaultLang;
}

export function getMeta(i18n) {
    try {
        return JSON.parse(localStorage.getItem(i18n.metaKey) || "{}");
    } catch {
        return {};
    }
}

export function setMeta(i18n, meta = {}) {
    if (typeof window === "undefined" || !("localStorage" in window)) {
        console.warn("localStorage در این محیط پشتیبانی نمی‌شود.");
        return false;
    }

    if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
        console.error("meta باید یک آبجکت معتبر باشد.");
        return false;
    }

    const enrichedMeta = {
        ...meta,
        _version: meta._version || 1,
        _lastUpdated: Date.now()
    };

    try {
        const serialized = JSON.stringify(enrichedMeta);
        if (serialized.length > 5000) {
            console.warn("meta حجم بالایی دارد و ممکن است در کش مرورگر جا نشود.");
        }
        localStorage.setItem(i18n.metaKey, serialized);
        return true;
    } catch (err) {
        if (err.name === "QuotaExceededError" || err.code === 22) {
            console.error("فضای localStorage پر شده است.");
        } else {
            console.error("خطا در ذخیره‌سازی meta:", err);
        }
        return false;
    }
}

export function shouldReload(i18n, now, meta) {
    if (!meta || !meta.lastFetched) return true;
    return now - meta.lastFetched > i18n.reloadIntervalMs;
}

export async function readFromSWCache(i18n) {
    if (!("caches" in window)) return null;
    const res = await caches.match(i18n.endpoint);
    if (!res) return null;
    try { return await res.json(); } catch { return null; }
}

export async function fetchDatasetSmart(i18n) {
    const now = Date.now();
    const meta = getMeta(i18n);
    const headers = new Headers();

    if (meta.etag) headers.set("If-None-Match", meta.etag);
    if (meta.lastModified) headers.set("If-Modified-Since", meta.lastModified);

    const fetchOptions = {
        cache: shouldReload(i18n, now, meta) ? "reload" : "default",
        headers
    };
    const res = await fetch(i18n.endpoint, fetchOptions);

    if (res.status === 304) {
        const fromCache = await readFromSWCache(i18n);
        if (fromCache) {
            meta.lastFetched = now;
            setMeta(i18n, meta);
            return fromCache;
        }
        const fresh = await fetch(i18n.endpoint, { cache: "reload" }).then(r => r.json());
        meta.etag = null;
        meta.lastModified = null;
        meta.lastFetched = now;
        setMeta(i18n, meta);
        return fresh;
    }

    if (res.ok) {
        const data = await res.clone().json();
        meta.etag = res.headers.get("ETag") || meta.etag || null;
        meta.lastModified = res.headers.get("Last-Modified") || meta.lastModified || null;
        meta.lastFetched = now;
        setMeta(i18n, meta);
        return data;
    }

    const cached = await readFromSWCache(i18n);
    if (cached) return cached;
    throw new Error(`HTTP ${res.status}`);
}

export async function getTranslations(i18n, state, userLang) {
    const lang = userLang;

    if (i18n.translationsCache.has(lang)) {
        return i18n.translationsCache.get(lang);
    }

    if (i18n.datasetCache) {
        const picked = i18n.datasetCache[lang] || i18n.datasetCache[state.defaultLang] || {};
        i18n.translationsCache.set(lang, picked);
        return picked;
    }

    if (!i18n.inflight) {
        i18n.inflight = fetchDatasetSmart(i18n)
            .then(data => {
                i18n.datasetCache = data || {};
                return i18n.datasetCache;
            })
            .finally(() => {
                i18n.inflight = null;
            });
    }

    const dataset = await i18n.inflight;
    const picked = dataset[lang] || dataset[state.defaultLang] || {};
    i18n.translationsCache.set(lang, picked);
    return picked;
}

export function detectDefaultLang(i18n, state) {
    const saved = localStorage.getItem(i18n.storageKey);
    if (saved && i18n.supported.includes(saved)) return saved;
    return normalizeLang(navigator.language, state, i18n);
}

export function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-attr-aria-label]').forEach(el => {
        const key = el.dataset.i18nAttrAriaLabel;
        if (dict[key]) el.setAttribute('aria-label', dict[key]);
    });
}

export async function loadLang(lang, dom, state, i18n, toggleLoader, updateDisplay, updateHistoryUI, updateLangButtons) {
    if (!i18n.supported.includes(lang)) {
        throw new Error(`زبان '${lang}' پشتیبانی نمی‌شود.`);
    }

    toggleLoader(true);

    try {
        const dict = await getTranslations(i18n, state, lang);
        applyTranslations(dict);
        state.defaultLang = lang;
        dom.root.lang = lang;
        dom.root.dir = lang === 'fa' ? 'rtl' : 'ltr';
        updateLangButtons(lang);
        localStorage.setItem(i18n.storageKey, lang);
        updateDisplay();
        await updateHistoryUI();
    } catch (error) {
        console.error(`خطا در بارگذاری و اعمال زبان '${lang}':`, error);
        throw error;
    } finally {
        toggleLoader(false);
    }
}
