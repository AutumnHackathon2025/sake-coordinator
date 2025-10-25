interface HeaderProps {
  title?: string;
}

export function Header({ title = "御酒印帳" }: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 bg-[#2B2D5F] py-6 text-center">
      <h1 className="text-2xl font-medium text-white">{title}</h1>
    </header>
  );
}

