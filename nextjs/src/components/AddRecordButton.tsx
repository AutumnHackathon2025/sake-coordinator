import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";

interface AddRecordButtonProps {
  variant?: "default" | "motivational";
}

export function AddRecordButton({ variant = "default" }: AddRecordButtonProps) {
  if (variant === "motivational") {
    return (
      <Link
        href="/record"
        className="fixed bottom-16 right-6 z-30 flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-[#2B2D5F] to-[#4B4D8F] px-6 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-3xl animate-pulse-slow"
      >
        <AddIcon className="text-2xl" />
        <span className="text-sm font-medium">記録する</span>
      </Link>
    );
  }

  return (
    <Link
      href="/record"
      className="fixed bottom-16 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B2D5F] text-white shadow-2xl transition-all hover:scale-110 hover:bg-[#3B3D7F]"
      aria-label="記録を追加"
    >
      <AddIcon className="text-2xl" />
    </Link>
  );
}

