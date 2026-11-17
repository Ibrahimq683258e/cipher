const CACHE_NAME = 'cipher-shell-v4';
const APP_SHELL = [
  '/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/Enc/',
  '/tools/base64/',
  '/tools/encrypt/',
  '/tools/hash-generator/',
  '/tools/image-compressor/',
  '/tools/merge-pdf/',
  '/tools/password-generator/',
  '/tools/qr-generator/',
  '/css/styles.css',
  '/css/i18n.css',
  '/css/consent.css',
  '/css/fonts.css',
  '/assets/fonts/firacode-latin.woff2',
  '/assets/fonts/merriweather-latin.woff2',
  '/assets/fonts/merriweather-italic-latin.woff2',
  '/assets/fonts/opensans-latin.woff2',
  '/assets/fonts/opensans-italic-latin.woff2',
  '/js/common.js',
  '/js/site-features.js',
  '/js/translations.js',
  '/images/Cipher.png',
  '/images/Cipher C.png',
  '/images/cipher-favicon.svg',
  '/Enc/css/styles.css',
  '/Enc/images/Cipher.png',
  '/Enc/images/Cipher C.png',
  '/Enc/images/cipher-favicon.svg',
  '/vendor/html5-qrcode.min.js',
  '/vendor/md5.min.js',
  '/vendor/pdf-lib.min.js',
  '/vendor/qrcode.min.js'
];

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('cipher-shell-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(APP_SHELL.map(async path => {
        try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(path, response);
        } catch (error) {
          console.warn(`Could not cache ${path} for offline use.`, error);
        }
      }));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const cacheUpdate = caches.open(CACHE_NAME).then(async cache => {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone()).catch(error => {
        console.warn(`Could not cache ${url.pathname} for offline use.`, error);
      });
    }
    return response;
  });

  event.waitUntil(cacheUpdate.catch(error => {
    console.warn(`Could not refresh ${url.pathname} for offline use.`, error);
  }));

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request, { ignoreSearch: true });
    if (cachedResponse) return cachedResponse;

    try {
      return await cacheUpdate;
    } catch (error) {
      if (request.mode === 'navigate') {
        const directoryPath = url.pathname.endsWith('/index.html')
          ? url.pathname.slice(0, -'index.html'.length)
          : url.pathname;
        const cachedPage = await cache.match(directoryPath, { ignoreSearch: true });
        if (cachedPage) return cachedPage;
        const homePage = await cache.match('/');
        if (homePage) return homePage;
      }
      console.warn(`Network request failed for ${url.pathname}.`, error);
      return Response.error();
    }
  })());
});
