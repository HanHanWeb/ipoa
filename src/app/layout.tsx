import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FancyboxProvider } from "@/components/fancybox-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "界面生态 PPTOS 创意设计大赛",
  description: "为搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才，界面生态特举办界面生态 PPTOS 创意设计大赛。",
  icons: {
    icon: "https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/favicon_wh.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <FancyboxProvider>{children}</FancyboxProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
