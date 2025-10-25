"use client";

import { useState, useEffect } from "react";

interface MenuEditorProps {
  initialItems?: string[];
  onSubmit: (items: string[]) => void;
}

export function MenuEditor({ initialItems = [], onSubmit }: MenuEditorProps) {
  const [menuItems, setMenuItems] = useState<string[]>(
    initialItems.length > 0 ? initialItems : [""]
  );

  // 初期値が変更されたら更新
  useEffect(() => {
    if (initialItems.length > 0) {
      setMenuItems(initialItems);
    }
  }, [initialItems]);
  const [newItem, setNewItem] = useState("");

  const handleAddItem = () => {
    if (menuItems.length < 10) {
      setMenuItems([...menuItems, ""]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...menuItems];
    updated[index] = value;
    setMenuItems(updated);
  };

  const handleSubmit = () => {
    const filteredItems = menuItems.filter((item) => item.trim() !== "");
    onSubmit(filteredItems);
  };

  return (
    <div className="flex min-h-[80vh] flex-col p-6">
      {/* タイトル */}
      <h2 className="mb-6 text-title text-[#2B2D5F]">銘柄</h2>

      {/* 銘柄リスト */}
      <div className="flex-1 space-y-3">
        {menuItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <input
              type="text"
              value={item}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              className="flex-1 border-2 border-gray-800 bg-white px-6 py-4 text-body-lg text-gray-800 focus:border-[#2B2D5F] focus:outline-none"
              placeholder="銘柄名を入力"
            />
            <button
              onClick={() => handleRemoveItem(index)}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#6B6D9F] text-white transition-all hover:bg-[#5B5D8F]"
              aria-label="削除"
            >
              <span className="text-2xl font-light">−</span>
            </button>
          </div>
        ))}
      </div>

      {/* 追加ボタン */}
      <button
        onClick={handleAddItem}
        disabled={menuItems.length >= 10}
        className="mt-4 w-full bg-[#6B6D9F] py-4 text-body-lg text-white transition-all hover:bg-[#5B5D8F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="mr-2 text-2xl">＋</span>
        銘柄を追加する
      </button>

      {/* おすすめを探すボタン */}
      <button
        onClick={handleSubmit}
        className="mt-4 flex w-full items-center justify-center gap-3 bg-[#2B2D5F] py-4 text-body-lg text-white transition-all hover:bg-[#3B3D7F]"
      >
        <span className="text-2xl">🍶</span>
        <span>おすすめを探す</span>
      </button>
    </div>
  );
}

