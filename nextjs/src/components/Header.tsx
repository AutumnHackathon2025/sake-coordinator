import Link from "next/link";
import { ReactNode } from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface HeaderProps {
  title?: string;
  rightAction?: ReactNode;
  showHelpLink?: boolean;
  enableHomeLink?: boolean;
}

export function Header({ 
  title = "御酒印帳", 
  rightAction, 
  showHelpLink = true,
  enableHomeLink = true 
}: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 bg-bg-page py-3">
      <div className="relative flex items-center justify-center px-4">
        {enableHomeLink ? (
          <Link href="/" className="text-title font-bold text-primary transition-opacity hover:opacity-80">
            {title}
          </Link>
        ) : (
          <h1 className="text-title font-bold text-primary">{title}</h1>
        )}
        {rightAction ? (
          <div className="absolute right-4">
            {rightAction}
          </div>
        ) : showHelpLink ? (
          <Link
            href="/how-to-use"
            className="absolute right-4 flex items-center gap-1 text-primary transition-opacity hover:opacity-80"
            aria-label="使い方"
          >
            <HelpOutlineIcon className="text-xl" />
            <span className="text-body">使い方</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}

