"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface FooterItem {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
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
        const isActive = item.href && pathname === item.href;
        
        const content = (
          <>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-body font-medium">{item.label}</span>
          </>
        );

        const activeStyles = isActive
          ? "text-primary bg-bg-subtle"
          : "text-secondary hover:bg-bg-page";

        if (item.href) {
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-row items-center justify-center gap-2 py-3 transition-colors ${activeStyles}`}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={index}
            onClick={item.onClick}
            className={`flex flex-row items-center justify-center gap-2 py-3 transition-colors ${activeStyles}`}
          >
            {content}
          </button>
        );
      })}
    </footer>
  );
}

