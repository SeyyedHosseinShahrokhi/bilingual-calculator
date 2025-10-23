'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const retryBtn = document.querySelector('.offline-page__cta');
    const reconnectToast = document.getElementById('reconnect-toast');

    retryBtn.addEventListener('click', () => {
        window.location.reload();
    });

    window.addEventListener('online', () => {
        reconnectToast.classList.add('toast--visible');

        setTimeout(() => {
            window.location.reload();
        }, 2500);
    });

    window.addEventListener('offline', () => {
        reconnectToast.classList.remove('toast--visible');
    });
});