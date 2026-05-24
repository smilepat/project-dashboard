// public/sw.js
// ─────────────────────────────────────────────────────────────
// Service Worker (서비스 워커, 브라우저 백그라운드 스크립트)
// 역할:
//   1) PWA 설치 가능 조건 만족 (브라우저에 "앱 설치" 버튼 노출)
//   2) 정적 자산을 캐시 → 오프라인에서도 첫 화면 렌더링 가능
//   3) 새 버전 배포 시 자동 갱신
// 네트워크 우선(network-first) 전략:
//   - 인터넷 되면 항상 최신 데이터, 안 되면 캐시로 fallback.
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'project-dashboard-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// 설치 단계: 정적 자산을 미리 캐시에 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // 새 SW를 즉시 활성화
});

// 활성화 단계: 오래된 캐시 청소
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim(); // 열려 있는 모든 탭에 즉시 적용
});

// fetch 가로채기: GET 요청만 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // GitHub API 호출은 캐싱하지 않음 (항상 최신 데이터 필요)
  if (event.request.url.includes('api.github.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // 성공 응답이면 캐시에 복사본 저장
        if (res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(() => {}); // 일부 요청 타입은 캐시 불가
          });
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response('오프라인 상태입니다.', { status: 503 })))
  );
});
