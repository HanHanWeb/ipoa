"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/", label: "赛事首页" },
  { href: "/dashboard/vote", label: "人气之星" },
  { href: "/awards", label: "获奖名单" },
];

export function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentLabel = navLinks.find((l) => l.href === pathname)?.label;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between md:h-16">
        <div className="flex items-center gap-2 md:gap-3">
          <a href="/" className="flex items-center">
            <img
              src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
              alt="IPOA Logo"
              className="h-6 w-auto md:h-8"
              crossOrigin="anonymous"
            />
          </a>
          {/* Desktop: pill buttons */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {navLinks.map((link) => {
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
          {/* Mobile: collapsible breadcrumb */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 text-sm font-medium text-foreground"
            >
              {currentLabel || "导航"}
              <ChevronDown className={`size-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-2 w-36 rounded-lg border bg-white shadow-lg">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
