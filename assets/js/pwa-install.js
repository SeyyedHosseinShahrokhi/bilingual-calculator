'use strict';

(function () {
    const STORAGE_KEY = 'pwa_install_suppressed';

    const overlay = document.getElementById('pwa-popup-overlay');
    const modal = overlay.querySelector('.pwa-modal');
    const btnInstall = document.getElementById('pwa-btn-install');
    const btnCancel = document.getElementById('pwa-btn-cancel');
    const btnClose = overlay.querySelector('.pwa-modal-close');
    const chkDontShow = document.getElementById('pwa-dont-show-again');

    let deferredPrompt = null;
    let installed = false;
    let delayPassed = false;

    function lockScroll() {
        if (!document.body.classList.contains('pwa-modal-open')) {
            const sw = window.innerWidth - document.documentElement.clientWidth;
            if (sw > 0) document.body.style.paddingRight = sw + 'px';
            document.body.classList.add('pwa-modal-open');
        }
    }

    function unlockScroll() {
        document.body.classList.remove('pwa-modal-open');
        document.body.style.paddingRight = '';
    }

    const getFocusable = () =>
        Array.from(modal.querySelectorAll(
            'a[href],button:not([disabled]),textarea,input:not([type="hidden"]),select,[tabindex]:not([tabindex="-1"])'
        ));

    function trapFocusTab(e) {
        if (e.key !== 'Tab') return;
        const focusable = getFocusable();
        if (focusable.length === 0) { e.preventDefault(); modal.focus(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') hidePopup();
        else if (e.key === 'Tab') trapFocusTab(e);
    }

    function suppressForever() {
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }

    function showPopup() {
        if (installed || !deferredPrompt) return;
        if (localStorage.getItem(STORAGE_KEY) === '1') return;

        overlay.hidden = false;
        overlay.classList.add('is-active');
        overlay.removeAttribute('inert');
        lockScroll();
        (getFocusable()[0] || modal).focus({ preventScroll: true });

        document.addEventListener('keydown', onKeyDown, true);
        overlay.addEventListener('click', onBackdropClick);
    }

    function hidePopup() {
        document.removeEventListener('keydown', onKeyDown, true);
        overlay.removeEventListener('click', onBackdropClick);

        if (chkDontShow.checked) suppressForever();

        overlay.classList.remove('is-active');
        overlay.setAttribute('inert', '');
        overlay.hidden = true;
        unlockScroll();
    }

    function onBackdropClick(e) {
        if (e.target === overlay) hidePopup();
    }

    // رویدادهای PWA
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        if (delayPassed) showPopup();
    });

    window.addEventListener('appinstalled', () => {
        installed = true;
        suppressForever();
        hidePopup();
    });

    // دکمه‌ها
    btnInstall.addEventListener('click', async () => {
        hidePopup();
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') suppressForever();
        deferredPrompt = null;
    });

    [btnCancel, btnClose].forEach(btn => btn.addEventListener('click', hidePopup));

    // تاخیر نمایش برای تجربهٔ بهتر
    window.addEventListener('load', () => {
        setTimeout(() => {
            delayPassed = true;
            if (deferredPrompt && !installed) showPopup();
        }, 30000);
    });
})();
