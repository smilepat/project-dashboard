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

// 캐시 버전을 올리면 activate 단계에서 옛 캐시를 통째로 지운다.
// v1 → v2: 비공개 화면('/')을 프리캐시 목록에서 제외하면서 버전업
// (기존 사용자 기기에 남아 있던 '/' 캐시본도 함께 정리되도록).
const CACHE_NAME = 'project-dashboard-v2';
// 프리캐시는 '공개 정적 자산'만 둔다.
// '/'(대시보드 HTML)는 private repo 데이터를 담고 Basic Auth로 보호되는 화면이라
// 기기 캐시에 저장하지 않는다(공유 PC에서 캐시본 노출 방지).
const STATIC_ASSETS = [
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

  // 페이지 HTML(navigation 요청)은 캐시에 저장하지 않는다.
  // 대시보드 화면은 private repo 데이터를 담고 Basic Auth로 보호되므로,
  // 기기 캐시에 남기면 공유 PC에서 노출될 수 있다. 정적 자산만 캐시한다.
  const isPageNavigation = event.request.mode === 'navigate';

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // 성공한 '정적 자산' 응답만 캐시에 복사본 저장(HTML 페이지는 제외)
        if (res.ok && res.status === 200 && !isPageNavigation) {
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
