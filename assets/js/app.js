import { getSharedDOM } from './shared/sharedDom.js';

// فقط صفحات عمومی که loader دارند:
document.addEventListener('DOMContentLoaded', () => {
    try {
        const shared = getSharedDOM();
        // نمونه استفاده از loader مشترک
        if (shared.loader) {
            shared.loader.classList.add('hidden'); // یا نمایش/پنهان‌سازی
        }
    } catch (error) {
        console.error("خطا در راه‌اندازی عمومی:", error);
    }
});
