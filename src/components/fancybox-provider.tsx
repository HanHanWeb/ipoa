"use client";

import { useEffect } from "react";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

export function FancyboxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Fancybox.bind("[data-fancybox]", {
      Hash: false,
    });

    return () => {
      Fancybox.unbind("[data-fancybox]");
      Fancybox.close();
    };
  }, []);

  return <>{children}</>;
}
