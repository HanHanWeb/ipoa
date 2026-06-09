import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "界面生态 PPTOS 创意设计大赛",
  description: "为搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才，界面生态特举办界面生态 PPTOS 创意设计大赛。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
