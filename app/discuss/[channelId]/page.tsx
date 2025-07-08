"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { DiscussWebSocket } from "@/lib/utils/websocket";

interface Message {
  id: number;
  author: string;
  body: string;
  date: string;
}

export default function ChannelPage() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const wsRef = useRef<DiscussWebSocket | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // TODO: Replace with environment variable or production URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ? `${process.env.NEXT_PUBLIC_WS_URL}/ws/discuss/${channelId}` : '';
    wsRef.current = new DiscussWebSocket(wsUrl, (data) => {
      if (data.type === "messages") {
        setMessages(data.messages || []);
        setLoading(false);
      } else if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.message]);
      }
    });
    wsRef.current.connect();
    setLoading(false);
    return () => {
      wsRef.current?.disconnect();
    };
  }, [channelId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      wsRef.current?.send({ type: "send_message", channelId, body: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div>Loading messages...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400">No messages yet.</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="mb-4">
              <div className="font-semibold">{msg.author} <span className="text-xs text-gray-400">{msg.date}</span></div>
              <div className="bg-gray-100 rounded p-2 inline-block mt-1">{msg.body}</div>
            </div>
          ))
        )}
      </div>
      <div className="border-t p-2 bg-white flex gap-2">
        <input
          className="w-full border rounded p-2"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!input.trim()}
          onClick={() => {
            if (input.trim()) {
              wsRef.current?.send({ type: "send_message", channelId, body: input });
              setInput("");
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
} 