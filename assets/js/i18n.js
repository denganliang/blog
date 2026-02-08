// ========================================
// Multilingual switcher
// ========================================

(function() {
  'use strict';

  const SUPPORTED_LANGS = ['zh', 'en'];

  function getPathLanguage(pathname = window.location.pathname) {
    return pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'zh';
  }

  function getStoredLanguage() {
    const savedLang = localStorage.getItem('lang');
    return SUPPORTED_LANGS.includes(savedLang) ? savedLang : null;
  }

  function getBrowserLanguage() {
    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return browserLang.startsWith('zh') ? 'zh' : 'en';
  }

  function getPreferredLanguage() {
    return getStoredLanguage() || getBrowserLanguage();
  }

  function getAlternateLanguageUrl(targetLang, pathname = window.location.pathname) {
    const currentLang = getPathLanguage(pathname);

    if (!SUPPORTED_LANGS.includes(targetLang) || currentLang === targetLang) {
      return pathname;
    }

    if (targetLang === 'en') {
      if (pathname === '/' || pathname === '/index.html') {
        return '/en/';
      }
      return `/en${pathname}`;
    }

    return pathname.replace(/^\/en/, '') || '/';
  }

  function switchLanguage(targetLang) {
    if (!SUPPORTED_LANGS.includes(targetLang)) {
      console.warn(`Unsupported language: ${targetLang}`);
      return;
    }

    localStorage.setItem('lang', targetLang);
    sessionStorage.setItem('lang-selected', 'true');

    const targetUrl = getAlternateLanguageUrl(targetLang);
    if (targetUrl !== window.location.pathname) {
      window.location.href = targetUrl;
    }
  }

  function updateLanguageToggle() {
    const langToggle = document.querySelector('.lang-toggle');
    if (!langToggle) return;

    const currentLang = getPathLanguage();
    const targetLang = currentLang === 'zh' ? 'en' : 'zh';

    langToggle.textContent = targetLang === 'en' ? 'English' : '中文';
    langToggle.setAttribute('data-lang', targetLang);
  }

  function autoRedirect() {
    if (sessionStorage.getItem('lang-selected')) return;

    const currentLang = getPathLanguage();
    const preferredLang = getPreferredLanguage();
    if (preferredLang === currentLang) return;

    const targetUrl = getAlternateLanguageUrl(preferredLang);
    if (targetUrl !== window.location.pathname) {
      window.location.replace(targetUrl);
    }
  }

  function init() {
    updateLanguageToggle();

    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', function() {
        const targetLang = this.getAttribute('data-lang') || 'en';
        switchLanguage(targetLang);
      });
    }

    autoRedirect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.I18n = {
    getCurrentLanguage: getPathLanguage,
    switchLanguage,
    getAlternateUrl: getAlternateLanguageUrl,
    getPreferredLanguage
  };

})();
