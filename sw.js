const CACHE_NAME = 'html-preview-v1';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  // スタイルはhtmlに直接書かれているので不要
  // アイコンファイルをキャッシュする場合はここに追加 (例: 'icons/icon-192x192.png')
];

// インストールイベント: アセットをキャッシュ
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Failed to cache:', err);
      })
  );
});

// フェッチイベント: キャッシュから提供し、オンライン時にフォールバック
self.addEventListener('fetch', event => {
  // Blob URLはサービスワーカーの対象外（プレビュー表示用のため）
  if (event.request.url.startsWith('blob:')) {
    return;
  }

  // キャッシュ、ネットワークのフォールバック戦略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュヒット
        if (response) {
          return response;
        }
        
        // キャッシュミス -> ネットワークから取得
        return fetch(event.request).catch(err => {
            console.error('[Service Worker] Fetch failed:', err);
            // オフライン時のフォールバック (ここではシンプルな処理)
        });
      })
  );
});

// アクティベートイベント: 古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
