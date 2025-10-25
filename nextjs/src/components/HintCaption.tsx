"use client";

import { useState } from "react";

interface HintCaptionProps {
  children: React.ReactNode;
}

export function HintCaption({ children }: HintCaptionProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed left-0 right-0 z-30 px-4"
      style={{  bottom: 'calc(var(--footer-height) + var(--floating-element-gap))' }}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="w-full rounded-lg bg-primary/70 backdrop-blur-sm px-4 py-3 shadow-lg transition-all hover:bg-primary cursor-pointer"
      >
        <p className="text-body text-center text-text-light font-medium">
          {children}
        </p>
      </button>
    </div>
  );
}

