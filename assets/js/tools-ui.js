/* ==============================================================
   Quiet Workbench · 在线工具板块交互运行时
   --------------------------------------------------------------
   全局契约：window.ToolUI（无依赖、无构建、ES2017、IIFE）
   加载位置：theme-switcher.js → i18n.js → main.js 之后，
            页面内联业务脚本之前（以便尽早接管 window.alert）。
   所有用户可控文本均通过 textContent 写入，禁止拼接 innerHTML。
   ============================================================== */
(function (window, document) {
  'use strict';

  /* ---------- 1. 双语消息字典 ---------- */
  var MESSAGES = {
    zh: {
      home: '首页',
      tools: '工具库',
      backToTools: '返回工具库',
      localOnly: '本地处理 · 数据不上传',
      loading: '正在处理…',
      loadingHint: '文件仅在当前浏览器中处理，请稍候',
      empty: '暂无内容',
      emptyHint: '完成上方操作后，结果会显示在这里',
      error: '操作失败',
      errorHint: '可重试，或复制详情便于排查',
      success: '处理完成',
      retry: '重试',
      copyDetails: '复制详情',
      copied: '已复制到剪贴板',
      copyFailed: '复制失败，请手动选择文本',
      remove: '移除',
      cancel: '取消',
      close: '关闭',
      dropTitle: '拖放文件到此处，或点击选择',
      dropHint: '点击或拖放文件，处理过程不会上传服务器',
      invalidType: '文件类型不支持，请检查所选文件',
      invalidSize: '文件体积超出限制，请选择更小的文件',
      dismiss: '关闭通知',
      shortcutHint: '按 / 快速搜索'
    },
    en: {
      home: 'Home',
      tools: 'Tools',
      backToTools: 'Back to tools',
      localOnly: 'Runs locally · Files stay on your device',
      loading: 'Processing…',
      loadingHint: 'Everything runs in your browser — please wait',
      empty: 'Nothing here yet',
      emptyHint: 'Results will appear here once you start',
      error: 'Something went wrong',
      errorHint: 'Retry, or copy details for troubleshooting',
      success: 'Done',
      retry: 'Retry',
      copyDetails: 'Copy details',
      copied: 'Copied to clipboard',
      copyFailed: 'Copy failed, please select the text manually',
      remove: 'Remove',
      cancel: 'Cancel',
      close: 'Close',
      dropTitle: 'Drop files here or click to browse',
      dropHint: 'Click or drop files — nothing is uploaded',
      invalidType: 'Unsupported file type, please check your selection',
      invalidSize: 'File is too large, please choose a smaller one',
      dismiss: 'Dismiss notification',
      shortcutHint: 'Press / to search'
    }
  };

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    shield: '<path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    success: '<circle cx="12" cy="12" r="9"/><path d="M8 12l2.6 2.6L16 9"/>',
    warn: '<path d="M10.3 4.3L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    error: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    inbox: '<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5 5h14l2 8v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5l2-8z"/>',
    spinner: '<path d="M12 3a9 9 0 109 9"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h8"/>'
  };

  function icon(name, className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (className) svg.setAttribute('class', className);
    /* 静态图标常量，不含任何外部输入 */
    svg.innerHTML = PATHS[name] || PATHS.info;
    return svg;
  }

  function lang() {
    if (window.I18n && typeof window.I18n.getCurrentLanguage === 'function') {
      try {
        var detected = window.I18n.getCurrentLanguage();
        if (detected === 'en' || detected === 'zh') return detected;
      } catch (err) { /* 回退到 lang 属性 */ }
    }
    return document.documentElement.lang === 'en' ? 'en' : 'zh';
  }

  function t(key, params) {
    var table = MESSAGES[lang()] || MESSAGES.zh;
    var value = table[key] || MESSAGES.zh[key] || key;
    if (!params) return value;
    return Object.keys(params).reduce(function (acc, name) {
      return acc.split('{' + name + '}').join(String(params[name]));
    }, value);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function toElement(target) {
    if (!target) return null;
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  /* ---------- 2. 通知队列（替代 alert） ---------- */
  var toastStack = null;
  var toastCount = 0;
  var MAX_TOASTS = 4;

  function ensureToastStack() {
    if (toastStack && toastStack.isConnected) return toastStack;
    toastStack = el('div', 'tool-toast-stack');
    toastStack.setAttribute('aria-live', 'polite');
    toastStack.setAttribute('aria-atomic', 'false');
    (document.body || document.documentElement).appendChild(toastStack);
    return toastStack;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('is-leaving');
    toast.parentNode.removeChild(toast);
    toastCount = Math.max(0, toastCount - 1);
  }

  function notify(kind, message, options) {
    var stack = ensureToastStack();
    var opts = options || {};
    var toast = el('div', 'tool-toast');
    toast.dataset.kind = kind;
    if (kind === 'error') toast.setAttribute('role', 'alert');

    var glyph = kind === 'success' ? 'success' : kind === 'warn' ? 'warn' : kind === 'error' ? 'error' : 'info';
    toast.appendChild(icon(glyph, 'tool-toast-icon'));

    var body = el('div', 'tool-toast-body');
    body.appendChild(el('div', 'tool-toast-text', message == null ? '' : String(message)));

    if (opts.actions && opts.actions.length) {
      var actions = el('div', 'tool-toast-actions');
      opts.actions.forEach(function (action) {
        var button = el('button', '', action.label);
        button.type = 'button';
        button.addEventListener('click', function () {
          if (typeof action.onClick === 'function') action.onClick();
          removeToast(toast);
        });
        actions.appendChild(button);
      });
      body.appendChild(actions);
    }
    toast.appendChild(body);

    var close = el('button', 'tool-toast-close');
    close.type = 'button';
    close.setAttribute('aria-label', t('dismiss'));
    close.appendChild(icon('close'));
    close.addEventListener('click', function () { removeToast(toast); });
    toast.appendChild(close);

    stack.appendChild(toast);
    toastCount += 1;
    while (toastCount > MAX_TOASTS && stack.firstElementChild) {
      removeToast(stack.firstElementChild);
    }

    var duration = opts.duration != null ? opts.duration : (kind === 'error' ? 8000 : 4600);
    if (duration > 0) window.setTimeout(function () { removeToast(toast); }, duration);
    return toast;
  }

  var notifyApi = {
    info: function (message, options) { return notify('info', message, options); },
    success: function (message, options) { return notify('success', message, options); },
    warn: function (message, options) { return notify('warn', message, options); },
    error: function (message, options) { return notify('error', message, options); }
  };

  /* 兼容入口：源码中的 alert(...) 统一改为 ToolUI.alert(...) */
  var SUCCESS_WORDS = /成功|完成|已保存|已复制|已生成|已导出|已下载|success|done|saved|copied|generated|exported|downloaded/i;

  function alertLike(message, options) {
    var text = message == null ? '' : String(message);
    var opts = options || {};
    var kind = opts.kind || (SUCCESS_WORDS.test(text) ? 'success' : 'error');
    var actions = opts.actions ? opts.actions.slice() : [];
    if (kind !== 'success') {
      actions.push({
        label: t('copyDetails'),
        onClick: function () { copy(text, null); }
      });
    }
    return notify(kind, text, { actions: actions, duration: opts.duration });
  }

  /* 兜底：任何遗留的原生 alert 也不会出现浏览器弹窗 */
  var nativeAlert = window.alert;
  try {
    window.alert = function (message) { return alertLike(message); };
  } catch (err) {
    /* 极端环境下不允许覆盖时，源码替换仍是主路径 */
  }

  /* ---------- 3. 状态容器 ---------- */
  var STATE_ICON = {
    loading: 'spinner',
    empty: 'inbox',
    error: 'error',
    success: 'success',
    idle: 'info'
  };

  function setState(container, state, detail) {
    var host = toElement(container);
    if (!host) return null;
    var box;
    if (host.classList && host.classList.contains('tool-state')) {
      box = host;
    } else {
      box = host.querySelector(':scope > .tool-state');
      if (!box) {
        box = el('div', 'tool-state');
        box.setAttribute('data-state-host', '');
        host.insertBefore(box, host.firstChild);
      }
    }
    var info = detail || {};
    var allowed = ['idle', 'loading', 'empty', 'error', 'success'];
    var next = allowed.indexOf(state) > -1 ? state : 'idle';
    box.dataset.state = next;
    box.textContent = '';
    box.appendChild(icon(STATE_ICON[next], 'tool-state-icon'));

    var body = el('div', 'tool-state-body');
    var title = info.title != null ? info.title : t(next === 'idle' ? 'empty' : next);
    body.appendChild(el('div', 'tool-state-title', title));
    var hint = info.message != null ? info.message : (next === 'error' ? t('errorHint') : next === 'loading' ? t('loadingHint') : next === 'empty' ? t('emptyHint') : '');
    if (hint) body.appendChild(el('div', 'tool-state-detail', hint));

    if (next === 'loading' && info.percent != null) {
      body.appendChild(buildProgress(info.percent, info.label));
    }

    if (info.actions && info.actions.length) {
      var actions = el('div', 'tool-state-actions');
      info.actions.forEach(function (action) {
        var button = el('button', 'tool-btn tool-btn--sm', action.label);
        button.type = 'button';
        button.addEventListener('click', function () {
          if (typeof action.onClick === 'function') action.onClick();
        });
        actions.appendChild(button);
      });
      body.appendChild(actions);
    }
    box.appendChild(body);
    if (next === 'error') box.setAttribute('role', 'alert');
    else box.removeAttribute('role');
    return box;
  }

  /* ---------- 4. 进度 ---------- */
  function buildProgress(percent, label) {
    var wrap = el('div', 'tool-progress-wrap');
    var bar = el('div', 'tool-progress');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    var value = Math.max(0, Math.min(100, Number(percent) || 0));
    bar.setAttribute('aria-valuenow', String(Math.round(value)));
    var fill = el('span');
    fill.style.width = value + '%';
    bar.appendChild(fill);
    wrap.appendChild(bar);
    var meta = el('div', 'tool-progress-label');
    meta.appendChild(el('span', '', label || t('loading')));
    meta.appendChild(el('b', '', Math.round(value) + '%'));
    wrap.appendChild(meta);
    return wrap;
  }

  function progress(target, percent, label) {
    var host = toElement(target);
    if (!host) return null;
    var existing = host.querySelector(':scope > .tool-progress-wrap');
    var next = buildProgress(percent, label);
    if (existing) host.replaceChild(next, existing);
    else host.appendChild(next);
    return next;
  }

  /* ---------- 5. 复制 ---------- */
  function copy(text, successMessage) {
    var value = String(text == null ? '' : text);
    var done = function (ok) {
      if (ok) notifyApi.success(successMessage === null ? t('copied') : (successMessage || t('copied')));
      else notifyApi.error(t('copyFailed'));
    };
    if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
      return window.navigator.clipboard.writeText(value)
        .then(function () { done(true); return true; })
        .catch(function () {
          var fallback = legacyCopy(value);
          done(fallback);
          return fallback;
        });
    }
    var ok = legacyCopy(value);
    done(ok);
    return Promise.resolve(ok);
  }

  function legacyCopy(value) {
    var area = el('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  /* ---------- 6. Tab 组件与渐进增强 ---------- */
  function syncTabState(root) {
    var list = toElement(root);
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.tab-btn, [role="tab"]'));
    tabs.forEach(function (tab) {
      var selected = tab.classList.contains('active') || tab.getAttribute('aria-selected') === 'true';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      var key = tab.getAttribute('data-tab');
      if (key) {
        tab.setAttribute('aria-controls', key);
        var panel = document.getElementById(key);
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          if (tab.id) panel.setAttribute('aria-labelledby', tab.id);
          panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
        }
      }
    });
  }

  function initTabs(root, options) {
    var list = toElement(root);
    if (!list) return null;
    var opts = options || {};
    list.setAttribute('role', 'tablist');
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.tab-btn, [role="tab"]'));

    tabs.forEach(function (tab, index) {
      if (!tab.id) tab.id = 'tool-tab-' + (list.id || 'group') + '-' + index;
      if (opts.manual !== false) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (other) {
            other.classList.toggle('active', other === tab);
          });
          window.requestAnimationFrame(function () { syncTabState(list); });
        });
      }
    });

    list.addEventListener('keydown', function (event) {
      var current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      tabs[next].focus();
      if (opts.activateOnArrow !== false) tabs[next].click();
    });

    syncTabState(list);
    return { root: list, sync: function () { syncTabState(list); } };
  }

  function enhanceNav(root) {
    var nav = toElement(root) || document.querySelector('.sub-nav');
    if (!nav) return null;
    var items = Array.prototype.slice.call(nav.querySelectorAll('.sub-nav-item'));
    var sync = function () {
      items.forEach(function (item) {
        var active = item.classList.contains('active') ||
          (item.getAttribute('href') && item.getAttribute('href') === window.location.hash);
        if (active) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
    };
    nav.setAttribute('aria-label', lang() === 'zh' ? '工具导航' : 'Tool navigation');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        items.forEach(function (other) { other.classList.remove('active'); });
        item.classList.add('active');
        sync();
      });
    });
    window.addEventListener('hashchange', sync);
    sync();
    return { root: nav, sync: sync };
  }

  /* ---------- 7. 投放区 ---------- */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function enhanceDropZone(zone, options) {
    var opts = options || {};
    var input = zone.querySelector('input[type="file"]');
    var accept = opts.accept || (input && input.getAttribute('accept')) || '';
    var maxSize = opts.maxSize || 0;

    if (!zone.hasAttribute('role')) zone.setAttribute('role', 'button');
    if (!zone.hasAttribute('tabindex')) zone.tabIndex = 0;
    if (!zone.getAttribute('aria-label')) zone.setAttribute('aria-label', t('dropTitle'));

    zone.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        if (input) input.click();
        else zone.click();
      }
    });

    /* 仅对显式标记 data-tool-drop="auto" 的投放区接管文件处理，
       其余页面保留自身拖拽逻辑，避免重复处理。 */
    zone.addEventListener('drop', function (event) {
      zone.classList.remove('drag-over');
      zone.removeAttribute('data-drag');
      if (opts.autoDrop !== true && zone.getAttribute('data-tool-drop') !== 'auto') return;
      if (event.defaultPrevented || !input || !event.dataTransfer || !event.dataTransfer.files.length) return;
      event.preventDefault();
      var files = event.dataTransfer.files;
      if (accept && !acceptMatches(files, accept)) {
        notifyApi.error(t('invalidType'));
        return;
      }
      if (maxSize && Array.prototype.some.call(files, function (file) { return file.size > maxSize; })) {
        notifyApi.error(t('invalidSize'));
        return;
      }
      try {
        input.files = files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (err) {
        console.warn('[ToolUI] Drop is not supported for this input', err);
      }
    });

    zone.addEventListener('dragover', function (event) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      zone.classList.add('drag-over');
      zone.setAttribute('data-drag', 'true');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
      zone.removeAttribute('data-drag');
    });

    return { root: zone, input: input };
  }

  function acceptMatches(files, accept) {
    var rules = accept.split(',').map(function (rule) { return rule.trim().toLowerCase(); }).filter(Boolean);
    return Array.prototype.every.call(files, function (file) {
      var name = (file.name || '').toLowerCase();
      var type = (file.type || '').toLowerCase();
      return rules.some(function (rule) {
        if (rule.charAt(0) === '.') return name.slice(-rule.length) === rule;
        if (rule.slice(-2) === '/*') return type.indexOf(rule.slice(0, -1)) === 0;
        return type === rule;
      });
    });
  }

  function initDropZone(root, options) {
    var zone = toElement(root);
    if (!zone) return null;
    var opts = options || {};
    if (!zone.classList.contains('tool-dropzone')) zone.classList.add('tool-dropzone');
    if (!zone.querySelector('.tool-dropzone-icon')) {
      zone.insertBefore(icon('upload', 'tool-dropzone-icon'), zone.firstChild);
    }
    if (opts.title) {
      var title = el('div', 'tool-dropzone-title', opts.title);
      zone.appendChild(title);
    }
    if (opts.hint) zone.appendChild(el('div', 'tool-dropzone-hint', opts.hint));
    return enhanceDropZone(zone, opts);
  }

  function renderFileList(host, files, onRemove) {
    var list = host.querySelector(':scope > .tool-file-list');
    if (!list) {
      list = el('div', 'tool-file-list');
      host.appendChild(list);
    }
    list.textContent = '';
    Array.prototype.forEach.call(files, function (file, index) {
      var row = el('div', 'tool-file-row');
      row.appendChild(icon('copy'));
      row.appendChild(el('span', 'tool-file-name', file.name));
      row.appendChild(el('span', 'tool-file-size', formatSize(file.size)));
      var remove = el('button', 'tool-file-remove', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', t('remove') + ' ' + file.name);
      remove.addEventListener('click', function (event) {
        event.stopPropagation();
        if (typeof onRemove === 'function') onRemove(index, file);
        else row.remove();
      });
      row.appendChild(remove);
      list.appendChild(row);
    });
    return list;
  }

  /* ---------- 8. 模态与焦点管理 ---------- */
  function openModal(root, options) {
    var content = toElement(root);
    if (!content) return null;
    var opts = options || {};
    var previous = document.activeElement;
    var backdrop = el('div', 'tool-modal-backdrop');
    var dialog = el('div', 'tool-modal');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', opts.label || t('success'));
    if (content.parentNode) content.parentNode.insertBefore(backdrop, content);
    else document.body.appendChild(backdrop);
    dialog.appendChild(content);
    backdrop.appendChild(dialog);
    content.removeAttribute('hidden');
    if (content.style) content.style.display = '';

    var focusables = function () {
      return Array.prototype.slice.call(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(function (node) { return !node.disabled && node.offsetParent !== null; });
    };
    var first = focusables()[0];
    if (first) first.focus();

    var onKey = function (event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      else if (event.key === 'Tab') {
        var nodes = focusables();
        if (!nodes.length) return;
        var firstNode = nodes[0];
        var lastNode = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === firstNode) { event.preventDefault(); lastNode.focus(); }
        else if (!event.shiftKey && document.activeElement === lastNode) { event.preventDefault(); firstNode.focus(); }
      }
    };
    var onBackdrop = function (event) { if (event.target === backdrop) close(); };
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', onBackdrop);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      backdrop.removeEventListener('click', onBackdrop);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (previous && typeof previous.focus === 'function') previous.focus();
      if (typeof opts.onClose === 'function') opts.onClose();
    }
    return { close: close, backdrop: backdrop, dialog: dialog };
  }

  /* ---------- 9. 页面框架自动增强 ---------- */
  function breadcrumb(title, showTrust) {
    var wrap = el('div', 'tool-workbench');
    var crumbs = el('nav', 'tool-breadcrumb');
    crumbs.setAttribute('aria-label', 'Breadcrumb');
    var home = el('a', '', t('home'));
    home.href = lang() === 'en' ? '/en/' : '/';
    crumbs.appendChild(home);
    crumbs.appendChild(el('span', 'tool-crumb-sep', '/'));
    var tools = el('a', '', t('tools'));
    tools.href = lang() === 'en' ? '/en/tools/' : '/tools/';
    crumbs.appendChild(tools);
    crumbs.appendChild(el('span', 'tool-crumb-sep', '/'));
    crumbs.appendChild(el('span', '', title));
    wrap.appendChild(crumbs);
    if (showTrust) wrap.appendChild(trustBadge());
    return wrap;
  }

  function trustBadge() {
    var badge = el('span', 'tool-trust');
    badge.appendChild(icon('shield'));
    badge.appendChild(el('span', '', t('localOnly')));
    return badge;
  }

  function pageTitle() {
    var heading = document.querySelector('.main-content h1');
    var raw = heading ? heading.textContent : (document.title || '').split('|')[0];
    return String(raw || '').replace(/^[\s\u2190-\u2BFF\uD800-\uDFFF\u2600-\u27BF\uFE0F]+/, '').trim() || 'Tools';
  }

  function enhanceFramework() {
    var isEnglish = lang() === 'en';
    var path = window.location.pathname;
    var isCatalog = /\/tools\/(?:index\.html)?$/.test(path) || /\/tools\/$/.test(path);
    var isCloudTool = /nano-banana\.html$/.test(path);
    if (isCatalog) return;

    /* 导航当前栏目 */
    var navLink = document.querySelector('.navbar-menu a[href="/tools/"], .navbar-menu a[href="/en/tools/"]');
    if (navLink) navLink.setAttribute('aria-current', 'page');

    var main = document.querySelector('.main-content');
    if (!main) return;
    var container = main.firstElementChild;
    if (!container) return;

    var existingCrumbs = container.querySelector('.breadcrumb, .tool-breadcrumb');
    var title = pageTitle();

    if (existingCrumbs && !existingCrumbs.classList.contains('tool-breadcrumb')) {
      existingCrumbs.classList.add('tool-breadcrumb');
      if (!isCloudTool && !existingCrumbs.querySelector('.tool-trust')) {
        existingCrumbs.appendChild(trustBadge());
      }
    } else if (!existingCrumbs) {
      container.insertBefore(breadcrumb(title, !isCloudTool), container.firstChild);
    }

    /* 工具箱页面头升级：去掉 emoji、补齐返回入口与可信标记 */
    var toolboxHeader = container.querySelector('.toolbox-header');
    if (toolboxHeader) {
      toolboxHeader.classList.add('tool-page-head');
      var heading = toolboxHeader.querySelector('h1');
      if (heading) heading.textContent = pageTitle();
      if (!toolboxHeader.querySelector('.tool-page-head-side')) {
        var side = el('div', 'tool-page-head-side');
        var back = el('a', 'tool-back', t('backToTools'));
        back.href = isEnglish ? '/en/tools/' : '/tools/';
        back.insertBefore(icon('arrowLeft'), back.firstChild);
        side.appendChild(back);
        if (!isCloudTool) side.appendChild(trustBadge());
        toolboxHeader.appendChild(side);
      }
    }
  }

  /* ---------- 9.1 图标与遗留弹层的渐进增强 ---------- */
  var EMOJI_RE = /[\uD800-\uDBFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F]/;

  function replaceEmojiIcons() {
    document.querySelectorAll('.tool-item h3 .icon, .upload-area > div').forEach(function (holder) {
      if (holder.children.length || !EMOJI_RE.test(holder.textContent || '')) return;
      var inUpload = !!holder.closest('.upload-area');
      var svg = icon(inUpload ? 'upload' : 'grid', inUpload ? 'tool-dropzone-icon' : 'tool-item-icon-svg');
      holder.textContent = '';
      holder.appendChild(svg);
      holder.classList.add('tool-item-icon');
      if (inUpload) holder.removeAttribute('style');
    });
  }

  function enhanceLegacyModal() {
    var modal = document.querySelector('.modal, #modal');
    if (!modal) return;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var title = modal.querySelector('#modalTitle, h2');
    if (title) {
      if (!title.id) title.id = 'tool-modal-title';
      modal.setAttribute('aria-labelledby', title.id);
    }
    var previousFocus = null;

    function isVisible() {
      try { return window.getComputedStyle(modal).display !== 'none'; }
      catch (err) { return modal.style.display !== 'none'; }
    }

    function focusables() {
      return Array.prototype.slice.call(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(function (node) { return !node.disabled; });
    }

    function sync() {
      var visible = isVisible();
      if (visible && !modal.dataset.toolModalOpen) {
        modal.dataset.toolModalOpen = '1';
        previousFocus = document.activeElement;
        var first = focusables()[0];
        if (first) first.focus();
      } else if (!visible && modal.dataset.toolModalOpen) {
        delete modal.dataset.toolModalOpen;
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
        previousFocus = null;
      }
    }

    document.addEventListener('keydown', function (event) {
      if (!isVisible()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        var closeButton = modal.querySelector('[id*="close" i], [data-close]');
        if (closeButton) closeButton.click();
        else modal.style.display = 'none';
        sync();
      } else if (event.key === 'Tab') {
        var nodes = focusables();
        if (!nodes.length) return;
        if (event.shiftKey && document.activeElement === nodes[0]) {
          event.preventDefault();
          nodes[nodes.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) {
          event.preventDefault();
          nodes[0].focus();
        }
      }
    });

    if (window.MutationObserver) {
      new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    sync();
  }

  function normalizeInlineHints() {
    var selectors = '.file-upload [style], .upload-area [style], .toolbox-header [style], ' +
      '.tool-item h3 [style], .main-content > .container > p[style], ' +
      '.editor-container > p[style], .photosign-container > p[style]';
    document.querySelectorAll(selectors).forEach(function (node) {
      ['font-size', 'color', 'margin-bottom', 'text-align'].forEach(function (prop) {
        node.style.removeProperty(prop);
      });
      if (!node.getAttribute('style')) node.removeAttribute('style');
    });
  }

  function enhanceAll() {
    enhanceFramework();
    replaceEmojiIcons();
    normalizeInlineHints();
    enhanceLegacyModal();
    document.querySelectorAll('.tab-nav, .tabs, .tool-segmented[role="tablist"]').forEach(function (list) {
      if (list.dataset.toolTabs === '1') return;
      list.dataset.toolTabs = '1';
      initTabs(list, { manual: false });
    });
    document.querySelectorAll('.sub-nav').forEach(function (nav) {
      if (nav.dataset.toolNav === '1') return;
      nav.dataset.toolNav = '1';
      enhanceNav(nav);
    });
    document.querySelectorAll('.file-upload, .tool-dropzone, .upload-area, #uploadArea, [data-dropzone]').forEach(function (zone) {
      if (zone.dataset.toolEnhanced === '1') return;
      zone.dataset.toolEnhanced = '1';
      enhanceDropZone(zone, {});
    });
    /* 页面业务脚本可能在 hash / history 驱动下切换面板，统一同步 ARIA */
    document.addEventListener('click', function (event) {
      var tab = event.target && event.target.closest ? event.target.closest('.tab-btn') : null;
      if (!tab) return;
      window.requestAnimationFrame(function () { syncTabState(tab.parentNode); });
    });
    window.addEventListener('hashchange', function () {
      document.querySelectorAll('.tab-nav').forEach(syncTabState);
    });
  }

  /* ---------- 10. 公开契约 ---------- */
  var ToolUI = {
    version: '1.0.0',
    lang: lang,
    t: t,
    icon: icon,
    nativeAlert: nativeAlert,
    alert: alertLike,
    notify: notifyApi,
    setState: setState,
    progress: progress,
    buildProgress: buildProgress,
    copy: copy,
    initTabs: initTabs,
    syncTabState: syncTabState,
    enhanceNav: enhanceNav,
    initDropZone: initDropZone,
    renderFileList: renderFileList,
    formatSize: formatSize,
    openModal: openModal,
    enhance: enhanceAll
  };
  window.ToolUI = ToolUI;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceAll);
  else window.requestAnimationFrame(enhanceAll);
})(window, document);
