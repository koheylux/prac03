// キャッシュのバージョン
const CACHE_VERSION = 'v1';
// キャッシュの名前
const CACHE_NAME = `${registration.scope}!${CACHE_VERSION}`;
// キャッシュ対象のファイル
const CACHE_FILE = [
  '/samplepwa/',
  '/samplepwa/PoweredByMacOSXLarge.gif',
  '/samplepwa/index.html'
];


// installイベント
//**************************************************************
// 新規インストール or 更新時に発火
//**************************************************************
self.addEventListener('install', function(event) {
  console.log('service worker install ...');
  // waitUntil()でイベントの完了を処理が成功するまで遅延させる
  event.waitUntil(
    // cacheStorageの中に指定したキーのcacheを新しく作成して開く
    caches.open(CACHE_NAME).then(function(cache) {
    // パスの一覧を渡してcacheに追加する
      return cache.addAll(CACHE_FILE);
    })
  );
});


// activateイベント
//**************************************************************
// 新規インストール時には発火しない
// ページを閉じて安全な状態になり、再度ページを開いた時に発火
// 古いキャッシュの削除等を行う
//**************************************************************
self.addEventListener('activate', function(event) {
  console.info('activate', event);
  // waitUntil()でイベントの完了を処理が成功するまで遅延させる
  event.waitUntil(
    // cacheStorageの中の全てのcacheを確認する
    caches.keys().then(function(cacheKeys) {
      return Promise.all(
        cacheKeys.filter(function(cacheKey) {
          // 同じキャッシュ名でバージョンが異なるものを削除対象とする
          return cacheKey.startsWith(`${registration.scope}!`) && !(cacheKey.endsWith(`${CACHE_VERSION}`));
        }).map(function(cacheKey) {
          // 削除対象としたキーのcacheを全てcacheStorageから削除する
          console.log('Service Worker Update ...');
          return caches.delete(cacheKey);
        })
      );
    })
  );
});

//fetchイベント
//**************************************************************
// 1. リクエストに対する応答「キャッシュに無ければネットワーク」 <今回
// 2. リクエストに対する応答「ネットワークがダメならキャッシュ」
//**************************************************************

// キャッシュ対象ファイルかどうかを判定する
const isTargetFile = function(url) {
  return CACHE_FILE.indexOf(new URL(url).pathname) >= 0;
};

// スコープ内のページからのリクエストによりfetchイベントが発火する
self.addEventListener('fetch', function(event) {
  console.log('fetch ... ', event.request.url);

  // レスポンスを宣言する
  event.respondWith(
    // cacheStorageの中から管理しているcacheを開く
    caches.open(CACHE_NAME).then(function(cache) {
      // cache内にこのリクエストに対するキャッシュが存在するか確認する
      return cache.match(event.request).then(function(response) {
        // もしキャッシュがあればそれを返す
        if (response) return response;
        // もし無ければネットワークに取得しに行く
        return fetch(event.request).then(function(response) {
          // キャッシュ対象のファイルでキャッシュすべきレスポンスであればキャッシュする
          // if (isTargetFile(event.request.url) && response.ok) {
            cache.put(event.request, response.clone());
          // }
          // レスポンスを返す
          return response;
        });
      });
    })
  );
});

// messageイベント
self.addEventListener('message', function(event) {
  // 送られてきたメッセージ
  const receivedData = event.data;
  if (receivedData.message == 'clear') {
    console.log('cashes delete ...');
    caches.delete(CACHE_NAME);
  }
  console.log(`I got a message from browser. ${event.data}`);
});
