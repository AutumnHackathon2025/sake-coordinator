import Link from "next/link";
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
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t border-gray-300 bg-white">
      {items.map((item, index) => {
        const content = (
          <>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-base">{item.label}</span>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={index}
              href={item.href}
              className="flex flex-row items-center justify-center gap-2 py-3 text-gray-600 transition-colors hover:bg-gray-50"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={index}
            onClick={item.onClick}
            className="flex flex-row items-center justify-center gap-2 py-3 text-gray-600 transition-colors hover:bg-gray-50"
          >
            {content}
          </button>
        );
      })}
    </footer>
  );
}

