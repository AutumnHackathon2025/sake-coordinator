import Link from "next/link";

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: LinkButtonProps) {
  const baseStyles =
    "block w-full py-8 text-2xl font-light tracking-wider text-center transition-all";
  const variantStyles =
    variant === "primary"
      ? "bg-white text-[#2B2D5F] hover:bg-gray-100"
      : "bg-[#2B2D5F] text-white hover:bg-[#3B3D7F]";

  return (
    <Link
      href={href}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </Link>
  );
}

