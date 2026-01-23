// ========================================
// 搜索功能
// ========================================

(function() {
  'use strict';

  let searchIndex = [];
  let searchIndexLoaded = false;

  // 加载搜索索引
  async function loadSearchIndex() {
    if (searchIndexLoaded) return;

    try {
      const response = await fetch('/search-index.json');
      searchIndex = await response.json();
      searchIndexLoaded = true;
    } catch (err) {
      console.error('Failed to load search index:', err);
    }
  }

  // 简单的模糊搜索算法
  function fuzzySearch(query, items) {
    if (!query || query.trim() === '') return [];

    const queryLower = query.toLowerCase().trim();
    const results = [];

    items.forEach(item => {
      let score = 0;
      const titleLower = (item.title || '').toLowerCase();
      const titleEnLower = (item.title_en || '').toLowerCase();
      const excerptLower = (item.excerpt || '').toLowerCase();
      const excerptEnLower = (item.excerpt_en || '').toLowerCase();
      const categoryLower = (item.category || '').toLowerCase();
      const tagsLower = (item.tags || []).join(' ').toLowerCase();

      // 标题完全匹配：高分
      if (titleLower === queryLower || titleEnLower === queryLower) {
        score += 100;
      }
      // 标题包含查询：较高分
      else if (titleLower.includes(queryLower) || titleEnLower.includes(queryLower)) {
        score += 50;
      }

      // 摘要包含查询
      if (excerptLower.includes(queryLower) || excerptEnLower.includes(queryLower)) {
        score += 20;
      }

      // 分类匹配
      if (categoryLower.includes(queryLower)) {
        score += 30;
      }

      // 标签匹配
      if (tagsLower.includes(queryLower)) {
        score += 25;
      }

      // URL匹配
      if (item.url && item.url.toLowerCase().includes(queryLower)) {
        score += 15;
      }

      if (score > 0) {
        results.push({
          ...item,
          score
        });
      }
    });

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    // 返回前10个结果
    return results.slice(0, 10);
  }

  // 高亮搜索关键词
  function highlightText(text, query) {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // 显示搜索结果
  function displayResults(results, query, resultsContainer) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          <p>没有找到相关结果</p>
          <p class="text-secondary">试试其他关键词</p>
        </div>
      `;
      resultsContainer.classList.add('active');
      return;
    }

    const currentLang = window.I18n ? window.I18n.getCurrentLanguage() : 'zh';

    results.forEach(result => {
      const item = document.createElement('a');
      item.className = 'search-result-item';
      item.href = result.url;

      const title = currentLang === 'en' ? (result.title_en || result.title) : result.title;
      const excerpt = currentLang === 'en' ? (result.excerpt_en || result.excerpt) : result.excerpt;
      const category = currentLang === 'en' ? (result.category_en || result.category) : result.category;

      item.innerHTML = `
        <div class="search-result-title">${highlightText(title, query)}</div>
        ${category ? `<span class="tag tag-outline">${category}</span>` : ''}
        ${excerpt ? `<div class="search-result-excerpt">${highlightText(excerpt, query)}</div>` : ''}
      `;

      resultsContainer.appendChild(item);
    });

    resultsContainer.classList.add('active');
  }

  // 执行搜索
  async function performSearch(query, resultsContainer) {
    if (!searchIndexLoaded) {
      await loadSearchIndex();
    }

    const results = fuzzySearch(query, searchIndex);
    displayResults(results, query, resultsContainer);
  }

  // 初始化搜索功能
  function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');

    if (!searchInput || !searchResults) return;

    // 预加载搜索索引
    loadSearchIndex();

    let searchTimeout;

    // 输入时搜索（防抖）
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();

      clearTimeout(searchTimeout);

      if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
      }

      searchTimeout = setTimeout(() => {
        performSearch(query, searchResults);
      }, 300);
    });

    // 获得焦点时显示结果
    searchInput.addEventListener('focus', function() {
      const query = this.value.trim();
      if (query.length >= 2 && searchResults.children.length > 0) {
        searchResults.classList.add('active');
      }
    });

    // 点击外部关闭结果
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
      }
    });

    // 键盘导航
    let selectedIndex = -1;

    searchInput.addEventListener('keydown', function(e) {
      const items = searchResults.querySelectorAll('.search-result-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items, selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection(items, selectedIndex);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        items[selectedIndex].click();
      } else if (e.key === 'Escape') {
        searchResults.classList.remove('active');
        selectedIndex = -1;
      }
    });

    function updateSelection(items, index) {
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }

  // 导出到全局
  window.Search = {
    search: performSearch,
    loadIndex: loadSearchIndex
  };

})();
