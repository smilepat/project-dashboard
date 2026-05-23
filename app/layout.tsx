// app/layout.tsx
// 모든 페이지를 감싸는 최상위 틀. 배경색·폰트·언어 설정.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "프로젝트 대시보드",
  description: "멀티 프로젝트 진행 상황 한눈에 보기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/* suppressHydrationWarning: 브라우저 확장 프로그램이 <body>에 style 등을
          끼워넣어 발생하는 hydration mismatch 경고만 무음 처리. (Next.js 공식 권장)
          이 한 단계만 해당되고, 자식 컴포넌트의 진짜 mismatch는 그대로 보임. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
