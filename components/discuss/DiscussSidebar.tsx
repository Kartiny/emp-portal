"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { DiscussWebSocket } from "@/lib/utils/websocket";

interface Channel {
  id: number;
  name: string;
  unread: number;
  type: "public" | "private" | "direct";
}

export function DiscussSidebar() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<DiscussWebSocket | null>(null);

  function startMeeting() {
    alert("Meeting started!");
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    const uid = localStorage.getItem("uid");
    if (!uid) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    // Connect to WebSocket for channels
    const wsUrl = `ws://localhost:3000/ws/discuss/channels?uid=${uid}`;
    wsRef.current = new DiscussWebSocket(wsUrl, (data) => {
      if (data.type === "channels") {
        setChannels(data.channels || []);
        setLoading(false);
      } else if (data.type === "error") {
        setError(data.error || "Failed to fetch channels");
        setLoading(false);
      }
    });
    wsRef.current.connect();
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  const publicChannels = channels.filter((c) => c.type !== "direct");
  const directMessages = channels.filter((c) => c.type === "direct");

  return (
    <nav className="flex flex-col h-full overflow-y-auto p-2">
      <button
        onClick={startMeeting}
        className="mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-2 w-full shadow"
      >
        <Video className="h-5 w-5" />
        Start a meeting
      </button>
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-500 px-2 mb-2">CHANNELS</div>
        {loading ? (
          <div className="text-gray-400 px-2">Loading...</div>
        ) : error ? (
          <div className="text-red-500 px-2">{error}</div>
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
      ) : error ? (
        <div className="text-red-500 px-2">{error}</div>
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