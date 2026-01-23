// ========================================
// 多语言切换功能
// ========================================

(function() {
  'use strict';

  const SUPPORTED_LANGS = ['zh', 'en'];
  const DEFAULT_LANG = 'zh';

  // 获取用户语言偏好
  function getUserLanguage() {
    // 1. 检查localStorage
    const savedLang = localStorage.getItem('lang');
    if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
      return savedLang;
    }

    // 2. 检查URL路径
    const pathLang = getLanguageFromPath();
    if (pathLang) {
      return pathLang;
    }

    // 3. 检查浏览器语言
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }

    return DEFAULT_LANG;
  }

  // 从URL路径获取语言
  function getLanguageFromPath() {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/en/') || pathname === '/en') {
      return 'en';
    }
    return 'zh';
  }

  // 获取当前页面的另一语言版本URL
  function getAlternateLanguageUrl(targetLang) {
    const currentPath = window.location.pathname;
    const currentLang = getLanguageFromPath();

    if (currentLang === targetLang) {
      return currentPath;
    }

    if (targetLang === 'en') {
      // 切换到英文：添加 /en 前缀
      if (currentPath === '/' || currentPath === '/index.html') {
        return '/en/';
      }
      return '/en' + currentPath;
    } else {
      // 切换到中文：移除 /en 前缀
      return currentPath.replace(/^\/en/, '') || '/';
    }
  }

  // 切换语言
  function switchLanguage(targetLang) {
    if (!SUPPORTED_LANGS.includes(targetLang)) {
      console.warn(`Unsupported language: ${targetLang}`);
      return;
    }

    // 保存语言偏好
    localStorage.setItem('lang', targetLang);

    // 跳转到对应语言版本
    const targetUrl = getAlternateLanguageUrl(targetLang);
    if (targetUrl !== window.location.pathname) {
      window.location.href = targetUrl;
    }
  }

  // 更新语言切换按钮
  function updateLanguageToggle() {
    const langToggle = document.querySelector('.lang-toggle');
    if (!langToggle) return;

    const currentLang = getLanguageFromPath();
    const targetLang = currentLang === 'zh' ? 'en' : 'zh';

    langToggle.textContent = targetLang === 'en' ? 'English' : '中文';
    langToggle.setAttribute('data-lang', targetLang);
  }

  // 自动跳转到用户偏好语言（仅首次访问）
  function autoRedirect() {
    const userLang = getUserLanguage();
    const pathLang = getLanguageFromPath();

    // 如果用户偏好语言与当前路径语言不一致，且没有显式选择过语言，则跳转
    if (userLang !== pathLang && !sessionStorage.getItem('lang-selected')) {
      const targetUrl = getAlternateLanguageUrl(userLang);
      if (targetUrl !== window.location.pathname) {
        window.location.href = targetUrl;
      }
    }
  }

  // 初始化
  function init() {
    updateLanguageToggle();

    // 绑定语言切换按钮
    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', function() {
        const targetLang = this.getAttribute('data-lang') || 'en';
        sessionStorage.setItem('lang-selected', 'true'); // 标记用户已手动选择
        switchLanguage(targetLang);
      });
    }

    // 首次访问时自动跳转（可选，取消注释以启用）
    // autoRedirect();
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出到全局
  window.I18n = {
    getCurrentLanguage: getLanguageFromPath,
    switchLanguage: switchLanguage,
    getAlternateUrl: getAlternateLanguageUrl
  };

})();
