"use client";

import { useEffect } from "react";

export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} - 界面生态 IPOA 赛事`;
  }, [title]);
  return null;
}
