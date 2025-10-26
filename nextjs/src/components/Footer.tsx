"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface FooterItem {
  icon: ReactNode;
  label: string;
  href: string;
}

interface FooterProps {
  items: FooterItem[];
}

export function Footer({ items }: FooterProps) {
  const pathname = usePathname();

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t border-border bg-bg-card"
      style={{ height: 'var(--footer-height)' }}
    >
      {items.map((item, index) => {
        const isActive = pathname === item.href;
        
        const content = (
          <>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-body font-medium">{item.label}</span>
          </>
        );

        const activeStyles = isActive
          ? "text-primary bg-bg-subtle"
          : "text-secondary hover:bg-bg-page";

        return (
          <Link
            key={index}
            href={item.href}
            className={`flex flex-row items-center justify-center gap-2 transition-colors ${activeStyles}`}
          >
            {content}
          </Link>
        );
      })}
    </footer>
  );
}

