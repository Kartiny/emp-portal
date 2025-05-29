"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/discuss/channels/${channelId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []))
      .catch(err => setError(err.message || "Failed to load messages"))
      .finally(() => setLoading(false));
  }, [channelId]);

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
      <div className="border-t p-2 bg-white">
        {/* Message composer goes here */}
        <input className="w-full border rounded p-2" placeholder="Type a message..." />
      </div>
    </div>
  );
} 