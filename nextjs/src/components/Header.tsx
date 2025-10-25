import { ReactNode } from "react";

interface HeaderProps {
  title?: string;
  rightAction?: ReactNode;
}

export function Header({ title = "御酒印帳", rightAction }: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 bg-[#2B2D5F] py-3">
      <div className="relative flex items-center justify-center px-4">
        <h1 className="text-body-lg font-medium text-white">{title}</h1>
        {rightAction && (
          <div className="absolute right-4">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}

