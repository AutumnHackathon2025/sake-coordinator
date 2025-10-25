import AddIcon from "@mui/icons-material/Add";

interface AddRecordButtonProps {
  variant?: "default" | "motivational";
  onClick: () => void;
}

export function AddRecordButton({ variant = "default", onClick }: AddRecordButtonProps) {
  const bottomStyle = { bottom: 'calc(var(--footer-height) + var(--floating-element-gap))' };

  if (variant === "motivational") {
    return (
      <button
        onClick={onClick}
        className="fixed right-6 z-30 flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-action-record to-action-record-hover px-6 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-3xl animate-pulse-slow"
        style={{
          ...bottomStyle,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        }}
      >
        <AddIcon className="text-2xl" />
        <span className="font-bold">記録する</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="fixed right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-action-record text-white shadow-2xl transition-all hover:scale-110 hover:bg-action-record-hover"
      aria-label="記録を追加"
    >
      <AddIcon className="text-2xl" />
    </button>
  );
}

