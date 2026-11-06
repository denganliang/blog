/* ==============================================================
   工具目录页控制器 · /tools/ 与 /en/tools/
   --------------------------------------------------------------
   职责：图标注入、分类筛选、防抖搜索、结果计数、空状态、
        URL 状态同步、快捷键与读屏播报、默认顺序与本地使用计数微调。
   依赖：window.ToolUI（tools-ui.js，必须先加载）
   ============================================================== */
(function (window, document) {
  'use strict';

  var ICON_PATHS = {
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2zM5 14l.6 1.6L7.2 16l-1.6.6L5 18.2l-.6-1.6L2.8 16l1.6-.4L5 14z"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L6 20"/>',
    audio: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    eraser: '<path d="M8 20h12"/><path d="M14.5 4.5l5 5a2 2 0 010 2.8L11 20.8a2 2 0 01-1.4.6H5.5L3 18.9a2 2 0 010-2.8L12.2 6a2 2 0 012.3-1.5z"/><path d="M9 11l6 6"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6M12 2v3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.4 3.8 5.5 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3z"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    markdown: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 15V9l3 3 3-3v6M15 9v6M15 15l-1-1M15 15l2-2"/>',
    palette: '<path d="M12 3a9 9 0 000 18h1.5a2 2 0 000-4H12a2 2 0 010-4h5a4 4 0 004-4 6 6 0 00-9-6z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    shield: '<path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
  };

  var MESSAGES = {
    zh: {
      count: '共 {n} 个工具',
      countFiltered: '找到 {n} 个工具',
      categoryLabel: '分类：{name}',
      clearFilter: '清除筛选',
      searchPlaceholder: '搜索工具、功能或关键词…',
      noResult: '没有找到匹配的工具',
      noResultHint: '试试更短的关键词，或清除筛选条件',
      tryKeyword: '试试：',
      shortcutHint: '按 / 快速搜索',
      clearSearch: '清除搜索',
      all: '所有工具',
      upcoming: '即将推出',
      suggestTitle: '有工具建议？',
      suggestText: '如果你有工具建议或功能需求，欢迎在 GitHub 提出。',
      suggestAction: '在 GitHub 提建议',
      localOnly: '本地处理 · 数据不上传',
      resetOrder: '恢复默认顺序',
      orderRestored: '已恢复默认顺序'
    },
    en: {
      count: '{n} tools',
      countFiltered: '{n} tools found',
      categoryLabel: 'Category: {name}',
      clearFilter: 'Clear filters',
      searchPlaceholder: 'Search tools, features or keywords…',
      noResult: 'No matching tools',
      noResultHint: 'Try a shorter keyword or clear the filters',
      tryKeyword: 'Try:',
      shortcutHint: 'Press / to search',
      clearSearch: 'Clear search',
      all: 'All tools',
      upcoming: 'Coming soon',
      suggestTitle: 'Have a tool idea?',
      suggestText: 'Suggestions and feature requests are welcome on GitHub.',
      suggestAction: 'Suggest on GitHub',
      localOnly: 'Runs locally · Files stay on your device',
      resetOrder: 'Reset order',
      orderRestored: 'Default order restored'
    }
  };

  function lang() {
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

  function createIcon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICON_PATHS[name] || ICON_PATHS.code;
    return svg;
  }

  function injectIcons() {
    document.querySelectorAll('.tool-card').forEach(function (card) {
      var holder = card.querySelector('.tool-card-icon');
      if (!holder || holder.firstChild) return;
      holder.appendChild(createIcon(card.getAttribute('data-icon') || 'code'));
    });
    document.querySelectorAll('[data-inline-icon]').forEach(function (holder) {
      if (holder.firstChild) return;
      holder.appendChild(createIcon(holder.getAttribute('data-inline-icon')));
    });
    document.querySelectorAll('.tool-hero-stats .tool-stat').forEach(function (stat) {
      var glyph = stat.querySelector('[data-stat-icon]');
      if (glyph && !glyph.firstChild) glyph.appendChild(createIcon(glyph.getAttribute('data-stat-icon')));
    });
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  /* ---------- 本地使用计数（仅存浏览器，不含任何个人信息） ---------- */
  var USAGE_KEY = 'tools:usage:v1';
  var MAX_PROMOTION = 8;

  function slugFromCard(card) {
    var href = (card.getAttribute('href') || '').split('?')[0].split('#')[0];
    return (href.split('/').pop() || '').replace(/\.html$/i, '');
  }

  function readUsage() {
    var result = {};
    try {
      var raw = window.localStorage.getItem(USAGE_KEY);
      if (!raw) return result;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return result;
      Object.keys(parsed).slice(0, 100).forEach(function (key) {
        var value = parsed[key];
        if (typeof value !== 'number' || !isFinite(value) || value <= 0) return;
        result[key] = Math.min(Math.floor(value), MAX_PROMOTION);
      });
    } catch (err) {
      console.warn('[tools-index] usage data ignored:', err && err.message ? err.message : err);
      return {};
    }
    return result;
  }

  function writeUsage(usage, knownSlugs) {
    try {
      var clean = {};
      Object.keys(usage).forEach(function (key) {
        if (knownSlugs.indexOf(key) > -1 && usage[key] > 0) clean[key] = usage[key];
      });
      window.localStorage.setItem(USAGE_KEY, JSON.stringify(clean));
    } catch (err) {
      /* 隐私模式或配额不足时静默降级，不影响导航 */
    }
  }

  function clearUsage() {
    try { window.localStorage.removeItem(USAGE_KEY); } catch (err) { /* ignore */ }
  }

  function init() {
    var search = document.getElementById('tool-search');
    var grid = document.getElementById('tools-grid');
    if (!search || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.tool-card'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.tool-filter-chip'));
    var countNode = document.getElementById('tool-result-count');
    var filterLabel = document.getElementById('tool-filter-label');
    var reset = document.getElementById('tool-reset');
    var empty = document.getElementById('tool-empty');
    var clearButton = document.getElementById('tool-search-clear');
    var suggestions = document.getElementById('tool-suggestions');
    var orderReset = document.getElementById('tool-order-reset');
    var defaultOrder = cards.slice();
    var slugs = cards.map(slugFromCard);

    /* 一次性缓存每张卡片的规范化可搜索文本 */
    var index = cards.map(function (card) {
      var parts = [
        card.querySelector('.card-title') ? card.querySelector('.card-title').textContent : '',
        card.querySelector('.card-description') ? card.querySelector('.card-description').textContent : '',
        card.getAttribute('data-keywords') || '',
        card.querySelector('.tool-card-tags') ? card.querySelector('.tool-card-tags').textContent : ''
      ];
      return {
        node: card,
        categories: (card.getAttribute('data-categories') || '').split(','),
        text: normalize(parts.join(' '))
      };
    });

    /* 分类计数（静态全量，不受搜索影响） */
    var categoryCounts = {};
    index.forEach(function (entry) {
      entry.categories.forEach(function (name) {
        categoryCounts[name] = (categoryCounts[name] || 0) + 1;
      });
    });
    chips.forEach(function (chip) {
      var badge = chip.querySelector('.tool-filter-count');
      if (!badge) return;
      var key = chip.getAttribute('data-category');
      badge.textContent = String(key === 'all' ? cards.length : (categoryCounts[key] || 0));
    });

    var state = { category: 'all', query: '' };

    function readUrl() {
      try {
        var params = new URLSearchParams(window.location.search);
        var cat = params.get('cat');
        var q = params.get('q');
        if (cat && chips.some(function (chip) { return chip.getAttribute('data-category') === cat; })) state.category = cat;
        if (q) state.query = q;
      } catch (err) {
        /* URLSearchParams 不可用时忽略 URL 状态 */
      }
      search.value = state.query;
    }

    function writeUrl() {
      if (!window.history || !window.history.replaceState) return;
      var params = new URLSearchParams();
      if (state.query) params.set('q', state.query);
      if (state.category !== 'all') params.set('cat', state.category);
      var query = params.toString();
      var next = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
      try { window.history.replaceState(null, '', next); } catch (err) { /* 忽略受限环境 */ }
    }

    function render(announce) {
      var terms = state.query.split(/\s+/).filter(Boolean).map(normalize);
      var visible = 0;
      index.forEach(function (entry) {
        var matchesCategory = state.category === 'all' || entry.categories.indexOf(state.category) > -1;
        var matchesQuery = terms.every(function (term) { return entry.text.indexOf(term) > -1; });
        var show = matchesCategory && matchesQuery;
        entry.node.hidden = !show;
        if (show) visible += 1;
      });

      if (countNode) {
        countNode.textContent = (state.query || state.category !== 'all')
          ? t('countFiltered', { n: visible })
          : t('count', { n: cards.length });
      }
      if (filterLabel) {
        var activeChip = chips.filter(function (chip) { return chip.getAttribute('data-category') === state.category; })[0];
        var name = activeChip ? activeChip.getAttribute('data-label') : t('all');
        filterLabel.textContent = state.category === 'all' ? '' : t('categoryLabel', { name: name });
        filterLabel.hidden = state.category === 'all';
      }
      if (reset) reset.hidden = state.category === 'all' && !state.query;
      if (empty) empty.hidden = visible !== 0;
      if (clearButton) clearButton.hidden = !state.query;
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.getAttribute('data-category') === state.category ? 'true' : 'false');
      });
      if (announce && countNode) {
        var bar = countNode.closest ? countNode.closest('.tool-result-bar') : countNode.parentNode;
        if (!bar) bar = countNode.parentNode;
        bar.setAttribute('data-updated', '');
        window.setTimeout(function () { bar.removeAttribute('data-updated'); }, 320);
      }
      writeUrl();
    }

    /* 一次性重排：保持空状态节点始终是网格最后一个子节点 */
    function reorder(nodes) {
      var fragment = document.createDocumentFragment();
      nodes.forEach(function (node) { fragment.appendChild(node); });
      grid.insertBefore(fragment, empty && empty.parentNode === grid ? empty : null);
    }

    /* 阻尼规则：每次点击最多前移一位，同分按默认位置稳定兜底 */
    function applyUsageOrder() {
      var usage = readUsage();
      var hasUsage = slugs.some(function (slug) { return usage[slug] > 0; });
      if (orderReset) {
        orderReset.textContent = t('resetOrder');
        orderReset.hidden = !hasUsage;
      }
      if (!hasUsage) return;

      var ranked = cards.map(function (card, position) {
        var count = usage[slugs[position]] || 0;
        return {
          node: card,
          count: count,
          effective: position - Math.min(count, MAX_PROMOTION),
          position: position
        };
      });
      ranked.sort(function (a, b) {
        return a.effective - b.effective || b.count - a.count || a.position - b.position;
      });
      var changed = ranked.some(function (entry, i) { return entry.node !== cards[i]; });
      if (changed) reorder(ranked.map(function (entry) { return entry.node; }));
    }

    function restoreDefaultOrder() {
      clearUsage();
      reorder(defaultOrder);
      if (orderReset) orderReset.hidden = true;
      render(true);
      search.focus();
      if (window.ToolUI && window.ToolUI.notify && window.ToolUI.notify.success) {
        window.ToolUI.notify.success(t('orderRestored'));
      }
    }

    var debounceTimer = null;
    search.addEventListener('input', function () {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(function () {
        state.query = normalize(search.value);
        render(true);
      }, 160);
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.category = chip.getAttribute('data-category') || 'all';
        render(true);
      });
    });

    function clearAll() {
      state.category = 'all';
      state.query = '';
      search.value = '';
      render(true);
      search.focus();
    }

    if (reset) reset.addEventListener('click', clearAll);

    grid.addEventListener('click', function (event) {
      var target = event.target;
      var card = target && target.closest ? target.closest('.tool-card') : null;
      if (!card || !grid.contains(card)) return;
      var slug = slugFromCard(card);
      if (slugs.indexOf(slug) === -1) return;
      var usage = readUsage();
      usage[slug] = Math.min((usage[slug] || 0) + 1, MAX_PROMOTION);
      writeUsage(usage, slugs);
      /* 本次访问不重排：新顺序在下次进入目录页时生效 */
    });

    if (orderReset) orderReset.addEventListener('click', restoreDefaultOrder);
    if (clearButton) clearButton.addEventListener('click', function () {
      state.query = '';
      search.value = '';
      render(true);
      search.focus();
    });

    if (suggestions) {
      suggestions.addEventListener('click', function (event) {
        var button = event.target && event.target.closest ? event.target.closest('[data-suggest]') : null;
        if (!button) return;
        state.query = normalize(button.getAttribute('data-suggest'));
        search.value = state.query;
        render(true);
        search.focus();
      });
    }

    document.addEventListener('keydown', function (event) {
      var tag = document.activeElement ? document.activeElement.tagName : '';
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        (document.activeElement && document.activeElement.isContentEditable);
      var shortcut = event.key === '/' && !typing || (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey));
      if (shortcut) {
        event.preventDefault();
        search.focus();
        search.select();
      } else if (event.key === 'Escape' && document.activeElement === search) {
        if (search.value) {
          state.query = '';
          search.value = '';
          render(true);
        }
        search.blur();
      }
    });

    search.placeholder = t('searchPlaceholder');
    if (clearButton) clearButton.setAttribute('aria-label', t('clearSearch'));
    if (orderReset) {
      orderReset.textContent = t('resetOrder');
      orderReset.setAttribute('aria-label', t('resetOrder'));
    }
    applyUsageOrder();
    readUrl();
    render(false);
  }

  injectIcons();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
