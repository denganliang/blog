/* ==============================================================
   Quiet Workbench · 开发工具箱卡片可用性增强
   --------------------------------------------------------------
   仅用于 tools/dev-toolbox.html 与 en/tools/dev-toolbox.html。
   不改动任何工具算法，只补齐表单语义、结果操作与状态反馈。
   文案取自各卡片上的 data-* 属性与下方中英小字典。
   ============================================================== */
(function (window, document) {
  'use strict';

  var I18N = {
    zh: {
      copyResult: '复制结果',
      example: '填入示例',
      clear: '清空',
      resultEmpty: '暂无可复制的结果，请先执行一次操作',
      resultCopied: '结果已复制到剪贴板',
      exampleFilled: '已填入示例，点击操作按钮即可查看结果'
    },
    en: {
      copyResult: 'Copy result',
      example: 'Use example',
      clear: 'Clear',
      resultEmpty: 'Nothing to copy yet — run a tool first',
      resultCopied: 'Result copied to clipboard',
      exampleFilled: 'Example filled in — run the tool to see the result'
    }
  };

  /* 结果是 innerHTML 的容器统一挂 class，便于限域样式接管 */
  var RESULT_PANEL_IDS = [
    'diff-result', 'time-diff-result', 'timestamp-result', 'date-result',
    'hash-results', 'qr-decode-result', 'regex-result', 'base-results'
  ];

  var fieldSeq = 0;

  function lang() {
    var root = document.documentElement;
    return root && String(root.lang || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh';
  }

  function t(key) {
    return (I18N[lang()] || I18N.zh)[key] || key;
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function cards() {
    return toArray(document.querySelectorAll('.tool-item[id]'));
  }

  /* 不依赖 Element.closest，便于零依赖环境冒烟测试 */
  function cardFrom(node) {
    var current = typeof node === 'string' ? document.getElementById(node) : node;
    while (current) {
      if (current.classList && current.classList.contains('tool-item')) return current;
      current = current.parentNode;
    }
    return null;
  }

  function directChild(card, className) {
    for (var i = 0; i < card.children.length; i++) {
      var child = card.children[i];
      if (child.classList && child.classList.contains(className)) return child;
    }
    return null;
  }

  function stateBox(card, create) {
    var box = directChild(card, 'tool-inline-state');
    if (!box && create) {
      box = document.createElement('div');
      box.className = 'tool-inline-state';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      box.hidden = true;
      card.appendChild(box);
    }
    return box;
  }

  function show(card, kind, message) {
    var box = stateBox(card, true);
    box.setAttribute('data-state', kind);
    box.textContent = message == null ? '' : String(message);
    box.hidden = !box.textContent;
    box.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  }

  /* 统一错误 / 成功 / 空状态；target 可为结果元素或工具 id */
  function report(target, kind, message) {
    var card = cardFrom(target);
    var node = typeof target === 'string' ? null : target;
    if (!card) {
      if (window.ToolUI && window.ToolUI.notify) window.ToolUI.notify.error(String(message));
      return;
    }
    if (node && node !== card && node.innerHTML !== undefined) node.innerHTML = '';
    show(card, kind, message);
  }

  function clear(target) {
    var card = cardFrom(target);
    var node = typeof target === 'string' ? null : target;
    if (node && node !== card && node.classList && node.classList.contains('error')) {
      node.textContent = '';
    }
    if (!card) return;
    var box = stateBox(card, false);
    if (box) {
      box.textContent = '';
      box.hidden = true;
      box.setAttribute('data-state', 'idle');
    }
  }

  /* 取代散落的工具内 alert：错误就地显示在卡片内，不再打断操作 */
  function alert(message) {
    var card = document.activeElement ? cardFrom(document.activeElement) : null;
    if (card) report(card, 'error', message);
    else if (window.ToolUI && window.ToolUI.notify) window.ToolUI.notify.error(String(message));
  }

  function resultText(card) {
    var sourceId = card.getAttribute('data-copy-source');
    var source = sourceId ? document.getElementById(sourceId) : null;
    if (!source) return '';
    if (typeof source.value === 'string') return source.value.trim();
    var clone = source.cloneNode(true);
    toArray(clone.querySelectorAll('button')).forEach(function (button) {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
    return String(clone.textContent || '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function copyResult(button) {
    var card = cardFrom(button);
    if (!card) return;
    var text = resultText(card);
    if (!text) {
      show(card, 'empty', t('resultEmpty'));
      return;
    }
    if (window.ToolUI && window.ToolUI.copy) window.ToolUI.copy(text, t('resultCopied'));
    show(card, 'success', t('resultCopied'));
  }

  function fillExample(button) {
    var card = cardFrom(button);
    if (!card) return;
    var field = card.querySelector('.io-section textarea:not([readonly]), .io-section input[type="text"]');
    if (!field) return;
    field.value = card.getAttribute('data-example') || '';
    show(card, 'success', t('exampleFilled'));
    if (field.focus) field.focus();
  }

  /* 通用清空：供原本没有清空入口的卡片使用 */
  function clearTool(button) {
    var card = cardFrom(button);
    if (!card) return;
    toArray(card.querySelectorAll('input, textarea')).forEach(function (node) {
      if (node.type === 'checkbox') node.checked = false;
      else node.value = '';
    });
    toArray(card.querySelectorAll('.tool-result-panel')).forEach(function (node) {
      node.innerHTML = '';
    });
    clear(card);
  }

  function makeButton(className, label, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  /* label 与控件建立 for / id 关联，读屏与点击聚焦都可用 */
  function enhanceLabels() {
    cards().forEach(function (card) {
      toArray(card.querySelectorAll('.io-section > label')).forEach(function (label) {
        if (label.getAttribute('for') || label.querySelector('input, textarea, select')) return;
        var control = label.nextElementSibling;
        if (!control || !/^(INPUT|TEXTAREA|SELECT)$/.test(control.tagName)) return;
        if (!control.id) control.id = card.id + '-field-' + (++fieldSeq);
        label.setAttribute('for', control.id);
      });
    });
  }

  /* 每张卡片标题下补一行简短说明，减少「不知道该填什么」 */
  function enhanceHints() {
    cards().forEach(function (card) {
      var text = card.getAttribute('data-hint');
      if (!text || directChild(card, 'tool-hint')) return;
      var hint = document.createElement('p');
      hint.className = 'tool-hint';
      hint.textContent = text;
      var heading = card.querySelector('h3');
      if (heading && heading.nextSibling) card.insertBefore(hint, heading.nextSibling);
      else if (heading) card.appendChild(hint);
    });
  }

  function enhanceResultPanels() {
    RESULT_PANEL_IDS.forEach(function (id) {
      var panel = document.getElementById(id);
      if (panel && panel.classList) panel.classList.add('tool-result-panel');
    });
  }

  /* 统一注入：复制结果 / 填入示例 / 清空 / 状态条 */
  function enhanceActions() {
    cards().forEach(function (card) {
      var groups = card.querySelectorAll('.btn-group');
      var host = groups.length ? groups[0] : null;
      if (!host) {
        host = document.createElement('div');
        host.className = 'btn-group tool-result-actions';
        card.appendChild(host);
      }

      if (card.getAttribute('data-example') && !host.querySelector('[data-fill-example]')) {
        var exampleButton = makeButton('tool-btn tool-btn--ghost tool-btn--sm', t('example'), function () {
          fillExample(exampleButton);
        });
        exampleButton.setAttribute('data-fill-example', '');
        host.insertBefore(exampleButton, host.firstChild);
      }

      if (card.getAttribute('data-copy-source') && !host.querySelector('[data-copy-result]')) {
        var copyButton = makeButton('tool-btn tool-btn--ghost tool-btn--sm', t('copyResult'), function () {
          copyResult(copyButton);
        });
        copyButton.setAttribute('data-copy-result', '');
        host.appendChild(copyButton);
      }

      var hasClear = toArray(card.querySelectorAll('[onclick]')).some(function (node) {
        return /^clear/i.test(String(node.getAttribute('onclick') || '').trim());
      });
      if (!hasClear && !host.querySelector('[data-clear-tool]')) {
        var clearButton = makeButton('tool-btn tool-btn--ghost tool-btn--sm', t('clear'), function () {
          clearTool(clearButton);
        });
        clearButton.setAttribute('data-clear-tool', '');
        host.appendChild(clearButton);
      }

      stateBox(card, true);
    });
  }

  /* 原生清空按钮执行后同步收起状态条 */
  function bindClearSync() {
    document.addEventListener('click', function (event) {
      var node = event.target;
      while (node && node.tagName !== 'BUTTON') node = node.parentNode;
      if (!node) return;
      var action = String(node.getAttribute('onclick') || '').trim();
      if (!/^clear/i.test(action)) return;
      var card = cardFrom(node);
      if (card) window.setTimeout(function () { clear(card); }, 0);
    }, true);
  }

  /* 吸顶导航高度由实际 DOM 计算，取代写死的 140px */
  function stickyOffset() {
    var nav = document.querySelector('.navbar');
    var sub = document.querySelector('.sub-nav');
    var navHeight = nav && nav.getBoundingClientRect ? nav.getBoundingClientRect().height : 64;
    var subHeight = sub && sub.getBoundingClientRect ? sub.getBoundingClientRect().height : 44;
    return Math.round(navHeight + subHeight + 16);
  }

  var ToolBox = {
    t: t,
    report: report,
    clear: clear,
    alert: alert,
    copyResult: copyResult,
    fillExample: fillExample,
    clearTool: clearTool,
    stickyOffset: stickyOffset,
    enhance: function () {
      enhanceLabels();
      enhanceHints();
      enhanceResultPanels();
      enhanceActions();
      bindClearSync();
    }
  };

  window.ToolBox = ToolBox;

  function init() {
    ToolBox.enhance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
