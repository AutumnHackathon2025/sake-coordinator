interface FooterItem {
  icon: string;
  label: string;
  onClick?: () => void;
}

interface FooterProps {
  items: FooterItem[];
}

export function Footer({ items }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t border-gray-300 bg-white">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          className="flex flex-col items-center justify-center gap-2 py-4 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </footer>
  );
}

