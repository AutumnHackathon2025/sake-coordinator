"use client";

import { useState, useEffect } from "react";

interface Item {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function DynamoDBTest() {
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);

  // テーブル一覧を取得
  const fetchTables = async () => {
    try {
      const response = await fetch("/api/dynamodb?action=list-tables");
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error("テーブル一覧の取得に失敗:", error);
    }
  };

  // テーブル作成
  const createTable = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dynamodb?action=create-table");
      const data = await response.json();
      alert(data.message);
      fetchTables();
    } catch (error) {
      console.error("テーブル作成に失敗:", error);
      alert("テーブル作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // アイテム一覧を取得
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dynamodb?action=get-all");
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("アイテム取得に失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  // アイテム追加
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setLoading(true);
      const response = await fetch("/api/dynamodb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
        }),
      });

      if (response.ok) {
        setNewName("");
        setNewDescription("");
        fetchItems();
      } else {
        alert("アイテム追加に失敗しました");
      }
    } catch (error) {
      console.error("アイテム追加に失敗:", error);
      alert("アイテム追加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // アイテム削除
  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dynamodb?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchItems();
      } else {
        alert("アイテム削除に失敗しました");
      }
    } catch (error) {
      console.error("アイテム削除に失敗:", error);
      alert("アイテム削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">DynamoDB Local テスト</h1>
      
      {/* 接続テスト */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">接続テスト</h2>
        <div className="space-x-4">
          <button
            onClick={fetchTables}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            テーブル一覧取得
          </button>
          <button
            onClick={createTable}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={loading}
          >
            テーブル作成
          </button>
        </div>
        <div className="mt-4">
          <p className="font-medium">テーブル一覧:</p>
          <ul className="list-disc ml-6">
            {tables.length > 0 ? (
              tables.map((table, index) => (
                <li key={index} className="text-gray-700">{table}</li>
              ))
            ) : (
              <li className="text-gray-500">テーブルがありません</li>
            )}
          </ul>
        </div>
      </div>

      {/* アイテム追加フォーム */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">アイテム追加</h2>
        <form onSubmit={addItem} className="space-y-4">
          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="名前"
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="説明"
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            追加
          </button>
        </form>
      </div>

      {/* アイテム一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">アイテム一覧</h2>
          <button
            onClick={fetchItems}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            disabled={loading}
          >
            更新
          </button>
        </div>
        
        {loading && <p className="text-gray-500">読み込み中...</p>}
        
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600">{item.description}</p>
                  <p className="text-sm text-gray-400">
                    作成日時: {new Date(item.createdAt).toLocaleString("ja-JP")}
                  </p>
                  <p className="text-sm text-gray-400">ID: {item.id}</p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  disabled={loading}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {items.length === 0 && !loading && (
          <p className="text-gray-500 text-center">アイテムがありません</p>
        )}
      </div>
    </div>
  );
}