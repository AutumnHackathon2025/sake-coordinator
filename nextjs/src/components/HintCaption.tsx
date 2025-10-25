"use client";

import { useState } from "react";

interface HintCaptionProps {
  message: string;
}

export function HintCaption({ message }: HintCaptionProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed left-0 right-0 z-30 px-4"
      style={{ bottom: 'calc(var(--footer-height) + var(--floating-element-gap))' }}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="w-full rounded-lg bg-[#2B2D5F]/90 backdrop-blur-sm px-4 py-3 shadow-lg border border-white/20 transition-all hover:bg-[#2B2D5F] cursor-pointer"
      >
        <p className="text-body text-center text-white font-medium">
          {message}
        </p>
      </button>
    </div>
  );
}

