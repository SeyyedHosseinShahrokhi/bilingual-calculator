'use strict';

(function () {
    const THEME_KEY = 'calculator_theme';

    function getInitialTheme() {
        const storedTheme = localStorage.getItem(THEME_KEY);
        if (storedTheme) {
            return storedTheme;
        }
        // اگر تم ذخیره شده وجود ندارد، تم سیستم عامل را بررسی کن
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // بروزرسانی رنگ نوار آدرس مرورگر
        const lightThemeColor = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
        const darkThemeColor = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');

        if (theme === 'dark') {
            if (darkThemeColor) darkThemeColor.setAttribute('content', '#0A1929');
            if (lightThemeColor) lightThemeColor.setAttribute('content', '#0A1929');
        } else {
            if (darkThemeColor) darkThemeColor.setAttribute('content', '#F0F4F8');
            if (lightThemeColor) lightThemeColor.setAttribute('content', '#F0F4F8');
        }
    }

    // اعمال تم اولیه بلافاصله
    const currentTheme = getInitialTheme();
    applyTheme(currentTheme);

    // افزودن event listener پس از بارگذاری کامل DOM
    // این کار برای اطمینان از وجود دکمه است
    window.addEventListener('DOMContentLoaded', () => {
        const themeToggleButton = document.getElementById('theme-toggle');
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => {
                const oldTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = oldTheme === 'light' ? 'dark' : 'light';

                localStorage.setItem(THEME_KEY, newTheme);
                applyTheme(newTheme);
            });
        }
    });

})();