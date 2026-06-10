interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

const footerGroups: FooterGroup[] = [
  {
    title: "关于",
    links: [
      { label: "关于我们", href: "https://www.intereco.org.cn/about.html", external: true },
      { label: "联系我们", href: "mailto:ipoa@intereco.org.cn", external: true },
      { label: "QQ 群", href: "https://qm.qq.com/q/zo6rvaWmKk", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-slate-50 px-4 pt-16 pb-10">
      <div className="mx-auto max-w-6xl">
        {/* Top area: logo + link groups */}
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Left: Logo & description */}
          <div className="max-w-xs">
            <img
              src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
              alt="Logo"
              className="h-10 w-auto"
              crossOrigin="anonymous"
            />
          </div>

          {/* Right: Link groups */}
          <div className="grid grid-cols-1 gap-8 sm:gap-16">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 text-sm font-semibold text-slate-900">
                  {group.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-sm text-slate-500 transition-colors hover:text-[#38b6ff]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <p className="mt-10 text-center text-sm text-slate-400 sm:text-left">
          &copy; {new Date().getFullYear()} 界面生态
        </p>
      </div>
    </footer>
  );
}
