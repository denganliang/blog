// ========================================
// Search feature
// ========================================

(function() {
  'use strict';

  let searchIndex = [];
  let searchIndexLoaded = false;
  let searchIndexPromise = null;

  function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async function loadSearchIndex() {
    if (searchIndexLoaded) return searchIndex;
    if (searchIndexPromise) return searchIndexPromise;

    searchIndexPromise = fetch('/search-index.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load search index: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        searchIndex = Array.isArray(data) ? data : [];
        searchIndexLoaded = true;
        return searchIndex;
      })
      .catch(err => {
        console.error('Failed to load search index:', err);
        return [];
      })
      .finally(() => {
        if (!searchIndexLoaded) {
          searchIndexPromise = null;
        }
      });

    return searchIndexPromise;
  }

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
      const categoryEnLower = (item.category_en || '').toLowerCase();
      const tagsLower = (item.tags || []).join(' ').toLowerCase();
      const tagsEnLower = (item.tags_en || []).join(' ').toLowerCase();

      if (titleLower === queryLower || titleEnLower === queryLower) {
        score += 100;
      } else if (titleLower.includes(queryLower) || titleEnLower.includes(queryLower)) {
        score += 50;
      }

      if (excerptLower.includes(queryLower) || excerptEnLower.includes(queryLower)) {
        score += 20;
      }

      if (categoryLower.includes(queryLower) || categoryEnLower.includes(queryLower)) {
        score += 30;
      }

      if (tagsLower.includes(queryLower) || tagsEnLower.includes(queryLower)) {
        score += 25;
      }

      if (item.url && item.url.toLowerCase().includes(queryLower)) {
        score += 15;
      }

      if (score > 0) {
        results.push({ ...item, score });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }

  function highlightText(text, query) {
    if (!query || !text) return text;

    const safeQuery = escapeRegex(query.trim());
    if (!safeQuery) return text;

    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function displayResults(results, query, resultsContainer) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
      const lang = window.I18n ? window.I18n.getCurrentLanguage() : 'zh';
      const emptyText = lang === 'en' ? 'No matching results found' : '没有找到相关结果';
      const hintText = lang === 'en' ? 'Try different keywords' : '试试其他关键词';
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          <p>${emptyText}</p>
          <p class="text-secondary">${hintText}</p>
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

      const title = currentLang === 'en' ? (result.title_en || result.title) : (result.title || result.title_en);
      const excerpt = currentLang === 'en' ? (result.excerpt_en || result.excerpt) : (result.excerpt || result.excerpt_en);
      const category = currentLang === 'en' ? (result.category_en || result.category) : (result.category || result.category_en);

      item.innerHTML = `
        <div class="search-result-title">${highlightText(title || '', query)}</div>
        ${category ? `<span class="tag tag-outline">${category}</span>` : ''}
        ${excerpt ? `<div class="search-result-excerpt">${highlightText(excerpt, query)}</div>` : ''}
      `;

      resultsContainer.appendChild(item);
    });

    resultsContainer.classList.add('active');
  }

  async function performSearch(query, resultsContainer) {
    await loadSearchIndex();
    const results = fuzzySearch(query, searchIndex);
    displayResults(results, query, resultsContainer);
  }

  function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');

    if (!searchInput || !searchResults) return;

    let searchTimeout;
    let selectedIndex = -1;

    searchInput.addEventListener('focus', () => {
      loadSearchIndex();
      const query = searchInput.value.trim();
      if (query.length >= 2 && searchResults.children.length > 0) {
        searchResults.classList.add('active');
      }
    });

    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      selectedIndex = -1;
      clearTimeout(searchTimeout);

      if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
      }

      searchTimeout = setTimeout(() => {
        performSearch(query, searchResults);
      }, 250);
    });

    document.addEventListener('click', function(event) {
      if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
        searchResults.classList.remove('active');
      }
    });

    searchInput.addEventListener('keydown', function(event) {
      const items = searchResults.querySelectorAll('.search-result-item');
      if (items.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items, selectedIndex);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection(items, selectedIndex);
      } else if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault();
        items[selectedIndex].click();
      } else if (event.key === 'Escape') {
        searchResults.classList.remove('active');
        selectedIndex = -1;
      }
    });

    function updateSelection(items, index) {
      items.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }

  window.Search = {
    search: performSearch,
    loadIndex: loadSearchIndex
  };

})();
