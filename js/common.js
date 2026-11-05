// Cipher Shared Common Utilities & Navigation
const navigationEntry = performance.getEntriesByType('navigation')[0];
if (navigationEntry?.type === 'reload' && !window.location.hash && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
  window.addEventListener('pageshow', () => {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      history.scrollRestoration = 'auto';
    });
  }, { once: true });
}

const siteFeaturesScript = document.createElement('script');
siteFeaturesScript.src = new URL('site-features.js', document.currentScript.src).href;
siteFeaturesScript.addEventListener('error', () => {
  console.error('Cipher site features failed to load.');
}, { once: true });
document.head.append(siteFeaturesScript);

if (!window.CipherI18n && !document.querySelector('script[data-cipher-translations]')) {
  const translationsScript = document.createElement('script');
  translationsScript.src = '/js/translations.js';
  translationsScript.dataset.cipherTranslations = '';
  document.head.append(translationsScript);
}

document.addEventListener('DOMContentLoaded', () => {
  const loadingShell = document.createElement('div');
  loadingShell.className = 'app-loading-shell';
  loadingShell.setAttribute('role', 'status');
  loadingShell.setAttribute('aria-label', 'Loading Cipher');
  loadingShell.innerHTML = '<div class="app-loading-card"><span></span><span></span><span></span></div>';
  document.body.prepend(loadingShell);
  requestAnimationFrame(() => loadingShell.classList.add('is-ready'));
  window.setTimeout(() => loadingShell.remove(), 1400);

  // Theme Toggle Support (default dark)
  const savedTheme = localStorage.getItem('cipher-theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');

  // Initialize Theme Toggle Buttons if present
  const themeToggles = document.querySelectorAll('.theme-toggle-btn');
  themeToggles.forEach(btn => {
    btn.setAttribute('aria-label', `Switch to ${savedTheme === 'dark' ? 'light' : 'dark'} mode`);
    btn.innerHTML = savedTheme === 'dark'
      ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-bs-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('cipher-theme', next);
      btn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
      btn.innerHTML = next === 'dark'
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    });
  });

  // Keep the primary navigation action consistent across the site.
  const primaryNavButtons = document.querySelectorAll('.btn-nav');
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const isHomepage = currentPath === '/' || currentPath === '/index.html';
  const primaryNavigation = {
    label: 'GET STARTED',
    href: isHomepage ? '#tools-dashboard' : '/'
  };

  primaryNavButtons.forEach(btn => {
    if (currentPath === '/Enc') return;

    btn.setAttribute('href', primaryNavigation.href);
    btn.setAttribute('aria-label', `Go to ${primaryNavigation.label}`);

    const actionIcon = btn.querySelector('.protect-icon');
    if (actionIcon) {
      actionIcon.innerHTML = '<path d="M5 12h14" /><path d="m13 6 6 6-6 6" />';
    }

    const labelNode = Array.from(btn.childNodes).find(node =>
      node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (labelNode) {
      labelNode.textContent = `\n            ${primaryNavigation.label}\n            `;
    }

  });

  document.querySelectorAll('.tool-card-container > .feature-card').forEach(card => {
    if (card.querySelector('.tool-online-status')) return;
    const status = document.createElement('div');
    status.className = 'tool-online-status';
    status.setAttribute('role', 'status');
    status.innerHTML = '<span class="tool-online-dot" aria-hidden="true"></span><span class="tool-online-label">Checking</span>';
    card.prepend(status);
  });

  const onlineStatuses = [
    ...document.querySelectorAll('.tool-online-status'),
    ...document.querySelectorAll('#localStatus')
  ];

  function setConnectivityStatus(isOnline, isChecking = false) {
    onlineStatuses.forEach(status => {
      const label = status.querySelector('.tool-online-label, #localStatusText');
      if (label) label.textContent = isChecking ? 'Checking' : (isOnline ? 'Online' : 'Offline');
      status.classList.toggle('offline', !isOnline && !isChecking);
      status.classList.toggle('checking', isChecking);
    });
  }

  function updateConnectionStatus() {
    setConnectivityStatus(navigator.onLine);
  }

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', event => {
      if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        menuToggle.focus();
      }
    });
  }

  document.querySelectorAll('label.field-label').forEach(label => {
    if (label.htmlFor) return;
    const control = label.parentElement?.querySelector('input, textarea, select');
    if (control?.id) label.htmlFor = control.id;
  });

  document.querySelectorAll('.dropzone').forEach(dropzone => {
    const fileInput = dropzone.querySelector('input[type="file"]');
    if (!fileInput) return;
    dropzone.setAttribute('role', 'button');
    dropzone.setAttribute('tabindex', '0');
    dropzone.setAttribute('aria-controls', fileInput.id);
    if (!dropzone.getAttribute('aria-label')) {
      const title = dropzone.querySelector('.dz-title')?.textContent.trim();
      if (title) dropzone.setAttribute('aria-label', title);
    }
    dropzone.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      fileInput.click();
    });
  });

  [['.base64-mode-tabs', '.base64-mode-btn'], ['.input-mode-tabs', '.input-mode-btn']].forEach(([listSelector, buttonSelector]) => {
    document.querySelectorAll(listSelector).forEach(tabList => {
      tabList.setAttribute('role', 'tablist');
      const syncTabs = () => tabList.querySelectorAll(buttonSelector).forEach(button => {
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', String(button.classList.contains('active')));
      });
      syncTabs();
      tabList.addEventListener('click', () => requestAnimationFrame(syncTabs));
    });
  });

  // FAQ Accordion Toggle Support
  const faqCloseTimers = new WeakMap();
  document.querySelectorAll('.faq-item summary').forEach(summary => {
    summary.addEventListener('click', (event) => {
      const item = summary.closest('.faq-item');
      if (!item) return;
      event.preventDefault();
      const shouldOpen = !item.open || item.classList.contains('is-closing');
      window.clearTimeout(faqCloseTimers.get(item));

      if (shouldOpen) {
        item.classList.remove('is-closing');
        item.open = true;
        return;
      }

      item.classList.add('is-closing');
      const closeTimer = window.setTimeout(() => {
        item.open = false;
        item.classList.remove('is-closing');
        faqCloseTimers.delete(item);
      }, 280);
      faqCloseTimers.set(item, closeTimer);
    });
  });

  // Add subtle pointer parallax to tool cards when motion is available.
  const toolCards = document.querySelectorAll('.tool-card');
  const canAnimateCards = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (canAnimateCards) {
    toolCards.forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--card-tilt-x', `${y * -3}deg`);
        card.style.setProperty('--card-tilt-y', `${x * 3}deg`);
        card.style.setProperty('--icon-x', `${x * 3}px`);
        card.style.setProperty('--icon-y', `${y * 3}px`);
        card.style.setProperty('--icon-rotate', `${x * 4}deg`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--card-tilt-x');
        card.style.removeProperty('--card-tilt-y');
        card.style.removeProperty('--icon-x');
        card.style.removeProperty('--icon-y');
        card.style.removeProperty('--icon-rotate');
      });
    });
  }

});
