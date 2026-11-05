(() => {
  const sharedUtilitiesScript = document.querySelector('script[src="/js/common.js"], script[src="js/common.js"]');
  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (!sharedUtilitiesScript && navigationEntry?.type === 'reload' && !window.location.hash &&
    'scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
    window.addEventListener('pageshow', () => {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        history.scrollRestoration = 'auto';
      });
    }, { once: true });
  }

  const consentStorageKey = 'cipher-site-consent-v1';
  const optionalCategories = ['advertising', 'analytics'];
  let savedConsent = readConsent();
  let closeTimer;
  let returnFocusTarget = null;

  const consentStylesheet = document.createElement('link');
  consentStylesheet.rel = 'stylesheet';
  consentStylesheet.href = new URL('../css/consent.css', document.currentScript.src).href;
  document.head.append(consentStylesheet);

  function readConsent() {
    try {
      const saved = localStorage.getItem(consentStorageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      if (parsed.version !== 1 || typeof parsed.advertising !== 'boolean' || typeof parsed.analytics !== 'boolean') {
        console.warn('Ignoring an invalid saved cookie consent record.');
        return null;
      }

      return {
        necessary: true,
        advertising: parsed.advertising,
        analytics: parsed.analytics,
        updatedAt: parsed.updatedAt
      };
    } catch (error) {
      console.error('Could not read the saved cookie consent choice.', error);
      return null;
    }
  }

  function emitConsentChange() {
    window.dispatchEvent(new CustomEvent('cipher:consentchange', {
      detail: savedConsent ? { ...savedConsent } : null
    }));
  }

  function saveConsent(advertising, analytics) {
    const previousConsent = savedConsent;
    const choice = {
      version: 1,
      necessary: true,
      advertising,
      analytics,
      updatedAt: new Date().toISOString()
    };
    let persisted = true;

    try {
      localStorage.setItem(consentStorageKey, JSON.stringify(choice));
    } catch (error) {
      persisted = false;
      console.error('Could not persist the cookie consent choice.', error);
    }

    savedConsent = choice;
    optionalCategories.filter(category => previousConsent?.[category] && !choice[category]).forEach(category => {
      document.querySelectorAll(`script[data-cipherConsentCategory="${category}"]`)
        .forEach(script => script.remove());
    });
    emitConsentChange();
    return persisted;
  }

  function hasConsent(category) {
    if (category === 'necessary') return true;
    return optionalCategories.includes(category) && savedConsent?.[category] === true;
  }

  function loadScript(src, category, attributes = {}) {
    if (!optionalCategories.includes(category)) {
      return Promise.reject(new Error(`Unsupported optional consent category: ${category}`));
    }
    if (!hasConsent(category)) return Promise.resolve(false);

    const scriptUrl = new URL(src, window.location.href);
    if (scriptUrl.origin !== window.location.origin) {
      return Promise.reject(new Error('Third-party scripts cannot run in the page context. Use an isolated integration.'));
    }

    const existingScript = Array.from(document.scripts).find(script =>
      script.dataset.cipherConsentSrc === scriptUrl.href && script.dataset.cipherConsentCategory === category
    );
    if (existingScript) return Promise.resolve(existingScript);

    const script = document.createElement('script');
    script.src = scriptUrl.href;
    script.async = true;
    script.dataset.cipherConsentCategory = category;
    script.dataset.cipherConsentSrc = scriptUrl.href;
    Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, String(value)));

    return new Promise((resolve, reject) => {
      script.addEventListener('load', () => {
        if (hasConsent(category)) {
          resolve(script);
        } else {
          script.remove();
          resolve(false);
        }
      }, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        reject(new Error(`Failed to load optional script: ${scriptUrl.href}`));
      }, { once: true });
      document.head.append(script);
    });
  }

  function setupConsentControls() {
    const backdrop = document.createElement('div');
    backdrop.className = 'cookie-consent-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="cookie-consent-modal" role="dialog" aria-modal="true" aria-labelledby="cookieConsentTitle"
        aria-describedby="cookieConsentDescription" tabindex="-1">
        <div class="cookie-consent-view" data-consent-view="welcome">
          <div class="cookie-consent-heading">
            <span class="cookie-consent-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
            <h2 id="cookieConsentTitle">Your Privacy Matters</h2>
          </div>
          <p id="cookieConsentDescription" class="cookie-consent-description">We use essential storage to keep Cipher running smoothly. With your permission, we also use analytics and advertising technologies to improve our services and support the platform.</p>
          <a class="cookie-consent-policy" href="/privacy/">Privacy Policy</a>
          <div class="cookie-consent-actions">
            <button type="button" class="cookie-consent-button cookie-consent-primary" data-consent-action="accept">Accept All</button>
            <button type="button" class="cookie-consent-button cookie-consent-secondary" data-consent-action="reject">Reject Optional</button>
            <button type="button" class="cookie-consent-customize" data-consent-action="customize">Customize Preferences</button>
          </div>
        </div>
        <div class="cookie-consent-view" data-consent-view="preferences" hidden>
          <div class="cookie-consent-heading">
            <span class="cookie-consent-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
            <h2 id="cookiePreferencesTitle">Customize Preferences</h2>
          </div>
          <p id="cookiePreferencesDescription" class="cookie-consent-description">Choose which optional technologies you allow. Essential storage is always enabled.</p>
          <div class="cookie-consent-options">
            <div class="cookie-consent-option cookie-consent-essential">
              <span><strong>Essential storage</strong><small>Always enabled</small></span>
            </div>
            <div class="cookie-consent-option">
              <span><strong>Advertising</strong><small>Supports the platform with relevant ads.</small></span>
              <button type="button" class="cookie-consent-switch" role="switch" aria-checked="false"
                aria-label="Advertising" data-consent-toggle="advertising"></button>
            </div>
            <div class="cookie-consent-option">
              <span><strong>Analytics</strong><small>Helps us understand and improve site use.</small></span>
              <button type="button" class="cookie-consent-switch" role="switch" aria-checked="false"
                aria-label="Analytics" data-consent-toggle="analytics"></button>
            </div>
          </div>
          <a class="cookie-consent-policy" href="/privacy/">Privacy Policy</a>
        </div>
        <div class="cookie-consent-preferences-footer" hidden>
          <p class="cookie-consent-save-status" role="status" aria-live="polite"></p>
          <div class="cookie-consent-actions cookie-consent-preference-actions">
            <button type="button" class="cookie-consent-button cookie-consent-primary" data-consent-action="save">Save Preferences</button>
            <button type="button" class="cookie-consent-button cookie-consent-secondary" data-consent-action="back">Back</button>
            <button type="button" class="cookie-consent-customize cookie-consent-visit-only" data-consent-action="continue" hidden>Continue for this visit</button>
          </div>
        </div>
      </section>`;
    document.body.append(backdrop);

    const dialog = backdrop.querySelector('.cookie-consent-modal');
    const welcomeView = backdrop.querySelector('[data-consent-view="welcome"]');
    const preferencesView = backdrop.querySelector('[data-consent-view="preferences"]');
    const preferencesFooter = backdrop.querySelector('.cookie-consent-preferences-footer');
    const status = backdrop.querySelector('.cookie-consent-save-status');
    const settingsLink = document.createElement('a');
    settingsLink.className = 'cookie-settings-button';
    settingsLink.href = '/privacy/';
    settingsLink.textContent = 'Privacy Settings';
    settingsLink.addEventListener('click', event => {
      event.preventDefault();
      openDialog('preferences');
    });

    const footer = document.querySelector('footer .container');
    if (footer) {
      footer.append(settingsLink);
    } else {
      console.warn('Privacy settings link could not be added because this page has no footer.');
    }

    function setSwitch(category, enabled) {
      const toggle = backdrop.querySelector(`[data-consent-toggle="${category}"]`);
      toggle?.setAttribute('aria-checked', String(enabled));
    }

    function showView(view) {
      welcomeView.hidden = view !== 'welcome';
      preferencesView.hidden = view !== 'preferences';
      preferencesFooter.hidden = view !== 'preferences';
      status.textContent = '';
      backdrop.querySelector('[data-consent-action="save"]').hidden = false;
      backdrop.querySelector('[data-consent-action="back"]').hidden = false;
      backdrop.querySelector('[data-consent-action="continue"]').hidden = true;
      dialog.setAttribute('aria-labelledby', view === 'welcome' ? 'cookieConsentTitle' : 'cookiePreferencesTitle');
      if (view === 'welcome') {
        dialog.setAttribute('aria-describedby', 'cookieConsentDescription');
      } else {
        dialog.setAttribute('aria-describedby', 'cookiePreferencesDescription');
      }
    }

    function openDialog(view) {
      if (backdrop.hidden) {
        returnFocusTarget = document.activeElement === document.body ? null : document.activeElement;
      }
      window.clearTimeout(closeTimer);
      backdrop.hidden = false;
      backdrop.classList.remove('is-closing');
      showView(view);
      setSwitch('advertising', savedConsent?.advertising === true);
      setSwitch('analytics', savedConsent?.analytics === true);
      backdrop.classList.add('is-open');
      const firstControl = view === 'welcome'
        ? backdrop.querySelector('[data-consent-action="accept"]')
        : backdrop.querySelector('[data-consent-toggle="advertising"]');
      firstControl?.focus({ preventScroll: true });
    }

    function closeDialog() {
      backdrop.classList.remove('is-open');
      backdrop.classList.add('is-closing');
      closeTimer = window.setTimeout(() => {
        backdrop.hidden = true;
        backdrop.classList.remove('is-closing');
        if (returnFocusTarget?.isConnected) {
          returnFocusTarget.focus({ preventScroll: true });
        }
        returnFocusTarget = null;
      }, 180);
    }

    backdrop.addEventListener('click', event => {
      const toggle = event.target.closest('[data-consent-toggle]');
      if (toggle) {
        toggle.setAttribute('aria-checked', String(toggle.getAttribute('aria-checked') !== 'true'));
        return;
      }

      const action = event.target.closest('[data-consent-action]')?.dataset.consentAction;
      if (!action) return;

      if (action === 'continue') {
        closeDialog();
      } else if (action === 'customize') {
        showView('preferences');
        setSwitch('advertising', savedConsent?.advertising === true);
        setSwitch('analytics', savedConsent?.analytics === true);
        backdrop.querySelector('[data-consent-toggle="advertising"]').focus({ preventScroll: true });
      } else if (action === 'back') {
        if (savedConsent) {
          closeDialog();
        } else {
          showView('welcome');
          backdrop.querySelector('[data-consent-action="accept"]').focus({ preventScroll: true });
        }
      } else {
        const advertising = action === 'accept' || (
          action === 'save' && backdrop.querySelector('[data-consent-toggle="advertising"]').getAttribute('aria-checked') === 'true'
        );
        const analytics = action === 'accept' || (
          action === 'save' && backdrop.querySelector('[data-consent-toggle="analytics"]').getAttribute('aria-checked') === 'true'
        );
        const persisted = saveConsent(advertising, analytics);
        if (!persisted) {
          showView('preferences');
          setSwitch('advertising', advertising);
          setSwitch('analytics', analytics);
          status.textContent = 'Your choice could not be saved on this device. It will apply for this visit only.';
          backdrop.querySelector('[data-consent-action="save"]').hidden = true;
          backdrop.querySelector('[data-consent-action="back"]').hidden = true;
          backdrop.querySelector('[data-consent-action="continue"]').hidden = false;
          backdrop.querySelector('[data-consent-action="continue"]').focus({ preventScroll: true });
          return;
        }
        closeDialog();
      }
    });

    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (preferencesView.hidden) return;
        if (savedConsent) {
          closeDialog();
        } else {
          showView('welcome');
          backdrop.querySelector('[data-consent-action="accept"]').focus({ preventScroll: true });
        }
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled])'))
        .filter(element => !element.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    });

    window.CipherConsent = {
      getConsent: () => savedConsent ? { ...savedConsent } : null,
      hasConsent,
      loadScript,
      openSettings: () => openDialog('preferences')
    };

    if (!savedConsent) openDialog('welcome');
    window.dispatchEvent(new CustomEvent('cipher:consentready', {
      detail: savedConsent ? { ...savedConsent } : null
    }));
  }

  function retireLegacyPwa() {
    const cleanupTasks = [];

    if ('serviceWorker' in navigator) {
      cleanupTasks.push(
        navigator.serviceWorker.getRegistrations().then(registrations =>
          Promise.all(registrations.filter(registration => {
            const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
            return scriptUrl && new URL(scriptUrl).origin === window.location.origin &&
              new URL(scriptUrl).pathname.endsWith('/sw.js');
          }).map(registration => registration.unregister()))
        )
      );
    }

    if ('caches' in window) {
      cleanupTasks.push(
        caches.keys().then(keys => Promise.all(
          keys.filter(key => key.startsWith('cipher-shell-')).map(key => caches.delete(key))
        ))
      );
    }

    Promise.all(cleanupTasks).catch(error => {
      console.error('Could not retire Cipher offline app data.', error);
    });
  }

  function initialize() {
    retireLegacyPwa();
    setupConsentControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
