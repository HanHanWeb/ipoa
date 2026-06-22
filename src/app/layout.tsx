import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FancyboxProvider } from "@/components/fancybox-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ipoa.interver.cn"),
  title: {
    default: "界面生态 IPOA 赛事",
    template: "%s - 界面生态 IPOA 赛事",
  },
  description: "为搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才，界面生态特举办界面生态 IPOA 赛事。参与投稿、社区互动，展示你的设计才华。",
  keywords: ["IPOA", "界面生态", "PPT OS", "设计赛事", "创意设计", "公益赛事", "设计爱好者", "作品评审"],
  icons: {
    icon: "https://intereco.cn-nb1.rains3.com/basic/favicon_wh.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://ipoa.interver.cn",
    siteName: "界面生态 IPOA 赛事",
    title: "界面生态 IPOA 赛事",
    description: "为搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才，界面生态特举办界面生态 IPOA 赛事。",
    images: [
      {
        url: "https://intereco.cn-nb1.rains3.com/basic/ipoa.png",
        width: 1200,
        height: 630,
        alt: "界面生态 IPOA 赛事",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "界面生态 IPOA 赛事",
    description: "为搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才，界面生态特举办界面生态 IPOA 赛事。",
    images: ["https://intereco.cn-nb1.rains3.com/basic/ipoa.png"],
  },
  robots: {
    index: true,
    follow: true,
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
