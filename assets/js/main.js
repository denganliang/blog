// ========================================
// Global behavior script
// ========================================

(function() {
  'use strict';

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (!mobileMenuToggle || !navbarMenu) return;

    mobileMenuToggle.addEventListener('click', function() {
      navbarMenu.classList.toggle('active');
      this.classList.toggle('active');
      this.setAttribute('aria-expanded', this.classList.contains('active') ? 'true' : 'false');
    });

    navbarMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navbarMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', event => {
      if (!navbarMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
        navbarMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', function(event) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 70;
        const targetPosition = target.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = throttle(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      navbar.classList.toggle('scrolled', scrollTop > 10);
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const image = entry.target;
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
            observer.unobserve(image);
          }
        });
      });

      images.forEach(image => imageObserver.observe(image));
    } else {
      images.forEach(image => {
        image.src = image.dataset.src;
        image.removeAttribute('data-src');
      });
    }
  }

  function initExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    const host = window.location.hostname;

    links.forEach(link => {
      if (link.hostname && link.hostname !== host) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function initBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (!backToTopButton) return;

    const onScroll = throttle(() => {
      backToTopButton.classList.toggle('visible', window.pageYOffset > 300);
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  function initCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre code');
    if (codeBlocks.length === 0) return;

    codeBlocks.forEach(block => {
      const pre = block.parentElement;
      if (!pre || pre.querySelector('.code-copy-btn')) return;

      const button = document.createElement('button');
      button.className = 'code-copy-btn';
      button.type = 'button';
      button.setAttribute('aria-label', 'Copy code');
      button.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
        </svg>
      `;

      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(block.textContent || '');
          button.textContent = '✓';
          button.classList.add('copied');
          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = `
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
            `;
          }, 2000);
        } catch (error) {
          console.error('Failed to copy code:', error);
        }
      });

      pre.style.position = 'relative';
      pre.appendChild(button);
    });
  }

  function initGamesMenuLink() {
    const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
    const toolsHref = isEnglish ? '/en/tools/' : '/tools/';
    const gamesHref = isEnglish ? '/en/games/' : '/games/';
    const gamesLabel = isEnglish ? 'Games' : '游戏';

    function appendLink(listElement) {
      if (!listElement || listElement.querySelector(`a[href="${gamesHref}"]`)) {
        return;
      }

      const listItem = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = gamesHref;
      anchor.textContent = gamesLabel;
      listItem.appendChild(anchor);

      const toolsAnchor = listElement.querySelector(`a[href="${toolsHref}"]`);
      if (toolsAnchor && toolsAnchor.parentElement?.tagName === 'LI') {
        toolsAnchor.parentElement.insertAdjacentElement('afterend', listItem);
      } else {
        listElement.appendChild(listItem);
      }
    }

    appendLink(document.querySelector('.navbar-menu'));
    appendLink(document.querySelector('.footer-links'));
  }

  function initToolsCarousel() {
    const carousels = document.querySelectorAll('.tools-carousel');
    if (carousels.length === 0) return;

    carousels.forEach(carousel => {
      const slides = Array.from(carousel.querySelectorAll('.tools-carousel-slide'));
      const dots = Array.from(carousel.querySelectorAll('.tools-carousel-dot'));

      if (slides.length === 0) return;

      const intervalMs = Number(carousel.dataset.interval || 5000);
      let activeIndex = slides.findIndex(slide => slide.classList.contains('is-active'));
      let timerId = null;

      if (activeIndex < 0) {
        activeIndex = 0;
      }

      function setActiveSlide(index) {
        activeIndex = index;

        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === activeIndex;
          slide.classList.toggle('is-active', isActive);
          slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        dots.forEach((dot, dotIndex) => {
          const isActive = dotIndex === activeIndex;
          dot.classList.toggle('is-active', isActive);
          dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      }

      function stopAutoplay() {
        if (timerId) {
          window.clearInterval(timerId);
          timerId = null;
        }
      }

      function startAutoplay() {
        if (slides.length < 2) return;

        stopAutoplay();
        timerId = window.setInterval(() => {
          setActiveSlide((activeIndex + 1) % slides.length);
        }, intervalMs);
      }

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          setActiveSlide(index);
          startAutoplay();
        });
      });

      carousel.addEventListener('mouseenter', stopAutoplay);
      carousel.addEventListener('mouseleave', startAutoplay);
      carousel.addEventListener('touchstart', stopAutoplay, { passive: true });
      carousel.addEventListener('touchend', startAutoplay);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });

      setActiveSlide(activeIndex);
      startAutoplay();
    });
  }

  function init() {
    initGamesMenuLink();
    initMobileMenu();
    initSmoothScroll();
    initNavbarScroll();
    initLazyLoad();
    initExternalLinks();
    initBackToTop();
    initToolsCarousel();
    initCodeCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Utils = {
    debounce,
    throttle,
    validateEmail
  };

})();
