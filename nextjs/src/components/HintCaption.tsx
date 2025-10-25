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
        className="w-full rounded-lg bg-primary/90 backdrop-blur-sm px-4 py-3 shadow-lg border border-primary-light/30 transition-all hover:bg-primary cursor-pointer"
      >
        <p className="text-body text-center text-text-light font-medium">
          {message}
        </p>
      </button>
    </div>
  );
}

