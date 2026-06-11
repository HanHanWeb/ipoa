"use client";

import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center">
            <img
              src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
              alt="IPOA Logo"
              className="h-8 w-auto"
              crossOrigin="anonymous"
            />
          </a>
          <Link
            href="/awards"
            className={`relative text-sm font-medium transition-colors ${
              pathname === "/awards"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            获奖名单
            {pathname === "/awards" && (
              <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary" />
            )}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
