// app/layout.tsx
// 모든 페이지를 감싸는 최상위 틀. 배경색·폰트·언어 설정.
// PWA(Progressive Web App, 점진적 웹앱) 메타데이터도 여기서 정의.
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "프로젝트 대시보드",
  description: "멀티 프로젝트 진행 상황 한눈에 보기",
  // PWA 매니페스트(앱 이름·아이콘·테마 정의 파일) 연결
  manifest: "/manifest.json",
  // iOS Safari에서 홈 화면 추가 시 풀스크린 앱처럼 동작하게 함
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "대시보드",
  },
  // 브라우저 탭 아이콘 + 홈 화면 아이콘
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Next.js 14+ 에서는 viewport(뷰포트, 화면 표시 영역 설정)를 metadata와 분리해서 export.
// theme-color: 모바일 브라우저 상단 바 색상.
export const viewport: Viewport = {
  themeColor: "#1D9E75",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/* suppressHydrationWarning: 브라우저 확장 프로그램이 <body>에 style 등을
          끼워넣어 발생하는 hydration mismatch 경고만 무음 처리. (Next.js 공식 권장)
          이 한 단계만 해당되고, 자식 컴포넌트의 진짜 mismatch는 그대로 보임. */}
      <body suppressHydrationWarning>{children}</body>
      {/* Service worker 등록 — PWA 설치 가능 + 오프라인 캐시 활성화.
          afterInteractive: 페이지가 사용자 입력에 반응 가능해진 직후 실행 (성능 영향 최소). */}
      <Script id="sw-register" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function (err) {
                console.error('SW 등록 실패:', err);
              });
            });
          }
        `}
      </Script>
    </html>
  );
}
