"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Channel {
  id: number;
  name: string;
  unread: number;
  type: "public" | "private" | "direct";
}

export function DiscussSidebar() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discuss/channels")
      .then((res) => res.json())
      .then((data) => setChannels(data.channels || []))
      .finally(() => setLoading(false));
  }, []);

  const publicChannels = channels.filter((c) => c.type !== "direct");
  const directMessages = channels.filter((c) => c.type === "direct");

  return (
    <nav className="flex flex-col h-full overflow-y-auto p-2">
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-500 px-2 mb-2">CHANNELS</div>
        {loading ? (
          <div className="text-gray-400 px-2">Loading...</div>
        ) : publicChannels.length === 0 ? (
          <div className="text-gray-400 px-2">No channels</div>
        ) : (
          publicChannels.map((ch) => (
            <Link
              key={ch.id}
              href={`/discuss/${ch.id}`}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="text-lg">#</span>
              <span className="flex-1 truncate">{ch.name}</span>
              {ch.unread > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">{ch.unread}</span>
              )}
            </Link>
          ))
        )}
      </div>
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-gray-500">DIRECT MESSAGES</span>
        <button className="text-gray-400 hover:text-gray-600 text-lg" title="New direct message">+</button>
      </div>
      {loading ? (
        <div className="text-gray-400 px-2">Loading...</div>
      ) : directMessages.length === 0 ? (
        <div className="text-gray-400 px-2">No direct messages</div>
      ) : (
        directMessages.map((ch) => (
          <Link
            key={ch.id}
            href={`/discuss/${ch.id}`}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="flex-1 truncate">{ch.name}</span>
            {ch.unread > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">{ch.unread}</span>
            )}
          </Link>
        ))
      )}
    </nav>
  );
} 