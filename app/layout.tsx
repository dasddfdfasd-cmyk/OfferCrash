import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "OfferCrash - 产品经理大厂校招压力面试 Agent",
  description: "产品经理大厂校招压力面试 Agent",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
