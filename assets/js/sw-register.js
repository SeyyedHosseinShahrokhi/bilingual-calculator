'use strict';

// فقط یک‌بار ثبت سرویس‌ورکر
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js', {scope: '/'})
            .then((reg) => {
                console.log('✅ Service Worker ثبت شد. اسکوپ:', reg.scope);

                // به‌صورت دوره‌ای بررسی آپدیت (اختیاری)
                // هر 30 دقیقه یک‌بار:
                setInterval(() => {
                    reg.update().catch(() => {
                    });
                }, 30 * 60 * 1000);

                // وقتی SW جدید پیدا شد (updatefound)
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        // وقتی SW به حالت installed می‌رسد و قبلی فعال است،
                        // یعنی آپدیت آماده است. می‌توانی به کاربر اعلان بدی برای رفرش.
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            console.log('🔄 نسخه جدید آماده است. صفحه را رفرش کنید.');
                            // اینجا می‌تونی یک بنر "آپدیت موجود است" نمایش بدی
                        }
                    });
                });
            })
            .catch((err) => {
                console.error('❌ خطا در ثبت Service Worker:', err);
            });

        // وقتی کنترل‌کننده SW تغییر کرد (بعد از آپدیت)، صفحه را یک‌بار رفرش کن (اختیاری)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('ℹ️ SW جدید کنترل صفحه را به‌عهده گرفت.');
            // اگر خواستی خودکار رفرش شود، این را باز کن.
            window.location.reload();
        });
    });
}
