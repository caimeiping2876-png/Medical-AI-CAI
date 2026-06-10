// Service Worker — 채매평 골절 분류 AI
// 버전을 올리면(예: v1 → v2) 사용자 기기의 캐시가 자동으로 갱신됩니다.
const CACHE_NAME = "fracture-ai-v4";

// 오프라인에서도 열리도록 미리 저장할 파일 목록
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

// 설치: 핵심 파일을 캐시에 저장
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 예전 버전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 요청 처리: 캐시 우선, 없으면 네트워크 (network fallback)
self.addEventListener("fetch", (event) => {
  // GET 요청만 처리
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // 정상 응답이면 캐시에 복사해 둠 (다음 오프라인 대비)
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html")); // 완전 오프라인 시 메인 페이지
    })
  );
});
