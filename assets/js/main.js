// (نسخه صفحه ماشین‌حساب)
import { getSharedDOM } from './shared/sharedDom.js';
import { getCalculatorDOM } from './calculator/dom.js';
import { initState, initI18n } from './calculator/state.js';
import { initController } from './calculator/controller.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const shared = getSharedDOM();
        const dom = { ...shared, ...getCalculatorDOM() };
        const state = initState();
        const i18n = initI18n();

        const controller = initController(dom, state, i18n);
        controller.initKeyMap();
        controller.initListeners();
        await controller.initApp();
    } catch (error) {
        console.error("خطای حیاتی در راه‌اندازی برنامه ماشین حساب:", error);
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="text-align: center; padding: 2rem; font-family: sans-serif; color: red;">
        <h1>خطای برنامه</h1>
        <p>متأسفانه ماشین حساب با یک خطای جدی مواجه شد و قابل اجرا نیست.</p>
        <p>جزئیات خطا در کنسول مرورگر ثبت شده است.</p>
      </div>`;
        }
    }

    window.addEventListener('online', () => console.log('🔌 آنلاین شد.'));
    window.addEventListener('offline', () => console.log('📴 آفلاین شد.'));
});
