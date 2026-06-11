"use client";

import { useEffect, useState } from "react";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "赛事首页" },
  { href: "/awards", label: "获奖名单", requireEnabled: true },
];

export function NavBar() {
  const pathname = usePathname();
  const [awardsEnabled, setAwardsEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/awards")
      .then((res) => res.json())
      .then((data) => setAwardsEnabled(data.enabled || false))
      .catch(() => {});
  }, []);

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
          {navLinks.map((link) => {
            if (link.requireEnabled && !awardsEnabled) return null;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
