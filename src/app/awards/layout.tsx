import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "获奖名单",
  description: "界面生态 IPOA 赛事获奖名单，展示各奖项获奖作品及作者信息。",
};

export default function AwardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
