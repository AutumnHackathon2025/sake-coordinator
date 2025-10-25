interface HintCaptionProps {
  message: string;
}

export function HintCaption({ message }: HintCaptionProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 pointer-events-none">
      <div className="mx-4 mb-2 rounded-lg bg-[#2B2D5F]/90 backdrop-blur-sm px-4 py-3 shadow-lg border border-white/20">
        <p className="text-body text-center text-white font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

